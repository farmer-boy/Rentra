from PIL import Image
import numpy as np
im=Image.open(r'E:\Rentra\tmp\pdfs\rtlfix-04.png').convert('L')
a=np.array(im)
ink=(a<145)
row=ink.sum(1)
active=np.where(row>5)[0]
runs=[]
if len(active):
 s=pr=active[0]
 for y in active[1:]:
  if y-pr>1:runs.append((s,pr,int(row[s:pr+1].max()),int(row[s:pr+1].sum())));s=y
  pr=y
 runs.append((s,pr,int(row[s:pr+1].max()),int(row[s:pr+1].sum())))
print(im.size)
print(runs)
