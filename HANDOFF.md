# HANDOFF — ciclo-inmovil-audioweb

**Estado (2026-08-09): LIBRO COMPLETO EN VIVO — narración v26 (32/32 capítulos).**
- Los 32 mp3 se regeneraron con Qwen3-TTS local (voz faraón + voz Élian por
  sección de POV, ver `C:\Users\escan\OneDrive\Documents\Claude\docs\HANDOFF-audio-libro.md`
  para el pipeline completo de generación).
  Reemplazados en el Release `audio-v1` de `escandargiadach/ciclo-inmovil-audio`
  vía `deploy_audio.py` (borra el asset viejo y sube el nuevo por número de
  capítulo, uno por uno — script quedó en el scratchpad de la sesión que hizo el
  deploy, no en este repo).
- `content.js` actualizado: títulos/archivos de caps 5 ("Lo que la prueba medía"
  -> "La marca roja"), 12 ("La señal pendiente" -> "La fase pendiente") y 27
  (archivo `27-la-lanza-de-vahl.mp3` -> `27-la-lanza-de-vhal.mp3`, corrige
  ortografía) al manuscrito final aprobado.
- `index.html`: stat estático "08 Capítulos activos" corregido a "32" (el contador
  de arriba, `#chapterCount`, ya era dinámico -- este de abajo no tenía `id` y
  quedó pegado en 8 desde que el libro tenía solo la Parte I).
- `sw.js`: `SHELL_CACHE` v31->v32, `AUDIO_CACHE` v27->v28 (regla del repo: todo
  cambio a shell/content.js exige bump antes de deploy).
- Verificado en vivo (2026-08-09): título del cap 5 actualizado, contador en 32,
  audio del cap 1 reproduce con `readyState=4` sin error desde la URL nueva del
  Release. `content.js` sirve el contenido nuevo aunque la primera carga del
  navegador puede pescar cache -- forzar reload si algo se ve viejo.
- Pendiente: la Parte IV en `content.js`/`app.js` sigue apuntando a la carpeta
  física `parte-3/` en el campo `file` (cosmético, `app.js` solo usa el basename,
  no rompe nada).

**Segunda tanda (2026-08-09, mismo día):**
- Escandar detectó que el título del cap 2 lo decía la voz del faraón (hombre)
  aunque todo el capítulo es de Élian -- sonaba a que un narrador ajeno
  presentaba algo que en realidad cuenta ella. Fix en el generador (no en este
  repo, ver HANDOFF del pipeline): el título ahora lo dice quien narra esa
  sección. 10 capítulos regenerados (solo el chunk de título, no el capítulo
  entero) y re-subidos al Release.
- `index.html`: "Lista de reproducción / Partes I y II" (quedó de cuando el
  libro tenía solo 2 partes) -> **"Libro completo"**.
- Nuevo: botón para **marcar un capítulo como terminado manualmente** en la
  lista (antes solo se auto-marcaba al escuchar el 90%+ o llegar al final).
  `toggleChapterDone(index)` en app.js, toggle circular con check a la derecha
  de cada fila (`.chapter-done-toggle`), estructura de la fila cambiada de
  `<button>` suelto a `<div class="chapter-item-wrap">` con DOS botones
  hermanos (seleccionar capítulo + marcar terminado) para no anidar botones
  (HTML inválido). `stopPropagation()` en el toggle para no disparar la
  selección del capítulo al click.
- `sw.js`: bump v32->v33 / v28->v29 (shell cambió de nuevo).
- Verificado en vivo: "Libro completo" y el toggle presentes tras el deploy.

**Tercera tanda (2026-08-09): "audio no encontrado" -- causa raíz encontrada y
arreglada en el service worker.**
- Escandar reportó el error dos veces (antes y después del deploy de las
  correcciones v28). Probé los 32 capítulos en un navegador limpio (sin estado
  previo) y los 32 cargaron perfecto -- confirma que NO es un problema de
  archivos faltantes en el Release.
