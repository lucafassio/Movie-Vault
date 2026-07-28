// orquestador: maquina de estados de camara y overlays sobre la imagen fija de la habitacion

window.MV = window.MV || {};

MV.main = (function () {
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CAMERA_MS = REDUCED ? 60 : 1300;

  const stage = document.getElementById("stage");
  const deskZone = document.getElementById("desk-zone");
  const shelfZone = document.getElementById("shelf-zone");
  const monitorScreen = document.getElementById("monitor-screen");
  const backBtn = document.getElementById("back-btn");

  // estados: room, desk, shelf, case, form, placing
  let state = "room";
  let busy = false;
  let activeCase = null;

  function setState(next) {
    state = next;
    document.body.dataset.state = next;
    backBtn.hidden = next !== "desk" && next !== "shelf";
  }

  function lock(ms) {
    // bloquea clicks mientras la camara viaja para que no queden estados intermedios rotos
    busy = true;
    setTimeout(function () { busy = false; }, ms);
  }

  function worldRect(el) {
    // coordenadas de mundo acumulando offsets hasta #stage, independientes de la posicion actual de la camara
    let x = 0;
    let y = 0;
    let node = el;
    while (node && node !== stage) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent;
    }
    return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
  }

  // columna de mundo que ocupa la estanteria, el scroll de la vista shelf se mueve entre top y bottom
  const SHELF_COL = { x: 1620, w: 1000, top: 120, bottom: 1400 };

  let shelfScroll = SHELF_COL.top;

  function shelfViewHeight() {
    // el alto del encuadre sale del aspecto del viewport para que la camara siempre calce el ancho de la estanteria y lo que sobra se recorra con scroll
    return SHELF_COL.w * window.innerHeight / window.innerWidth;
  }

  function shelfViewRect(scrollY) {
    const h = shelfViewHeight();
    const maxTop = Math.max(SHELF_COL.top, SHELF_COL.bottom - h);
    const y = Math.min(Math.max(scrollY, SHELF_COL.top), maxTop);
    return { x: SHELF_COL.x, y: y, w: SHELF_COL.w, h: h };
  }

  function applyShelfScroll(mode) {
    const rect = shelfViewRect(shelfScroll);
    // el rect ya viene clampeado, lo guardamos asi el scroll no acumula fuera de rango y responde apenas cambia de sentido
    shelfScroll = rect.y;
    MV.camera.goTo("shelf", rect, mode);
  }

  function scrollShelfBy(worldDelta) {
    if (state !== "shelf") return;
    shelfScroll += worldDelta;
    applyShelfScroll("pan");
  }

  // ---- flujos de camara ----

  function goDesk() {
    if (state !== "room" || busy) return;
    setState("desk");
    lock(CAMERA_MS);
    MV.camera.goTo("desk");
    // la pantalla se prende mientras la camara todavia esta llegando, como acercarse a una compu en standby
    setTimeout(function () { MV.computer.turnOn(); }, CAMERA_MS * 0.4);
  }

  function goShelf() {
    if (state !== "room" || busy) return;
    setState("shelf");
    lock(CAMERA_MS);
    // siempre entramos por arriba, que es donde arranca la coleccion
    shelfScroll = SHELF_COL.top;
    applyShelfScroll("travel");
  }

  function goRoom() {
    if (busy) return;
    if (state !== "desk" && state !== "shelf") return;
    if (state === "desk") MV.computer.turnOff();
    setState("room");
    lock(CAMERA_MS);
    MV.camera.goTo("room");
  }

  // ---- caja en modo lectura desde la estanteria ----

  function handleSpineClick(movie, spineEl) {
    if (state !== "shelf" || busy) return;
    setState("case");
    activeCase = MV.shelf.openCase(movie, {
      fromEl: spineEl,
      mode: "view",
      onClosed: function () {
        activeCase = null;
        setState("shelf");
      }
    });
  }

  // ---- alta: la caja sale de la pantalla, se completa la ficha y la caja viaja al estante ----

  function handleSelect(movie) {
    if (state !== "desk" || busy) return;
    setState("form");
    activeCase = MV.shelf.openCase(movie, {
      fromRect: monitorScreen.getBoundingClientRect(),
      mode: "edit",
      onClosed: function () {
        activeCase = null;
        setState("desk");
      },
      onConfirm: placeMovie
    });
  }

  function placeMovie(movie) {
    setState("placing");
    busy = true;

    MV.data.addMovie(movie);
    MV.shelf.render(MV.data.getCollection());

    // el lomo nuevo ya existe pero viaja escondido dentro de la caja, aparece cuando la caja aterriza
    const spine = MV.shelf.lastSpine();
    spine.style.visibility = "hidden";

    // la camara arranca hacia la estanteria dejando el lomo nuevo centrado y la caja vuela al lugar exacto donde va a quedar cuando la camara llegue
    const spineWorld = worldRect(spine);
    shelfScroll = spineWorld.y + spineWorld.h / 2 - shelfViewHeight() / 2;
    const view = shelfViewRect(shelfScroll);
    shelfScroll = view.y;
    MV.camera.goTo("shelf", view);
    const target = MV.camera.worldToClient(spineWorld, view);

    activeCase.travelTo(target, function () {
      activeCase = null;
      spine.style.visibility = "";
      spine.classList.add("just-added");
      MV.computer.turnOff();
      busy = false;
      setState("shelf");
    });
  }

  // ---- wiring ----

  deskZone.addEventListener("click", goDesk);
  shelfZone.addEventListener("click", goShelf);
  backBtn.addEventListener("click", goRoom);

  // la rueda recorre la estanteria a lo alto, convertimos el delta de pantalla a px de mundo para que el movimiento acompañe al gesto sin importar el zoom
  window.addEventListener("wheel", function (event) {
    if (state !== "shelf") return;
    event.preventDefault();
    const scale = window.innerWidth / SHELF_COL.w;
    scrollShelfBy(event.deltaY / scale);
  }, { passive: false });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if ((state === "case" || state === "form") && activeCase) {
        activeCase.close();
      } else {
        goRoom();
      }
      return;
    }

    if (state !== "shelf") return;

    const step = shelfViewHeight();
    const keySteps = {
      ArrowDown: step * 0.3,
      ArrowUp: -step * 0.3,
      PageDown: step * 0.85,
      PageUp: -step * 0.85,
      Home: -(SHELF_COL.bottom - SHELF_COL.top),
      End: SHELF_COL.bottom - SHELF_COL.top
    };
    if (keySteps[event.key] === undefined) return;
    event.preventDefault();
    scrollShelfBy(keySteps[event.key]);
  });

  // el reencuadre por resize necesita el rect de shelf recalculado con el aspecto nuevo, si no el alto queda del viewport viejo
  window.addEventListener("resize", function () {
    if (state !== "shelf" && state !== "case") return;
    applyShelfScroll("instant");
  });

  // ---- init ----

  const cameraEl = document.getElementById("camera");
  cameraEl.style.transition = "none";
  MV.camera.goTo("room");
  void cameraEl.offsetWidth;
  cameraEl.style.transition = "";

  MV.shelf.render(MV.data.getCollection());
  MV.shelf.setOnSpineClick(handleSpineClick);
  MV.computer.setOnSelect(handleSelect);
  setState("room");

  return {};
})();
