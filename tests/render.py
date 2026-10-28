import json,sys
from PIL import Image,ImageDraw
A=json.load(open(sys.argv[1])); S=12; W=1100
im=Image.new('RGB',(W,W),'white'); d=ImageDraw.Draw(im)
ci=-1; cols=A['colors']; col=cols[0] if cols else '#000'
k=0
for i in range(len(A['X'])):
  c=A['C'][i]
  if c==3: k+=1; col=cols[k]; continue
  if i>0 and c==0 and A['C'][i-1]!=3:
    p=(A['X'][i-1]*S+W/2,A['Y'][i-1]*S+W/2); q=(A['X'][i]*S+W/2,A['Y'][i]*S+W/2)
    d.line([p,q],fill=col,width=2)
  if c==1 and i>0:
    p=(A['X'][i-1]*S+W/2,A['Y'][i-1]*S+W/2); q=(A['X'][i]*S+W/2,A['Y'][i]*S+W/2)
    d.line([p,q],fill='#f0f',width=1)
im.save(sys.argv[2])
