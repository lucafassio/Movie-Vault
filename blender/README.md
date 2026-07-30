# blender/

Archivos fuente de la escena. El plan completo esta en
[../docs/plan-escena-3d.md](../docs/plan-escena-3d.md).

## Archivos

| Archivo | Que es |
|---|---|
| `scene-base.blend` | Escena maestra. Collections: `_camera` (las tres camaras de vista + `cam-lamp-wip`, que es solo de preview), `_lights` (`win-light` area 15 W, `lamp-light` point 30 W a 3000K), `room-shell` (paredes + piso, paso 1), `shelf-carcass` (carcasa del paternoster, paso 3), `lamp` (velador, paso 4). Parametros de camara en [../docs/camaras.md](../docs/camaras.md); historia en `../docs/plan-escena-3d.md` seccion 4.bis. |
| `dvd-case-test.blend` | Backup de la escena de prueba del DVD de la sesion anterior. No es parte de la escena. |

## Reglas que no se negocian

1. **Las camaras estan CONGELADAS.** `cam-room` y `cam-shelf` cerradas el 2026-07-29,
   parametros en [../docs/camaras.md](../docs/camaras.md). Ningun render las modifica: ni
   posicion, ni rotacion, ni `ortho_scale`, ni `shift`, ni `sensor_fit`, ni la resolucion
   asociada. Si se mueve una, hay que rehacer **todas** las capas de esa vista.
   `cam-desk` es la unica que sigue abierta, hasta el paso 5. Capas de vistas distintas no
   alinean entre si por diseño: cada vista es su propio encuadre.
2. **Una collection por capa**, con el mismo nombre que el PNG de salida sin extension.
   El render batch itera collections; si los nombres no coinciden, no hay tabla que lo
   arregle.
3. **Film transparent ON, PNG RGBA, full frame.** Nunca recortar en Blender; el recorte es
   un paso posterior y mecanico. **La resolucion es por camara, no global** — hay que
   fijarla antes de renderizar:

   | Camara | Resolucion | Escala |
   |---|---|---|
   | `cam-room` | 2816 x 1536 | 605.0 px/m |
   | `cam-shelf` | 2816 x 2846 | 1482.1053 px/m |
4. **Los finales se renderizan despues del paso 4** (lampara / luz principal). El paso 4
   quedo cerrado el 2026-07-29, asi que ya se puede: la luz de la escena es `win-light` +
   `lamp-light`, y **ninguna capa se renderiza con luz propia inventada**.
5. **Si se cambia la potencia de `lamp-light`, hay que reescalar `W_CAM`** en el material
   `lit-lamp-shade` (`W_CAM ~= 0.188/P`), o la pantalla del velador clipea a blanco. El por
   que esta en `../docs/plan-escena-3d.md` paso 4.

## Salidas

- `../renders/layers/<vista>/` — PNGs finales que consume la app, separados por vista
  (`room/`, `shelf/`, `desk/`). Versionados.
- `../renders/wip/` — pruebas e iteraciones. Gitignoreado, descartable.

## Convencion de nombres

`<slug>.png` en kebab-case. Variantes con guion doble (`crt--on.png`), sombras con
`--shadow`, resoluciones alternativas con `@2x`. Sin numeros de orden en el nombre: el
orden de apilado vive en el CSS.
