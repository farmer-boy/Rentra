from collections import Counter,defaultdict
from pathlib import Path
from pypdf import PdfReader,PdfWriter
from pypdf.generic import ContentStream,FloatObject,NameObject
src=Path(r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-formatted.pdf'); out=Path(r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-RTL.pdf')
r=PdfReader(str(src)); w=PdfWriter(); target_tm=515.0
for pi,page in enumerate(r.pages):
 if pi<2: w.add_page(page); continue
 cs=ContentStream(page.get_contents(),r); mats=[]; cnt=Counter()
 for i,(a,op) in enumerate(cs.operations):
  if op!=b'Tm': continue
  y=float(a[5])
  if not 75<y<775: continue
  if any(cs.operations[j][1] in (b'Tj',b'TJ') for j in range(i+1,min(i+5,len(cs.operations)))):
   mats.append((i,float(a[4]),y));cnt[round(y,1)]+=1
 peaks=sorted((y,n) for y,n in cnt.items() if n>=2); groups=[]
 for y,n in peaks:
  if groups and y-groups[-1][0]<8:
   old,nn=groups[-1];groups[-1]=((old*nn+y*n)/(nn+n),nn+n)
  else:groups.append((y,n))
 centers=[y for y,n in groups]; lineops=defaultdict(list)
 for oi,x,y in mats:
  if centers:
   j=min(range(len(centers)),key=lambda j:abs(centers[j]-y))
   lineops[j].append(oi)
 shifts=[]
 for j,ops in lineops.items():
  xmax=max(float(cs.operations[oi][0][4]) for oi in ops)
  dx=target_tm-xmax
  if abs(dx)<0.5:continue
  for oi in ops:
   a,op=cs.operations[oi];b=list(a);b[4]=FloatObject(float(b[4])+dx);cs.operations[oi]=(b,op)
  shifts.append((round(centers[j],1),round(xmax,1),round(dx,1),len(ops)))
 # Also move each line's initial Td position; some text is emitted before the per-glyph Tm placements.
 for oi,(a,op) in enumerate(cs.operations):
  if op!=b'Td': continue
  y=float(a[1])
  if not 75<y<775 or not centers: continue
  j=min(range(len(centers)),key=lambda j:abs(centers[j]-y))
  if j not in lineops: continue
  dx=target_tm-max(float(cs.operations[k][0][4]) for k in lineops[j])
  b=list(a);b[0]=FloatObject(float(b[0])+dx);cs.operations[oi]=(b,op)
 page[NameObject('/Contents')]=cs;w.add_page(page)
 print(f'page {pi+1}: lines={len(shifts)} shifts={shifts[:8]}')
w.write(str(out));print(f'Created {out}; pages={len(w.pages)}; first two unchanged')