- Causa real: el fetch handler de `sw.js` para audio hacía
  `caches.match(request)` ANTES de ir a la red. Si alguna vez se usó "Guardar
  capítulo sin conexión" (o quedó una respuesta parcial/rota en Cache Storage
  por cualquier motivo), esa versión cacheada se serviría PARA SIEMPRE, sin
  importar que el mp3 en el Release se actualizara después -- el bump de
  `AUDIO_CACHE` en sw.js no limpia entradas dentro de un cache existente, y
  encima `app.js` usa su PROPIO nombre de cache para offline
  (`el-ciclo-inmovil-audio-v1`, no sincronizado con el de sw.js -- bug
  relacionado, más chico, sigue pendiente como tarea aparte).
- Fix: el handler de audio ahora intenta la RED primero; si responde ok, la
  cachea (bajo el `AUDIO_CACHE` versionado del propio SW) y la devuelve; solo
  cae a caché si la red falla de verdad (offline real). Efecto colateral bueno:
  se autocura solo -- no hace falta que Escandar borre datos del sitio a mano,
  en cuanto el navegador tome el SW nuevo y el audio cargue una vez por red
  bien, la entrada vieja/rota queda sobrescrita.
- `sw.js`: bump v33->v34 / v29->v30. Deployado.
- **Seguía fallando SOLO en iPhone/Safari** (desktop y el navegador emulado con
  UA Android probaron bien). Causa: Safari en iOS maneja mal los redirects
  (GitHub Releases -> Azure Blob) y los Range requests de audio cuando pasan
  por el `fetch` handler de un service worker -- bug conocido de WebKit, no
  algo arreglable ajustando la estrategia de cache. Fix definitivo: el audio
  ya NO pasa por el service worker en absoluto (el handler retorna sin
  `respondWith`, dejando que el navegador lo maneje nativo). El botón
  "Guardar sin conexión" sigue funcionando aparte (usa la Cache API directo
  desde `app.js`, no depende de este handler). Bump v34->v35 / v30->v31.
  Pendiente: confirmación de Escandar desde el iPhone real.

**Estado (2026-08-05): EN VIVO en GitHub Pages tras caída de Netlify.**
- **Sitio activo:** https://escandargiadach.github.io/ciclo-inmovil-audioweb/
- **Netlify** (`https://el-ciclo-inmovil.netlify.app`) bloqueado por `usage_exceeded` (excedió 100GB/mes del free tier cuando el audio de 1.1GB vivía ahí). Cuenta bloquea deploys nuevos también, no solo tráfico. Reset del billing period: `2026-08-07 00:00 -07:00`. Reintentar deploy Netlify después de esa fecha si se quiere recuperar ese dominio (código shell-only ya listo, solo falta publicar).

## Qué es
Audioweb PWA del libro "El ciclo inmóvil" (Partes I–III, 32 capítulos). Estático: `index.html` + `app.js` + `content.js` (datos) + `fx.js` + `sw.js`. **El audio ya NO vive en el repo del sitio** — carpeta local movida a `web/ciclo-inmovil-audioweb-audio-backup/` (backup, no se despliega).

## Arquitectura de hosting (2026-08-05)
- **Shell (HTML/CSS/JS, ~5.9MB):** repo `escandargiadach/ciclo-inmovil-audioweb` en GitHub, servido por GitHub Pages (rama `main`, root). Push normal + Pages se reconstruye solo en ~30-60s.
- **Audio (1.1GB, 32 mp3):** repo `escandargiadach/ciclo-inmovil-audio`, subido como GitHub Release (`tag: audio-v1`), assets planos (sin subcarpetas). `content.js` → `site.audioBaseUrl = "https://github.com/escandargiadach/ciclo-inmovil-audio/releases/download/audio-v1/"`. `app.js` arma la URL con `chapter.file.split("/").pop()` (toma solo el nombre de archivo, ignora `parte-N/`). Verificado: redirect a Azure Blob, soporta `Range` (206 Partial Content) → scrubbing funciona.
- **Por qué no jsDelivr:** tiene límite duro de 20MB/archivo; 28 de los 32 capítulos lo superan. GitHub Releases no tiene ese límite (usado por proyectos con binarios de GBs).
- **Deploy del shell:** clonar `ciclo-inmovil-audioweb`, copiar los archivos del folder local, commit, push a `main` (con token en URL solo para el push, luego quitarlo). Pages no necesita comando de "publish" aparte.
- **Deploy de audio nuevo/reemplazado:** subir asset al Release vía API (`POST https://uploads.github.com/repos/escandargiadach/ciclo-inmovil-audio/releases/{release_id}/assets?name=archivo.mp3` con el mp3 como body binario, header `Content-Type: audio/mpeg`).
- Token usado tenía scopes de sobra (el usuario generó uno con casi todos los permisos) — para el próximo, pedir solo scope `repo`.

