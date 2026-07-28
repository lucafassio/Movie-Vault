# Estado de la interfaz — movievault

> **Direccion de arte superada (2026-07-28).** Este documento describe el approach de
> **un solo PNG de fondo** (`images/Background.png`). Ese approach quedo atras: la escena
> se arma en Blender objeto por objeto, cada uno renderizado aparte con fondo
> transparente y montado como capa en el DOM. El plan nuevo esta en
> [plan-escena-3d.md](plan-escena-3d.md).
>
> Que sigue siendo cierto de este documento: **todo lo que describe el codigo** —
> secciones 4 (camara), 6 (estado), 7 (API) y las limitaciones de logica de la 8. El
> codigo no cambio.
>
> Que hay que leer como referencia vieja: todo lo que sale de medir `Background.png` —
> las coordenadas de la seccion 5, los paneles opacadores de la seccion 3, y la seccion
> "Techo tecnico" entera, que razona sobre una ilustracion fija como asset final.

Relevado el 2026-07-28 sobre el working tree actual (branch `main`, con cambios sin
commitear). Todo lo que sigue sale de leer el codigo, no de suposiciones.

---

## 1. Stack

- **Render de la escena:** ninguna tecnologia de graficos. No hay 3D, ni canvas 2D, ni
  SVG de escena. La habitacion es **una sola imagen PNG** (`images/Background.png`,
  2816x1536, 8.0 MB) puesta como `background-image` de un `<div id="stage">`
  (`css/scene.css:24-31`). Todo lo interactivo son **elementos DOM posicionados en
  `position: absolute`** con coordenadas en px de esa imagen.
- **SVG:** aparece en un solo lugar, el disco de la caja abierta
  (`discSvg()` en `js/shelf.js:139-155`): 6 circles + 4 paths inline. Nada mas.
- **3D:** lo unico "3D" es CSS 3D transforms (`perspective: 2400px`,
  `transform-style: preserve-3d`, `rotateY`) para abrir la tapa de la caja de DVD
  (`css/case.css:146-168`, `255-312`). No hay geometria, ni mallas, ni WebGL.
- **Frameworks / librerias:** cero. No hay React, ni Three.js, ni nada. JS vanilla en
  scripts clasicos (no ES modules) con un namespace global `MV`.
- **Versiones:** no aplica — no hay `package.json`, ni `requirements.txt`, ni lockfile.
  La unica dependencia externa es Google Fonts por CDN (Fraunces, Nunito Sans, VT323,
  Caveat, `index.html:9`).
- **Build tool:** ninguno. No hay bundler, ni transpilador, ni paso de build. Se sirve
  la carpeta tal cual con `python -m http.server 8123` (`.claude/launch.json`).
  El unico "build" es un cache-bust en runtime: `index.html` inyecta los `<link>` y
  `<script>` con `?v=Date.now()` (`index.html:10-16` y `47-56`) porque
  `http.server` no manda cabeceras de no-cache.
- **Tamaño total del codigo de interfaz:** 2013 lineas (JS 1015, CSS 940, HTML 58).

---

## 2. Estructura de archivos relevante a la interfaz

