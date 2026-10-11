import sys, numpy as np, cv2
src, out, prev = sys.argv[1], sys.argv[2], sys.argv[3]
im=cv2.imread(src)
L=[ # box (x0,y0,x1,y1), dot or None

((660,158,830,184),(846,182)),((880,285,960,308),(857,308)),
((255,268,338,292),(220,295)),((226,285,282,305),None),
((452,355,542,378),(420,377)),((130,455,333,477),(326,478)),
((642,404,750,428),(851,427)),((538,517,686,541),(503,540)),
((885,537,978,560),(860,558)),((648,619,734,642),(612,641)),
((640,675,740,698),(851,697)),((268,786,408,809),(234,809)),
((885,806,980,830),(861,829)),((665,931,747,955),(855,954)),
((942,979,1010,1001),(917,1005)),((885,1057,1058,1081),(862,1080)),
((1390,310,1486,334),(1360,332)),((1135,491,1233,515),(1103,514)),
((1213,631,1308,655),(1183,653)),((1196,794,1300,818),(1165,816)),
((1512,854,1630,880),(1482,879)),
]
m=np.zeros(im.shape[:2],np.uint8)
for (x0,y0,x1,y1),d in L:
    cv2.rectangle(m,(x0-5,y0-5),(x1+5,y1+5),255,-1)
    if d:
        dx,dy=d; cv2.circle(m,(dx,dy),12,255,-1)
        ex = x0 if dx<x0 else x1
        cy=(y0+y1)//2
        cv2.line(m,(dx,dy),(ex,dy),255,7); cv2.line(m,(ex,dy),(ex,cy),255,7)
# Vhal red line + diamond, vigilia underline
cv2.line(m,(222,312),(352,313),255,8); cv2.circle(m,(350,313),13,255,-1)
cv2.line(m,(128,476),(330,476),255,8)
# exemplar fill: per mask component, copy best-matching nearby patch with feathered edge
r=im.copy().astype(np.float32)
n,lab,st,_=cv2.connectedComponentsWithStats(m)
H,W=m.shape
for i in range(1,n):
    x,y,w,h,_a=st[i]
    if y<150: continue  # header row gets cropped away
    comp=(lab==i).astype(np.uint8)
    pad=14
    X0,Y0,X1,Y1=max(x-pad,0),max(y-pad,0),min(x+w+pad,W),min(y+h+pad,H)
    cm=comp[Y0:Y1,X0:X1]
    ring=cv2.dilate(cm,np.ones((15,15),np.uint8))-cm
    best=None
    for dy in [-(h+40),-(h+20),h+20,h+40,0,-2*h-40,2*h+40]:
        for dx in [-(w+30),0,w+30,-(w//2+30),w//2+30]:
            if dx==0 and dy==0: continue
            sx0,sy0,sx1,sy1=X0+dx,Y0+dy,X1+dx,Y1+dy
            if sx0<0 or sy0<150 or sx1>W or sy1>H: continue
            if m[sy0:sy1,sx0:sx1].any(): continue
            src=im[sy0:sy1,sx0:sx1].astype(np.float32); tgt=im[Y0:Y1,X0:X1].astype(np.float32)
            e=(((src-tgt)**2).sum(axis=2)*ring).sum()/max(ring.sum(),1)
            if best is None or e<best[0]: best=(e,sx0,sy0)
    if best is None: continue
    _,sx0,sy0=best
    src=im[sy0:sy0+(Y1-Y0),sx0:sx0+(X1-X0)].astype(np.float32)
    a=cv2.GaussianBlur(cv2.dilate(cm,np.ones((9,9),np.uint8)).astype(np.float32),(0,0),4)[...,None]
    r[Y0:Y1,X0:X1]=r[Y0:Y1,X0:X1]*(1-a)+src*a
r=np.clip(r,0,255).astype(np.uint8)
r=r[150:1310,18:1704]
cv2.imwrite(out,r,[cv2.IMWRITE_JPEG_QUALITY,92])
cv2.imwrite(prev,cv2.resize(r,(r.shape[1]//2,r.shape[0]//2)))
print(r.shape)
