from pypdf import PdfReader
from pypdf.generic import ContentStream
r=PdfReader(r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-formatted.pdf');p=r.pages[3];cs=ContentStream(p.get_contents(),r)
for i,(a,o) in enumerate(cs.operations[:80]): print(i,o,repr(a)[:140])
