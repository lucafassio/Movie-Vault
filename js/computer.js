// ui de la computadora: buscador mock sobre el dataset, la seleccion abre la caja de alta que maneja main

window.MV = window.MV || {};

MV.computer = (function () {
  const screen = document.getElementById("monitor-screen");

  let onSelect = null;
  let searchTimer = null;

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
  }

  function buildUi() {
    screen.innerHTML =
      '<div class="pc-ui">' +
        '<div class="pc-header"><span class="pc-brand">movievault</span><span class="pc-version">v0.2</span></div>' +
        '<div class="pc-input-row"><span class="pc-prompt">&gt;</span><input class="pc-input" type="text" placeholder="buscar pelicula..." spellcheck="false"></div>' +
        '<div class="pc-results"></div>' +
        '<div class="pc-hint">escribi para buscar &middot; esc vuelve a la habitacion</div>' +
      "</div>";

    const input = screen.querySelector(".pc-input");
    input.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        runSearch(input.value);
      }, 250);
    });
  }

  function runSearch(query) {
    const resultsEl = screen.querySelector(".pc-results");
    if (!resultsEl) return;
    if (!query.trim()) {
      resultsEl.innerHTML = "";
      return;
    }
    resultsEl.innerHTML = '<div class="pc-hint">buscando...</div>';
    MV.data.searchMovies(query).then(function (results) {
      if (!results.length) {
        resultsEl.innerHTML = '<div class="pc-hint">sin resultados para "' + escapeHtml(query) + '"</div>';
        return;
      }
      resultsEl.innerHTML = "";
      results.forEach(function (movie) {
        const btn = document.createElement("button");
        btn.className = "pc-result";
        btn.disabled = movie.alreadyOwned;
        btn.innerHTML =
          '<span class="r-title">' + escapeHtml(movie.title) + "</span>" +
          '<span class="r-meta">' + escapeHtml(movie.releaseDate.slice(-4)) + " &middot; imdb " + escapeHtml(movie.imdbRating) +
          (movie.alreadyOwned ? " &middot; en estanteria" : "") + "</span>";
        if (!movie.alreadyOwned) {
          btn.addEventListener("click", function () {
            if (onSelect) onSelect(movie);
          });
        }
        resultsEl.appendChild(btn);
      });
    });
  }

  function refreshSearch() {
    // se llama al volver de una alta para que el titulo recien guardado aparezca como en estanteria
    const input = screen.querySelector(".pc-input");
    if (input && input.value.trim()) runSearch(input.value);
  }

  function turnOn() {
    buildUi();
    screen.classList.add("on");
    const input = screen.querySelector(".pc-input");
    setTimeout(function () { input.focus({ preventScroll: true }); }, 350);
  }

  function turnOff() {
    screen.classList.remove("on");
    screen.innerHTML = "";
  }

  function setOnSelect(handler) {
    onSelect = handler;
  }

  return {
    turnOn: turnOn,
    turnOff: turnOff,
    refreshSearch: refreshSearch,
    setOnSelect: setOnSelect
  };
})();
