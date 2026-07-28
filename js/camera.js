// camara sobre imagen fija: el mundo mide lo mismo que la imagen de fondo y la camara aplica translate+scale sobre #camera para encuadrar rects de mundo

window.MV = window.MV || {};

MV.camera = (function () {
  const WORLD_W = 2816;
  const WORLD_H = 1536;

  // la vista room usa cover para que la habitacion llene el viewport sin franjas, recorta apenas los bordes
  const VIEWS = {
    room: { x: 0, y: 0, w: WORLD_W, h: WORLD_H, cover: true },
    desk: { x: 700, y: 470, w: 460, h: 380 }
  };

  const cameraEl = document.getElementById("camera");
  let currentName = "room";
  let currentRect = VIEWS.room;

  function viewTransform(rect) {
    // contain contra el viewport salvo cover, el letterbox se funde con el fondo oscuro asi que no molesta
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = rect.cover
      ? Math.max(vw / rect.w, vh / rect.h)
      : Math.min(vw / rect.w, vh / rect.h);
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    return { scale: scale, ox: vw / 2 - scale * cx, oy: vh / 2 - scale * cy };
  }

  function apply() {
    const t = viewTransform(currentRect);
    cameraEl.style.transform = "translate(" + t.ox + "px, " + t.oy + "px) scale(" + t.scale + ")";
  }

  function applyInstant() {
    // corta la transicion para que el reencuadre no se lea como un movimiento de camara
    cameraEl.style.transition = "none";
    apply();
    void cameraEl.offsetWidth;
    cameraEl.style.transition = "";
  }

  function goTo(name, customRect, mode) {
    // mode: travel para el viaje largo entre vistas, pan para seguir el scroll dentro de una vista, instant para reencuadrar sin animar
    currentName = name;
    currentRect = customRect || VIEWS[name] || VIEWS.room;
    cameraEl.classList.toggle("panning", mode === "pan");
    if (mode === "instant") {
      applyInstant();
      return;
    }
    apply();
  }

  function worldToClient(worldRect, viewRect) {
    // proyecta un rect de mundo a coordenadas de pantalla como si la camara ya estuviera en viewRect, sirve para animar overlays hacia destinos que todavia estan viajando
    const t = viewTransform(viewRect);
    return {
      left: t.ox + t.scale * worldRect.x,
      top: t.oy + t.scale * worldRect.y,
      width: t.scale * worldRect.w,
      height: t.scale * worldRect.h
    };
  }

  function getView() {
    return currentName;
  }

  window.addEventListener("resize", applyInstant);

  return {
    goTo: goTo,
    getView: getView,
    worldToClient: worldToClient,
    VIEWS: VIEWS
  };
})();
