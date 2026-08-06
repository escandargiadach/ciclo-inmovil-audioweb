# El ciclo inmóvil — Audioweb

Primera versión de una web estática para publicar el audiolibro de **Los hijos del muro** en Netlify.

## 1. Agregar los audios

Copia los ocho MP3 de la Parte I dentro de:

`audio/parte-1/`

Deben conservar exactamente estos nombres:

1. `01-la-vida-que-le-quedaba.mp3`
2. `02-la-segunda-muerte.mp3`
3. `03-la-historia-correcta.mp3`
4. `04-la-linea-blanca.mp3`
5. `05-los-hijos-del-muro.mp3`
6. `06-los-nombres-prestados.mp3`
7. `07-los-nombres-heredados.mp3`
8. `08-lo-que-despierta.mp3`

Si tus archivos tienen otros nombres, renómbralos o cambia la propiedad `file` correspondiente dentro de `content.js`.

## 2. Reemplazar la portada

Reemplaza:

`assets/cover/portada.svg`

Puedes usar JPG, PNG o WebP. Si cambias el nombre o la extensión, actualiza `cover` dentro de `content.js`.

## 3. Reemplazar sellos, personajes e infografías

Los archivos provisionales están en:

`assets/gallery/`

Puedes reemplazarlos manteniendo los mismos nombres, o editar las rutas en `content.js`.

Cada elemento visual tiene:

- `title`: nombre visible;
- `category`: Sellos, Personajes, Infografías o Lugares;
- `image`: ruta del archivo;
- `unlockChapter`: capítulo que debe alcanzarse para desbloquearlo;
- `caption`: descripción breve.

El visitante puede desactivar la protección de spoilers.

## 4. Probar la web

La forma más fiable es usar un servidor local. Desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

Después abre:

`http://localhost:8000`

También puedes abrir `index.html` directamente, pero las funciones PWA y sin conexión requieren HTTP o HTTPS.

## 5. Publicar en Netlify

1. Asegúrate de que los MP3 y las imágenes estén dentro de esta carpeta.
2. Comprime **el contenido de la carpeta**, no una carpeta vacía superior.
3. En Netlify, crea un sitio mediante despliegue manual.
4. Arrastra la carpeta o el ZIP.
5. Abre la URL generada y prueba los ocho capítulos desde teléfono y computadora.
6. Cambia el nombre del sitio en la configuración de Netlify.

## 6. Cuando los audios sean demasiado pesados

La web admite alojar los MP3 en otro servicio, como Cloudflare R2. Cambia en `content.js`:

```js
audioBaseUrl: "https://tu-dominio-de-audio.example/parte-1/"
```

El servidor externo debe permitir solicitudes CORS desde el dominio de la web. Para el guardado sin conexión también debe permitir descargar el archivo completo.

## Funciones incluidas

- reproductor adaptable a teléfono;
- avance y retroceso de 10 segundos;
- capítulo anterior y siguiente;
- velocidad de 0.75× a 2×;
- guardado automático del capítulo y segundo exacto;
- progreso por capítulo y progreso total;
- reproducción automática del siguiente capítulo;
- controles del sistema mediante Media Session cuando el navegador lo permite;
- tema claro y oscuro;
- archivo visual filtrable;
- protección de spoilers por progreso;
- instalación como PWA;
- guardado manual de capítulos para escuchar sin conexión;
- estructura lista para agregar Partes II, III y IV.

## Edición principal

La mayor parte del contenido se controla desde un solo archivo:

`content.js`

No necesitas modificar `index.html` para añadir capítulos o material visual.
