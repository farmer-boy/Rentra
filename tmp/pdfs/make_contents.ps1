Add-Type -AssemblyName System.Drawing
$width=2480;$height=3508
$img=New-Object System.Drawing.Bitmap $width,$height
$img.SetResolution(300,300)
$g=[System.Drawing.Graphics]::FromImage($img)
$g.Clear([System.Drawing.Color]::White)
$g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint=[System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$pfc=New-Object System.Drawing.Text.PrivateFontCollection
$pfc.AddFontFile('E:\Rentra\tmp\pdfs\jameel-full.ttf')
$jameel=$pfc.Families[0]
$regular=New-Object System.Drawing.Font($jameel,48,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)
$bold=New-Object System.Drawing.Font($jameel,58,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
$head=New-Object System.Drawing.Font($jameel,50,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
$latin=New-Object System.Drawing.Font('Times New Roman',42,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)
$small=New-Object System.Drawing.Font('Times New Roman',38,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)
$black=[System.Drawing.Brushes]::Black
$rtl=New-Object System.Drawing.StringFormat
$rtl.FormatFlags=[System.Drawing.StringFormatFlags]::DirectionRightToLeft
$rtl.Alignment=[System.Drawing.StringAlignment]::Far
$center=New-Object System.Drawing.StringFormat
$center.FormatFlags=[System.Drawing.StringFormatFlags]::DirectionRightToLeft
$center.Alignment=[System.Drawing.StringAlignment]::Center
$left=New-Object System.Drawing.StringFormat
$left.Alignment=[System.Drawing.StringAlignment]::Near
# Sample-style page marker and fine rule.
$g.DrawString('2',$small,$black,235,72,$left)
$g.DrawString('|  P a g e',$small,$black,278,72,$left)
$pen=New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(198,198,198),1.5)
$g.DrawLine($pen,235,125,2245,125)
# Main title and column headings.
$g.DrawString('فہرست مضامین',$bold,$black,[System.Drawing.RectangleF]::new(235.0,260.0,2010.0,100.0),$center)
$g.DrawString('نمبر شمار',$head,$black,[System.Drawing.RectangleF]::new(2040.0,450.0,200.0,75.0),$rtl)
$g.DrawString('عنوان',$head,$black,[System.Drawing.RectangleF]::new(480.0,450.0,1490.0,75.0),$rtl)
$g.DrawString('صفحہ نمبر',$head,$black,[System.Drawing.RectangleF]::new(240.0,450.0,260.0,75.0),$center)
$rows=@(
 @('عنوان تحقیق','3'),@('تعارف موضوع','3'),@('مسئلہ تحقیق','4'),@('تحقیق کی اہمیت و ضرورت','4'),@('مقاصد تحقیق','4'),
 @('تحقیقی سوالات','5'),@('سابقہ تحقیقات کا تنقیدی جائزہ','5'),@('منہج تحقیق','6'),@('حدود تحقیق','11'),
 @('مجوزہ ابواب کی تقسیم','11'),@('متوقع نتائج تحقیق','13'),@('بنیادی مصادر و مراجع','13'),@('خلاصہ سینوپسس','14')
)
$dotPen=New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(55,55,55),1.6)
$dotPen.DashStyle=[System.Drawing.Drawing2D.DashStyle]::Dot
for($i=0;$i -lt $rows.Count;$i++){
 $y=620+($i*168)
 $num="$($i+1)-"
 $g.DrawString($num,$latin,$black,[System.Drawing.RectangleF]::new(2020.0,[single]$y,220.0,70.0),$rtl)
 $txt=$rows[$i][0]
 $measure=$g.MeasureString($txt,$regular,1400,$rtl)
 $right=1970.0;$leftx=$right-$measure.Width
 $g.DrawString($txt,$regular,$black,[System.Drawing.RectangleF]::new([single]$leftx,[single]$y,[single](($right-$leftx)+12),72.0),$rtl)
 $g.DrawLine($dotPen,520,$y+54,[Math]::Max(535,$leftx-22),$y+54)
 $g.DrawString($rows[$i][1],$latin,$black,[System.Drawing.RectangleF]::new(285.0,[single]$y,180.0,68.0),$center)
}
$img.Save('E:\Rentra\tmp\pdfs\contents-jameel.png',[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose();$img.Dispose();$pen.Dispose();$dotPen.Dispose()
