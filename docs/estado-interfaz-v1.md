# Estado de la interfaz — movievault, version dibujada a mano (commit `6b81517`)

Mismo diagnostico que [estado-interfaz.md](estado-interfaz.md), pero sobre el commit
`6b81517` ("v1"), el ultimo que construia la habitacion entera con DOM + CSS + SVG en vez
de apoyarse en `images/Background.png`.

Relevado el 2026-07-28. El working tree actual no se toco: los archivos se extrajeron con
`git show 6b81517:<path>` a un directorio temporal.

Contexto de historia: el repo tiene 2 commits. `42fe05e` es el README solo, `6b81517` es
esta version. Todo lo que vino despues (fondo PNG, borrado de `rain.js`, scroll de
estanteria, caja con modo edit) esta sin commitear en el working tree.

---

## 1. Stack

- **Render de la escena:** **DOM + CSS puro, con SVG inline para las formas organicas y
  un canvas 2D para la lluvia.** Cero imagenes de escena. Cero WebGL. La habitacion
  entera son elementos posicionados en `position: absolute` dentro de un mundo fijo de
  **2400 x 1350 px**.
  - **CSS:** el 90% de la escena. Rectangulos con `border: 5-8px solid`,
    `linear-gradient`, `radial-gradient`, `box-shadow: inset`, `border-radius`,
    `clip-path` (2 usos: el pie del CRT y la estrellita `.sparkle`).
  - **SVG inline:** 10 elementos `<svg>` con 57 nodos de forma en total, para lo que no
    se puede hacer con cajas: guirnalda de luces, planta de piso, planta de escritorio,
    2 macetas del estante, 2 suculentas, hiedra, lampara, silla.
  - **Canvas 2D:** uno solo, `#rain-canvas`, para la lluvia detras del vidrio
    (`js/rain.js`, 102 lineas).
  - **CSS 3D:** dos usos, la caja de DVD abierta (`perspective: 2400px`) y la mini caja
    de la secuencia de alta (`perspective: 900px`).
- **Frameworks / librerias:** cero. JS vanilla, scripts clasicos, namespace global `MV`.
- **Versiones:** no aplica. Sin `package.json`, sin lockfile. Unica dependencia externa:
  Google Fonts por CDN (Fraunces, Nunito Sans, VT323, Caveat).
- **Build tool:** ninguno. Se sirve la carpeta cruda con `python -m http.server 8123`.
  **Nota:** en esta version los `<link>` y `<script>` son etiquetas normales, sin el
  cache-bust `?v=Date.now()` que se agrego despues. Es decir, el problema de cache que
  motivo ese parche todavia no estaba resuelto aca.
- **Tamaño del codigo de interfaz:** 3455 lineas (JS 1081, CSS 2088, HTML 286). Contra
  2013 lineas de la version PNG: **+72%**.
- **Peso binario del repo:** `cd_image.webp` (100 KB) + `final-room.jpeg` (130 KB) =
  **~230 KB**, y ninguno de los dos se referencia en codigo. Contra 15 MB en la version
  PNG. La escena entera pesa lo que pesa el HTML+CSS: **~90 KB sin comprimir**.

---

## 2. Estructura de archivos relevante a la interfaz

| Archivo | Lineas | Que hace |
|---|---|---|
| `index.html` | 286 | **La escena entera esta aca.** 200 elementos dentro de `#stage`: pared, piso, alfombra, guirnalda, estante flotante, posters, ventana con persiana, escritorio, torre, lampara, libros, taza, impresora, silla, CRT, estanteria, poster de luna, cama, planta, y 4 capas de luz. Mas `.app-chrome` fijo (logo + iconos) y `#case-overlay`. |
| `css/base.css` | 133 | Paleta (24 vars), fuentes, easing y duraciones, reset, `.app-chrome`, `.ui-btn`, override de reduced-motion. **Identico a la version actual salvo el bloque `.app-chrome`** (que despues se borro porque el header quedo pintado en el PNG). |
| `css/scene.css` | 1104 | El grueso. Cada mueble, cada objeto y cada capa de luz de la habitacion, en px de mundo. |
| `css/computer.css` | 248 | Terminal verde dentro del CRT: header, 3 vistas (`search` / `form` / `done`), resultados, formulario de alta, animacion de boot. |
| `css/case.css` | 603 | Lomos, caja abierta en CSS 3D, y las piezas de la secuencia de alta: `.mini-case`, `.fly-paper`, `.print-paper`, `.flyer`. |
| `js/camera.js` | 61 | `MV.camera`: transform de 4 partes con rotacion. `goTo`, `getView`. |
| `js/rain.js` | 102 | `MV.rain`: 42 streaks + 14 gotas en canvas 2D, loop rAF, pausa por `visibilitychange`. |
| `js/shelf.js` | 298 | Lomos + caja abierta en modo lectura unicamente. |
| `js/computer.js` | 163 | Buscador **y formulario de alta**, los dos adentro de la pantalla del CRT. |
| `js/main.js` | 244 | Maquina de estados + la coreografia de alta de 5 pasos con `setTimeout`. |
| `js/data.js` | 213 | **Byte por byte identico al actual** (verificado con `diff`). |
| `assets/cd_image.webp` | — | 100 KB, cero referencias en codigo. Ya estaba muerto aca. |
| `final-room.jpeg` | — | 130 KB, cero referencias. |
| `data/*.csv` | — | No se leen en runtime. |

