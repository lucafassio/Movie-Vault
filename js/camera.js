// camara 2.5d: el mundo es fijo de 2400x1350 y la camara aplica translate+rotate+scale sobre #camera para encuadrar rects de mundo
// el rot compensa objetos apoyados en angulo, como el crt que esta levemente girado sobre el escritorio

window.MV = window.MV || {};

MV.camera = (function () {
  const WORLD_W = 2400;
  const WORLD_H = 1350;

  // la vista room usa cover para que la habitacion llene el viewport sin franjas, recorta apenas los bordes
  const VIEWS = {
    room: { x: 0, y: 0, w: WORLD_W, h: WORLD_H, rot: 0, cover: true },
    desk: { x: 160, y: 268, w: 850, h: 580, rot: 4 },
    shelf: { x: 1420, y: 40, w: 860, h: 1120, rot: 0 }
  };

  const cameraEl = document.getElementById("camera");
  let currentName = "room";
  let currentRect = VIEWS.room;

  function computeTransform(rect) {
    // contain contra el viewport, el letterbox se funde con el fondo oscuro asi que no molesta
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = rect.cover
      ? Math.max(vw / rect.w, vh / rect.h)
      : Math.min(vw / rect.w, vh / rect.h);
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const rot = rect.rot || 0;
    return "translate(" + vw / 2 + "px, " + vh / 2 + "px) rotate(" + rot + "deg) scale(" + scale + ") translate(" + -cx + "px, " + -cy + "px)";
  }

  function apply() {
    cameraEl.style.transform = computeTransform(currentRect);
  }

  function goTo(name, customRect) {
    currentName = name;
    currentRect = customRect || VIEWS[name] || VIEWS.room;
    apply();
  }

  function getView() {
    return currentName;
  }

  // el resize reencuadra sin animar para que no se sienta como un movimiento de camara
  window.addEventListener("resize", function () {
    cameraEl.style.transition = "none";
    apply();
    void cameraEl.offsetWidth;
    cameraEl.style.transition = "";
  });

  return {
    goTo: goTo,
    getView: getView,
    VIEWS: VIEWS
  };
})();
