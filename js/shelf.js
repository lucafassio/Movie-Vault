// estanteria: renderiza los lomos estilo caja de dvd y maneja la caja que sale del estante y se abre

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

  const shelfZone = document.getElementById("shelf-zone");
  const strips = Array.prototype.slice.call(shelfZone.querySelectorAll(".spine-strip"));
  const overlay = document.getElementById("case-overlay");

  const STRIP_WIDTH = 636;
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

    // los libros decorativos del estante de abajo se esconden cuando la coleccion desborda hasta ahi
    const bottomRow = strips[strips.length - 1].parentElement;
    bottomRow.querySelector(".lean-books").style.display = strips[strips.length - 1].children.length ? "none" : "flex";
  }

  function lastSpine() {
    const spines = shelfZone.querySelectorAll(".spine");
    return spines[spines.length - 1] || null;
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

  function buildOverlayContent(movie) {
    const actors = (movie.actors || []).slice(0, 4).map(function (actor) {
      return "<li>" + escapeHtml(actor) + "</li>";
    }).join("");

    const genreList = (movie.genres || "").split("-").map(function (genre) { return genre.trim(); });
    const genres = genreList.map(function (genre) {
      return '<span class="genre-chip">' + escapeHtml(genre) + "</span>";
    }).join("");

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
                  '<div class="case-paper">' +
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
                        metaItem("genero", genreList[0] || "-") +
                        metaItem("pais", movie.country) +
                      "</div>" +
                      '<div class="booklet-section">elenco</div>' +
                      '<ul class="booklet-actors">' + actors + "</ul>" +
                      '<div class="booklet-section">review</div>' +
                      '<p class="booklet-review">' + escapeHtml(movie.review) + "</p>" +
                      '<a class="booklet-link" href="' + encodeURI(movie.imdbLink) + '" target="_blank" rel="noopener">ver en imdb &rarr;</a>' +
                    "</div>" +
                  "</div>" +
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

  function flipTransformFor(spineEl, flipEl) {
    // la caja arranca exactamente en el rect del lomo en pantalla y viaja al centro
    const spineRect = spineEl.getBoundingClientRect();
    const flipRect = flipEl.getBoundingClientRect();
    const dx = (spineRect.left + spineRect.width / 2) - (flipRect.left + flipRect.width / 2);
    const dy = (spineRect.top + spineRect.height / 2) - (flipRect.top + flipRect.height / 2);
    const sx = spineRect.width / flipRect.width;
    const sy = spineRect.height / flipRect.height;
    return "translate(" + dx + "px, " + dy + "px) scale(" + sx + ", " + sy + ") rotateY(14deg)";
  }

  let closing = false;

  function openCase(movie, spineEl, onClosed) {
    buildOverlayContent(movie);
    overlay.hidden = false;
    closing = false;

    const flip = overlay.querySelector(".case-flip");
    const cover = overlay.querySelector(".case-cover");
    const backdrop = overlay.querySelector(".case-backdrop");
    const closeBtn = overlay.querySelector(".case-close");

    spineEl.classList.add("is-open");

    // primer frame en el lomo sin animar, segundo frame viaja al centro
    flip.style.transition = "none";
    flip.style.transform = flipTransformFor(spineEl, flip);
    void flip.offsetWidth;
    flip.style.transition = "";
    flip.style.transform = "";

    flip.addEventListener("transitionend", function onArrive(event) {
      if (event.target !== flip || closing) return;
      flip.removeEventListener("transitionend", onArrive);
      overlay.classList.add("arrived", "open");
    });

    function close() {
      if (closing) return;
      closing = true;
      overlay.classList.remove("open");

      cover.addEventListener("transitionend", function onCoverClosed(event) {
        if (event.target !== cover) return;
        cover.removeEventListener("transitionend", onCoverClosed);
        overlay.classList.remove("arrived");
        flip.style.transform = flipTransformFor(spineEl, flip);
        flip.addEventListener("transitionend", function onBack(event2) {
          if (event2.target !== flip) return;
          flip.removeEventListener("transitionend", onBack);
          overlay.hidden = true;
          overlay.innerHTML = "";
          spineEl.classList.remove("is-open");
          if (onClosed) onClosed();
        });
      });
    }

    backdrop.addEventListener("click", close);
    closeBtn.addEventListener("click", close);

    return { close: close };
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