| Archivo | Lineas | Que hace |
|---|---|---|
| `index.html` | 58 | Esqueleto: `#viewport > #camera > #stage`, 3 paneles opacadores, 3 tiras de lomos, `#monitor-screen`, 2 botones-hotspot, boton volver, `#case-overlay` vacio. Inyecta css y js con cache-bust. |
| `css/base.css` | 105 | Variables de paleta (24 colores), 4 familias tipograficas, easing y duraciones de camara/caja, reset minimo, estilo del boton `volver`, override de `prefers-reduced-motion`. |
| `css/scene.css` | 166 | `#viewport` fijo, `#camera` con `transform-origin: 0 0` y la transicion, `#stage` de 2816x1536 con el PNG de fondo, hotspots y su tooltip, paneles opacadores de estantes, tiras de lomos, pantalla del CRT con scanlines. |
| `css/computer.css` | 124 | UI verde-fosforo dentro de la pantalla del CRT: header, input, lista de resultados, hint, animacion de boot (`pc-boot`, 0.5s). |
| `css/case.css` | 545 | Lo mas pesado. Lomos (bandas, cinta de papel, tilt, `spine-pop`), y el overlay de la caja abierta en CSS 3D: backdrop con blur, `case-flip`, `case-shift`, `case3d`, bandeja, disco girando, tapa que rota 180 grados, papel con ficha o formulario. |
| `js/data.js` | 213 | Dataset embebido de **10 peliculas**, `getCollection()`, `addMovie()`, `searchMovies()` (mock async). Persistencia en localStorage. |
| `js/camera.js` | 79 | Modulo `MV.camera`: encuadra rects de mundo aplicando translate+scale a `#camera`. `goTo`, `worldToClient`, `getView`. |
| `js/shelf.js` | 404 | Modulo `MV.shelf`: layout y render de lomos, color por genero, y el componente unico de caja abierta (`openCase`) con modos `view` y `edit`. |
| `js/computer.js` | 95 | Modulo `MV.computer`: construye la UI del buscador dentro del CRT, debounce de 250 ms, pinta resultados, `turnOn` / `turnOff`. |
| `js/main.js` | 224 | Orquestador: maquina de estados, flujos de camara, scroll de la estanteria, wiring de eventos, init. |
| `images/Background.png` | — | 8.0 MB. La escena entera. Asset final, no se regenera. |
| `images/Box.png` | — | 7.0 MB. **No se referencia en runtime** (verificado por grep). Referencia de estilo nomas. |
| `assets/cd_image.webp` | — | 100 KB. **No se referencia en runtime** (verificado por grep). Reserva muerta. |
| `final-room.jpeg` | — | 130 KB. Mockup viejo, no referenciado. |
| `data/*.csv` | — | Dos CSVs de origen, no se leen en runtime. |
| `js/rain.js` | — | **Borrado** (aparece como `D` en git status). Quedo huerfana la variable `--rain-cool` en `base.css:23`. |

---

## 3. Como esta construida la escena

**Es 2D raster, no 3D y no SVG.** Un `<div>` de 2816x1536 px con un PNG de fondo, y
encima un puñado de elementos DOM absolutos.

Conteo de nodos de la escena (no del contenido dinamico):

- 1 `#stage` (el PNG)
- 3 `.shelf-panel` — rectangulos con `linear-gradient` oscuro + `inset box-shadow`, tapan
  los DVDs pintados dentro de la imagen. Filas 0 y 1 siempre visibles; la fila 2 solo
  cuando la coleccion desborda (`.in-use`, `js/shelf.js:127`).
- 3 `.spine-strip` — contenedores flex donde viven los lomos.
- 1 `#monitor-screen` — 230x190 px, transparente hasta que se prende.
- 2 `.hotspot` (botones).

Total: **10 nodos estaticos**. Sobre eso, un `.spine` por pelicula en estanteria
(hoy 8: 10 del dataset menos `Wonder Man` y `Bad Boys II`, que arrancan fuera para poder
demostrar el alta). Cada lomo son 3 nodos (`button` + `.spine-title` + `.spine-tape`) mas
2 pseudo-elementos. La caja abierta agrega ~18 nodos mas mientras esta abierta.

**Formas:** todas las formas son cajas CSS. Nada de paths. Los lomos son `div`s con
`border: 4px solid`, `border-radius`, y un `linear-gradient` de 4 stops que simula el
brillo lateral (`css/case.css:12-14`). El color de cada lomo sale de un hue por genero
(11 generos mapeados, `js/shelf.js:7-19`) corrido por un hash del titulo:
`hsl(hue, 46%, 36-45%)` (`js/shelf.js:38-46`).

