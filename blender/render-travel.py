"""Rehace las capas del viaje room->front: renders/layers/travel/travel-NN.png.

La camara transicional no existe como objeto en el .blend (nunca quedo guardada; los
frames commiteados en `df10390` se hornearon con una corrida ad-hoc que no dejo rastro).
Se arma en runtime como una camara temporal, interpolada desde `cam-room` (arranque,
CONGELADA, sin tocar) hasta un estado final derivado de `cam-travel` (la vista definitiva
del armario, CONGELADA, sin tocar). La camara temporal se crea, se anima y se borra en
cada corrida - no queda rastro en el .blend.

Por que el estado final NO es cam-travel con la resolucion de cam-travel tal cual: el
viaje siempre encuadra el stage completo (2816x1536), pero cam-travel hornea un canvas
mas alto (2816x3403, ver render-front.py) que la app recorre con scroll (`translateY`).
Lo que el usuario ve apenas termina el viaje es la ventana [PAN_MIN, PAN_MIN+1536] de ese
canvas, no el canvas entero ni su centro. Para que el ULTIMO FRAME salga pixel a pixel
igual a esa ventana real, la camara final tiene que ser cam-travel corrida en Z lo que
haga falta para que, renderizando a 2816x1536, se vea exactamente esa franja - se resuelve
con `world_to_camera_view` sobre el borde superior real de `shelf-frame` (x=1.144, y=0,
z=2.0 -> fila 153.68 del canvas de cam-travel, el mismo numero que `zona-armario.top` en
index.html), pidiendo que esa fila caiga en 20.00px (153.68 - PAN_MIN) del cuadro final de
1536px. Verificado 2026-08-09: el resultado matchea el recorte real de `front-frame.png`
en PAN_MIN con diff medio < 3/255 (ruido de sampling entre corridas, no desalineo).
Solo cambia location.z: rotacion, ortho_scale y shift quedan iguales a cam-travel (mismo
resolution_x -> misma escala horizontal, cero corrimiento en x, verificado tambien).

Interpolacion con ease (smoothstep) en location/rotacion(slerp)/shift, geometrica
(logaritmica) en ortho_scale para que el zoom se sienta parejo en vez de acelerar al
final. K_VIAJE pasos (tiene que matchear K_VIAJE en index.html) - subido de 24 a 40 a
pedido de Luca (2026-08-09) para que el acercamiento final no salte entre poses.
Frame 0 sale identico a cam-room (t=0 exacto); el ultimo frame sale con la pose resuelta
arriba (t=1 exacto).

Mismos objetos ocultos que la vista front definitiva (`render-front.py`): placeholders y
sprockets nunca van. Room-shell/desk/lamp quedan visibles pero caen fuera de cuadro solos
en los frames finales (la camara ya esta encima del armario).

Bandejas en el hueco (agregado 2026-08-09, Luca lo pidio - sin esto el armario se ve como
un hueco negro en el viaje). `tray` no es un objeto, son 7 piezas (`tray-floor`,
`tray-lip`, `tray-back`, `tray-cheek-{l,r}`, `tray-pin-{l,r}`) centradas por diseno en la
posicion de `loop-ph-00` (bounding box mundo identica en x/z, `render-tray.py` las renderiza
ahi). El delta de cada copia sale de restar los centros de bounding box (`tray` vs el
punto de cada slot), no de la `location` del objeto (varias piezas cuelgan a
rotacion/parent, la resta de bbox es la que no falla).

Cuantas copias y donde (corregido 2026-08-09, primera vuelta solo llenaba `loop-ph-00..04`
y el hueco quedaba vacio abajo en los frames mas lejanos/anchos): `loop-ph-00..04` son la
corrida recta del frente (x/y fijos, Z parejo por `PASO`) pero solo cubren de Z_TOP=1.740
a 0.673 - el hueco real (`shelf-void`, medido) llega de 1.85 a 0.25, mas abajo de lo que
esos 5 tapan. Los slots que siguen (`loop-ph-05` en adelante) ya curvan hacia atras (Y deja
de ser -0.36) y su rotacion real no hace falta para un fondo de transicion. En vez de eso,
se sigue la MISMA recta (x/y de `loop-ph-00`, Z bajando de a `PASO`) hasta pasar el piso del
hueco (0.25) - bandejas sin rotar, aproximacion a proposito: nadie mira el mecanismo de cerca
en el viaje, lo que importa es que el hueco se vea lleno a cualquier zoom, no que la curva sea
exacta.

Luz de las bandejas: usar la luz de la habitacion las deja negras (ver tray-shadow.md -
sin `_tray-rig` las bandejas salen negras). Se prende `_tray-rig` para el render pero con
Light Linking (`light_linking.receiver_collection`) atado SOLO a la collection temporal de
las copias, así no le vuela la exposicion al resto del cuarto (el sol de `rig-key` es luz
global, sin este freno blanquearia room-shell/desk/lamp en los frames lejanos).
"""

