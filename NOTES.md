# Pig Speed Calculator: calculation notes

Pig speed is taken equal to the flow speed: volumetric flow at line (pressure and temperature) conditions divided by the inner pipe area.
Inner diameter = OD - 2 x wall. All lengths are used in mm.
Pressure is absolute. Standard conditions: 14.696 psia, 60 F (about 101.325 kPa, 15.56 C).

Flow entered at standard conditions is converted to line conditions:

- Gas: Qline = Qstd x (Pstd / P) x (T / Tstd) x Z.
  Z: Dranchuk and Abou-Kassem (1975), 11 coefficients, Newton iteration on reduced density.
  Pseudo-critical properties: Sutton (1985), Tpc = 169.2 + 349.5 g - 74.0 g^2 (R), Ppc = 756.8 - 131.0 g - 3.6 g^2 (psia). g = gas specific gravity (air = 1).
  Checked against Hall and Yarborough at six points: agreement within 0.3 %.
- Oil (no gas): Qline = Qstd / VCF(T) x exp(-co (P - Pstd)).
  VCF: API MPMS 11.1 generalized crude, alpha60 = 341.0957 / rho60^2 (1/F), VCF = exp(-alpha dT (1 + 0.8 alpha dT)), dT = T - 60 F, rho60 from API gravity.
  co: Vazquez and Beggs (1980) undersaturated oil compressibility, limited to 4e-6 .. 3e-5 1/psi.
- Oil + gas (GOR given, scf per stock-tank barrel): Standing (1947).
  Rs = g [(P/18.2 + 1.4) 10^(0.0125 API - 0.00091 T)]^1.2048, Bo = 0.9759 + 0.000120 [Rs sqrt(g/go) + 1.25 T]^1.2 (T in F).
  Above the bubble point (Pb from the inverse Standing form) all gas is dissolved: Bo = Bob exp(co (Pb - P)).
  Below it: free gas = GOR - Rs, Qline = Qstd (Bo + free gas x Bg / 5.6146), Bg = (Pstd/Tstd) Z T / P.
- Time = length / speed. Flow for target speed = Qstd x target speed / speed (all models are linear in Qstd).

Sources checked online: DAK coefficients and Sutton pseudo-criticals (SPE/PetroWiki and journal papers), Standing Bo and the
inverse Rs form (SPE correlation reviews), API MPMS 11.1 constants (Wikipedia volume correction factor article quoting API 11.1:2004).
The Vazquez and Beggs compressibility equation and the Standing Rs exponent 1.2048 come from the original papers and were not
re-confirmed word for word online.

Limits: Z is best for 1.05 <= Tpr <= 3 and Ppr <= 30; Standing for API 16.5-63.8, Rs 20-1425 scf/STB. The app shows a warning
when a result lies outside these ranges. No H2S/CO2/N2 correction, no pig bypass or slip.

The original PigSpeedCalc_0_2a.exe used simpler constants (a fixed Z table for gas, temperature ignored for gas and oil).
Results differ from it by design.

## Added later

- Pressure along the line: optional outlet pressure. Gas and oil + gas use P^2 linear in distance, oil uses P linear. The time is
  integrated along the line (200 steps), so valve times and the moving pig follow the real, non-uniform speed.
- Pig slip (speed as a % of flow speed), gauge pressure option (adds 14.696 psia), selectable standard conditions (60 F, 15 C, 20 C).
- Catalogue checks (Interscan catalogue): speed 0.2-4 m/s, 72 h run time, 100 km range, 5-100 bar, gas at least 20 bar, -20..+80 C,
  minimum bore 75 % (geometry) / 85 % (MFL) of OD. Barrel diameter and tool length per OD are taken from the catalogue tables.
  The catalogue has no TFI data, TFI uses the MFL numbers.
- Run tracking: real launch time is stored, so the run survives a reload. "Passed" buttons recalibrate the speed from the real
  passage time (playback x1 only). Receiver confirmation stores planned vs actual time in the run history.