No existe `images/`. No existe `.claude/`, `.playwright-mcp/` ni `docs/`.

---

## 3. Como esta construida la escena

**Es 2D — ni 3D ni SVG puro: es DOM.** Un mundo de 2400x1350 donde cada objeto es un div
(o un svg) con `left`/`top`/`width`/`height` en px de mundo, hardcodeados en `scene.css`.

### Conteo de nodos

200 elementos dentro de `#stage`:

| Tag | Cantidad |
|---|---|
| `div` | 118 |
| `span` | 24 |
| `rect` (svg) | 21 |
| `svg` (raiz) | 10 |
| `circle` (svg) | 9 |
| `path` (svg) | 8 |
| `polygon` (svg) | 8 |
| `g` (svg) | 1 |
| `canvas` | 1 |
| **Total** | **200** |

De esos, **57 son nodos SVG** repartidos en 10 arboles. Sobre los 200 estaticos se
agregan los lomos dinamicos (3 nodos por pelicula) y, durante el alta, entre 4 y 8 nodos
efimeros mas.

### Como se definen las formas

**Casi todo son cajas.** El vocabulario visual completo es:

- `border: 4-8px solid var(--outline)` (`#241a20`) como contorno negro tipo pixel-art.
  Aparece en practicamente todos los objetos; es lo que unifica el estilo.
- `linear-gradient` de 2 stops para el volumen (ej: `.desk-surface` va de `--wood-light`
  a `--wood`; `.tower` es un gradiente a 90 grados).
- `box-shadow: inset` para huecos (ej: `.shelf-row` tiene
  `inset 0 8px 18px rgba(20,12,16,0.5)` que simula la sombra del estante de arriba).
- `border-radius: 50%` para circulos (planetas del poster, luna, botones).
- Truco del triangulo con bordes: `.pin-card-pyramid .pyr` usa
  `border-left/right: 18px solid transparent; border-bottom: 30px solid #b08a3e`.
- `repeating-linear-gradient` para patrones: teclas del teclado
  (`--cream-dark 0 14px, transparent 14px 18px`), scanlines del CRT, renglones del papel.
- `clip-path`: solo 2 usos, el pie trapezoidal del CRT
  (`polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)`) y la estrella de 8 puntas del
  `.sparkle`.
- Variables inline por instancia para los libros: cada `<span style="--bh:52px;--bw:16px;--bc:#8a4a3a">`
  se dibuja con una sola regla CSS compartida.

**Los SVG entran solo donde la caja no alcanza:** hojas de plantas (`path` con curvas
Bezier `Q`), la curva de la guirnalda, la silla de oficina (7 nodos: respaldo, asiento,
piston, 3 ruedas, patas con `stroke-linecap: round`), y la pantalla de la lampara
(`polygon` trapezoidal).

**Inconsistencia detectada:** 4 de los 10 SVG llevan `shape-rendering="crispEdges"`
(guirnalda, lampara, planta de escritorio, silla) y los otros 6 no (hiedra, 2 macetas del
estante, 2 suculentas, planta de piso). O sea, dentro de la misma escena hay formas con
antialiasing y formas sin el, con el mismo lenguaje visual. Se nota en los bordes curvos.

### Materiales, luces, environment

No hay nada de eso en sentido tecnico, pero **si hay un sistema de iluminacion fake**, que
es lo que mas distingue esta version:

- `.lamp-halo` — 360x260 px, `radial-gradient` ambar al 30%, pegado a la lampara.
- `.lamp-glow` — **1400x1400 px**, circulo con gradiente ambar de 3 stops,
  `mix-blend-mode: screen`, `z-index: 30`. Es la luz de la lampara derramada sobre toda
  la mitad izquierda de la habitacion.
- `.ambient-warm` — `linear-gradient(200deg, ...)` que suma ambar arriba-izquierda y
  oscurece abajo-derecha. `z-index: 30`.
- `.vignette` — `radial-gradient(ellipse at 42% 50%, transparent 45%, rgba(24,17,28,0.5) 100%)`.
  `z-index: 31`. El centro del ellipse esta en 42%, corrido hacia la lampara.
- `#viewport` tiene su propio `radial-gradient` de fondo (`#2a2134` a `#201828`) para que
  el letterbox no se lea como un borde.

Es un grading de 4 capas hecho a mano, coherente con una unica fuente de luz. Es lo que
hace que la escena no se lea como un mockup de Figma.

### Animaciones ambientales

Cinco loops corriendo permanentemente:

| Animacion | Elemento | Duracion |
|---|---|---|
| `bulb-twinkle` | 10 bombitas de la guirnalda, con `delay` escalonado por `nth-child(2n)` y `(3n)` | 3.4 s |
| `steam` | vapor de la taza (`translateY(-10px) scaleX(1.7)`, `filter: blur(3px)`) | 4 s |
| `sparkle-twinkle` | estrellita decorativa abajo a la derecha | 2.8 s |
| `disc-spin` | disco de la caja abierta | 12 s |
| lluvia | canvas, `requestAnimationFrame` continuo | — |

### La lluvia (`js/rain.js`)

- Canvas de **1140 x 880** de backing store, mostrado a **570 x 400** CSS
  (`#rain-canvas { inset: 0; width: 100%; height: 100% }` dentro de `.win-night`, que mide
  570x400). El comentario del archivo dice "al doble de resolucion del mundo para que no
  se vea borrosa con zoom".
- **Bug de aspecto:** 1140/880 = 1.295 pero 570/400 = 1.425. El canvas se escala 0.50 en
  x y 0.4545 en y. Las gotas circulares (`ctx.arc`) salen **elipses achatadas** y los
  streaks quedan levemente inclinados de mas. No es fatal — es lluvia detras de un vidrio,
  cuesta notarlo — pero es un error real, no una decision.
- 42 streaks: `len` 26-66 px, `speed` 7-13 px/frame, `alpha` 0.18-0.38, color
  `rgba(143,169,201,a)`. Se dibujan con un offset de -2 px en x para dar diagonal.
- 14 gotas: `r` 2.5-6, `speed` 0.15-0.65, con `wobble` senoidal de amplitud 0.8 px.
- `visibilitychange` para el loop con la pestaña oculta.
- Con `prefers-reduced-motion` dibuja **un solo frame estatico** en vez de apagarse — la
  ambientacion se conserva. Buen detalle.
- La var `--rain-cool` (`#9db4d9`) esta declarada en `base.css` pero `rain.js` hardcodea
  `rgba(143,169,201,...)`. **Ya estaba huerfana en esta version** — no fue el borrado de
  `rain.js` lo que la dejo sin uso.

### Z-index

Manejo manual, sin sistema. Valores repartidos: `#window-unit` 0 (para aislar sus
internos), `.spine-strip` 2, `.win-cross` 2, `.blind` 3, `.win-frame` 4, `.win-sill` 5,
`#desk-zone` 6, `.chair` 8, `.floor-plant` 9, `.print-paper` 24, `.mini-case` 26,
`.flyer` 26, `.fly-paper` 27, capas de luz 30-31, `#case-overlay` 50, `.ui-btn` 60,
`.app-chrome` 70. El orden de apilado es lo que crea la profundidad de la escena
(la silla delante del escritorio, la planta delante de todo, la luz encima de los objetos).

---

## 4. Camara

`js/camera.js`, 61 lineas. Mundo fijo de **2400 x 1350**.

**Transform de 4 partes** (`js/camera.js:31`), distinto al de la version PNG:

```
translate(vw/2, vh/2) rotate(rot) scale(s) translate(-cx, -cy)
```

Se centra el viewport, se rota, se escala, y recien ahi se lleva el centro del rect al
origen. **Tiene rotacion** — la version PNG la perdio, porque el CRT del PNG esta derecho.