import bpy
import os
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector, Matrix

RES_X, RES_Y = 2816, 1536      # el viaje siempre encuadra el stage completo
OUT_PCT = 50                    # salida a media res (1408x768), como siempre fue
SAMPLES = 64
K_VIAJE = 40                    # tiene que matchear K_VIAJE en index.html
PAN_MIN = 133.68                # ver index.html: posicion de camara al llegar a front
ARMARIO_TOP = 153.68            # zona-armario.top en index.html = techo real de shelf-frame

PH = ["loop-ph-%02d" % i for i in range(13)]
SPROCKETS = ["loop-sprocket-bot-l", "loop-sprocket-bot-r",
             "loop-sprocket-top-l", "loop-sprocket-top-r"]
TRAY_PARTS = ["tray-floor", "tray-lip", "tray-back",
              "tray-cheek-l", "tray-cheek-r", "tray-pin-l", "tray-pin-r"]
TRAY_RIG = ["rig-key", "rig-fill", "rig-bounce", "rig-top-rake"]
PASO = 1.60 / 6                 # mismo PASO que index.html: 0.2666667
PH_Z = 0.220                     # alto del estante, ver index.html
VOID_BOTTOM = 0.25               # piso real de shelf-void, medido


def bbox_center(obj):
    corners = [obj.matrix_world @ Vector(v) for v in obj.bound_box]
    xs = [c.x for c in corners]; ys = [c.y for c in corners]; zs = [c.z for c in corners]
    return Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, (min(zs) + max(zs)) / 2))


def armar_bandejas(scene):
    """Duplica las 7 piezas de la bandeja bajando desde loop-ph-00 hasta tapar
    todo shelf-void. Devuelve la collection temporal (light linking + borrado)."""
    tray_objs = [bpy.data.objects[n] for n in TRAY_PARTS]
    centros = [bbox_center(o) for o in tray_objs]
    centro_tray = sum(centros, Vector()) / len(centros)

    ph00 = bbox_center(bpy.data.objects["loop-ph-00"])
    slots = []
    i = 0
    while True:
        z = ph00.z - i * PASO
        slots.append(Vector((ph00.x, ph00.y, z)))
        i += 1
        if z - PH_Z / 2 <= VOID_BOTTOM:
            break

    tmp_coll = bpy.data.collections.new("_travel-tray-tmp")
    scene.collection.children.link(tmp_coll)

    for centro_slot in slots:
        delta = centro_slot - centro_tray
        mat_delta = Matrix.Translation(delta)
        for orig in tray_objs:
            dup = orig.copy()
            dup.matrix_world = mat_delta @ orig.matrix_world
            tmp_coll.objects.link(dup)

    return tmp_coll


def salida(i):
    raiz = os.path.dirname(bpy.data.filepath)
    return os.path.normpath(os.path.join(raiz, "..", "renders", "layers", "travel",
                                         "travel-%02d.png" % i))


def ease(t):
    return t * t * (3 - 2 * t)


def resolver_pose_final(scene, cam_travel):
    """Estado final: cam-travel corrida en Z para que el recorte a 1536px de alto
    calce con la ventana real (pan=PAN_MIN), medido con world_to_camera_view."""
    cd = cam_travel.data.copy()
    tmp = bpy.data.objects.new("_tmp-solve", cd)
    scene.collection.objects.link(tmp)
    tmp.matrix_world = cam_travel.matrix_world.copy()

    target = Vector((1.144, 0.0, 2.0))     # techo de shelf-frame = zona-armario.top
    target_row = ARMARIO_TOP - PAN_MIN

    def fila(z):
        tmp.location.z = z
        bpy.context.view_layer.update()
        co = world_to_camera_view(scene, tmp, target)
        return (1 - co.y) * RES_Y

    z0 = cam_travel.location.z
    r0 = fila(z0)
    r1 = fila(z0 + 0.2)
    pendiente = (r1 - r0) / 0.2
    z_sol = z0 + (target_row - r0) / pendiente

    # verificacion: la columna izquierda del armario no se tiene que mover
    left = Vector((0.494, 0.0, 1.0))
    fila(z_sol)
    co_left = world_to_camera_view(scene, tmp, left)
    col_left = co_left.x * RES_X
    fila_final = fila(z_sol)
    print("[render-travel] verificacion pose final: fila objetivo %.2f, fila lograda %.4f, "
          "columna izq %.4f (esperada ~352.00)" % (target_row, fila_final, col_left))

    loc = Vector((cam_travel.location.x, cam_travel.location.y, z_sol))
    rot = cam_travel.rotation_quaternion.copy()
    ortho = cd.ortho_scale
    sx, sy = cd.shift_x, cd.shift_y

    bpy.data.objects.remove(tmp, do_unlink=True)
    bpy.data.cameras.remove(cd)
    return loc, rot, ortho, sx, sy


