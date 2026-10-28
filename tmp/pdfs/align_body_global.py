from pathlib import Path
from pypdf import PdfReader,PdfWriter
src=Path(r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-formatted.pdf')
out=Path(r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-RTL.pdf')
r=PdfReader(str(src));w=PdfWriter()
sx=0.908;tx=22.4
for i,p in enumerate(r.pages):
 if i>=2: p.add_transformation((sx,0,0,1,tx,0))
 w.add_page(p)
w.write(str(out))
print(f'Created {out}; pages={len(w.pages)}; pages 1-2 unchanged; body horizontal width {sx:.3f} and right edge aligned to reference margin')