**Ancho del lomo:** calculado del titulo. `fontSize = floor(118 / title.length)`,
clampeado a 8-15 px; si baja de 10 px y el titulo tiene mas de una palabra, se parte en
dos renglones balanceados y recalcula con `110 / longest`. Ancho final
`clamp(34, lines * (fontSize + 6) + 16, 64)` px (`js/shelf.js:65-78`).

**Wrapping de estantes:** greedy, ancho de tira 822 px, gap 4 px; cuando no entra, pasa a
la fila siguiente (`js/shelf.js:105-128`).

**La caja de DVD abierta** es lo unico con profundidad: `perspective: 2400px` en el wrap,
`preserve-3d` en `case3d`, la tapa rota `rotateY(-180deg)` al abrir y el contenedor se
corre `translateX(--case-w / 2)` para que la caja quede centrada abierta. Dimensiones:
`--case-h: min(78vh, 60vw)`, `--case-w: --case-h / 1.38`. El disco gira con
`animation: disc-spin 12s linear infinite`.

**Sin UVs, sin materiales, sin luces, sin environment map, sin HDRI** — nada de eso
existe en este approach. La iluminacion (lampara ambar, sombras, ambiente de noche) esta
**bakeada dentro del PNG**. Los overlays no reciben luz de ningun lado: son colores
planos con gradientes fijos escritos a mano.

---

## 4. Camara

Implementada entera en `js/camera.js` (79 lineas). No hay camara real: es un
`transform: translate(ox, oy) scale(s)` sobre `#camera`, que tiene
`transform-origin: 0 0`.

**Mundo:** 2816 x 1536 (igual a la imagen).

**Vistas definidas** (`js/camera.js:10-13`):

| Vista | Rect (x, y, w, h) | Fit |
|---|---|---|
| `room` | 0, 0, 2816, 1536 | `cover` (`Math.max`) — llena el viewport, recorta bordes |
| `desk` | 700, 470, 460, 380 | `contain` (`Math.min`) — encuadra el CRT con margen |
| `shelf` | 1620, scrollY, 1000, `1000 * vh / vw` | `contain`; el alto sale del aspecto del viewport |

**Formula de encuadre** (`js/camera.js:19-29`):

```
scale = cover ? max(vw/rect.w, vh/rect.h) : min(vw/rect.w, vh/rect.h)
ox    = vw/2 - scale * (rect.x + rect.w/2)
oy    = vh/2 - scale * (rect.y + rect.h/2)
```

En un viewport 1920x1080: `room` da scale ~0.70, `desk` da scale ~2.84. O sea, en la
vista escritorio el PNG se muestra a casi 3x su resolucion nativa.

**Modos de `goTo(name, rect, mode)`:**

- `travel` (default) — transicion larga: `transform var(--dur-camera) var(--ease-camera)`
  = **1.25 s**, `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out fuerte, sin overshoot).
- `pan` — agrega la clase `#camera.panning`: **0.3 s**,
  `cubic-bezier(0.16, 0.9, 0.3, 1)`. Se usa para el scroll de la estanteria; con la
  transicion larga la camara se arrastraba detras de la rueda.
- `instant` — pone `transition: none`, aplica, fuerza reflow con `void offsetWidth`,
  restaura. Para reencuadrar en `resize` sin que se lea como un movimiento.

**No hay rotacion de camara** — el CRT en la imagen esta derecho.

**Lock de interaccion:** `CAMERA_MS = 1300` en `js/main.js:7` (60 si
`prefers-reduced-motion`). Nota: no coincide con el `--dur-camera: 1.25s` del CSS; son
1300 ms de bloqueo contra 1250 ms de animacion, 50 ms de colchon. Con reduced motion el
CSS baja a `0.01s` pero el lock queda en 60 ms.

