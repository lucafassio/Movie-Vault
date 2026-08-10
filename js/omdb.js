// cliente de la api de omdb (omdbapi.com): busca titulos y mapea la respuesta cruda al shape que ya usa js/data.js
// omdb es la unica fuente del buscador porque es la unica de una sola key que trae imdbRating y Rated juntos

window.MV = window.MV || {};

MV.omdb = (function () {
  const MONTHS = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };

  // omdb marca todo lo que le falta con el string literal "N/A", no con null ni con el campo ausente
  function isMissing(value) {
    if (value === undefined || value === null) {
      return true;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" || trimmed === "N/A";
    }
    return false;
  }

  function parseReleased(released, year) {
    if (!isMissing(released)) {
      const parts = String(released).split(" ");
      const month = MONTHS[parts[1]];
      if (parts.length === 3 && month) {
        return String(parts[0]).padStart(2, "0") + "/" + month + "/" + parts[2];
      }
    }
    // fallback al año suelto porque los estrenos futuros y varias series vienen con Released "N/A" pero si traen Year
    if (!isMissing(year)) {
      return String(year).slice(0, 4);
    }
    return "-";
  }

  function parseRuntime(runtime) {
    if (isMissing(runtime)) {
      return "-";
    }
    const minutes = parseInt(runtime, 10);
    if (isNaN(minutes)) {
      return "-";
    }
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0) {
      return rest + "min";
    }
    // los minutos van con cero a la izquierda porque asi estan escritos en la coleccion ("2h 07min")
    return hours + "h " + String(rest).padStart(2, "0") + "min";
  }

  function parseSeriesDuration(totalSeasons, episodeCount) {
    const seasons = parseInt(totalSeasons, 10);
    // una serie de temporada unica se anota en episodios, no en temporadas (Wonder Man = "8 eps")
    if (seasons === 1 && episodeCount > 0) {
      return episodeCount + " eps";
    }
    if (seasons > 0) {
      return seasons + " temp";
    }
    return "-";
  }

  function parseGenres(genre) {
    if (isMissing(genre)) {
      return "-";
    }
    return String(genre).split(",").map(function (name) { return name.trim(); }).filter(Boolean).join(" - ");
  }

  // omdb no devuelve el personaje, solo el nombre del actor: "Leonardo DiCaprio (Teddy Daniels)" no se puede reconstruir desde aca
  function parseActors(actors) {
    if (isMissing(actors)) {
      return [];
    }
    return String(actors).split(",").map(function (name) { return name.trim(); }).filter(Boolean);
  }

  function parseRating(imdbRating) {
    if (isMissing(imdbRating)) {
      return null;
    }
    // parseFloat parsea de a pedazos y "8,2" le sale 8: chequeamos la forma antes para que un valor raro caiga en null y no en un numero equivocado
    if (!/^\d+(\.\d+)?$/.test(String(imdbRating).trim())) {
      return null;
    }
    const rating = parseFloat(imdbRating);
    return isNaN(rating) ? null : rating;
  }

  function imdbLink(imdbID) {
    if (isMissing(imdbID)) {
      return "";
    }
    return "https://www.imdb.com/es/title/" + imdbID + "/";
  }

  return {
    isMissing: isMissing,
    parseReleased: parseReleased,
    parseRuntime: parseRuntime,
    parseSeriesDuration: parseSeriesDuration,
    parseGenres: parseGenres,
    parseActors: parseActors,
    parseRating: parseRating,
    imdbLink: imdbLink
  };
})();
