from pypdf import PdfReader
from pypdf.generic import ContentStream
from collections import defaultdict,Counter
r=PdfReader(r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-formatted.pdf');p=r.pages[3];cs=ContentStream(p.get_contents(),r)
ctr=Counter(); records=[];actual=None
for i,(a,o) in enumerate(cs.operations):
 if o==b'BDC' and len(a)>1 and isinstance(a[1],dict):actual=a[1].get('/ActualText')
 elif o==b'Tm': xy=(float(a[4]),float(a[5]))
 elif o in (b'Tj',b'TJ') and actual and xy[1]<775 and xy[1]>80: records.append((xy[0],xy[1],actual))
 elif o==b'EMC':actual=None
for x,y,ch in records:ctr[round(y,1)]+=1
peaks=[y for y,n in ctr.items() if n>=5]
# merge peaks under 8 points
peaks=sorted(peaks); groups=[]
for y in peaks:
 if groups and y-groups[-1][-1]<8:groups[-1].append(y)
 else:groups.append([y])
centers=[sum(g)/len(g) for g in groups]
lines=defaultdict(list)
for x,y,ch in records:
 j=min(range(len(centers)),key=lambda j:abs(centers[j]-y))
 lines[j].append((x,y,ch))
for j in sorted(lines):
 c=sorted(lines[j],key=lambda z:-z[0]); print('LINE',round(centers[j],1),''.join(z[2] for z in c)); print([(round(x),round(y,1),ch) for x,y,ch in c[:60]])
