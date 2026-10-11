import sys, numpy as np, cv2
mapf, outdir = sys.argv[1], sys.argv[2]
im=cv2.imread(mapf).astype(int); H,W=im.shape[:2]
OX,OY=18,150
L=[(795,150),(775,700),(735,1000),(705,1310)]; R=[(955,150),(990,700),(1040,1000),(1100,1310)]
def c(p): return [(x-OX,y-OY) for x,y in p]
nid=np.zeros((H,W),np.uint8); cv2.fillPoly(nid,[np.array(c(L)+c(R)[::-1],np.int32)],255)
left=np.zeros((H,W),np.uint8); cv2.fillPoly(left,[np.array([(0,0)]+c(L)+[(0,H)],np.int32)],255)
right=np.zeros((H,W),np.uint8); cv2.fillPoly(right,[np.array(c(R)+[(W,H),(W,0)],np.int32)],255)
b,g,r=im[...,0],im[...,1],im[...,2]
ocean=((b>r+12)&(b>g-5)).astype(np.uint8)*255
ocean=cv2.medianBlur(ocean,9)
land=cv2.morphologyEx(255-ocean,cv2.MORPH_OPEN,np.ones((9,9),np.uint8))
land=cv2.morphologyEx(land,cv2.MORPH_CLOSE,np.ones((21,21),np.uint8))
assum=cv2.bitwise_and(land,right)
# keep components touching the wall edge (mainland) + Farallon peninsula: keep components > 5000 px
n,lab,st,_=cv2.connectedComponentsWithStats(assum)
keep=np.zeros_like(assum)
for i in range(1,n):
    if st[i,4]>4000: keep[lab==i]=255
assum=keep
# Dia Extremo limit: soft cut above diagonal (1300,150)->(1650,700) in original coords
dz=np.zeros((H,W),np.uint8); cv2.fillPoly(dz,[np.array(c([(1300,150),(1650,700),(2048,700),(2048,150)]),np.int32)],255)
assum[dz>0]=0
assum=cv2.morphologyEx(assum,cv2.MORPH_OPEN,np.ones((7,7),np.uint8))
# fill lakes/rivers: inverse components that are small or don't reach the open ocean
inv=cv2.bitwise_and(255-assum,right); inv[dz>0]=0
n,lab,st,_=cv2.connectedComponentsWithStats(inv)
for i in range(1,n):
    if st[i,4]<40000: assum[lab==i]=255
# smooth contours slightly
for name,m in [('gran-noche',left),('nidum',nid),('assum',assum)]:
    ms=cv2.GaussianBlur(m,(0,0),2.0)
    _,mb=cv2.threshold(ms,127,255,cv2.THRESH_BINARY)
    # fill: soft-edged alpha mask
    fill=cv2.GaussianBlur(mb,(0,0),1.5)
    rgba=np.zeros((H,W,4),np.uint8); rgba[...,:3]=255; rgba[...,3]=fill
    cv2.imwrite(f'{outdir}/mask-{name}.png',rgba)
    # border stroke (skip image frame)
    pad=cv2.copyMakeBorder(mb,8,8,8,8,cv2.BORDER_REPLICATE)
    e=cv2.morphologyEx(pad,cv2.MORPH_GRADIENT,np.ones((5,5),np.uint8))[8:-8,8:-8]
    e=cv2.GaussianBlur(e,(0,0),0.8)
    rgba=np.zeros((H,W,4),np.uint8); rgba[...,:3]=255; rgba[...,3]=e
    cv2.imwrite(f'{outdir}/borde-{name}.png',rgba)
    print(name, int((mb>0).sum()))
