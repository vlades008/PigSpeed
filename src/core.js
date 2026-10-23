
/* Calculation core. Pig speed = volumetric flow at line conditions / inner pipe area.
   Standard-condition flow is converted to line conditions with literature correlations (see NOTES.md):
   gas: real-gas law, Z from Dranchuk-Abou-Kassem with Sutton pseudo-criticals;
   oil: API MPMS 11.1 thermal expansion, Vazquez-Beggs compressibility;
   oil + gas: Standing Rs / Bo, free gas through Bg. Standard conditions: 14.696 psia, 60 F. */
var PSC = (function(){
  var PSTD=14.696, TSTD=519.67, BBL=0.158987294928, BBL_FT3=5.614583, SG_DEF=0.65;
  var LEN_KM=[1,0.001];
  var RV_KMH=[3600/1000,1.609344,1];
  var OIL_M3D=[1,BBL,24,BBL*24];
  var GAS_M3D=[1,24];                       // std m3/day per unit
  var P_PSI=[0.145038,0.145038*1000,1,0.145038*100];
  function pseudo(sg){return {Tpc:169.2+349.5*sg-74.0*sg*sg, Ppc:756.8-131.0*sg-3.6*sg*sg}}   // Sutton 1985, R and psia
  // Dranchuk and Abou-Kassem (1975): Z from reduced density by Newton iteration
  function zDAK(P,TR,sg){
    var pc=pseudo(sg),Tr=TR/pc.Tpc,Pr=P/pc.Ppc;
    var A1=0.3265,A2=-1.0700,A3=-0.5339,A4=0.01569,A5=-0.05165,A6=0.5475,A7=-0.7361,A8=0.1844,A9=0.1056,A10=0.6134,A11=0.7210;
    var R1=A1+A2/Tr+A3/Math.pow(Tr,3)+A4/Math.pow(Tr,4)+A5/Math.pow(Tr,5),
        R2=0.27*Pr/Tr, R3=A6+A7/Tr+A8/(Tr*Tr), R4=A9*(A7/Tr+A8/(Tr*Tr)), R5=A10/Math.pow(Tr,3);
    var rho=R2, i;
    for(i=0;i<100;i++){
      var r2=rho*rho,e=Math.exp(-A11*r2);
      var f=R1*rho-R2/rho+R3*r2-R4*Math.pow(rho,5)+R5*r2*(1+A11*r2)*e+1;
      var d=R1+R2/r2+2*R3*rho-5*R4*Math.pow(rho,4)+2*R5*rho*e*(1+A11*r2-A11*A11*r2*r2);
      var nr=rho-f/d; if(!(nr>0))nr=rho/2;
      if(Math.abs(nr-rho)<1e-12){rho=nr;break}
      rho=nr;
    }
    return {z:R2/rho,Tr:Tr,Pr:Pr};
  }
  // Standing (1947): solution GOR and oil FVF (P psia, T F, Rs scf/STB)
  function standingRs(P,TF,API,sg){return sg*Math.pow((P/18.2+1.4)*Math.pow(10,0.0125*API-0.00091*TF),1.2048)}
  function standingPb(Rs,TF,API,sg){return 18.2*(Math.pow(Rs/sg,0.83)*Math.pow(10,0.00091*TF-0.0125*API)-1.4)}
  function standingBo(Rs,TF,API,sg){var go=141.5/(131.5+API);return 0.9759+0.00012*Math.pow(Rs*Math.sqrt(sg/go)+1.25*TF,1.2)}
  // Vazquez and Beggs (1980) undersaturated compressibility, 1/psi, kept inside a physical band
  function coVB(P,TF,API,sg,Rsb){var c=(-1433+5*Rsb+17.2*TF-1180*sg+12.61*API)/(1e5*P);return Math.min(3e-5,Math.max(4e-6,c))}
  // API MPMS 11.1 (generalized crude oil): volume correction factor from TF to 60 F
  function vcf(TF,API){var rho=141.5/(131.5+API)*999.016,al=341.0957/(rho*rho),dT=TF-60;return Math.exp(-al*dT*(1+0.8*al*dT))}
  var STDT=[519.67,518.67,527.67];                 // standard temperature, R: 60 F, 15 C, 20 C (at 14.696 psia)
  // inp: fluid 0 gas/1 oil/2 oil+gas, od, wt, wtu, len,lenu, flow, oilu,gasu, p (inlet),pout (outlet, optional),pu, atm (gauge input),
  //      std, slip (% of flow speed), t,tu (0 C,1 R), sg, api, gor, rv,rvu, rgasu, roilu
  function calc(i){
    var od=i.od, wt=i.wtu===1?i.wt*25.4:i.wt;
    if(!(od-2*wt>=1)) return {error:'Wrong Outer Diameter or Wall Thickness'};
    var areaM2=Math.pow((od-2*wt)/1000,2)*Math.PI/4;
    var lenKm=Math.abs(i.len)*LEN_KM[i.lenu];
    var rvKmh=i.rv*RV_KMH[i.rvu];
    var patm=i.atm?PSTD:0;
    var P1=Math.abs(i.p)*P_PSI[i.pu]+patm, P2=(i.pout>0)?Math.abs(i.pout)*P_PSI[i.pu]+patm:P1;
    if(P2>P1*(1+1e-9)) return {error:'out_gt_in'};
    var TF=i.tu===0?i.t*9/5+32:i.t-459.67, TR=TF+459.67;
    var sg=i.sg>0?i.sg:SG_DEF, api=i.api>0?i.api:35, gor=i.gor>0?i.gor:0;
    var slip=(i.slip>0&&i.slip<=100?i.slip:100)/100, Tstd=STDT[i.std]||STDT[0];
    var res={v:null,hours:null,rq:null,notes:[],f:null,z:null,prof:null};
    if(!(P1>0)||!(TR>0)) return res;
    var qstd=i.fluid===0?Math.abs(i.flow)*GAS_M3D[i.gasu]:Math.abs(i.flow)*OIL_M3D[i.oilu];
    var hasGas=(i.fluid===0)||(i.fluid===2&&gor>0);
    // line volume per standard volume at pressure P
    function fAt(P){
      if(i.fluid===0){var zz=zDAK(P,TR,sg);return {f:(PSTD/P)*(TR/Tstd)*zz.z,z:zz.z,Tr:zz.Tr,Pr:zz.Pr}}
      if(!hasGas) return {f:(1/vcf(TF,api))*Math.exp(-coVB(P,TF,api,SG_DEF,0)*(P-PSTD))};
      var z2=zDAK(P,TR,sg),Pb=standingPb(gor,TF,api,sg),Bo,free;
      if(P>=Pb){Bo=standingBo(gor,TF,api,sg)*Math.exp(coVB(P,TF,api,sg,gor)*(Pb-P));free=0}
      else{var Rs=standingRs(P,TF,api,sg);Bo=standingBo(Rs,TF,api,sg);free=Math.max(0,gor-Rs)}
      return {f:Bo+free*(PSTD/TSTD)*z2.z*TR/P/BBL_FT3,z:z2.z,Tr:z2.Tr,Pr:z2.Pr};
    }
    function vAt(P){return qstd*fAt(P).f/86400/areaM2*slip}      // m/s
    function pAt(x){return hasGas?Math.sqrt(P1*P1-(P1*P1-P2*P2)*x):P1-(P1-P2)*x}
    var f1=fAt(P1); res.f=f1.f; res.z=f1.z===undefined?null:f1.z;
    var N=P1===P2?1:200, tc=[0], vs=[vAt(pAt(0))], k;
    for(k=1;k<=N;k++){vs.push(vAt(pAt(k/N)));tc.push(tc[k-1]+(lenKm*1000/N)*(1/vs[k-1]+1/vs[k])/2)}
    var tot=tc[N];
    if(!(tot>0)||!isFinite(tot)) return res;
    res.prof=tc.map(function(t){return t/tot});
    res.hours=tot/3600;
    res.v=lenKm/res.hours;                              // average speed, km/h
    res.vin=vs[0]*3.6; res.vout=vs[N]*3.6;
    res.qline=qstd*f1.f/86400;
    res.rq=(i.fluid===0?qstd*rvKmh/res.v/GAS_M3D[i.rgasu]:qstd*rvKmh/res.v/OIL_M3D[i.roilu]);
    if(i.fluid!==1&&f1.Tr!==undefined){var f2=fAt(P2);if(f1.Tr<1.05||f1.Tr>3||f1.Pr>30||f2.Pr>30)res.notes.push('z_range')}
    if(i.fluid===2&&gor>0&&(api<16.5||api>63.8||gor<20||gor>1425))res.notes.push('standing_range');
    return res;
  }
  function vRel(prof,x){if(!prof||prof.length<3)return 1;var n=prof.length-1,d=1/n,a=Math.max(0,x-d),b=Math.min(1,x+d);return (b-a)/(tAt(prof,b)-tAt(prof,a))}
  // position (0..1) <-> time (0..1) along the run
  function tAt(prof,x){if(!prof)return x;var n=prof.length-1,y=Math.max(0,Math.min(1,x))*n,k=Math.min(n-1,Math.floor(y));return prof[k]+(prof[k+1]-prof[k])*(y-k)}
  function xAt(prof,t){
    if(!prof)return t;var n=prof.length-1;t=Math.max(0,Math.min(1,t));
    var lo=0,hi=n;while(hi-lo>1){var m=(lo+hi)>>1;if(prof[m]<=t)lo=m;else hi=m}
    var d=prof[hi]-prof[lo];return (lo+(d>0?(t-prof[lo])/d:0))/n;
  }
  function velOut(vKmh,u){return u===0?vKmh*1000/3600:u===1?vKmh/1.609344:vKmh}
  function fmtDur(h){
    if(h===null)return null;
    var mm=(h%1)*60, ss=(mm%1)*60;
    var a=Math.trunc(h),b=Math.trunc(mm),c=Math.trunc(ss);
    return String(a)+':'+String(b).padStart(2,'0')+':'+String(c).padStart(2,'0');
  }
  return {calc:calc,velOut:velOut,fmtDur:fmtDur,tAt:tAt,xAt:xAt,vRel:vRel};
})();