**Scroll de la estanteria** (`js/main.js:46-73`): columna de mundo
`{x: 1620, w: 1000, top: 120, bottom: 1400}`. La rueda convierte `deltaY` de pantalla a
px de mundo dividiendo por `vw / 1000`. Teclado: flechas = 0.3 de la altura de vista,
PageUp/PageDown = 0.85, Home/End = el rango entero. El scroll se clampea y se re-guarda
clampeado para que no acumule fuera de rango.

**`worldToClient(worldRect, viewRect)`** (`js/camera.js:56-65`) proyecta un rect de mundo
a coordenadas de pantalla como si la camara ya estuviera en `viewRect`. Es lo que permite
que la caja vuele al lugar exacto del lomo nuevo mientras la camara todavia esta viajando.

**Otras duraciones concretas:**

- `--dur-case: 0.9s` — vuelo de la caja, apertura de tapa, backdrop blur.
- `.spine` tilt/hover: 0.45 s, mismo easing de camara.
- `spine-pop` (lomo recien agregado): 0.55 s.
- `pc-boot`: 0.5 s.
- CRT se prende a `CAMERA_MS * 0.4` = 520 ms de arrancado el viaje (`js/main.js:83`).
- Foco del input del buscador: +350 ms tras `turnOn` (`js/computer.js:77`).
- Debounce del buscador: 250 ms (`js/computer.js:30`); latencia simulada del mock: 350 ms.

---

## 5. Hotspots

Dos `<button class="hotspot">` en `index.html:38-39`, posicionados en px de imagen en
`css/scene.css:79-91`:

| Id | left | top | width | height |
|---|---|---|---|---|
| `#desk-zone` | 480 | 430 | 900 | 540 |
| `#shelf-zone` | 1640 | 110 | 990 | 1300 |

Son **rectangulos**, no formas recortadas. No siguen el contorno del escritorio ni de la
estanteria — son cajas generosas alrededor.

**Gating:** `pointer-events: none` por default; solo `body[data-state="room"] .hotspot`
los habilita (`css/scene.css:43-45`). Analogo para los lomos: solo clickeables en
`body[data-state="shelf"]` (`css/scene.css:133-139`).

**Feedback visual:** en hover/focus, `background: rgba(255,207,125,0.05)` +
`inset box-shadow` ambar de 4 px + glow externo de 60 px, y un tooltip pixel
(`::after` con `content: attr(data-label)`) que sube 6 px y aparece en 0.25 s.

Otras coordenadas de mundo relevantes:

- Interior de estanteria: x 1698-2548 (paneles), tiras de lomos x 1712 ancho 822.
- Filas de lomos: y 210 / 458 / 948, alto 192 (el lomo mide 182).
- Paneles opacadores: y 183 (h 224) / 420 (h 235) / 905 (h 240).
- Pantalla CRT: x 838, y 594, 230x190.

---

## 6. Estado de la app

**Estado de UI:** una variable `let state` en `js/main.js:17`, espejada en
`document.body.dataset.state` para que el CSS pueda gatear los `pointer-events`.
Estados: `room`, `desk`, `shelf`, `case`, `form`, `placing`. No hay libreria de estado,
ni reducer, ni eventos: son llamadas directas entre modulos, cableadas en el init de
`main.js` via `setOnSpineClick` / `setOnSelect`.

Ademas hay un flag `busy` con `lock(ms)` que bloquea clicks mientras la camara viaja
(`js/main.js:26-30`), y `activeCase` que guarda el handle de la caja abierta.

**Datos:**

- `BASE_MOVIES` — 10 peliculas hardcodeadas en `js/data.js`. **Nunca se persisten.**
- `NOT_ON_SHELF` — set con `Wonder Man` y `Bad Boys II`, que se filtran de la coleccion
  visible para poder demostrar el flujo de alta.
- Agregados del usuario — `localStorage`, key `movievault.added`, JSON array
  (`js/data.js:155-186`). `loadAdded()` tiene try/catch con fallback a `[]`.
