import sys, numpy as np, cv2
src, outdir = sys.argv[1], sys.argv[2]
im=cv2.imread(src)
E={'aurelian':(94,288),'veyron':(414,288),'sevrin':(94,516),'solenne':(414,516),'corven':(94,744),'ordel':(414,744),
   'helion':(756,346),'valeris':(980,346),'sareth':(756,686),'ardent':(980,686),
   'veyra':(1226,346),'orsen':(1450,346),'silven':(1226,686),'korr':(1450,686)}
R=35; UP=4
for n,(x,y) in E.items():
    crop=im[y-R:y+R+1,x-R:x+R+1]
    big=cv2.resize(crop,None,fx=UP,fy=UP,interpolation=cv2.INTER_LANCZOS4)
    bl=cv2.GaussianBlur(big,(0,0),2.2); big=cv2.addWeighted(big,1.6,bl,-0.6,0)  # unsharp
    s=big.shape[0]; a=np.zeros((s,s),np.uint8)
    cv2.circle(a,(s//2,s//2),int(33.2*UP),255,-1,lineType=cv2.LINE_AA)
    a=cv2.GaussianBlur(a,(0,0),1.2)
    out=np.dstack([big,a]); cv2.imwrite(f'{outdir}/emb-{n}.png',out)
print(len(E))