**Vistas** (`js/camera.js:11-15`):

| Vista | x | y | w | h | rot | Fit |
|---|---|---|---|---|---|---|
| `room` | 0 | 0 | 2400 | 1350 | 0 | `cover` |
| `desk` | 160 | 268 | 850 | 580 | **4 grados** | `contain` |
| `shelf` | 1420 | 40 | 860 | 1120 | 0 | `contain` |

Los 4 grados de `desk` compensan el `.crt { transform: rotate(-4deg) }` de
`scene.css:728`: el monitor esta apoyado torcido sobre el escritorio, y al acercarse la
camara se endereza sola para que la pantalla quede recta. Ese detalle es la razon de ser
del `rot` en la formula, y desaparecio junto con la escena dibujada.

En un viewport 1920x1080: `room` da scale 0.80, `desk` da 1.86, `shelf` da 0.96. **Todos
los zooms son suaves** — el maximo es 1.86x, y como todo es vectorial/CSS, no hay perdida.

**Un solo modo de transicion.** `goTo(name, customRect)` no tiene parametro `mode`: aplica
el transform y la transicion CSS hace el resto — `transform var(--dur-camera) var(--ease-camera)`
= **1.25 s**, `cubic-bezier(0.22, 1, 0.36, 1)`.

**No existe:**
- `worldToClient` (no hace falta, ver seccion 8)
- modo `pan` ni la clase `#camera.panning`
- modo `instant` expuesto (el reencuadre sin animar esta cableado adentro del listener de
  `resize` en `camera.js:49-54`, no se puede invocar desde afuera)
- scroll de estanteria — la vista `shelf` es un rect fijo, entra todo de una

**Duraciones concretas:**

- `--dur-camera: 1.25s`, `--dur-case: 0.9s`, easing `cubic-bezier(0.22, 1, 0.36, 1)`.
- `CAMERA_MS = 1300` en `main.js:8` (60 con reduced-motion). Mismo desfase de 50 ms
  contra el CSS que en la version actual — **el bug de duplicacion nace aca**.
- `T = REDUCED ? 0.02 : 1` (`main.js:7`) — multiplicador para toda la coreografia de alta,
  que esta en JS y no en CSS. Este mecanismo desaparecio despues.
- `.spine` tilt/hover 0.45 s, `spine-pop` 0.55 s, `.mc-left` (cierre de la mini caja)
  0.65 s, `.mini-case` fade-in 0.4 s.
- CRT se prende a `CAMERA_MS * 0.4` = 520 ms. Foco del input a +350 ms.
- Debounce del buscador 250 ms, latencia del mock 350 ms.

---

## 5. Hotspots

**Diferencia conceptual grande con la version PNG:** aca los hotspots **son los objetos
mismos**, no rectangulos invisibles encima de una imagen.

`#desk-zone` y `#shelf-zone` son `<div role="button" tabindex="0">` que **contienen** al
CRT, teclado y mouse en un caso, y a la biblioteca completa en el otro
(`index.html:150-171` y `202-234`).

| Id | left | top | width | height | z-index | Contiene |
|---|---|---|---|---|---|---|
| `#desk-zone` | 396 | 396 | 390 | 350 | 6 | `.crt`, `.keyboard`, `.mouse`, `.zone-label` |
| `#shelf-zone` | 1470 | 90 | 710 | 1010 | — | `.bookcase` entera, `.zone-label` |

**Feedback visual:** `filter: brightness(1.12) saturate(1.05)` sobre la zona
(`scene.css:669-673`). Como la zona contiene el objeto real, **el objeto entero se ilumina
al pasar el mouse**. Eso es algo que la version PNG no puede hacer: alli el hover es un
recuadro ambar traslucido sobre pixeles que no reaccionan.

El label (`.zone-label`) es texto pixel que pasa de `color: transparent` a
`rgba(243,233,215,0.9)` con `text-shadow` — posicionado dentro de la zona
(`.zone-label-desk` en 110,-34; `.zone-label-shelf` en 290,26).

**Gating:** por CSS negativo — `body:not([data-state="room"]) .interactive` apaga cursor,
filtro y label. Los lomos no necesitan gating de `pointer-events` porque no hay estados
intermedios donde sean ambiguos.

