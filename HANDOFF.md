# HANDOFF — ciclo-inmovil-audioweb

**Estado (2026-07-30): EN VIVO y funcionando.** https://el-ciclo-inmovil.netlify.app

## Qué es
Audioweb PWA del libro "El ciclo inmóvil" (Parte I, 8 capítulos). Estático: `index.html` + `app.js` + `content.js` (datos) + `sw.js` + `audio/parte-1/*.mp3` (~215 MB).

## Deploy
- Netlify site id `f2f05d21-0b5b-4894-a7dc-b283f176484a` (nombre `el-ciclo-inmovil`).
- **Solo por CLI** (CLI ya autenticado): `npx netlify-cli deploy --prod --dir . --site f2f05d21-0b5b-4894-a7dc-b283f176484a`
- **Nunca Netlify Drop**: descarta los MP3 grandes en silencio (causó los 404 originales).
- Si `deploy --prod` da `JSONHTTPError: Forbidden`: hacer deploy draft (sin `--prod`), sacar el deploy_id de `api listSiteDeploys`, y publicarlo con `api restoreSiteDeploy --data '{"site_id":"...","deploy_id":"..."}'`. Funcionó 2026-07-31.

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
