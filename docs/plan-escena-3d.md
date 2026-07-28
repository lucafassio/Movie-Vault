# Plan de escena 3D — movievault

Escrito el 2026-07-28. Reemplaza la direccion de arte que describe
[estado-interfaz.md](estado-interfaz.md), que pasa a ser el relevamiento del approach
viejo (un solo PNG de fondo).

**Este documento es plan, no ejecucion. Nada de esto esta construido todavia.**

---

## 1. Que cambia y que no

**Cambia:** de donde sale el arte. La habitacion se modela en Blender objeto por objeto.
Cada objeto se renderiza por separado con fondo transparente y se monta como una capa
mas en el DOM.

**No cambia:** nada del codigo funcional. Siguen intactos:

- `js/camera.js` — translate+scale sobre un plano de mundo. Sigue siendo valido porque
  las capas renderizadas son imagenes planas apiladas, igual que hoy.
- `js/main.js` — maquina de estados, locks, flujos de camara.
- `js/shelf.js` — layout de lomos, wrapping, caja abierta.
- `js/data.js`, `js/computer.js` — sin relacion con el arte.
- El sistema de coordenadas de mundo en px de imagen y los `position: absolute`.

Lo que se toca cuando llegue el momento de construir: `css/scene.css` (el `#stage` deja
de tener un `background-image` unico y pasa a tener capas) e `index.html` (los nodos de
las capas). Nada mas.

**Esto no es el camino "rehacer todo en Three.js"** que la seccion "Techo tecnico" de
`estado-interfaz.md` describe como alternativa. Es un camino intermedio: el 3D vive en
Blender y sale como PNGs; el runtime sigue siendo DOM 2D sin build tools. Los limites
duros que enumera esa seccion (un solo punto de vista, sin oclusion real, resolucion
fija) **siguen aplicando**, con dos mejoras concretas:

- Cada objeto se puede reencuadrar, mover o rehacer sin regenerar la escena entera.
- Los objetos que la app crea en runtime (lomos, caja) pueden renderizarse en Blender con
  la misma luz que el resto, en vez de fingirse con gradientes CSS.

---

## 2. Contrato de render (lo mas importante del documento)

Todo lo demas depende de respetar esto. Si dos capas se renderizan con camaras o
resoluciones distintas, no hay forma de alinearlas en el DOM.

### Reglas duras

1. **Una sola camara, bloqueada.** Se define en el paso 2 y no se mueve nunca mas. Todas
   las capas salen de esa camara.
2. **Una sola resolucion de salida** para todas las capas: la del mundo de la app.
3. **Full frame, no recortado.** Cada capa se renderiza al frame completo con alfa. El
   objeto aparece en su lugar y el resto es transparente.
4. **Film transparent ON.** PNG RGBA 8 bits.
5. **La luz de la escena es global.** Al renderizar un objeto solo, el resto de las luces
   sigue prendida. Nunca se renderiza un objeto con luz propia inventada.

### Por que full frame

Porque hace que el montaje en el DOM sea trivial y a prueba de errores: **toda** capa es

```css
.layer { position: absolute; left: 0; top: 0; width: 2816px; height: 1536px; }
```

Cero matematica de offsets, cero manifest, cero desalineos. Los hotspots y los rects de
`camera.js` siguen viviendo en el mismo espacio de coordenadas de siempre.

El costo es peso: un PNG RGBA de 2816x1536 por objeto. Con ~15 objetos eso es del orden
de 20-40 MB, peor que los 8 MB de hoy. **Solucion prevista, no ahora:** una vez que la
escena este armada y estable, un script (`tools/crop-layers.py`, todavia sin escribir)
autorecorta cada PNG a su bounding box y escribe un `renders/manifest.json` con el offset
de cada capa; el CSS pasa a usar esos offsets. Es una optimizacion mecanica y reversible.
Arrancar recortando a mano es la forma mas rapida de perder dias persiguiendo desalineos
de 3 px.

### Resolucion del mundo

Arranque propuesto: **2816 x 1536**, igual que hoy, para no tocar ni una coordenada
existente mientras se migra.

Aviso: en la vista `desk` la camara escala a ~2.84x (medido en `estado-interfaz.md`
seccion 4). Con un PNG pintado eso es un limite duro; con Blender no, porque los objetos
del escritorio se pueden re-renderizar aparte a 2x o 3x y cargarse solo en esa vista.
Queda anotado como opcion para el paso 5, no como requisito.

