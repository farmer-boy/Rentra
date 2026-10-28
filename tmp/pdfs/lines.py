import pdfplumber
for fn in [r'C:\Downloads\1.pdf',r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-formatted.pdf']:
 p=pdfplumber.open(fn).pages[3]; print('\n',fn)
 for i,l in enumerate(p.extract_text_lines()):
  if 80<l['top']<p.height-60:
   print(i,round(l['top'],1),round(l['bottom'],1),round(l['x0'],1),round(l['x1'],1),repr(l['text'][:30]))
