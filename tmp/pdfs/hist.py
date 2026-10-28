from pypdf import PdfReader
from pypdf.generic import ContentStream
from collections import Counter
r=PdfReader(r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-formatted.pdf'); p=r.pages[3]; cs=ContentStream(p.get_contents(),r)
mat=None; cnt=Counter(); font=None; size=0; grp={}
for args,op in cs.operations:
 if op==b'Tf':font,size=args[0],float(args[1])
 elif op==b'Tm': mat=args
 elif op in (b'Tj',b'TJ') and mat is not None:
  y=float(mat[5]); x=float(mat[4]); cnt[round(y,1)]+=1
  grp.setdefault(round(y,1),[]).append((x,font,size,op,args))
print(cnt.most_common(35))