- `getCollection()` = base filtrada + agregados. La coleccion no tiene id: la
  desduplicacion en el buscador se hace por titulo exacto (`js/data.js:197`).

**Sin backend, sin base de datos, sin sync.** Borrar el localStorage del navegador borra
todo lo que agregaste.

---

## 7. Integracion con API de peliculas

**No hay ninguna.** No se hace una sola llamada HTTP a nada (verificado: no hay `fetch`,
`XMLHttpRequest` ni referencia a ningun endpoint en todo el JS). La unica request externa
del proyecto es el CSS de Google Fonts.

`MV.data.searchMovies(query)` (`js/data.js:188-206`) es un mock: filtra `BASE_MOVIES` por
`title.toLowerCase().includes(query)` y resuelve una `Promise` despues de un
`setTimeout(350)`. Devuelve cada match con un flag `alreadyOwned`. El `async` es
deliberado para que el swap por la API real no cambie la firma.

Consecuencia practica: **el buscador solo puede encontrar 10 titulos**, todos ya escritos
a mano, con reviews propias ya cargadas. De esos 10, solo 2 son "comprables". Una vez que
agregas los dos, el flujo de alta no tiene nada mas que ofrecer salvo que edites
`data.js`.

Los `imdbLink` guardados son URLs reales de IMDb y el link del booklet funciona, pero es
un `<a href>`, no una integracion.

---

## 8. Que funciona y que no

### Funciona de verdad

- Vista `room` con encuadre cover y reajuste en resize.
- Hover de hotspots con tooltip y glow; gating por estado.
- Viaje a `desk` (zoom al CRT) y encendido de la pantalla a mitad de camino.
- Buscador del CRT: debounce, estado "buscando...", resultados, resultados deshabilitados
  para lo que ya esta en estanteria.
- Flujo de alta completo: caja sale del rect de la pantalla, viaja al centro, abre tapa en
  modo `edit`, la cinta de papel refleja el puntaje en vivo, valida que el puntaje este
  entre 0 y 10, cierra tapa, y vuela al lugar exacto del lomo nuevo mientras la camara
  viaja a la estanteria.
- Persistencia en localStorage y re-render de la estanteria.
- Vista `shelf` con scroll por rueda, flechas, PageUp/PageDown, Home/End, todo clampeado.
- Click en lomo -> caja abierta en modo `view` con la ficha completa y la review.
- Cierre con Escape, con el backdrop o con el boton `cerrar`; la caja vuelve al origen.
- Wrapping de lomos entre las 3 filas y aparicion del panel de la fila 2 al desbordar.
- `prefers-reduced-motion` esta contemplado en CSS y en `CAMERA_MS`.

### Stubbeado

- **`searchMovies`** — mock sobre 10 titulos hardcodeados (ver seccion 7).
- **`MV.computer.refreshSearch()`** — la funcion existe y esta exportada
  (`js/computer.js:67-71`) con un comentario que dice que se llama al volver de un alta,
  pero **nadie la llama**. Codigo muerto. En la practica no molesta porque `placeMovie`
  hace `MV.computer.turnOff()`, que limpia el `innerHTML` de la pantalla entera.
- **`assets/cd_image.webp`** — asset presente, cero referencias en codigo.
- **`images/Box.png`** — 7 MB en el repo, cero referencias en codigo.

### Roto / limitaciones reales

- **No se puede editar ni borrar** una pelicula una vez guardada. `addMovie` solo hace
  push; no hay `removeMovie` ni `updateMovie`.
- **Sin desduplicacion por identidad** — la clave es el titulo exacto como string. Dos
  peliculas con el mismo titulo colisionan.
- **La fecha "vista" no se valida** — se guarda el string tal cual; vacio cae a `"-"`.
  Es coherente con los quirks del dataset, pero significa que nunca vas a poder ordenar
  ni filtrar por fecha sin un parseo posterior.
