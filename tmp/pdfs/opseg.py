from pypdf import PdfReader
from pypdf.generic import ContentStream
r=PdfReader(r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-formatted.pdf');cs=ContentStream(r.pages[3].get_contents(),r)
for i in range(185,225):
 a,o=cs.operations[i];print(i,o,repr(a)[:100])
