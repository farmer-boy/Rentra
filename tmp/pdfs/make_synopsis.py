from io import BytesIO
from pypdf import PdfReader, PdfWriter, PageObject
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

src = r'C:\Users\subss\OneDrive\Desktop\تحقیقی_سینوپسس_محمد_کامران-1.pdf'
cover_src = r'E:\Rentra\output\pdf\Thesis-6-updated.pdf'
out = r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-formatted.pdf'
reader = PdfReader(src)
cover = PdfReader(cover_src).pages[0]
writer = PdfWriter()
writer.add_page(cover)

page0 = reader.pages[0]
w,h = float(page0.mediabox.width), float(page0.mediabox.height)
font_dir = 'C:\\Windows\\Fonts'
pdfmetrics.registerFont(TTFont('TimesRegular', font_dir+'\\\\times.ttf'))
pdfmetrics.registerFont(TTFont('TimesBold', font_dir+'\\\\timesbd.ttf'))

def make_overlay(width, height, page_number, mask_header=True, footer_box=None):
    b = BytesIO()
    c = canvas.Canvas(b, pagesize=(width,height))
    c.setFillColorRGB(1,1,1)
    if mask_header:
        # The repeated Urdu running title at the top left.
        c.rect(20, height-65, 185, 43, fill=1, stroke=0)
    if footer_box:
        x,y,bw,bh=footer_box
        c.rect(x,y,bw,bh,fill=1,stroke=0)
    else:
        # The original centered Urdu page number.
        c.rect(width/2-65, 24, 130, 38, fill=1, stroke=0)
    c.setFillColorRGB(0,0,0)
    c.setFont('TimesBold',9)
    c.drawString(70,height-42,str(page_number))
    c.setFont('TimesRegular',8)
    c.drawString(80,height-42,'|')
    c.drawString(88,height-42,'P a g e')
    c.setStrokeColorRGB(0.78,0.78,0.78)
    c.setLineWidth(0.45)
    c.line(70,height-51,width-70,height-51)
    c.save(); b.seek(0)
    return PdfReader(b).pages[0]

# Preserve the original first page's research content after moving the old cover block off-page.
body1 = PageObject.create_blank_page(width=w,height=h)
body1.merge_translated_page(page0, 0, 300, over=False)
body1.merge_page(make_overlay(w,h,2,mask_header=False,footer_box=(w/2-65, 322, 130, 38)))
writer.add_page(body1)

# Keep the remaining original body pages, remove their repeated header/footer, and use the sample page-number style.
for source_index in range(1,len(reader.pages)):
    p=reader.pages[source_index]
    p.merge_page(make_overlay(w,h,source_index+2,mask_header=True))
    writer.add_page(p)

with open(out,'wb') as f:
    writer.write(f)
print(f'Created {out}; pages={len(writer.pages)}; cover copied from Thesis-6-updated; body={len(reader.pages)} pages')


