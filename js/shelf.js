// estanteria: renderiza los lomos estilo caja de dvd sobre la imagen fija y maneja la caja abierta en sus dos modos, lectura y alta

window.MV = window.MV || {};

MV.shelf = (function () {
  // hue por genero para tenir las cajas, saturacion alta porque las cajas de la referencia son vivas
  const GENRE_HUES = {
    "drama": 16,
    "action": 356,
    "adventure": 92,
    "comedy": 44,
    "crime": 336,
    "thriller": 208,
    "suspenso": 232,
    "misterio": 262,
    "mystery": 262,
    "fantasy": 282,
    "horror": 172
  };

  const strips = Array.prototype.slice.call(document.querySelectorAll(".spine-strip"));
  const overflowPanel = document.querySelector('.shelf-panel[data-row="2"]');
  const overlay = document.getElementById("case-overlay");

  const STRIP_WIDTH = 822;
  const SPINE_GAP = 4;

  let onSpineClick = null;

  function titleHash(title) {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = (hash * 31 + title.charCodeAt(i)) % 997;
    }
    return hash;
  }

  function spineColor(movie) {
    // el hue lo ancla el primer genero y el hash del titulo lo corre un poco para que no haya dos lomos identicos
    const first = (movie.genres || "").split("-")[0].trim().toLowerCase();
    const base = GENRE_HUES[first] !== undefined ? GENRE_HUES[first] : 220;
    const hash = titleHash(movie.title);
    const hue = (base + (hash % 96) - 48 + 360) % 360;
    const light = 36 + (hash % 10);
    return "hsl(" + hue + ", 46%, " + light + "%)";
  }

  function balanceLines(words) {
    // partimos el titulo en dos renglones lo mas parejos posible cortando en un espacio
    const total = words.join(" ").length;
    let best = 1;
    let bestDiff = Infinity;
    for (let i = 1; i < words.length; i++) {
      const left = words.slice(0, i).join(" ").length;
      const right = words.slice(i).join(" ").length;
      const diff = Math.abs(left - right);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = i;
      }
    }
    return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
  }

  function spineLayout(title) {
    // titulos largos van en dos renglones con letra mas chica para que el lomo no quede gordo
    const words = title.split(" ");
    let fontSize = Math.floor(118 / title.length);
    let lines = [title];
    if (fontSize < 10 && words.length > 1) {
      lines = balanceLines(words);
      const longest = Math.max(lines[0].length, lines[1].length);
      fontSize = Math.floor(110 / longest);
    }
    fontSize = Math.max(8, Math.min(15, fontSize));
    const width = Math.max(34, Math.min(64, lines.length * (fontSize + 6) + 16));
    return { fontSize: fontSize, lines: lines, width: width };
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
  }

  function buildSpine(movie, index) {
    const layout = spineLayout(movie.title);
    const spine = document.createElement("button");
    spine.className = "spine";
    spine.style.setProperty("--spine-color", spineColor(movie));
    spine.style.width = layout.width + "px";
    spine.dataset.index = String(index);
    spine.setAttribute("aria-label", "abrir la caja de " + movie.title);
    const titleHtml = layout.lines.map(escapeHtml).join("<br>");
    spine.innerHTML =
      '<span class="spine-title" style="font-size:' + layout.fontSize + 'px">' + titleHtml + "</span>" +
      '<span class="spine-tape">' + escapeHtml(movie.personalRating.toFixed(1)) + "</span>";
    spine.addEventListener("click", function (event) {
      event.stopPropagation();
      if (onSpineClick) onSpineClick(movie, spine);
    });
    return spine;
  }

  function render(collection) {
    strips.forEach(function (strip) { strip.innerHTML = ""; });
    let row = 0;
    let used = 0;
    let lastSpineEl = null;
    collection.forEach(function (movie, index) {
      const width = spineLayout(movie.title).width;
      const needed = used === 0 ? width : used + SPINE_GAP + width;
      if (needed > STRIP_WIDTH && row < strips.length - 1) {
        row += 1;
        used = width;
      } else {
        used = needed;
      }
      lastSpineEl = buildSpine(movie, index);
      strips[row].appendChild(lastSpineEl);
    });

    // la ultima caja acomodada queda levemente inclinada, como recien apoyada
    if (lastSpineEl) lastSpineEl.classList.add("tilted");

    // el estante de abajo tiene libros pintados en la imagen, el panel que los tapa solo aparece cuando la coleccion desborda hasta ahi
    overflowPanel.classList.toggle("in-use", strips[2].children.length > 0);
  }

  function lastSpine() {
    let found = null;
    strips.forEach(function (strip) {
      const spines = strip.querySelectorAll(".spine");
      if (spines.length) found = spines[spines.length - 1];
    });
    return found;
  }

  function discSvg() {
    return (
      '<svg viewBox="0 0 200 200" aria-hidden="true">' +
        '<circle cx="100" cy="100" r="95" fill="#c9ccd4" stroke="#241a20" stroke-width="7"/>' +
        '<g class="disc-wedges">' +
          '<path d="M100,100 L100,8 A92,92 0 0 1 168,32 Z" fill="#eef2f6" opacity="0.85"/>' +
          '<path d="M100,100 L100,192 A92,92 0 0 1 32,168 Z" fill="#eef2f6" opacity="0.6"/>' +
          '<path d="M100,100 L14,72 A92,92 0 0 1 40,34 Z" fill="#a8adb8" opacity="0.5"/>' +
        "</g>" +
        '<circle cx="100" cy="100" r="56" fill="#b3b8c4"/>' +
        '<circle cx="100" cy="100" r="42" fill="#d9dde4"/>' +
        '<circle cx="100" cy="100" r="27" fill="#8a8f9c" stroke="#241a20" stroke-width="4"/>' +
        '<circle cx="100" cy="100" r="15" fill="#544a5e"/>' +
        '<path d="M100,85 a15,15 0 0 1 0,30 a7.5,7.5 0 0 1 0,-15 a7.5,7.5 0 0 0 0,-15" fill="#3a333f"/>' +
      "</svg>"
    );
  }

  // ---- caja abierta ----

  function metaItem(label, value) {
    return '<div class="meta-item"><span class="meta-label">' + label + '</span><span class="meta-value">' + escapeHtml(value) + "</span></div>";
  }

  function bookletView(movie) {
    const genreList = (movie.genres || "").split("-").map(function (genre) { return genre.trim(); });
    const genres = genreList.map(function (genre) {
      return '<span class="genre-chip">' + escapeHtml(genre) + "</span>";
    }).join("");

    return (
      '<span class="booklet-tape">' + escapeHtml(movie.personalRating.toFixed(1)) + "</span>" +
      '<div class="booklet">' +
        '<h2 class="booklet-title">' + escapeHtml(movie.title) + "</h2>" +
        '<div class="booklet-genres">' + genres + "</div>" +
        '<div class="booklet-meta">' +
          metaItem("estreno", movie.releaseDate) +
          metaItem("duracion", movie.duration) +
          metaItem("imdb", movie.imdbRating) +
          metaItem("clasificacion", movie.parental) +
          metaItem("vista", movie.watchedDate) +
          metaItem("pais", movie.country) +
        "</div>" +
        '<div class="booklet-section">review</div>' +
        '<p class="booklet-review">' + escapeHtml(movie.review) + "</p>" +
        '<a class="booklet-link" href="' + encodeURI(movie.imdbLink) + '" target="_blank" rel="noopener">ver en imdb &rarr;</a>' +
      "</div>"
    );
  }

  function bookletForm(movie) {
    const genreList = (movie.genres || "").split("-").map(function (genre) { return genre.trim(); });
    const genres = genreList.map(function (genre) {
      return '<span class="genre-chip">' + escapeHtml(genre) + "</span>";
    }).join("");

    return (
      '<span class="booklet-tape booklet-tape-pending">?</span>' +
      '<div class="booklet">' +
        '<h2 class="booklet-title">' + escapeHtml(movie.title) + "</h2>" +
        '<div class="booklet-genres">' + genres + "</div>" +
        '<div class="booklet-meta">' +
          metaItem("estreno", movie.releaseDate) +
          metaItem("duracion", movie.duration) +
          metaItem("imdb", movie.imdbRating) +
          metaItem("clasificacion", movie.parental) +
        "</div>" +
        '<div class="booklet-section">tu ficha</div>' +
        '<div class="case-field"><label for="case-date">fecha en la que la viste</label><input id="case-date" type="text" placeholder="dd/mm/aaaa" spellcheck="false"></div>' +
        '<div class="case-field"><label for="case-rating">tu puntaje (0 a 10)</label><input id="case-rating" type="number" min="0" max="10" step="0.1" placeholder="7.5"></div>' +
        '<div class="case-field"><label for="case-review">review</label><textarea id="case-review" placeholder="que te parecio..."></textarea></div>' +
        '<div class="case-actions">' +
          '<button class="case-btn case-cancel-btn" type="button">&larr; buscar otra</button>' +
          '<button class="case-btn case-btn-primary case-save-btn" type="button">guardar en la estanteria</button>' +
        "</div>" +
      "</div>"
    );
  }

  function buildOverlayContent(movie, mode) {
    const paper = mode === "edit" ? bookletForm(movie) : bookletView(movie);
    overlay.innerHTML =
      '<div class="case-backdrop"></div>' +
      '<div class="case-wrap">' +
        '<div class="case-flip">' +
          '<div class="case-shift">' +
            '<div class="case3d" style="--spine-color:' + spineColor(movie) + '">' +
              '<div class="case-tray">' +
                '<div class="tray-lip"></div>' +
                '<div class="disc">' + discSvg() + "</div>" +
                '<div class="case-hinge"></div>' +
              "</div>" +
              '<div class="case-cover">' +
                '<div class="cover-front">' +
                  '<span class="front-title">' + escapeHtml(movie.title) + "</span>" +
                  '<span class="front-brand">MOVIEVAULT</span>' +
                "</div>" +
                '<div class="cover-inside">' +
                  '<div class="inside-lip"></div>' +
                  '<div class="case-latch"></div>' +
                  '<div class="case-paper">' + paper + "</div>" +
                  '<span class="paper-clip paper-clip-top"></span>' +
                  '<span class="paper-clip paper-clip-bottom"></span>' +
                "</div>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>" +
      '<button class="case-close">cerrar</button>';
  }

  function rectCenterTransform(target, flipEl) {
    // la caja arranca o termina exactamente en un rect de pantalla y viaja desde o hacia el centro
    const flipRect = flipEl.getBoundingClientRect();
    const dx = (target.left + target.width / 2) - (flipRect.left + flipRect.width / 2);
    const dy = (target.top + target.height / 2) - (flipRect.top + flipRect.height / 2);
    const sx = target.width / flipRect.width;
    const sy = target.height / flipRect.height;
    return "translate(" + dx + "px, " + dy + "px) scale(" + sx + ", " + sy + ") rotateY(14deg)";
  }

  function clientRect(el) {
    const rect = el.getBoundingClientRect();
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  }

  function openCase(movie, opts) {
    // opts: fromEl o fromRect (origen del vuelo), mode view o edit, onClosed, onConfirm
    opts = opts || {};
    const mode = opts.mode || "view";
    buildOverlayContent(movie, mode);
    overlay.hidden = false;

    let closing = false;
    const fromRect = opts.fromRect || (opts.fromEl ? clientRect(opts.fromEl) : null);

    const flip = overlay.querySelector(".case-flip");
    const cover = overlay.querySelector(".case-cover");
    const backdrop = overlay.querySelector(".case-backdrop");
    const closeBtn = overlay.querySelector(".case-close");

    if (opts.fromEl) opts.fromEl.classList.add("is-open");

    // primer frame en el origen sin animar, segundo frame viaja al centro
    flip.style.transition = "none";
    flip.style.transform = fromRect ? rectCenterTransform(fromRect, flip) : "scale(0.6)";
    void flip.offsetWidth;
    flip.style.transition = "";
    flip.style.transform = "";

    flip.addEventListener("transitionend", function onArrive(event) {
      if (event.target !== flip || closing) return;
      flip.removeEventListener("transitionend", onArrive);
      overlay.classList.add("arrived", "open");
      if (mode === "edit") {
        const dateInput = overlay.querySelector("#case-date");
        if (dateInput) dateInput.focus({ preventScroll: true });
      }
    });

    function teardown() {
      overlay.hidden = true;
      overlay.innerHTML = "";
      if (opts.fromEl) opts.fromEl.classList.remove("is-open");
    }

    function travelTo(targetRect, done) {
      // cierra la tapa, saca la caja del centro y la manda al rect destino
      if (closing) return;
      closing = true;
      const wasOpen = overlay.classList.contains("open");
      overlay.classList.remove("open");

      function fly() {
        overlay.classList.remove("arrived");
        flip.style.transform = targetRect ? rectCenterTransform(targetRect, flip) : "scale(0.6)";
        flip.addEventListener("transitionend", function onBack(event2) {
          if (event2.target !== flip) return;
          flip.removeEventListener("transitionend", onBack);
          teardown();
          if (done) done();
        });
      }

      // si la tapa nunca llego a abrirse no hay transicion que esperar, la caja vuela directo
      if (!wasOpen) {
        fly();
        return;
      }

      cover.addEventListener("transitionend", function onCoverClosed(event) {
        if (event.target !== cover) return;
        cover.removeEventListener("transitionend", onCoverClosed);
        fly();
      });
    }

    function close() {
      // vuelve al origen, el lomo si vino de un lomo o el rect inicial si vino de la computadora
      const backRect = opts.fromEl ? clientRect(opts.fromEl) : fromRect;
      travelTo(backRect, opts.onClosed);
    }

    if (mode === "edit") {
      const ratingInput = overlay.querySelector("#case-rating");
      const tape = overlay.querySelector(".booklet-tape");

      // la cinta de papel refleja el puntaje en vivo, arranca en duda hasta que haya numero valido
      ratingInput.addEventListener("input", function () {
        const value = parseFloat(ratingInput.value);
        const valid = !isNaN(value) && value >= 0 && value <= 10;
        tape.textContent = valid ? (Math.round(value * 10) / 10).toFixed(1) : "?";
        tape.classList.toggle("booklet-tape-pending", !valid);
      });

      overlay.querySelector(".case-cancel-btn").addEventListener("click", close);
      overlay.querySelector(".case-save-btn").addEventListener("click", function () {
        const dateValue = overlay.querySelector("#case-date").value.trim() || "-";
        const ratingValue = parseFloat(ratingInput.value);
        const reviewValue = overlay.querySelector("#case-review").value.trim() || "sin review todavia";

        // el puntaje es lo unico obligatorio porque la cinta del lomo lo necesita
        if (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 10) {
          ratingInput.classList.add("invalid");
          ratingInput.focus({ preventScroll: true });
          return;
        }

        const fullMovie = {
          title: movie.title,
          releaseDate: movie.releaseDate,
          duration: movie.duration,
          imdbRating: movie.imdbRating,
          parental: movie.parental,
          genres: movie.genres,
          country: movie.country,
          actors: movie.actors,
          imdbLink: movie.imdbLink,
          watchedDate: dateValue,
          personalRating: Math.round(ratingValue * 10) / 10,
          review: reviewValue
        };
        if (opts.onConfirm) opts.onConfirm(fullMovie);
      });
    }

    backdrop.addEventListener("click", close);
    closeBtn.addEventListener("click", close);

    return { close: close, travelTo: travelTo };
  }

  function setOnSpineClick(handler) {
    onSpineClick = handler;
  }

  return {
    render: render,
    openCase: openCase,
    setOnSpineClick: setOnSpineClick,
    spineColor: spineColor,
    spineLayout: spineLayout,
    lastSpine: lastSpine
  };
})();
