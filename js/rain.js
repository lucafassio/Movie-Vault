// lluvia detras del vidrio de la ventana, canvas al doble de resolucion del mundo para que no se vea borrosa con zoom

window.MV = window.MV || {};

MV.rain = (function () {
  const canvas = document.getElementById("rain-canvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // streaks que caen atras y gotas que resbalan por el vidrio
  const streaks = [];
  const droplets = [];

  for (let i = 0; i < 42; i++) {
    streaks.push({
      x: Math.random() * W,
      y: Math.random() * H,
      len: 26 + Math.random() * 40,
      speed: 7 + Math.random() * 6,
      alpha: 0.18 + Math.random() * 0.20
    });
  }

  for (let i = 0; i < 14; i++) {
    droplets.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 2.5 + Math.random() * 3.5,
      speed: 0.15 + Math.random() * 0.5,
      wobble: Math.random() * Math.PI * 2
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (const s of streaks) {
      ctx.strokeStyle = "rgba(143, 169, 201, " + s.alpha + ")";
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - 2, s.y + s.len);
      ctx.stroke();
      s.y += s.speed;
      if (s.y > H) {
        s.y = -s.len;
        s.x = Math.random() * W;
      }
    }

    for (const d of droplets) {
      d.wobble += 0.02;
      ctx.fillStyle = "rgba(170, 195, 225, 0.30)";
      ctx.beginPath();
      ctx.arc(d.x + Math.sin(d.wobble) * 0.8, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
      d.y += d.speed;
      if (d.y > H + 6) {
        d.y = -6;
        d.x = Math.random() * W;
      }
    }
  }

  let running = false;

  function loop() {
    if (!running) return;
    draw();
    requestAnimationFrame(loop);
  }

  function start() {
    if (reduced) {
      // con reduced motion se dibuja un solo frame estatico para conservar la ambientacion
      draw();
      return;
    }
    if (running) return;
    running = true;
    requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
  }

  // sin pestania visible no tiene sentido seguir dibujando
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  return { start: start, stop: stop };
})();
