param([string]$src,[string]$dst,[int]$height=520)
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System; using System.Drawing; using System.Drawing.Imaging; using System.Collections.Generic;
public static class Cut {
  public static void Run(string src, string dst, int outH) {
    Bitmap raw = new Bitmap(src);
    int w = raw.Width, h = raw.Height;
    Bitmap b = new Bitmap(w, h, PixelFormat.Format32bppArgb);
    using (Graphics g = Graphics.FromImage(b)) { g.Clear(Color.White); g.DrawImage(raw, 0, 0, w, h); }
    bool[] bg = new bool[w*h];
    Func<int,int,bool> near = (x,y) => { Color c = b.GetPixel(x,y); return c.R>=238 && c.G>=238 && c.B>=238; };
    Queue<int> q = new Queue<int>();
    for (int x=0;x<w;x++){ q.Enqueue(x); q.Enqueue((h-1)*w+x); }
    for (int y=0;y<h;y++){ q.Enqueue(y*w); q.Enqueue(y*w+w-1); }
    while (q.Count>0) {
      int i = q.Dequeue(); if (bg[i]) continue;
      int x = i % w, y = i / w;
      if (!near(x,y)) continue;
      bg[i] = true;
      if (x>0) q.Enqueue(i-1); if (x<w-1) q.Enqueue(i+1); if (y>0) q.Enqueue(i-w); if (y<h-1) q.Enqueue(i+w);
    }
    int minx=w,miny=h,maxx=0,maxy=0;
    for (int y=0;y<h;y++) for (int x=0;x<w;x++) {
      int i = y*w+x; Color c = b.GetPixel(x,y);
      if (bg[i]) { b.SetPixel(x,y,Color.FromArgb(0,255,255,255)); continue; }
      bool edge = (x>0&&bg[i-1])||(x<w-1&&bg[i+1])||(y>0&&bg[i-w])||(y<h-1&&bg[i+w]);
      if (edge && c.R>200 && c.G>200 && c.B>200) b.SetPixel(x,y,Color.FromArgb(110,c.R,c.G,c.B));
      if (x<minx) minx=x; if (x>maxx) maxx=x; if (y<miny) miny=y; if (y>maxy) maxy=y;
    }
    int cw = maxx-minx+1, ch = maxy-miny+1, ow = (int)Math.Round(cw*(double)outH/ch);
    Bitmap o = new Bitmap(ow, outH, PixelFormat.Format32bppArgb);
    using (Graphics g = Graphics.FromImage(o)) { g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic; g.Clear(Color.Transparent);
      g.DrawImage(b, new Rectangle(0,0,ow,outH), new Rectangle(minx,miny,cw,ch), GraphicsUnit.Pixel); }
    o.Save(dst, ImageFormat.Png);
    Console.WriteLine(w+"x"+h+" -> "+ow+"x"+outH);
  }
}
"@
[Cut]::Run($src,$dst,$height)
