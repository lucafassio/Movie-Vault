// ui de la computadora: buscador mock sobre el dataset y formulario de alta con la metafora de caja

window.MV = window.MV || {};

MV.computer = (function () {
  const screen = document.getElementById("monitor-screen");

  let selectedMovie = null;
  let onPurchase = null;
  let searchTimer = null;

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
  }

  function buildUi() {
    screen.innerHTML =
      '<div class="pc-ui">' +
        '<div class="pc-header"><span class="pc-brand">movievault</span><span class="pc-version">v0.1 &middot; imdb mock</span></div>' +
        '<div class="pc-view pc-search">' +
          '<div class="pc-input-row"><span class="pc-prompt">&gt;</span><input class="pc-input" type="text" placeholder="buscar pelicula..." spellcheck="false"></div>' +
          '<div class="pc-results"></div>' +
          '<div class="pc-hint">escribi para buscar en imdb &middot; esc para volver a la habitacion</div>' +
        "</div>" +
        '<div class="pc-view pc-form" hidden></div>' +
        '<div class="pc-view pc-done" hidden></div>' +
      "</div>";

    const input = screen.querySelector(".pc-input");
    input.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        runSearch(input.value);
      }, 250);
    });
  }

  function showView(name) {
    screen.querySelectorAll(".pc-view").forEach(function (view) {
      view.hidden = !view.classList.contains("pc-" + name);
    });
  }

  function runSearch(query) {
    const resultsEl = screen.querySelector(".pc-results");
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
            openForm(movie);
          });
        }
        resultsEl.appendChild(btn);
      });
    });
  }

  function openForm(movie) {
    selectedMovie = movie;
    const formEl = screen.querySelector(".pc-form");
    formEl.innerHTML =
      '<div class="pc-form-case" style="--spine-color:' + MV.shelf.spineColor(movie) + '">' +
        '<div class="pc-form-spine"><span>' + escapeHtml(movie.title) + '</span><span class="pc-form-tape">tu caja</span></div>' +
        '<div class="pc-form-body">' +
          '<div class="pc-field"><label for="pc-date">fecha en la que la viste</label><input id="pc-date" type="text" placeholder="dd/mm/aaaa"></div>' +
          '<div class="pc-field"><label for="pc-rating">tu puntaje (0 a 10)</label><input id="pc-rating" type="number" min="0" max="10" step="0.1" placeholder="7.5"></div>' +
          '<div class="pc-field"><label for="pc-review">review</label><textarea id="pc-review" placeholder="que te parecio..."></textarea></div>' +
          '<div class="pc-actions">' +
            '<button class="pc-btn pc-back-btn" type="button">&larr; buscar otra</button>' +
            '<button class="pc-btn pc-btn-primary pc-save-btn" type="button">guardar en la estanteria</button>' +
          "</div>" +
        "</div>" +
      "</div>";

    formEl.querySelector(".pc-back-btn").addEventListener("click", function () {
      showView("search");
    });
    formEl.querySelector(".pc-save-btn").addEventListener("click", confirmPurchase);
    showView("form");
    formEl.querySelector("#pc-date").focus();
  }

  function confirmPurchase() {
    const dateValue = screen.querySelector("#pc-date").value.trim() || "-";
    const ratingValue = parseFloat(screen.querySelector("#pc-rating").value);
    const reviewValue = screen.querySelector("#pc-review").value.trim() || "sin review todavia";

    // el puntaje es lo unico obligatorio porque la cinta del lomo lo necesita
    if (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 10) {
      const ratingInput = screen.querySelector("#pc-rating");
      ratingInput.style.borderColor = "#c96a4a";
      ratingInput.focus();
      return;
    }

    const movie = {
      title: selectedMovie.title,
      releaseDate: selectedMovie.releaseDate,
      duration: selectedMovie.duration,
      imdbRating: selectedMovie.imdbRating,
      parental: selectedMovie.parental,
      genres: selectedMovie.genres,
      country: selectedMovie.country,
      actors: selectedMovie.actors,
      imdbLink: selectedMovie.imdbLink,
      watchedDate: dateValue,
      personalRating: Math.round(ratingValue * 10) / 10,
      review: reviewValue
    };

    MV.data.addMovie(movie);

    const doneEl = screen.querySelector(".pc-done");
    doneEl.innerHTML =
      '<div class="pc-done-msg"><span class="big">' + escapeHtml(movie.title) + '</span><br>' +
      '<span class="pc-printing-dots">imprimiendo ficha</span></div>';
    showView("done");

    if (onPurchase) onPurchase(movie);
  }

  function turnOn() {
    buildUi();
    screen.classList.add("on");
    const input = screen.querySelector(".pc-input");
    setTimeout(function () { input.focus(); }, 350);
  }

  function turnOff() {
    screen.classList.remove("on");
    screen.innerHTML = "";
    selectedMovie = null;
  }

  function setOnPurchase(handler) {
    onPurchase = handler;
  }

  return {
    turnOn: turnOn,
    turnOff: turnOff,
    setOnPurchase: setOnPurchase
  };
})();
