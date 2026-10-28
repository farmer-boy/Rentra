Add-Type -AssemblyName System.Drawing
$img = New-Object System.Drawing.Bitmap 1000,180
$g = [System.Drawing.Graphics]::FromImage($img)
$g.Clear([System.Drawing.Color]::White)
$pfc = New-Object System.Drawing.Text.PrivateFontCollection
$pfc.AddFontFile('C:\Windows\Fonts\arial.ttf')
$f = New-Object System.Drawing.Font($pfc.Families[0],48,[System.Drawing.FontStyle]::Regular)
$fmt = New-Object System.Drawing.StringFormat
$fmt.FormatFlags = [System.Drawing.StringFormatFlags]::DirectionRightToLeft
$fmt.Alignment = [System.Drawing.StringAlignment]::Far
$g.DrawString('فہرست مضامین',$f,[System.Drawing.Brushes]::Black,(New-Object System.Drawing.RectangleF(20,20,950,100)),$fmt)
$img.Save('E:\Rentra\tmp\pdfs\gdi-test.png',[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose();$img.Dispose()

