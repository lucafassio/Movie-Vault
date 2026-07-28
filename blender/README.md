# blender/

Archivos fuente de la escena. El plan completo esta en
[../docs/plan-escena-3d.md](../docs/plan-escena-3d.md).

## Archivos

| Archivo | Que es |
|---|---|
| `scene-base.blend` | Escena maestra. **Todavia no existe** — se crea en el paso 1. |

## Reglas que no se negocian

1. **Una sola camara para toda la escena.** Se bloquea en el paso 2 y no se mueve mas.
   Si se mueve, todas las capas ya renderizadas quedan desalineadas entre si.
2. **Una collection por capa**, con el mismo nombre que el PNG de salida sin extension.
   El render batch itera collections; si los nombres no coinciden, no hay tabla que lo
   arregle.
3. **Film transparent ON, PNG RGBA, 2816x1536, full frame.** Nunca recortar en Blender.
   El recorte es un paso posterior y mecanico.
4. **Los finales se renderizan despues del paso 4** (lampara / luz principal). Antes de
   eso la luz todavia va a cambiar y habria que rehacer todo.

## Salidas

- `../renders/layers/` — PNGs finales que consume la app. Versionados.
- `../renders/wip/` — pruebas e iteraciones. Gitignoreado, descartable.

## Convencion de nombres

`<slug>.png` en kebab-case. Variantes con guion doble (`crt--on.png`), sombras con
`--shadow`, resoluciones alternativas con `@2x`. Sin numeros de orden en el nombre: el
orden de apilado vive en el CSS.
