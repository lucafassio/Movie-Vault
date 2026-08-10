// cliente de la api de omdb (omdbapi.com): busca titulos y mapea la respuesta cruda al shape que ya usa js/data.js
// omdb es la unica fuente del buscador porque es la unica de una sola key que trae imdbRating y Rated juntos

window.MV = window.MV || {};

MV.omdb = (function () {
  const MONTHS = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };

  // omdb marca todo lo que le falta con el string literal "N/A", no con null ni con el campo ausente
  function isMissing(value) {
    return value === undefined || value === null || value === "" || value === "N/A";
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

  return {
    isMissing: isMissing,
    parseReleased: parseReleased,
    parseRuntime: parseRuntime,
    parseSeriesDuration: parseSeriesDuration
  };
})();