def render():
    sc = bpy.context.scene
    ee = sc.eevee

    cam_room = bpy.data.objects["cam-room"]
    cam_travel = bpy.data.objects["cam-travel"]

    loc_ini = cam_room.location.copy()
    rot_ini = cam_room.rotation_euler.to_quaternion()
    ortho_ini = cam_room.data.ortho_scale
    sx_ini, sy_ini = cam_room.data.shift_x, cam_room.data.shift_y

    swept = PH + SPROCKETS
    vl = bpy.context.view_layer
    tray_rig_lc = next(c for c in vl.layer_collection.children if c.name == "_tray-rig")
    guardado = {
        "cam": sc.camera.name,
        "rx": sc.render.resolution_x, "ry": sc.render.resolution_y,
        "pct": sc.render.resolution_percentage,
        "samples": ee.taa_render_samples,
        "path": sc.render.filepath,
        "film": sc.render.film_transparent,
        "hide": {n: bpy.data.objects[n].hide_render for n in swept},
        "tray_rig_excl": tray_rig_lc.exclude,
        "receiver": {n: bpy.data.objects[n].light_linking.receiver_collection for n in TRAY_RIG},
    }

    # RES_X/RES_Y tienen que estar puestos ANTES de resolver_pose_final: world_to_camera_view
    # lee scene.render.resolution_x/y para el aspecto (sensor_fit HORIZONTAL), y el .blend en
    # disco puede tener guardada cualquier resolucion vieja (de la ultima vez que alguien
    # guardo a mano) - si no se fija aca antes de proyectar, la fila resuelta sale mal aunque
    # el print de verificacion parezca calzar (bug encontrado 2026-08-09: el print calzaba
    # porque comparaba contra si mismo, no contra una proyeccion real a 1536).
    sc.render.resolution_x = RES_X
    sc.render.resolution_y = RES_Y

    loc_fin, rot_fin, ortho_fin, sx_fin, sy_fin = resolver_pose_final(sc, cam_travel)

    cam_data = bpy.data.cameras.new("cam-travel-anim")
    cam_data.type = 'ORTHO'
    cam_data.sensor_fit = 'HORIZONTAL'
    cam = bpy.data.objects.new("cam-travel-anim", cam_data)
    cam.rotation_mode = 'QUATERNION'
    sc.collection.objects.link(cam)

    tmp_coll = armar_bandejas(sc)

    try:
        sc.camera = cam
        sc.render.resolution_x = RES_X
        sc.render.resolution_y = RES_Y
        sc.render.resolution_percentage = OUT_PCT
        ee.taa_render_samples = SAMPLES
        sc.render.film_transparent = True
        sc.render.image_settings.file_format = 'PNG'
        sc.render.image_settings.color_mode = 'RGBA'

        for n in swept:
            bpy.data.objects[n].hide_render = True

        tray_rig_lc.exclude = False
        for n in TRAY_RIG:
            bpy.data.objects[n].light_linking.receiver_collection = tmp_coll

        for i in range(K_VIAJE):
            t = ease(i / (K_VIAJE - 1))
            cam.location = loc_ini.lerp(loc_fin, t)
            cam.rotation_quaternion = rot_ini.slerp(rot_fin, t)
            cam_data.ortho_scale = ortho_ini * (ortho_fin / ortho_ini) ** t
            cam_data.shift_x = sx_ini + (sx_fin - sx_ini) * t
            cam_data.shift_y = sy_ini + (sy_fin - sy_ini) * t
            bpy.context.view_layer.update()

            sc.render.filepath = salida(i)
            bpy.ops.render.render(write_still=True)
    finally:
        sc.camera = bpy.data.objects[guardado["cam"]]
        sc.render.resolution_x = guardado["rx"]
        sc.render.resolution_y = guardado["ry"]
        sc.render.resolution_percentage = guardado["pct"]
        ee.taa_render_samples = guardado["samples"]
        sc.render.filepath = guardado["path"]
        sc.render.film_transparent = guardado["film"]
        for n, v in guardado["hide"].items():
            bpy.data.objects[n].hide_render = v
        for n, rc in guardado["receiver"].items():
            bpy.data.objects[n].light_linking.receiver_collection = rc
        tray_rig_lc.exclude = guardado["tray_rig_excl"]
        bpy.data.objects.remove(cam, do_unlink=True)
        bpy.data.cameras.remove(cam_data)
        for o in list(tmp_coll.objects):
            bpy.data.objects.remove(o, do_unlink=True)
        bpy.data.collections.remove(tmp_coll)


render()
