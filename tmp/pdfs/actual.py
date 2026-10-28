from pypdf import PdfReader
from pypdf.generic import ContentStream
r=PdfReader(r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-formatted.pdf');p=r.pages[3];cs=ContentStream(p.get_contents(),r)
cur=None;xy=None
for i,(a,o) in enumerate(cs.operations):
 if o==b'BDC' and len(a)>1 and isinstance(a[1],dict):cur=a[1].get('/ActualText')
 elif o==b'Tm':xy=(float(a[4]),float(a[5]))
 elif o in (b'Tj',b'TJ') and cur:
  if xy and xy[1]<775 and xy[1]>80: print(i,round(xy[0],1),round(xy[1],1),repr(cur))
 elif o==b'EMC':cur=None
