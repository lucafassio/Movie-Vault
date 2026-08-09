"""Rehace las 3 capas de la vista front: renders/layers/front/front-{scene,back,frame}.png.

Recipe reconstruido el 2026-08-08 (no habia script ni recipe guardado en el .blend
para estas 3 capas; el .blend solo conservaba render.filepath apuntando a
front-frame.png, ultimo pase corrido a mano). Reconstruido a partir de los PNG
commiteados: renders de control a scratchpad, diff contra HEAD excluyendo las
columnas de cadena (que difieren porque el riel se corrio 5 mm) -> dRGB medio
0.0000 (frame), 0.0072 (scene), 0.0895 (back), ruido de muestreo de EEVEE.

Misma camara (`cam-travel`) y mismos settings en los 3 pases (EEVEE,
taa_render_samples 64, 2816x3403, film_transparent, PNG RGBA, world `world`):
solo cambia que esta visible.

- front-scene: room-shell + desk + lamp + las cadenas (loop-chain-l/r).
  Sin carcasa (ni shelf-void ni shelf-frame), sin sprockets, sin loop-ph-*.
- front-back:  shelf-void + las cadenas. Nada de room-shell/desk/lamp,
  nada de shelf-frame, sin sprockets ni loop-ph-*.
- front-frame: shelf-frame + las cadenas. Nada de room-shell/desk/lamp,
  nada de shelf-void, sin sprockets ni loop-ph-*.

Las cadenas estan en las 3 capas: por eso si se mueve `loop-chain-l/r`
(el riel) hay que rehacer las 3, no solo una.

`tray` y `_tray-rig` quedan excluidas del view layer como siempre (son el rig
aparte de `render-tray.py`, no entran aca).
"""

import bpy
import os

RES_X, RES_Y = 2816, 3403
SAMPLES = 64

# nombres exactos de las piezas que hay que aislar dentro de collections mixtas
SHELF_VOID = "shelf-void"
SHELF_FRAME = "shelf-frame"
CHAINS = ["loop-chain-l", "loop-chain-r"]
PH = ["loop-ph-%02d" % i for i in range(13)]
SPROCKETS = ["loop-sprocket-bot-l", "loop-sprocket-bot-r",
             "loop-sprocket-top-l", "loop-sprocket-top-r"]

PASES = {
    # capa: (room-shell/desk/lamp visibles, shelf-void visible, shelf-frame visible)
    "scene": (True, False, False),
    "back":  (False, True, False),
    "frame": (False, False, True),
}


def salida(cara):
    raiz = os.path.dirname(bpy.data.filepath)
    return os.path.normpath(os.path.join(raiz, "..", "renders", "layers", "front",
                                         "front-%s.png" % cara))


def render():
    sc = bpy.context.scene
    vl = bpy.context.view_layer
    ee = sc.eevee

    room_collections = ["room-shell", "desk", "lamp"]
    room_objs = [o.name for n in room_collections for o in bpy.data.collections[n].objects]
    swept = CHAINS + PH + SPROCKETS + [SHELF_VOID, SHELF_FRAME] + room_objs

    guardado = {
        "cam": sc.camera.name,
        "rx": sc.render.resolution_x,
        "ry": sc.render.resolution_y,
        "samples": ee.taa_render_samples,
        "path": sc.render.filepath,
        "film": sc.render.film_transparent,
        "hide": {n: bpy.data.objects[n].hide_render for n in swept},
        "excl": {lc.name: lc.exclude for lc in vl.layer_collection.children},
    }

    try:
        sc.camera = bpy.data.objects["cam-travel"]
        sc.render.resolution_x = RES_X
        sc.render.resolution_y = RES_Y
        sc.render.resolution_percentage = 100
        ee.taa_render_samples = SAMPLES
        sc.render.film_transparent = True
        sc.render.image_settings.file_format = 'PNG'
        sc.render.image_settings.color_mode = 'RGBA'

        # tray y _tray-rig nunca entran en esta vista
        for lc in vl.layer_collection.children:
            if lc.name in ("tray", "_tray-rig"):
                lc.exclude = True
            elif lc.name in ("shelf-carcass", "shelf-loop") or lc.name in room_collections \
                    or lc.name in ("_camera", "_lights"):
                lc.exclude = False

        # nunca van: placeholders y sprockets
        for n in PH + SPROCKETS:
            bpy.data.objects[n].hide_render = True

        for cara, (room_on, void_on, frame_on) in PASES.items():
            for n in room_collections:
                for o in bpy.data.collections[n].objects:
                    o.hide_render = not room_on
            bpy.data.objects[SHELF_VOID].hide_render = not void_on
            bpy.data.objects[SHELF_FRAME].hide_render = not frame_on
            for n in CHAINS:
                bpy.data.objects[n].hide_render = False

            sc.render.filepath = salida(cara)
            bpy.ops.render.render(write_still=True)
    finally:
        sc.camera = bpy.data.objects[guardado["cam"]]
        sc.render.resolution_x = guardado["rx"]
        sc.render.resolution_y = guardado["ry"]
        ee.taa_render_samples = guardado["samples"]
        sc.render.filepath = guardado["path"]
        sc.render.film_transparent = guardado["film"]
        for n, v in guardado["hide"].items():
            bpy.data.objects[n].hide_render = v
        for lc in vl.layer_collection.children:
            if lc.name in guardado["excl"]:
                lc.exclude = guardado["excl"][lc.name]


render()
