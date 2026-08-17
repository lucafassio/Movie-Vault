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
  // todo en US por default: lo que importa es que la coleccion entera sea uniforme, no que cada ficha use el dato mas local
  // la lista queda como mecanismo de fallback por si alguna vez falta un pais, pero hoy alcanza con US solo
  const COUNTRY_PRIORITY = ["US"];

  // solo estos cuatro tipos cuentan como estreno: 3 cines, 4 digital, 5 fisico, 6 tv
  // el premiere (1) y el estreno limitado (2) quedan afuera a proposito, una funcion de festival o una sala suelta no es un estreno
  const RELEASE_TYPE_PRIORITY = [3, 4, 5, 6];

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

  function findCountryRow(releaseDates, code) {
    return (releaseDates || []).find(function (row) { return row.iso_3166_1 === code; });
  }

  function pickEntryByType(entries) {
    for (let index = 0; index < RELEASE_TYPE_PRIORITY.length; index += 1) {
      const found = (entries || []).find(function (entry) { return entry.type === RELEASE_TYPE_PRIORITY[index]; });
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  function pickReleaseDate(releaseDates, fallbackIso) {
    for (let index = 0; index < COUNTRY_PRIORITY.length; index += 1) {
      const row = findCountryRow(releaseDates, COUNTRY_PRIORITY[index]);
      const chosen = row && pickEntryByType(row.release_dates);
      if (chosen && chosen.release_date) {
        return parseDate(String(chosen.release_date).slice(0, 10));
      }
    }
    return parseDate(fallbackIso);
  }

  // un pais puede listar el estreno de prensa con la clasificacion vacia antes del de cines: hay que saltear las vacias, no tomar la primera
  function pickCertification(releaseDates) {
    for (let index = 0; index < COUNTRY_PRIORITY.length; index += 1) {
      const row = findCountryRow(releaseDates, COUNTRY_PRIORITY[index]);
      const rated = row && row.release_dates.find(function (entry) { return entry.certification; });
      if (rated) {
        return rated.certification;
      }
    }
    return "-";
  }

  // el shape es el de la coleccion (titulo, fecha, duracion, genero, pais, elenco, portada, link) menos imdbRating, que lo completa js/movie-source.js con omdb
  function mapMovie(detail) {
    const credits = detail.credits || {};
    const releaseDates = (detail.release_dates || {}).results;
    return {
      tmdbId: detail.id,
      imdbID: detail.imdb_id || "",
      title: detail.title || "-",
      releaseDate: pickReleaseDate(releaseDates, detail.release_date),
      duration: parseRuntime(detail.runtime),
      parental: pickCertification(releaseDates),
      genres: parseGenres(detail.genres),
      country: parseCountry(detail.production_countries),
      actors: parseActors(credits.cast, CAST_LIMIT),
      poster: posterUrl(detail.poster_path),
      imdbLink: detail.imdb_id ? "https://www.imdb.com/es/title/" + detail.imdb_id + "/" : ""
    };
  }

  function mapSearchItem(result) {
    return {
      tmdbId: result.id,
      title: result.title,
      year: String(result.release_date || "").slice(0, 4) || "-",
      poster: posterUrl(result.poster_path)
    };
  }

  // la key entra por parametro y no se lee del config adentro para que esta funcion se pueda testear sin browser
  function buildUrl(path, params, key) {
    const url = new URL(BASE_URL + path);
    url.searchParams.set("api_key", key);
    url.searchParams.set("language", LANGUAGE);
    Object.keys(params || {}).forEach(function (name) {
      url.searchParams.set(name, params[name]);
    });
    return url.toString();
  }

  function getKey() {
    return window.MV.config && MV.config.has("TMDB_API_KEY") ? MV.config.get("TMDB_API_KEY") : "";
  }

  function request(path, params) {
    const key = getKey();
    if (!key) {
      return Promise.reject(new Error("falta TMDB_API_KEY en js/config.local.js"));
    }
    return fetch(buildUrl(path, params, key)).then(function (response) {
      if (!response.ok) {
        throw new Error("tmdb respondio " + response.status + " en " + path);
      }
      return response.json();
    });
  }

  // solo peliculas: /search/movie no devuelve series, asi que el alcance queda acotado por el endpoint y no por un filtro nuestro
  function search(query) {
    const normalized = String(query).trim();
    if (!normalized) {
      return Promise.resolve([]);
    }
    return request("/search/movie", { query: normalized, include_adult: "false" }).then(function (data) {
      return (data.results || []).map(mapSearchItem);
    });
  }

  // credits y release_dates vienen en la misma llamada con append_to_response: son tres datos y un solo request
  function getMovie(tmdbId) {
    return request("/movie/" + tmdbId, { append_to_response: "credits,release_dates" }).then(function (detail) {
      return { mapped: mapMovie(detail), raw: detail };
    });
  }

  // el panel de asserts arranca de los imdb id que ya tiene la coleccion: este es el puente de imdb a tmdb
  function findByImdbId(imdbID) {
    return request("/find/" + imdbID, { external_source: "imdb_id" }).then(function (data) {
      const movie = (data.movie_results || [])[0];
      return movie ? movie.id : null;
    });
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
    posterUrl: posterUrl,
    pickReleaseDate: pickReleaseDate,
    pickCertification: pickCertification,
    mapMovie: mapMovie,
    mapSearchItem: mapSearchItem,
    buildUrl: buildUrl,
    search: search,
    getMovie: getMovie,
    findByImdbId: findByImdbId
  };
})();
