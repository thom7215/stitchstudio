# realistic-ish render of assembled stitches: thread 0.4mm wide with dark edge
import json, sys
from PIL import Image, ImageDraw
def render(A, out, scale=14, pad=4, bg=(244,241,234), crop=None):
    X,Y,C=A['X'],A['Y'],A['C']
    xs=[x for x,c in zip(X,C) if c==0]; ys=[y for y,c in zip(Y,C) if c==0]
    x0,x1,y0,y1=min(xs)-pad,max(xs)+pad,min(ys)-pad,max(ys)+pad
    if crop: x0,y0,x1,y1=crop
    W,H=int((x1-x0)*scale),int((y1-y0)*scale)
    im=Image.new('RGB',(W,H),bg); d=ImageDraw.Draw(im)
    def P(i): return ((X[i]-x0)*scale,(Y[i]-y0)*scale)
    for pas in (0,1):
        ci=0; col=A['colors'][0]
        for i in range(1,len(X)):
            if C[i]==3: ci+=1; col=A['colors'][ci]; continue
            if C[i]!=0 or C[i-1] in (2,3): continue
            h=col.lstrip('#'); r,g,b=int(h[0:2],16),int(h[2:4],16),int(h[4:6],16)
            if pas==0: d.line([P(i-1),P(i)],fill=(int(r*.6),int(g*.6),int(b*.6)),width=max(1,int(0.42*scale)))
            else: d.line([P(i-1),P(i)],fill=(r,g,b),width=max(1,int(0.28*scale)))
    # jumps in magenta thin
    for i in range(1,len(X)):
        if C[i]==1: d.line([P(i-1),P(i)],fill=(255,0,160),width=1)
    im.save(out); return im.size
if __name__=='__main__':
    A=json.load(open(sys.argv[1])); print(render(A, sys.argv[2], float(sys.argv[3]) if len(sys.argv)>3 else 14))
