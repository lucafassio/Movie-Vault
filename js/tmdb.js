// cliente de tmdb (api.themoviedb.org): es la fuente primaria de la ficha porque es la unica que trae el personaje de cada actor y la portada
// lo unico que tmdb no tiene es el imdbRating, su vote_average es otro numero (Shutter Island: 8.197 contra 8.2 de imdb): ese campo lo aporta js/omdb.js

window.MV = window.MV || {};

MV.tmdb = (function () {
  const BASE_URL = "https://api.themoviedb.org/3";
  const IMAGE_BASE = "https://image.tmdb.org/t/p/";
  const POSTER_SIZE = "w500";
  // en-US y no es-ES a proposito: en castellano los titulos vuelven traducidos ("Dos policias rebeldes II") y la coleccion los tiene en ingles
  const LANGUAGE = "en-US";
  const CAST_LIMIT = 4;

  function parseRuntime(minutes) {
    const total = parseInt(minutes, 10);
    if (!total || isNaN(total)) {
      return "-";
    }
    const hours = Math.floor(total / 60);
    const rest = total % 60;
    if (hours === 0) {
      return rest + "min";
    }
    return hours + "h " + String(rest).padStart(2, "0") + "min";
  }

  function parseDate(iso) {
    const parts = String(iso || "").split("-");
    if (parts.length !== 3) {
      return "-";
    }
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  function parseGenres(genres) {
    if (!genres || !genres.length) {
      return "-";
    }
    return genres.map(function (genre) { return genre.name; }).join(" - ");
  }

  // el personaje va entre parentesis como en la coleccion, pero si tmdb no lo sabe queda solo el nombre y no un parentesis vacio
  function parseActors(cast, limit) {
    if (!cast || !cast.length) {
      return [];
    }
    return cast.slice(0, limit).map(function (person) {
      return person.character ? person.name + " (" + person.character + ")" : person.name;
    });
  }

  function parseCountry(countries) {
    if (!countries || !countries.length) {
      return "-";
    }
    return countries[0].name;
  }

  function posterUrl(path) {
    if (!path) {
      return "";
    }
    return IMAGE_BASE + POSTER_SIZE + path;
  }

  return {
    CAST_LIMIT: CAST_LIMIT,
    BASE_URL: BASE_URL,
    LANGUAGE: LANGUAGE,
    parseRuntime: parseRuntime,
    parseDate: parseDate,
    parseGenres: parseGenres,
    parseActors: parseActors,
    parseCountry: parseCountry,
    posterUrl: posterUrl
  };
})();