### Sombras entre objetos

Un objeto renderizado solo no proyecta sombra sobre los demas, porque los demas no estan
en el render. Tres formas de resolverlo, en orden de simplicidad:

1. **Shadow catcher** (Cycles): los objetos vecinos quedan como shadow catchers, asi la
   sombra que el objeto proyecta sobre ellos entra en su propia capa.
2. **Capa de sombras aparte**, montada en el DOM con `mix-blend-mode: multiply`.
3. **Ignorarlo** para objetos que no se tocan entre si.

Decision por objeto, no global. Se define en el paso 5 cuando entren los muebles.

### Settings de Blender a fijar en el .blend base

| Setting | Valor | Nota |
|---|---|---|
| Unit system | Metric, 1 unidad = 1 m | Todo se piensa en metros reales |
| Resolution | 2816 x 1536, 100% | Ver arriba |
| Film > Transparent | ON | Obligatorio |
| Output | PNG, RGBA, 8 bits | |
| Engine | EEVEE Next para iterar | Cycles para los finales con luz de lampara |
| Color management > View transform | **a decidir** | Ver preguntas abiertas |
| Camera | una sola, bloqueada | Ver paso 2 |

---

## 3. Estanteria: que existe hoy y que falta

El pedido dice que el scroll de estanteria "ya existe en el codigo". Verificado — existe
**a medias**, y la diferencia importa para planificar:

**Existe:**

- Vista `shelf` con scroll vertical de camara: rueda, flechas, PageUp/PageDown, Home/End,
  todo clampeado (`js/main.js:45-73` y `171-202`).
- La camara calza el ancho de la estanteria y el alto sale del aspecto del viewport
  (`js/main.js:50-60`).

**No existe:**

- La estanteria **no es infinita**. Son 3 tiras fijas hardcodeadas en `index.html:30-32`,
  y `js/shelf.js:113` fuerza todo lo que desborda dentro de la ultima tira: no hay cuarta
  fila, los lomos se salen del panel. El scroll esta clampeado entre y 120 y y 1400
  (`SHELF_COL` en `js/main.js:46`).
- Las tres tiras, los tres paneles opacadores y sus coordenadas existen **para tapar los
  DVDs y libros pintados dentro de `Background.png`**. Con arte por objeto ese mecanismo
  entero deja de tener razon de ser.

Conclusion: el scroll de camara se reusa; el layout de filas hay que rehacerlo. Y hay una
tension de proyeccion que conviene resolver antes de modelar la estanteria, no despues:

**Una estanteria que se repite verticalmente no se puede armar con una camara en
perspectiva.** Cada tramo repetido se veria desde un angulo distinto y las juntas no
cerrarian. Tres salidas:

| Opcion | Como | Costo |
|---|---|---|
| **A. Escena entera ortografica** | Camara ortho para todo. Todo tilea, todo consistente. | Se pierde profundidad de perspectiva. Poco costo real: `Background.png` ya es una vista casi frontal. |
| **B. Estanteria de alto fijo, scroll de contenido** | El mueble no crece; los lomos scrollean dentro de un marco con mascara. No hace falta tilear arte. | Cambia el scroll de camara por scroll de contenido en `main.js`. La estanteria deja de ser "infinita" visualmente. |
| **C. Room en perspectiva + estanteria ortho** | Dos camaras. La estanteria solo cierra bien en su propia vista. | En la vista `room` la estanteria no encaja del todo con el resto. |

**Recomendacion: A.** Es la unica que deja todo consistente sin tocar codigo, y el estilo
actual ya es casi frontal. Decision a tomar en el paso 2 (camara), porque condiciona todo
lo que se modele despues.

---

## 4. Orden de construccion

Acordado. No ejecutar fuera de orden: cada paso fija decisiones de las que dependen los
siguientes.

| # | Paso | Fija |
|---|---|---|
| 1 | **Caja vacia de la habitacion** — paredes, piso, techo, alturas | Escala en metros, proporciones, que paredes se ven |
| 2 | **Camara y encuadres** | Proyeccion (ortho vs perspectiva), FOV/escala ortho, altura, la relacion px de mundo por metro. **Se bloquea aca y no se toca mas.** |
| 3 | **Estanteria infinita** | Modulo repetible, alto de fila, profundidad, y la decision A/B/C de la seccion 3 |
| 4 | **Lampara / luz principal** | Setup de iluminacion global. A partir de aca todo objeto se renderiza con esta luz |
| 5 | **Resto de muebles, uno por uno** | Escritorio, CRT, silla, cama, ventana, planta, etc. |