- **Solo 3 filas de estanteria, ancho 822 px cada una.** Con lomos de 34-64 px entran
  aproximadamente 40-60 peliculas en total. Al llenarse, la cuarta fila no existe: el
  `render` fuerza todo lo que sobra en la ultima fila (`row < strips.length - 1` en
  `js/shelf.js:113`), y los lomos se desbordan visualmente fuera del panel.
- **`--rain-cool`** quedo huerfana en `base.css` tras borrar `rain.js`.
- **`CAMERA_MS` (1300) y `--dur-camera` (1250 ms) estan duplicados** en dos archivos
  distintos. Cambiar uno sin el otro descuadra el lock.
- **El zoom a `desk` muestra el PNG a ~2.84x.** A esa escala el pixel-art de la imagen se
  interpola y se ve blando; el `image-rendering` no esta seteado en ningun lado, asi que
  queda el suavizado por default del navegador.
- **Peso:** 15 MB de imagenes en el repo, de los cuales 7 MB (`Box.png`) no se usan. El
  fondo de 8 MB se descarga entero antes de que la escena tenga sentido; no hay
  placeholder ni estado de carga.
- **Mobile:** no contemplado. `overflow: hidden` en `html, body`, sin gestos tactiles;
  el scroll de estanteria solo escucha `wheel` y teclado. En un telefono la vista `shelf`
  queda inmovil.

---

## Techo tecnico

### Hasta donde llega este approach sin rehacerlo

El techo esta bastante alto **para lo que este approach es**, y es importante ser preciso
sobre que es: no es "geometria sin texturas". Es lo contrario — es una **ilustracion
final** con overlays encima. La calidad visual del fondo ya esta al 100% de su techo,
porque el fondo no se renderiza: es un asset terminado. La luz, las sombras, la
atmosfera de noche, la lampara ambar, todo eso ya esta ahi y no se puede mejorar ni
empeorar con codigo.

Lo que **si** se ve "sin texturas" es lo que se dibuja con CSS encima: los lomos, la caja
abierta y los paneles opacadores. Ese es el unico delta de calidad real, y ese delta se
puede cerrar bastante sin tocar la arquitectura:

- **Texturas en los lomos.** Hoy son `linear-gradient` de 4 stops sobre un `hsl()` plano.
  Un PNG tileable de grano/cartulina como `background-image` extra en cada `.spine`, en
  `mix-blend-mode: overlay` sobre el color, los saca del look "div de color" al toque.
  Costo: un asset chico y dos lineas de CSS.
- **Sombras de contacto.** Los lomos no proyectan nada sobre el estante. Un
  `box-shadow` direccional coherente con la lampara (que en la imagen viene de la
  izquierda-arriba del escritorio) mas un `::after` de sombra elipsoidal en la base
  cambia mucho la lectura de "pegado" vs "apoyado".
- **Grading unificado.** Un overlay global sobre `#stage` con la misma dominante ambar
  del fondo (`mix-blend-mode: soft-light` o `color`) hace que los overlays hereden la
  temperatura de la escena en vez de flotar con su propia paleta. Es el truco que mas
  rinde por linea de CSS.
- **Vignette y falloff de luz** sobre la zona de estanteria, que en el PNG esta mas
  oscura que los lomos que le ponemos encima. Hoy los lomos son mas brillantes que su
  entorno, que es exactamente la señal que hace que se lean como UI y no como objetos.
- **`image-rendering: pixelated`** en `#stage` — decision a tomar, pero si la estetica es
  pixel-lofi, dejar que el navegador interpole a 2.84x en la vista `desk` traiciona el
  look. Con `pixelated` el zoom se lee como acercarse a pixel-art, no como una foto
  borrosa.
- **Sombras propias de la caja abierta.** Ya tiene 3D real; le falta una sombra
  proyectada que responda al `rotateY` de la tapa.
