import pdfplumber
from collections import defaultdict
p=pdfplumber.open(r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-formatted.pdf')
for k in [2,3,4,5]:
 page=p.pages[k]
 lines=page.extract_text_lines(layout=False)
 print('PAGE',k+1,'size',page.width,page.height)
 for x in lines:
  if x['top']>70 and x['bottom']<page.height-40:
   print(round(x['top'],1),round(x['x0'],1),round(x['x1'],1),len(x['text']),repr(x['text'][:25]))
 print()