**Accesibilidad:** hay handler de teclado explicito (`main.js:209-218`): Enter y Espacio
disparan `zone.click()`, con guarda `event.target !== zone` para que la barra espaciadora
del input de busqueda no se robe el evento. La version PNG uso `<button>` real y se ahorro
todo esto — cambio a mejor.

**Otras coordenadas de mundo relevantes:**

- Biblioteca: `.bookcase` en 10,70 dentro de `#shelf-zone` (o sea 1480,160 de mundo),
  690x930, `padding: 16px`, flex column.
- Tiras de lomos: `.spine-strip` absoluta dentro de cada `.shelf-row`, `left/right: 8px`,
  `bottom: 0`, `top: 6px`. `STRIP_WIDTH = 636` en JS.
- Pantalla del CRT: `.crt-screen-frame` en 20,18 de 266x182 con `padding: 8px`, o sea la
  pantalla util son **250x166**.
- Impresora: 862,566 de 200x132; ranura de salida en +22,+74.

---

## 6. Estado de la app

**Estado de UI:** identico en espiritu al actual — `let state` en `main.js:16` espejado en
`document.body.dataset.state`. Estados: `room`, `desk`, `shelf`, `case`, `placing`.

**Diferencia:** **no existe el estado `form`.** El formulario de alta vive adentro de la
pantalla del CRT como una tercera vista (`pc-search` / `pc-form` / `pc-done`,
`computer.js:40-44`), no como una caja abierta flotando en el centro. La app nunca sale
del estado `desk` mientras completas la ficha.

**Cableado:** `MV.computer.setOnPurchase(placeMovie)` — la computadora avisa que se
confirmo una compra. En la version actual es `setOnSelect(handleSelect)`: la computadora
solo avisa que se eligio un titulo, y la ficha se completa despues, en la caja. El punto
de corte entre modulos se movio.

**Datos:** `js/data.js` es **byte por byte identico** al actual. Mismas 10 peliculas,
mismo `NOT_ON_SHELF` con `Wonder Man` y `Bad Boys II`, misma persistencia en
`localStorage` bajo `movievault.added`, mismo `getCollection()` = base filtrada +
agregados.

**Sin backend, sin base de datos, sin sync.**

---

## 7. Integracion con API de peliculas

**No hay ninguna, exactamente igual que hoy.** Cero `fetch`, cero `XMLHttpRequest`. La
unica request externa es Google Fonts.

`searchMovies(query)` es el mismo mock: filtra 10 titulos hardcodeados por substring y
resuelve una Promise a los 350 ms.

Unica diferencia cosmetica: el header del CRT dice **`v0.1 · imdb mock`**
(`computer.js:21`) y el hint dice "escribi para buscar **en imdb**". O sea, la version
vieja **admitia en pantalla que era un mock**. La actual dice solo `v0.2` y "escribi para
buscar" — se saco la etiqueta pero la implementacion no cambio.

De los 10 titulos, solo 2 son comprables.

---

## 8. Que funciona y que no

### Funciona de verdad

- Habitacion completa renderizada en DOM, con 5 animaciones ambientales en loop
  (guirnalda, vapor, sparkle, disco, lluvia).
- Lluvia en canvas detras del vidrio, con pausa por pestaña oculta y frame estatico con
  reduced-motion.
- Camara con rotacion: el viaje a `desk` endereza el CRT que esta apoyado a -4 grados.
- Hover que ilumina el objeto real (`filter: brightness`) + label pixel.
- Navegacion por teclado en las zonas (Enter / Espacio), Escape para retroceder.
- Buscador en el CRT con 3 vistas: search, form, done.
- **Secuencia de alta de 5 pasos**, coreografiada con `setTimeout` en `main.js:98-201`:

  | t (ms) | Paso |
  |---|---|
  | 300 | El papel sale de la impresora: `scaleY(0.06)` → `scaleY(1)` en 950 ms, `transformOrigin: bottom` |
  | 1150 | Aparece la mini caja abierta sobre el escritorio (fade + `translateY(14px)` → 0) |
  | 1550 | El papel vuela a la mitad izquierda de la caja: 3 keyframes, 680 ms, con arco (-46 px de altura al 50%) y `scale(0.78, 1.32)` al aterrizar para simular que se acuesta |
  | 2550 | La caja se cierra: `.mc-left` rota `rotateY(-180deg)` en 650 ms con `backface-visibility: hidden` |
  | 3350 | La caja cerrada vuela al estante mientras la camara viaja: 3 keyframes, 1250 ms + 120 de delay, arco de -190 px, rotacion 0 → 8 → -7 grados, escala de `112/w, 164/h` a 1 |

  Total: **~4.7 segundos** de animacion encadenada. Es sensiblemente mas elaborada que la
  version actual (que va directo del CRT al centro y del centro al estante).
