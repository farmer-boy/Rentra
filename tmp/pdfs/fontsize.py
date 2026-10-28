import pdfplumber,collections
for fn in [r'C:\Downloads\1.pdf',r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-formatted.pdf']:
 p=pdfplumber.open(fn).pages[3]; c=[x for x in p.chars if 130<x['top']<p.height-130]; print(fn,collections.Counter(round(x['size'],1) for x in c).most_common(8))
