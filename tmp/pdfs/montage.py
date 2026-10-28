from PIL import Image,ImageOps,ImageDraw
from pathlib import Path
files=[Path(rf'E:\Rentra\tmp\pdfs\finalrtl-{i:02d}.png') for i in range(6,15)]
ims=[Image.open(f).convert('RGB') for f in files]
thumbs=[]
for im in ims:
 im.thumbnail((350,500)); thumbs.append(im.copy())
W=350*3; H=500*3
out=Image.new('RGB',(W,H),'#dddddd')
for k,im in enumerate(thumbs):
 x=(k%3)*350; y=(k//3)*500; out.paste(im,(x,y))
out.save(r'E:\Rentra\tmp\pdfs\finalrtl-montage.png')
