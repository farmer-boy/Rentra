import os, sys
sys.path.insert(0, r'E:\Rentra\tmp\pdfs\pydeps')
from pypdf import PdfReader, PdfWriter
from pypdf.generic import IndirectObject
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.ttfonts import shapeStr
from io import BytesIO
src = r'C:\Users\subss\OneDrive\Desktop\Thesis 6.pdf'
out = r'E:\Rentra\output\pdf\Thesis-6-updated.pdf'
reader = PdfReader(src)
page = reader.pages[0]
w, h = float(page.mediabox.width), float(page.mediabox.height)
pdfmetrics.registerFont(TTFont('Jameel', r'E:\Rentra\tmp\pdfs\jameel-full.ttf', shapable=True))
buf = BytesIO(); c = canvas.Canvas(buf, pagesize=(w,h))
# Cover only the three edited text areas.
c.setFillColorRGB(1,1,1)
c.rect(72, h-165, 452, 119, fill=1, stroke=0)
c.rect(125, h-551, 192, 31, fill=1, stroke=0)
c.rect(454, h-551, 75, 31, fill=1, stroke=0)
c.rect(414, h-581, 80, 26, fill=1, stroke=0)
c.setFillColorRGB(0,0,0)
def shaped(text, size):
    value = shapeStr(text, 'Jameel', size)
    width = (sum(item.x_advance for item in value.__shapeData__) * size / 1000) if hasattr(value, '__shapeData__') else pdfmetrics.stringWidth(value, 'Jameel', size)
    return value, width
def centered(text, x, y, size):
    value, width = shaped(text, size)
    c.setFont('Jameel', size); c.drawString(x - width / 2, y, value)
def right_aligned(text, x, y, size):
    value, width = shaped(text, size)
    c.setFont('Jameel', size); c.drawString(x - width, y, value)
centered('ادارہ مکتب تعلیم القرآن میں بچوں کی', w/2, h-88, 28)
centered('منظم تعلیم کا تجزیاتی مطالعہ', w/2, h-159, 28)
centered('ڈاکٹر عبد الرؤف عثمانی صاحب', 220, h-545, 18)
right_aligned('محمد کامران', 523, h-545, 18)
right_aligned('F25.30101', 493, h-577, 19)
c.save(); buf.seek(0)
page.merge_page(PdfReader(buf).pages[0])
writer=PdfWriter(); writer.append(reader)
with open(out,'wb') as f: writer.write(f)
print(f'Created {out}; pages={len(writer.pages)}; page_size={w:.2f}x{h:.2f}pt')






