# 5 instrucciones para que una animación no parezca PowerPoint

Fuente: reel de @sanmunoz.ia (instagram.com/reel/DeXur-5oF_o), "Tips de animación con Claude".
Aquí van tal como las explica y cómo se aplican en nuestro motor de reels (`render(t)` puro, export con Playwright).

## 1. Revela el texto desde una máscara

Las palabras salen de detrás de un borde en lugar de "encenderse" con un fade.

- Cada línea va en un contenedor con `overflow: hidden`; la palabra entra con `translateY(110%) → 0`.
- Escalonar por palabra (0.05–0.08 s), con easing de salida fuerte (`easeOutCubic`/`easeOutExpo`).
- Un subrayado o barra de color que barre la palabra clave refuerza el énfasis.

**Prompt:** "Revela el texto desde una máscara: cada palabra sube desde detrás de una línea, no aparece con fade."

## 2. Encadena los movimientos

Un elemento entra, empuja al siguiente y provoca una acción. Nada se mueve solo.

- El final de la animación de A es el inicio de la de B (B arranca cuando A lo toca).
- Al contacto: pequeño rebote/squash en ambos y desplazamiento del empujado.
- La cadena termina en una acción visible (un botón se presiona, algo cae, cambia de estado).

**Prompt:** "Encadena los movimientos: cada elemento entra y empuja al siguiente, y el último dispara una acción."

## 3. Haz que la cámara siga algo importante

La cámara acompaña al objeto que importa (una mano, un elemento en movimiento), con un poco de retraso.

- La cámara es una transformación del mundo (`translate/scale`) que persigue la posición del objetivo con suavizado (lag).
- Agregar paralaje: el fondo se mueve menos que el primer plano.
- Opcional: marco de "REC" o retícula que enmarca el objetivo.

**Prompt:** "Haz que la cámara siga [el objeto] con un leve retraso y paralaje en el fondo."

## 4. Transforma un objeto para introducir la siguiente escena

En vez de cortar o hacer fade, un elemento de la escena actual se convierte en la siguiente (una tarjeta se expande y se vuelve la interfaz).

- Animar `left/top/width/height/border-radius` (o `clip-path`) del objeto hasta cubrir la pantalla.
- El contenido nuevo aparece dentro del objeto ya expandido.

**Prompt:** "Transforma [el objeto] para introducir la siguiente escena: que se expanda y se convierta en ella."

## 5. Sincroniza entradas y énfasis con la narración

Cuando la voz dice una cifra, aparece la cifra. Cuando dice un objeto, aparece el objeto. Cuando dice una acción, ocurre.

- Generar la voz primero (Qwen3-TTS, voz faraón clonada) y sacar marcas de tiempo por palabra con faster-whisper (`word_timestamps=True`).
- Anclar cada entrada/énfasis a la palabra exacta (`t = inicio_palabra - 0.05`).
- Si la animación ya existe, usar un remapeo de tiempo por anclas `[tiempo_real, tiempo_animación]`.

**Prompt:** "Sincroniza las entradas y los énfasis con mi narración: cada cifra, objeto o acción aparece cuando lo digo."

## Checklist rápido

| # | Instrucción | Señal de que falta |
|---|---|---|
| 1 | Máscara | El texto aparece con fade |
| 2 | Encadenar | Los elementos entran cada uno por su cuenta |
| 3 | Cámara que sigue | Encuadre fijo todo el video |
| 4 | Transformar | Cortes o fades entre escenas |
| 5 | Sincronizar | Lo que se ve no coincide con lo que se dice |
