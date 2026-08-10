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

  return {
    isMissing: isMissing,
    parseReleased: parseReleased
  };
})();