Regla que sale de esto: **nada se renderiza en serio antes del paso 4**, porque la luz
cambiaria y habria que rehacer todo. Los pasos 1-3 se validan con renders de prueba que
van a `renders/wip/` y se tiran.

---

## 5. Estructura de carpetas y convencion de nombres

```
blender/
  scene-base.blend        # escena maestra: camara bloqueada, luces, unidades, output settings
  README.md               # que hay en cada collection y como se renderiza
renders/
  layers/                 # PNGs finales que consume la app. Un archivo por objeto
  wip/                    # pruebas, iteraciones, todo lo descartable. Gitignoreado
tools/
  blender-mcp/            # addon de terceros, ya estaba
```

### Nombres de archivo

`renders/layers/<slug>.png`, slug en kebab-case, sin numero de orden (el orden de
apilado vive en el CSS, no en el nombre; si esta en las dos partes se desincronizan).

Nombres previstos, alineados con el orden de construccion:

```
room-shell.png       # paso 1: paredes, piso, techo
shelf.png            # paso 3: el mueble vacio
shelf-tile.png       # paso 3: tramo repetible, solo si sale la opcion A
lamp.png             # paso 4
lamp-glow.png        # paso 4: el halo, capa aparte para poder animarlo
desk.png             # paso 5
crt.png
chair.png
bed.png
window.png
...
```

Variantes del mismo objeto: sufijo con guion doble — `crt--on.png`, `crt--off.png`.
Resoluciones alternativas: sufijo `@2x` — `crt@2x.png`. Capas de sombra: sufijo
`--shadow` — `desk--shadow.png`.

### Collections en Blender

Una collection por capa, con **el mismo nombre que el archivo de salida sin extension**.
Asi el script de render batch es un `for` sobre las collections y no hace falta mantener
una tabla de correspondencias.

---

## 6. El .blend base

Todavia no existe. Cuando Blender este conectado por MCP (ver
[blender-mcp-setup.md](blender-mcp-setup.md), pasos 1-5), el paso 1 arranca creandolo con
todo lo de la tabla de settings de la seccion 2 ya puesto, mas:

- Collection `_camera` con la camara unica.
- Collection `_lights`, vacia hasta el paso 4.
- Una collection por objeto, a medida que se van construyendo.
- Un script de render batch guardado como Text block dentro del .blend, que itera las
  collections, aisla cada una, y escribe a `renders/layers/<nombre>.png`.

No lo creo ahora porque requiere Blender corriendo y con el socket arriba, y porque las
medidas del paso 1 son justamente lo que falta definir.

---

## 7. Inventario: que queda obsoleto y que sigue sirviendo

Nada de esto se borro. Ver la seccion "a confirmar" al final.

### Obsoleto como asset final, util como referencia

| Archivo | Estado |
|---|---|
| `images/Background.png` | Deja de ser el arte final. **Sigue siendo la mejor referencia que hay** de layout, paleta, luz nocturna y composicion. La app todavia lo usa (`css/scene.css:30`), asi que no se toca hasta que haya capas que lo reemplacen. |
| `images/Box.png` | Ya era referencia de estilo, sin uso en runtime. Sigue igual: referencia visual de la caja de DVD abierta. |
| `docs/estado-interfaz-v1.md` | Historico del approach DOM+CSS+SVG del commit `6b81517`. Se conserva: documenta que objetos se dibujaron a mano y con que formas, util al modelarlos. |

### Obsoleto de verdad, candidato a borrar

| Archivo | Por que |
|---|---|
| `final-room.jpeg` | Mockup de una iteracion anterior a `Background.png`. Cero referencias en codigo, superado dos veces. |
| `assets/cd_image.webp` | Cero referencias en codigo (verificado por grep). Era reserva para portadas; con Blender el disco se renderiza. |
| `renders/dvd-test.png`, `dvd-lomo.png`, `dvd-lomo-2.png` | Pruebas sueltas de la sesion anterior, sin convencion de nombres. **Los movi a `renders/wip/`** en vez de borrarlos. |

### Decisiones de arte que quedan invalidadas

Estas frases figuran hoy en `.claude/CLAUDE.md` y `.claude/napkin.md` y contradicen el
enfoque nuevo. Las actualice en esos dos archivos; las dejo listadas aca para que quede
el rastro:

- "La imagen de fondo NO se redibuja ni se recrea: es asset final."
- "El fondo es imagen fija final, prohibido redibujar arte."
- "El header movievault esta pintado en la imagen." — pasa a ser una capa mas, o HTML.
- Las coordenadas de estanteria (interior x 1698-2548, filas y 210/458/948, tiras de
  822 px de ancho, paneles opacadores en y 183/420/905): **son medidas sacadas de
  `Background.png`. Referencia vieja.** Hay que re-derivarlas del render nuevo en el
  paso 3.
- El rect de la pantalla del CRT (x 838, y 594, 230x190) y los rects de hotspots
  (`#desk-zone` 480,430,900x540 — `#shelf-zone` 1640,110,990x1300): mismo caso, se
  re-derivan en el paso 5. El **mecanismo** de hotspots rectangulares sobrevive.

### Codigo que queda sin razon de ser (no tocar todavia)

- Los 3 `.shelf-panel` (`index.html:25-27`, `css/scene.css`) existen unicamente para tapar
  los DVDs pintados en `Background.png`. Con arte por objeto no hacen falta.
- `#stage { background: url(Background.png) }` (`css/scene.css:30`) pasa a ser una pila de
  capas.
- `--rain-cool` en `base.css:23` quedo huerfana al borrar `js/rain.js`. Ya estaba muerta
  antes de este cambio.

### Sigue sirviendo intacto

- Todo `js/` salvo el arte: `data.js`, `camera.js`, `computer.js`, `main.js`, y de
  `shelf.js` el layout y la caja abierta.
- El sistema de coordenadas de mundo y el montaje por `position: absolute`.
- `css/case.css` — la caja de DVD en CSS 3D. Nota: es candidata a pasar a render de
  Blender mas adelante, pero funciona y no bloquea nada.
- `docs/blender-mcp-setup.md` — vigente y necesario para arrancar.
- `data/*.csv`, `README.md`, `.claude/launch.json`.

---

## 8. Que necesito de vos para arrancar el paso 1

Sin esto no se puede modelar la caja de la habitacion.

### Bloqueantes

1. **Blender abierto con el socket arriba.** Pasos 1-5 de
   [blender-mcp-setup.md](blender-mcp-setup.md). Sin eso no puedo crear ni tocar nada.
   El panel tiene que decir `Running on port 9876`.
2. **Medidas de la habitacion en metros.** Ancho x profundidad x alto. Si no tenes un
   numero pensado, un cuarto tipico es 4.0 x 3.5 x 2.6 m y sirve de arranque; decime si
   te sirve o pasame los tuyos.
3. **Que paredes se ven.** En `Background.png` se lee una vista casi frontal contra una
   pared. Preguntas concretas:
   - Se ve una sola pared de fondo, o tambien una lateral?
   - Se ve el piso? Cuanto?
   - Se ve el techo?
   - La habitacion nueva **copia el layout de `Background.png`** (escritorio a la
     izquierda, estanteria a la derecha, ventana atras) o es diseño nuevo?
4. **Proyeccion de camara: ortografica o perspectiva.** Es la decision de la seccion 3.
   Mi recomendacion es **ortografica**, porque es la unica que deja la estanteria
   repetible sin trucos y el estilo actual ya es casi frontal. Necesito tu ok o tu no.
   Se ejecuta en el paso 2, pero condiciona como modelo la caja en el paso 1.

### Importantes, pero puedo arrancar sin ellas

5. **Estilo de render.** Seguimos con pixel-lofi (render a resolucion baja y escalado con
   `image-rendering: pixelated`, o post de pixelado), o pasamos a render limpio? Esto
   define el View transform de color management y si conviene EEVEE o Cycles. Si decis
   pixel-lofi, necesito saber a que resolucion nativa pixelar.
6. **Referencias visuales.** Cualquier imagen de habitaciones que te guste, aunque no sea
   del proyecto. Con `Background.png` alcanza para arrancar, pero mas referencia = menos
   ida y vuelta.
7. **Que va en la habitacion, lista completa.** Para el paso 5, pero saberlo desde el
   paso 1 evita modelar una caja donde despues no entra algo.

### A confirmar (no toco nada hasta que digas)

- Borrar `final-room.jpeg` (130 KB) y `assets/cd_image.webp` (100 KB)?
- `tools/blender-mcp/addon.py` son 122 KB de codigo de terceros dentro del repo. Sigue
  pendiente de la sesion anterior: versionarlo, ignorarlo, o moverlo fuera del proyecto?
