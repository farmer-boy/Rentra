from pypdf import PdfReader
from pypdf.generic import ContentStream
r=PdfReader(r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-formatted.pdf'); p=r.pages[3]; cs=ContentStream(p.get_contents(),r)
for i,(args,op) in enumerate(cs.operations):
 if op in (b'Tm',b'Tj',b'TJ') and (i<200): print(i,op,repr(args)[:150])