## Deploy Netlify (legado, para cuando se recupere la cuenta)
- Netlify site id `f2f05d21-0b5b-4894-a7dc-b283f176484a` (nombre `el-ciclo-inmovil`).
- **Solo por CLI** (CLI ya autenticado): `npx netlify-cli deploy --prod --dir . --site f2f05d21-0b5b-4894-a7dc-b283f176484a`
- **Nunca Netlify Drop**: descarta los MP3 grandes en silencio (causó los 404 originales).
- Si `deploy --prod` da `JSONHTTPError: Forbidden`: hacer deploy draft (sin `--prod`), sacar el deploy_id de `api listSiteDeploys`, y publicarlo con `api restoreSiteDeploy --data '{"site_id":"...","deploy_id":"..."}'`. Funcionó 2026-07-31.
- **Nunca volver a poner el audio pesado dentro del folder que se deploya a Netlify** — eso fue la causa raíz del `usage_exceeded`. El audio vive en GitHub Releases ahora; si se recupera Netlify, debe seguir sirviendo solo el shell liviano.

## Gotchas resueltas
- Headers dan `/audio/*` caché 7 días; los 404 viejos quedaron cacheados en navegadores → audio se pide con `?v=2` (app.js:218). Si se reemplazan MP3, subir a `?v=3` y bumpear `SHELL_CACHE`/`AUDIO_CACHE` en sw.js.
- sw.js ya no cachea respuestas no-ok.
- **REGLA: todo cambio a index.html / styles.css / content.js / app.js / fx.js exige bump de `SHELL_CACHE`/`AUDIO_CACHE` en sw.js antes de deployar** — el shell es cache-first; sin bump los clientes quedan pegados a la versión vieja para siempre (pasó 2026-08-03 con los emblemas).

## Temas por Casa (2026-07-30)
- Selector Fulgur / Gélida / Assum en topbar (y menú móvil). `body[data-house]` + CSS vars al final de styles.css; sello de la Casa como identidad (topbar + marca de agua del hero) en `assets/seals/seal-*.webp` (PNG originales en `Downloads\archive (2)`). Estado en `state.house` (localStorage). Atmósferas: grid eléctrico / nieve / brasas. Inspirado en `Downloads\El_Ciclo_Inmovil_Interfaces_FX_v4 (1).html`.
- Gotcha: consts de app.js usadas en el init (línea ~57) deben declararse arriba (TDZ rompió todo el init sin error visible en consola).

## Fuente de audios
`C:\Users\escan\Downloads\El Ciclo Inmovil\NN_Fragmentos_Higgsfield\CNN_completo.mp3` (capítulos 01–16; solo 01–08 tienen completo hoy).

## Parte II (agregada 2026-07-30)
- Caps 9–16 en `audio/parte-2/` ("Parte II — Activación", títulos del manuscrito v6 del CANON). Los `C0X_completo.mp3` de 9–16 se generaron uniendo fragmentos con ffmpeg concat (warnings de dts = benignos). `audioBaseUrl` ahora es `audio/` y cada capítulo lleva `part` + ruta `parte-N/…`.

## FX + dropdown (2026-07-31)
- `fx.js`: efectos canvas full-screen al cambiar de Casa (rayos / cristalización / fuego de partículas), one-shot ~1.5s, respeta prefers-reduced-motion; se dispara desde applyHouse solo con persist=true (clic de usuario). Canvas `#fxCanvas` + velo `#fxVeil` en index.html; keyframes `seal-anim-*` en styles.css.
- Lista de capítulos agrupada por parte con acordeón (`.part-header`, `expandedParts` en app.js); progreso se actualiza en sitio vía `[data-index]` (no re-render → sin parpadeo).
- Demos de la animación en `_scratch/demo-pulso-elemental-v3.html` (y v1/v2).

## Pendiente
- Galería usa SVG placeholder; reemplazar por láminas reales cuando existan.
- Preview local: server `ciclo-inmovil-audioweb` (puerto 5690) en launch.json.
