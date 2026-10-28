from pypdf import PdfReader
from pypdf.generic import ContentStream
from collections import Counter
r=PdfReader(r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-formatted.pdf');cs=ContentStream(r.pages[3].get_contents(),r)
print(Counter(op for a,op in cs.operations).most_common(30))
for i,(a,o) in enumerate(cs.operations):
 if o in (b'Td',b'TD') and (float(a[1])>70 and float(a[1])<775): print('TD',i,a)
