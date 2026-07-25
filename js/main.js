// orquestador: maquina de estados de la escena y la secuencia de alta con impresora, caja y vuelo al estante

window.MV = window.MV || {};

MV.main = (function () {
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const T = REDUCED ? 0.02 : 1;
  const CAMERA_MS = REDUCED ? 60 : 1300;

  const stage = document.getElementById("stage");
  const deskZone = document.getElementById("desk-zone");
  const shelfZone = document.getElementById("shelf-zone");
  const backBtn = document.getElementById("back-btn");

  // estados: room, desk, shelf, case, placing
  let state = "room";
  let busy = false;
  let activeCase = null;

  function setState(next) {
    state = next;
    document.body.dataset.state = next;
    backBtn.hidden = next === "room" || next === "case" || next === "placing";
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
    MV.camera.goTo("shelf");
  }

  function goRoom() {
    if (busy) return;
    if (state === "desk") MV.computer.turnOff();
    if (state !== "desk" && state !== "shelf") return;
    setState("room");
    lock(CAMERA_MS);
    MV.camera.goTo("room");
  }

  // ---- caja abierta ----

  function handleSpineClick(movie, spineEl) {
    if (state !== "shelf" || busy) return;
    setState("case");
    activeCase = MV.shelf.openCase(movie, spineEl, function () {
      activeCase = null;
      setState("shelf");
    });
  }

  // ---- secuencia de alta: imprimir, guardar el papel en la caja, cerrarla y volarla al estante ----

  function buildMiniCase(color) {
    const mini = document.createElement("div");
    mini.className = "mini-case";
    mini.style.setProperty("--spine-color", color);
    mini.innerHTML =
      '<div class="mc-half mc-right"><div class="mc-disc"></div></div>' +
      '<div class="mc-half mc-left">' +
        '<div class="mc-face mc-face-inside"><div class="mc-paper"><div class="pp-lines"></div></div></div>' +
        '<div class="mc-face mc-face-cover"></div>' +
      "</div>";
    return mini;
  }

  function placeMovie(movie) {
    setState("placing");
    busy = true;

    const color = MV.shelf.spineColor(movie);

    // 1. el papel con la ficha sale de la impresora
    const paper = document.createElement("div");
    paper.className = "print-paper";
    paper.innerHTML = '<div class="pp-lines"></div>';
    paper.style.left = "898px";
    paper.style.top = "546px";
    paper.style.height = "100px";
    paper.style.transformOrigin = "bottom";
    paper.style.transform = "scaleY(0.06)";
    stage.appendChild(paper);
    paper.animate(
      [{ transform: "scaleY(0.06)" }, { transform: "scaleY(1)" }],
      { duration: 950 * T, delay: 300 * T, easing: "cubic-bezier(0.3, 1, 0.5, 1)", fill: "forwards" }
    );

    // 2. aparece la caja abierta sobre el escritorio
    const mini = buildMiniCase(color);
    stage.appendChild(mini);
    setTimeout(function () { mini.classList.add("visible"); }, 1150 * T);

    // 3. el papel viaja y se engancha en la mitad izquierda de la caja
    setTimeout(function () {
      paper.remove();
      const flyPaper = document.createElement("div");
      flyPaper.className = "fly-paper";
      flyPaper.style.left = "898px";
      flyPaper.style.top = "546px";
      stage.appendChild(flyPaper);
      flyPaper.innerHTML = '<div class="pp-lines"></div>';

      // destino: el hueco interior de la mitad izquierda de la mini caja
      const targetX = 710;
      const targetY = 537;
      const dx = targetX + 46 - (898 + 60);
      const dy = targetY + 67 - (546 + 50);
      const anim = flyPaper.animate(
        [
          { transform: "translate(0px, 0px) rotate(0deg) scale(1)" },
          { transform: "translate(" + dx * 0.5 + "px, " + (dy * 0.5 - 46) + "px) rotate(-7deg) scale(0.92)", offset: 0.5 },
          { transform: "translate(" + dx + "px, " + dy + "px) rotate(-2deg) scale(0.78, 1.32)" }
        ],
        { duration: 680 * T, easing: "cubic-bezier(0.35, 0.9, 0.4, 1)", fill: "forwards" }
      );
      anim.onfinish = function () {
        flyPaper.remove();
        mini.classList.add("paper-in");
      };
    }, 1550 * T);

    // 4. la caja se cierra sobre el papel
    setTimeout(function () { mini.classList.add("closing"); }, 2550 * T);

    // 5. la caja cerrada vuela al estante mientras la camara la sigue
    setTimeout(function () {
      MV.camera.goTo("shelf");

      // el lomo nuevo ya existe pero viaja escondido dentro de la caja voladora, el que estaba inclinado se endereza fuera de camara
      MV.shelf.render(MV.data.getCollection());
      const spine = MV.shelf.lastSpine();
      spine.style.visibility = "hidden";
      const target = worldRect(spine);

      const startCx = 880;
      const startCy = 604;
      const flyer = document.createElement("div");
      flyer.className = "flyer";
      flyer.style.setProperty("--spine-color", color);
      flyer.style.width = target.w + "px";
      flyer.style.height = target.h + "px";
      flyer.style.left = (startCx - target.w / 2) + "px";
      flyer.style.top = (startCy - target.h / 2) + "px";
      stage.appendChild(flyer);
      mini.remove();

      const dx = target.x + target.w / 2 - startCx;
      const dy = target.y + target.h / 2 - startCy;
      const sx = 112 / target.w;
      const sy = 164 / target.h;

      const anim = flyer.animate(
        [
          { transform: "translate(0px, 0px) rotate(0deg) scale(" + sx + ", " + sy + ")" },
          { transform: "translate(" + dx * 0.45 + "px, " + (dy * 0.45 - 190) + "px) rotate(8deg) scale(" + (0.4 + sx * 0.6) + ", " + (0.4 + sy * 0.6) + ")", offset: 0.42 },
          { transform: "translate(" + dx + "px, " + dy + "px) rotate(-7deg) scale(1)" }
        ],
        { duration: 1250 * T, delay: 120 * T, easing: "cubic-bezier(0.35, 0.75, 0.3, 1)", fill: "forwards" }
      );

      anim.onfinish = function () {
        flyer.remove();
        spine.style.visibility = "";
        spine.classList.add("just-added");
        MV.computer.turnOff();
        busy = false;
        setState("shelf");
      };
    }, 3350 * T);
  }

  // ---- wiring ----

  deskZone.addEventListener("click", goDesk);
  shelfZone.addEventListener("click", goShelf);
  backBtn.addEventListener("click", goRoom);

  [deskZone, shelfZone].forEach(function (zone) {
    zone.addEventListener("keydown", function (event) {
      // solo si el foco esta en la zona misma, si no la barra espaciadora del input de busqueda se pierde
      if (event.target !== zone) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        zone.click();
      }
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (state === "case" && activeCase) {
      activeCase.close();
    } else {
      goRoom();
    }
  });

  // ---- init ----

  const cameraEl = document.getElementById("camera");
  cameraEl.style.transition = "none";
  MV.camera.goTo("room");
  void cameraEl.offsetWidth;
  cameraEl.style.transition = "";

  MV.shelf.render(MV.data.getCollection());
  MV.shelf.setOnSpineClick(handleSpineClick);
  MV.computer.setOnPurchase(placeMovie);
  MV.rain.start();
  setState("room");

  return {};
})();