- Click en lomo → caja sale del estante y se abre con la ficha completa (incluye
  **seccion elenco**, que despues se saco).
- Wrapping de lomos entre 3 filas; los libros decorativos de la fila de abajo se ocultan
  cuando la coleccion desborda hasta ahi.
- Persistencia en localStorage.
- `prefers-reduced-motion` contemplado en 3 lugares: CSS (`--dur-*` a 0.01s), `CAMERA_MS`,
  y el multiplicador `T` de toda la coreografia.

### Ventaja arquitectonica que se perdio despues

**El flyer es hijo de `#stage`, no de la pantalla.** `stage.appendChild(flyer)` en
`main.js:175`, con posicion en px de mundo. Como vive dentro de `#camera`, **la camara lo
arrastra sola**: el vuelo y el viaje de camara componen sin que nadie los coordine.

Por eso `camera.js` de esta version **no necesita `worldToClient`**. La version PNG movio
la caja a un overlay `position: fixed` fuera de `#camera`, y ahi si tuvo que inventar
`worldToClient` (13 lineas) para proyectar a mano el destino antes de que la camara
llegue. Menos codigo aca, y mas robusto.

### Stubbeado

- **`searchMovies`** — mock sobre 10 titulos (seccion 7).
- **`assets/cd_image.webp`** y **`final-room.jpeg`** — cero referencias. Ya estaban
  muertos en este commit.
- **`--rain-cool`** — declarada en `base.css:23`, nunca usada (`rain.js` hardcodea el
  rgba). Huerfana desde el dia uno, no por el borrado posterior.
- **`.app-icons`** — el sobre y el engranaje del header son decorativos, sin handler y con
  `pointer-events: none` en el contenedor.
- **`MV.rain.stop()`** — exportado, solo lo usa el propio listener interno de
  `visibilitychange`. Nadie mas lo llama.

### Roto

1. **Bug de cierre de la caja** (`shelf.js:259-278`). `close()` espera un `transitionend`
   de `.case-cover` para arrancar el vuelo de vuelta. Pero la clase `open` (la que dispara
   `rotateY(-180deg)` en la tapa) se agrega recien cuando el flip **llega al centro**. Si
   apretas Escape o clickeas el backdrop mientras la caja todavia esta viajando, `close()`
   pone `closing = true`, saca una clase que nunca estuvo, y el `transitionend` de la tapa
   **nunca llega**. La caja queda colgada, el estado queda en `case`, y como
   `closing = true` bloquea reintentos, no hay forma de salir sin recargar.
   La version PNG lo arreglo con el flag `wasOpen` (`shelf.js:310` y `325-328`).
2. **`closing` es una variable de modulo** (`shelf.js:232`), no de instancia. Se comparte
   entre todas las cajas que se abran. Combinado con el bug 1, una vez que queda en `true`
   sin resetearse, envenena la proxima apertura.
3. **Coordenadas magicas en `placeMovie`.** El paso 1 arranca en `898,546`; el destino del
   papel es `710+46, 537+67`; el flyer arranca en `880,604` y escala desde `112/w, 164/h`.
   Ninguno de esos numeros esta derivado del DOM — estan copiados a mano de las posiciones
   de `.printer` (862,566), `.mini-case` (700,522) y `.mc-half` (112x164) en `case.css` y
   `scene.css`. **Mover la impresora 10 px rompe la animacion en silencio.**
4. **Bug de aspecto del canvas de lluvia** — 1140x880 mostrado en 570x400, escala no
   uniforme (0.50 en x, 0.4545 en y). Las gotas circulares salen elipses.
5. **Sin cache-bust.** Los `<link>` y `<script>` son planos. Con `python -m http.server`
   (que no manda `Cache-Control`), cada edicion requiere recarga forzada. Es el problema
   que motivo el parche `?v=Date.now()` de despues.
6. **`total` sin usar** en `balanceLines` (`shelf.js:50`). Se calcula y se descarta.
   Este bug sobrevivio: sigue igual en la version actual.
