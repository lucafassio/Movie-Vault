# 0001 — Eliminar app-v1.html en vez de compartir un modulo fit() con index.html

## Contexto

Issue #3 nacio de un architecture review: `js/camera.js` (`viewTransform`, mundo `app-v1.html`)
e `index.html` (`encuadrar`) resuelven cada uno por su cuenta "encajar un rect de mundo en el
viewport" — una es `contain`, la otra `cover`, ya divergentes. La solucion propuesta original
era extraer un `fit(rect, mode)` compartido entre los dos mundos.

Al retomar el issue se confirmo que `app-v1.html` es la version obsoleta: la que dependia de
`images/Background.png` (arte plano, pre-Blender) y que ya no se usa de referencia real desde que
existe el arte por objeto renderizado. `index.html` es la unica app en desarrollo activo.

## Decision

No se comparte modulo. Se borra `app-v1.html` entero junto con lo que solo el consumia:
`css/base.css`, `css/scene.css`, `css/computer.css`, `js/data.js`, `js/camera.js`, `js/computer.js`,
`js/main.js`, `images/Background.png`, `images/Box.png`.

Se rescata **solo** la caja abierta (`MV.shelf.openCase` y sus helpers: `buildOverlayContent`,
`bookletView`, `bookletForm`, `discSvg`, `rectCenterTransform`) a `reference/open-case.js` +
`reference/open-case.css` — codigo inerte, no wireado a ningun html — porque es la unica pieza de
`app-v1.html` sin equivalente todavia en `index.html` (buscador, lomos y caja abierta siguen
pendientes de montar ahi, ver CLAUDE.md "Etapa actual").

`js/` no desaparece: `tmdb.js`, `omdb.js`, `movie-source.js` y sus `*-testdata.js` siguen vivos,
consumidos por `index.html` y `api-test.html` (no por `app-v1.html`).

## Por que no el modulo compartido

- `index.html` es inline por decision explicita (sin build tools, sin ES modules) — un `fit.js`
  compartido hubiera sido la primera excepcion a esa regla, solo para sostener un mundo que se
  iba a borrar de todas formas.
- Los dos `fit` ya habian divergido en semantica (`contain` vs `cover`) porque resuelven problemas
  distintos: `app-v1.html` encajaba dentro del viewport con margen, `index.html` llena la pantalla
  sin bordes. Unificarlos hubiera forzado a elegir uno de los dos comportamientos.
- Borrar el mundo que menos se usa es mas barato que mantener una abstraccion compartida para dos
  consumidores, uno de los cuales no tiene futuro.

## Consecuencias

- Migrar buscador/lomos/caja a `index.html` ya no es una migracion 1:1 de `app-v1.html`: hay que
  reconstruir sobre `reference/open-case.js` redefiniendo las custom properties que dependian de
  `css/base.css` (borrado).
- `#fit`/`encuadrar()` de `index.html` queda como la unica implementacion de fit en el repo — no
  hay mas divergencia que resolver.
