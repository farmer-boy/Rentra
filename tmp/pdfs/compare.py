import pdfplumber
for fn in [r'C:\Downloads\1.pdf',r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-formatted.pdf']:
 p=pdfplumber.open(fn).pages[3]
 cs=[c for c in p.chars if 80<c['top']<p.height-70]
 print(fn, p.width,p.height, min(c['x0'] for c in cs),max(c['x1'] for c in cs))
 for l in p.extract_text_lines():
  if 90<l['top']<p.height-80: print(round(l['top']),round(l['x0']),round(l['x1']))
  if l['top']>300: break