7. **Capacidad de la estanteria menor que hoy:** `STRIP_WIDTH = 636` contra 822, con 3
   filas — y una de las tres (`.shelf-row-decor`) esta ocupada por decoracion y **no
   recibe lomos**. Con lomos de 34-64 px entran aproximadamente **30-45 peliculas**. Al
   llenarse, el `render` fuerza el resto en la ultima fila y desbordan visualmente. Sin
   scroll de estanteria: lo que no entra en el rect fijo `shelf` no se ve.
8. **`CAMERA_MS` (1300) vs `--dur-camera` (1.25s)** duplicados en archivos distintos.
   El bug nace en este commit y sigue sin arreglarse.
9. **Mobile no contemplado.** `overflow: hidden` en `html, body`, sin gestos tactiles, sin
   media queries de layout. Ademas las 5 animaciones en loop + el rAF de la lluvia corren
   siempre: es la version con mas costo de bateria de las dos.
10. **Costo de render permanente.** `.lamp-glow` es un div de **1400x1400 con
    `mix-blend-mode: screen`** encima de 200 elementos, dentro de un contenedor que se
    esta transformando. Junto con el `filter: drop-shadow` de las 10 bombitas y el
    `filter: blur(3px)` del vapor, obliga al compositor a rasterizar capas grandes en cada
    frame de viaje de camara. Es el candidato numero uno a jank en maquinas lentas — y es
    exactamente el tipo de costo que la version PNG elimino de un plumazo.

---

## Techo tecnico

### Que tan lejos llega este approach

Mucho mas lejos de lo que aparenta, y con una propiedad que la version PNG **no tiene y no
puede tener**: todo lo que se ve esta vivo. Cada objeto es un elemento con estado propio,
la camara puede rotar, y agregar un mueble nuevo cuesta 6 lineas de CSS en vez de
regenerar una imagen de 2816x1536.

Aca si aplica el diagnostico de "geometria sin texturas", y de manera literal: son 200
cajas de color plano con contorno negro. Lo que se puede hacer sin rehacer nada:

- **Texturas.** Ninguna superficie tiene grano. Un `repeating-linear-gradient` sutil en la
  madera para simular veta, ruido SVG (`<feTurbulence>`) como `background-image` en la
  pared, un patron de trama en la alfombra. Todo se aplica como capa extra sobre el color
  existente, sin tocar geometria. Es lo que mas separa "prototipo CSS" de "ilustracion".
- **Sombras de contacto.** Ningun objeto proyecta sombra sobre el piso ni sobre el
  escritorio. La taza, la torre, la silla, la lampara, los libros — todos flotan. Un
  `::after` elipsoidal oscuro en la base de cada objeto, orientado en direccion contraria
  a `.lamp-glow`, es probablemente la mejora de mayor impacto por linea escrita.
- **Falloff real de la luz.** Hoy `.lamp-glow` es un solo circulo uniforme. Con 2 o 3
  capas de distinto radio y opacidad se logra un decaimiento que se lee como fisico.
  Ademas se puede aprovechar que los objetos son DOM: un `filter: brightness()` por
  objeto, escalonado segun distancia a la lampara, ilumina cada mueble de forma distinta.
  **Eso es imposible en la version PNG.**
- **Mas pasadas de detalle donde ya hay estructura.** El CRT tiene body, marco, pantalla,
  chin, LED, badge y pie — 7 piezas. El mismo nivel de subdivision aplicado a la silla, la
  cama y el escritorio los sacaria del look "bloque de color".
- **Paleta por profundidad.** Los objetos lejanos deberian desaturarse y acercarse al
  color de pared. Hoy la taza en primer plano y el poster del fondo tienen la misma
  saturacion. Un `filter: saturate()` por banda de profundidad da separacion inmediata.
- **Parallax gratis.** A diferencia de la version PNG, aca las capas **ya estan
  separadas**. Mover `.wall`, los muebles y `.floor-plant` a velocidades distintas dentro
  de `#camera` es cuestion de aplicar un `translate` proporcional por capa. En la version
  PNG lo mismo requiere recortar el fondo a mano en Photoshop.
- **Pixel grid consistente.** Poner `shape-rendering="crispEdges"` en los 6 SVG que no lo
  tienen, y unificar los grosores de borde (hoy conviven 4, 5, 6 y 8 px sin criterio) para
  que el trazo se lea como un solo pincel.

