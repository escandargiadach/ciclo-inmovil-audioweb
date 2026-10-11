# Atlas del poder — reel 9:16

Prototipo de reel inspirado en los videos de "marcas por país" sobre mapa
(referencia: instagram.com/reel/DeThzGWI2fB). La cámara recorre el mapa canónico
y muestra las 14 Casas de Custodia por territorio: Gran Noche → Nidum → Assum.

Todo es local y gratis: sin IA ni créditos.

## Qué hay

- `index.html`: reel en HTML/CSS/JS. Todo depende de `render(t)`, así que el
  export es determinista. Duración: 24 s, 1080×1920.
- `assets/mapa-limpio.jpg`: `assets/world/mundo-realista-final-2048.webp` sin
  etiquetas ni marco (relleno con parches de textura vecina).
- `assets/mask-*.png` / `assets/borde-*.png`: máscara y borde de cada región.
- `assets/emb-*.png`: los 14 emblemas recortados de `assets/gallery/casas-v2.webp`
  (ampliados ×4; se notan suaves si se muestran a más de unos 170 px).
- `assets/sello-*.png`: sellos regionales de `assets/seals/`.
- `tools/`: scripts que generaron los assets y el MP4.

## Regenerar

```bash
pip install opencv-python-headless numpy pillow
python3 tools/clean_map.py ../../assets/world/mundo-realista-final-2048.webp assets/mapa-limpio.jpg /tmp/prev.jpg
python3 tools/gen_masks.py assets/mapa-limpio.jpg assets
python3 tools/emblems.py ../../assets/gallery/casas-v2.webp assets

# Export: servir la carpeta por HTTP (las máscaras CSS no cargan con file://)
# envolviendo index.html en <!doctype html>…<body> como render.html, luego:
npm i playwright
node tools/export.js "http://127.0.0.1:8765/render.html?export=1" atlas-del-poder.mp4
```

## Supuestos a confirmar

- Sello por región: Fulgur → Nidum, Gélida → Gran Noche, Assum → Assum.
- La frontera Assum / Día Extremo es una diagonal aproximada; el mapa canónico
  no la dibuja.
- Cierre "El sol no se mueve. El poder, sí." es copy propuesto, no canon.

Nota: Netlify publica la raíz del repo (`publish = "."`), así que esta carpeta
quedaría accesible en el sitio si se fusiona a la rama desplegada.
