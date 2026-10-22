Add-Type -AssemblyName System.Drawing
$out = Join-Path $PSScriptRoot 'PigSpeedCalc.ico'
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
function RR($x,$y,$w,$h,$r){
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = [single]($r*2)
  $p.AddArc($x,$y,$d,$d,180,90); $p.AddArc($x+$w-$d,$y,$d,$d,270,90)
  $p.AddArc($x+$w-$d,$y+$h-$d,$d,$d,0,90); $p.AddArc($x,$y+$h-$d,$d,$d,90,90); $p.CloseFigure(); $p
}
function Draw($size){
  $b = New-Object System.Drawing.Bitmap $size,$size,([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = 'AntiAlias'; $g.Clear([System.Drawing.Color]::Transparent)
  $g.ScaleTransform($size/130, $size/130)
  $g.FillPath((New-Object System.Drawing.SolidBrush (C '#17304f')), (RR 0 0 130 130 28))
  # pipe
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C '#8cbcff')), 12, 42, 106, 46)
  $pen = New-Object System.Drawing.Pen (C '#e8f1ff'), 4
  $g.DrawRectangle($pen, 12, 42, 106, 46)
  # tool body and cups
  $g.FillPath((New-Object System.Drawing.SolidBrush (C '#17304f')), (RR 40 55 44 20 9))
  $cup = New-Object System.Drawing.SolidBrush (C '#2a66d8')
  $g.FillPath($cup, (RR 31 47 7 36 3)); $g.FillPath($cup, (RR 86 47 7 36 3))
  # arrow
  $pts = @((New-Object System.Drawing.PointF 93,56),(New-Object System.Drawing.PointF 110,65),(New-Object System.Drawing.PointF 93,74))
  $g.FillPolygon((New-Object System.Drawing.SolidBrush (C '#e8f1ff')), $pts)
  $g.FillEllipse((New-Object System.Drawing.SolidBrush (C '#6ee7a8')), 59, 62, 6, 6)
  $g.Dispose()
  $ms = New-Object System.IO.MemoryStream
  $b.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); $b.Dispose()
  ,$ms.ToArray()
}
$sizes = 16,24,32,48,64,128,256
$imgs = foreach($s in $sizes){ ,(Draw $s) }
$fs = [System.IO.File]::Create($out); $bw = New-Object System.IO.BinaryWriter $fs
$bw.Write([uint16]0); $bw.Write([uint16]1); $bw.Write([uint16]$sizes.Count)
$off = 6 + 16*$sizes.Count
for($i=0;$i -lt $sizes.Count;$i++){
  $s = $sizes[$i]; $d = $imgs[$i]
  $bw.Write([byte]($(if($s -ge 256){0}else{$s}))); $bw.Write([byte]($(if($s -ge 256){0}else{$s})))
  $bw.Write([byte]0); $bw.Write([byte]0); $bw.Write([uint16]1); $bw.Write([uint16]32)
  $bw.Write([uint32]$d.Length); $bw.Write([uint32]$off); $off += $d.Length
}
foreach($d in $imgs){ $bw.Write($d) }
$bw.Close(); $fs.Close()
"wrote $out ($((Get-Item $out).Length) bytes)"
$android = Join-Path (Split-Path $PSScriptRoot -Parent) 'android'
New-Item -ItemType Directory -Force $android | Out-Null
foreach($s in 192,512){ [System.IO.File]::WriteAllBytes((Join-Path $android "icon-$s.png"), (Draw $s)) }
"wrote android icons"
