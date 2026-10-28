from pypdf import PdfReader
from pypdf.generic import ContentStream
from collections import Counter
import pdfplumber
fn=r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-formatted.pdf'
r=PdfReader(fn); p=r.pages[3]; cs=ContentStream(p.get_contents(),r); ctr=Counter()
for i,(a,op) in enumerate(cs.operations):
 if op==b'Tm' and any(cs.operations[j][1] in (b'Tj',b'TJ') for j in range(i+1,min(i+5,len(cs.operations)))):
  y=float(a[5]);
  if 65<y<775:ctr[round(y,1)]+=1
peaks=sorted([(y,n) for y,n in ctr.items() if n>=4])
merged=[]
for y,n in peaks:
 if merged and y-merged[-1][0]<3.5:
  old,nn=merged[-1]; merged[-1]=((old*nn+y*n)/(nn+n),nn+n)
 else:merged.append((y,n))
pp=pdfplumber.open(fn).pages[3]; chars=[c for c in pp.chars if 80<c['top']<pp.height-70]
print('centers baseline/top/count/range')
for y,n in merged:
 top=pp.height-y
 cc=[c for c in chars if abs((c['top']+c['bottom'])/2-top)<13]
 if cc: print(round(y,1),round(top,1),n,round(min(c['x0'] for c in cc),1),round(max(c['x1'] for c in cc),1),len(cc))
