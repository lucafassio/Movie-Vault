"""Rehace las tres caras del estante: renders/layers/front/tray--{front,top,bottom}.png.

Las tres salen del mismo rig (`_tray-rig`) y de la misma camara ortografica por cara,
al tamaño exacto de la cara. No son capas de escena: son las texturas de las tres caras
de la caja CSS del paternoster, asi que se iluminan con luz propia y no con la de la
habitacion (el nicho no tiene luz: con las luces reales la bandeja sale negra).

La historia de luz es una sola para las tres caras, y es la que hace que la sombra tenga
sentido: la luz entra por la abertura desde adelante-arriba (`rig-front`, sol a 42 grados
sobre la horizontal). El liston de adelante le tapa el paso al piso, asi que el piso se
oscurece hacia el frente; el panel de fondo, que mira de frente a la luz, queda mas claro.
Piso y panel de fondo son la misma tabla (`lit-tray-back`), asi que las dos caras que
muestran el interior comparten material y matiz (R/B ~3.05 en lineal, medido) y lo unico
que las diferencia es la sombra.

`rig-front` es un SOL, no un area: con area los rayos oblicuos entran por los costados
esquivando el liston y la sombra deja de ser pareja a lo largo del estante.

El mundo `tray-ambient` es la unica fuente sin direccion, y es la que levanta la parte
sombreada del piso. Es el unico lever que sirve: sube el piso sombreado y el interior del
frente casi 1 a 1, mientras que `rig-fill` los sube 1 a 22 y volaria la cara frontal.
Va como World aparte para no tocar el de la escena, que es el de las capas de habitacion.

Lo unico que se toca al vuelo y se revierte es el corrimiento del liston: 14 mm adelante
deja 2 px de su tapa dentro del encuadre de arriba, que es la linea de la esquina del
hueco con el grosor minimo. Corrido sigue tapando la luz, asi que la sombra del piso no
cambia. Va SOLO en el pase de arriba: corrido el liston queda en voladizo sobre el canto
del piso y le tira una sombra que en el modelo no existe (medido: el zocalo de la cara
frontal baja de 148.9 a 123.1). La proyeccion ortografica esconde el corrimiento, la luz
no.
"""

import bpy
import os

CORRIMIENTO_LIP = 0.014
CARAS = {                         # cara: (camara, ancho, alto) a 1016.36 px/m (bandeja 1.142 m, 2026-08-08 riel pegado a la tabla real, carcasa intacta)
    "front": ("cam-tray-front", 1161, 224),
    "top": ("cam-tray-top", 1161, 173),
    "bottom": ("cam-tray-bottom", 1161, 173),
}


def salida(cara):
    raiz = os.path.dirname(bpy.data.filepath)
    return os.path.normpath(os.path.join(raiz, "..", "renders", "layers", "front",
                                         "tray--%s.png" % cara))


def render():
    sc = bpy.context.scene
    vl = bpy.context.view_layer
    ee = sc.eevee
    lip = bpy.data.objects["tray-lip"]

    guardado = {
        "world": sc.world,
        "fg_metodo": ee.fast_gi_method,
        "fg_dist": ee.fast_gi_distance,
        "cam": sc.camera.name,
        "rx": sc.render.resolution_x,
        "ry": sc.render.resolution_y,
        "path": sc.render.filepath,
        "film": sc.render.film_transparent,
        "excl": {lc.name: lc.exclude for lc in vl.layer_collection.children},
    }
    corrido = [False]

    def correr_lip(quiero):
        if quiero == corrido[0]:
            return
        d = -CORRIMIENTO_LIP if quiero else CORRIMIENTO_LIP
        for v in lip.data.vertices:
            v.co.y += d
        lip.data.update()
        corrido[0] = quiero

    try:
        sc.world = bpy.data.worlds["tray-ambient"]
        ee.fast_gi_method = 'AMBIENT_OCCLUSION_ONLY'
        ee.fast_gi_distance = 0.12

        for lc in vl.layer_collection.children:
            lc.exclude = lc.name not in ("tray", "_tray-rig", "_camera")

        sc.render.film_transparent = True
        sc.render.image_settings.file_format = 'PNG'
        sc.render.image_settings.color_mode = 'RGBA'

        for cara, (cam, rx, ry) in CARAS.items():
            correr_lip(cara == "top")
            sc.camera = bpy.data.objects[cam]
            sc.render.resolution_x = rx
            sc.render.resolution_y = ry
            sc.render.filepath = salida(cara)
            bpy.ops.render.render(write_still=True)
    finally:
        correr_lip(False)
        sc.world = guardado["world"]
        ee.fast_gi_method = guardado["fg_metodo"]
        ee.fast_gi_distance = guardado["fg_dist"]
        sc.camera = bpy.data.objects[guardado["cam"]]
        sc.render.resolution_x = guardado["rx"]
        sc.render.resolution_y = guardado["ry"]
        sc.render.filepath = guardado["path"]
        sc.render.film_transparent = guardado["film"]
        for lc in vl.layer_collection.children:
            if lc.name in guardado["excl"]:
                lc.exclude = guardado["excl"][lc.name]


render()
