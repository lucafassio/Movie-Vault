# blender/

Archivos fuente de la escena. El contexto vive en
[../.claude/CLAUDE.md](../.claude/CLAUDE.md); la carpeta `docs/` se borro en el commit
`df10390` y solo queda en el historial (`git show 7d8941b:docs/<archivo>`).

## Archivos

| Archivo | Que es |
|---|---|
| `scene-base.blend` | Escena maestra. Collections: `_camera` (camaras de vista + `cam-travel` para la vista alta del lab + `cam-lamp-wip` y `cam-diag-side`, que son solo de preview), `_lights` (`win-light` area 15 W, `lamp-light` point 30 W a 3000K, `lamp-fill`), `room-shell` (paredes + piso, paso 1), `shelf-carcass` (`shelf-frame` + `shelf-void`, paso 3), `shelf-loop` (13 estantes + cadenas y sprockets), `desk` (escritorio), `lamp` (velador, paso 4), `tray` (la bandeja del paternoster) y `_tray-rig` (`rig-front` sol, `rig-fill`, `rig-bounce`), las dos excluidas del view layer. Los parametros de camara son los del propio `.blend`; la copia legible esta en `../.claude/CLAUDE.md`. |
| `dvd-case-test.blend` | Backup de la escena de prueba del DVD de la sesion anterior. No es parte de la escena. |

## Reglas que no se negocian

1. **Las camaras estan CONGELADAS.** `cam-room` y `cam-shelf` cerradas el 2026-07-29,
   `cam-travel` desde que se horneo la vista `front`. Ningun render las modifica: ni
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
   | `cam-travel` | 2816 x 2648 | 1016.6065 px/m |

   **Excepcion: los sprites de cara del estante.** `tray--front` (1118x224),
   `tray--top` y `tray--bottom` (1118x173) se renderizan al tamaño exacto de la cara
   con `cam-tray-front/-top/-bottom`, sin margen y sin full frame, porque no son
   capas de escena: son texturas de las tres caras de una caja CSS. Se iluminan con
   `_tray-rig` y el World `tray-ambient`, no con la luz de la escena. `tray` y
   `_tray-rig` estan excluidas del view layer.

   No hacerlo a mano — correr [`render-tray.py`](render-tray.py), que saca las tres
   caras de una sola pasada con la misma luz (que es lo que hace que la sombra de la
   tapa tenga sentido contra el interior del frente). Lo unico que toca al vuelo y
   revierte es el corrimiento de 14 mm del liston; el resto vive en el `.blend`. El
   por que de cada decision esta en el docstring del script.
4. **Los finales se renderizan despues del paso 4** (lampara / luz principal). El paso 4
   quedo cerrado el 2026-07-29, asi que ya se puede: la luz de la escena es `win-light` +
   `lamp-light`, y **ninguna capa se renderiza con luz propia inventada**.
5. **Si se cambia la potencia de `lamp-light`, hay que reescalar `W_CAM`** en el material
   `lit-lamp-shade` (`W_CAM ~= 0.188/P`), o la pantalla del velador clipea a blanco. El por
   que esta en `../.claude/CLAUDE.md`, en la entrada de la luz principal.

## Salidas

- `../renders/layers/<vista>/` — PNGs finales que consume la app, separados por vista
  (`room/`, `shelf/`, `desk/`). Versionados.
- `../renders/wip/` — pruebas e iteraciones. Gitignoreado, descartable.

## Convencion de nombres

`<slug>.png` en kebab-case. Variantes con guion doble (`crt--on.png`), sombras con
`--shadow`, resoluciones alternativas con `@2x`. Sin numeros de orden en el nombre: el
orden de apilado vive en el CSS.