- **Parallax barato.** Recortar 2 o 3 capas del PNG (fondo / mueble / primer plano) y
  moverlas a distinta velocidad dentro de `#camera` daria profundidad en los viajes sin
  ninguna tecnologia nueva. Es la mejora de mayor impacto por unidad de esfuerzo, y el
  costo es de arte (recortar), no de codigo.

Con eso, este approach puede llegar a verse **muy bien** — al nivel de un juego pixel-art
comercial con UI diegetica. Lo que nunca va a poder hacer:

### Los limites duros

1. **Un solo punto de vista.** La camara solo puede recortar y escalar un plano. No hay
   angulo nuevo posible: no podes rodear el escritorio, ni mirar la estanteria de costado,
   ni asomarte detras del monitor. Cada encuadre nuevo que quiera un angulo distinto
   necesita **una imagen nueva generada a mano**.
2. **Nada reacciona a la luz.** Un objeto nuevo agregado por el usuario nunca va a recibir
   la luz de la lampara. Se puede fingir con gradientes hechos a mano por zona, pero es
   trabajo manual por objeto y se rompe apenas la camara se mueve.
3. **Resolucion fija.** 2816x1536. En la vista `desk` ya estamos a 2.84x. Cualquier zoom
   mas cerrado degrada. Un upscale del PNG mueve el techo pero infla los 8 MB.
4. **Los overlays no ocluyen ni son ocluidos.** Un lomo no puede quedar parcialmente
   tapado por el marco del estante que esta pintado en el fondo, salvo que se recorte una
   mascara a mano por zona.
5. **CSS 3D no es un motor.** La caja abierta funciona porque es una caja: planos rigidos
   con `rotateY`. Cualquier cosa con curvatura, deformacion o sombreado real no se puede
   expresar asi.

### Que haria falta cambiar

Depende de que se este persiguiendo, y son dos caminos distintos:

**Si lo que molesta es que los overlays se vean planos** (que es el diagnostico real hoy):
no hace falta rehacer nada. Es trabajo de asset + CSS, todo lo de la lista de arriba,
sin tocar `camera.js` ni la arquitectura. Es la opcion barata y la que mas rinde.

**Si lo que se quiere es camara libre, luz real y objetos que existan en el espacio:**
ahi si hay que rehacer la escena en 3D, y el cambio es total:

- Reemplazar el PNG por geometria (Blender o similar), con UVs, materiales PBR y un
  entorno de iluminacion. La habitacion completa modelada.
- Reemplazar `camera.js` — que hoy son 79 lineas de translate+scale — por una camara
  real (Three.js o similar) con posicion, target y FOV. La interfaz `goTo(name, rect)`
  no sobrevive: los rects de mundo 2D dejan de significar algo.
- Reemplazar los hotspots por raycasting contra la geometria. Las coordenadas en px de
  imagen dejan de existir.
- Reemplazar `.spine` de CSS por instancias de malla con textura generada (canvas o
  SDF) para el titulo. Todo `case.css` (545 lineas) se tira.
- Introducir un build tool. Three.js implica npm, y con eso se cae la decision explicita
  de "scripts clasicos, namespace `MV`, sin build".
- Baked lighting o lightmaps para no pagar iluminacion en tiempo real en un proyecto que
  hoy corre en cualquier cosa.

Lo unico que sobrevive intacto de este proyecto en ese escenario es `data.js`, la
persistencia, y la logica de layout de lomos (que filas, que ancho). Todo lo demas — el
100% del CSS, `camera.js`, `shelf.js` completo, los hotspots — se reescribe.

Dicho sin vueltas: el approach actual no esta cerca de su techo visual, pero el techo que
tiene no es "verse 3D". Es "verse como una ilustracion bien integrada". Si el objetivo es
lo primero, conviene invertir en las texturas y el grading. Si es lo segundo, es un
proyecto nuevo que reusa el dataset.