Con eso llega a verse como una escena de pixel-art dibujada con intencion. **Lo que nunca
va a alcanzar es lo que ya tiene el PNG generado:** densidad de detalle, textura real,
iluminacion continua y imperfeccion. Cada pixel de detalle aca cuesta una regla CSS
escrita a mano; en el PNG venia gratis.

### Los limites duros

1. **El detalle no escala.** El techo no es tecnico, es de mano de obra: 1104 lineas de
   CSS para una habitacion que se lee como un mockup. Duplicar el detalle percibido
   significa cuadruplicar el CSS. La curva es brutalmente desfavorable.
2. **No hay superficie continua.** Todo es un rectangulo o un path. Sombras suaves,
   degrades sobre formas irregulares, oclusion ambiente en las esquinas — nada de eso se
   expresa con cajas sin apilar capas hasta volver el archivo inmanejable.
3. **Costo de composicion creciente.** Ya hay 200 nodos, `mix-blend-mode` sobre 1400x1400,
   3 `filter` distintos y un rAF, todo dentro de un contenedor que se transforma. Cada
   objeto nuevo lo empeora. La version PNG tiene 10 nodos y un `background-image`.
4. **La coreografia de alta esta clavada a coordenadas literales.** Cualquier reacomodo de
   los muebles del escritorio rompe la animacion sin dar error. No es un limite del
   approach, pero es la deuda tecnica que este approach genero.
5. **Sin scroll de estanteria**, con 636 px de tira util y una fila gastada en decoracion,
   la coleccion tiene un tope duro de ~30-45 titulos.

### Que haria falta cambiar

Tres caminos, y son excluyentes:

**A — Quedarse en DOM y subirle la calidad.** Texturas, sombras de contacto, falloff por
capas, desaturacion por profundidad, unificar el pixel grid. No se toca la arquitectura.
Es el unico camino que conserva la propiedad valiosa de esta version — que todo esta vivo
— y el mas barato de los tres. El techo es alto pero no infinito: nunca va a igualar la
densidad del PNG.

**B — Lo que efectivamente se hizo:** cambiar 200 nodos por 1 imagen generada. Se gana
densidad visual y rendimiento de golpe; se pierde la rotacion de camara, el hover que
ilumina el objeto, el parallax barato, el flyer que la camara arrastra sola, y la
capacidad de agregar un mueble sin volver a generar arte. Fijate que `data.js` quedo
identico y `shelf.js` conservo `spineColor`, `spineLayout`, `balanceLines` y `titleHash`
sin un solo cambio: **la migracion fue toda de escena, ninguna de dominio.**

**C — 3D real.** Modelar la habitacion con UVs, materiales PBR e iluminacion; reemplazar
`camera.js` por una camara con posicion/target/FOV; hotspots por raycasting; los lomos por
instancias de malla con textura de titulo generada. Se tiran `scene.css` (1104), `case.css`
(603), `computer.css` (248) y `index.html` (286) enteros, mas `camera.js` y `rain.js`. Se
introduce npm y un bundler, lo que rompe la decision explicita de "scripts clasicos,
namespace `MV`, sin build". Sobreviven `data.js` y la logica de layout de lomos — o sea,
lo mismo que sobrevivio en el camino B.

**Comparacion directa de las dos versiones:**

| | v1 (dibujada) | actual (PNG) |
|---|---|---|
| Nodos en la escena | 200 | 10 |
| Lineas de codigo UI | 3455 | 2013 |
| Binarios en repo | ~230 KB (muertos) | 15 MB |
| Camara | translate+rotate+scale, 3 vistas | translate+scale, sin rotacion |
| Modos de camara | 1 | 3 (travel/pan/instant) |
| Hover | ilumina el objeto real | recuadro ambar sobre pixeles inertes |
| Iluminacion | 4 capas fake, ajustables | bakeada, fija |
| Scroll de estanteria | no | si |
| Capacidad estanteria | ~30-45 | ~40-60 |
| Lluvia | canvas 2D animado | ninguna |
| Densidad de detalle | baja (cajas planas) | alta (arte generado) |
| Costo de agregar un mueble | 6 lineas de CSS | regenerar la imagen |
| Costo de render | alto (blend + filters + rAF) | bajo |
| Bugs de estado | caja se cuelga si cerras temprano | arreglado |

El dato mas util del cruce: la version dibujada tenia **mejor arquitectura de escena**
(objetos vivos, camara con rotacion, flyer en coordenadas de mundo, iluminacion
parametrica) y **peor resultado visual**. La version PNG invirtio esa relacion exactamente.
