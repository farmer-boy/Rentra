Add-Type -AssemblyName System.Drawing
$img=New-Object System.Drawing.Bitmap 900,180
$g=[System.Drawing.Graphics]::FromImage($img);$g.Clear([System.Drawing.Color]::White)
$f=New-Object System.Drawing.Font('Arial',48,[System.Drawing.FontStyle]::Regular)
$fmt=New-Object System.Drawing.StringFormat;$fmt.FormatFlags=[System.Drawing.StringFormatFlags]::DirectionRightToLeft;$fmt.Alignment=[System.Drawing.StringAlignment]::Far
$g.DrawString('فہرست مضامین',$f,[System.Drawing.Brushes]::Black,(New-Object System.Drawing.RectangleF(20,20,850,100)),$fmt)
$img.Save('E:\Rentra\tmp\pdfs\gdi-utf8.png',[System.Drawing.Imaging.ImageFormat]::Png)
