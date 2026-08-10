// cliente de la api de omdb (omdbapi.com): busca titulos y mapea la respuesta cruda al shape que ya usa js/data.js
// omdb es la unica fuente del buscador porque es la unica de una sola key que trae imdbRating y Rated juntos

window.MV = window.MV || {};

MV.omdb = (function () {
  const MONTHS = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
  const BASE_URL = "https://www.omdbapi.com/";
  const KEY_STORAGE = "movievault.omdbKey";
  const CACHE_STORAGE = "movievault.omdbCache";

  // --- parseo puro ---

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

  function mapTitle(raw, episodeCount) {
    const isSeries = raw.Type === "series";
    return {
      title: isMissing(raw.Title) ? "-" : raw.Title,
      releaseDate: parseReleased(raw.Released, raw.Year),
      duration: isSeries ? parseSeriesDuration(raw.totalSeasons, episodeCount) : parseRuntime(raw.Runtime),
      imdbRating: parseRating(raw.imdbRating),
      parental: isMissing(raw.Rated) ? "-" : raw.Rated,
      genres: parseGenres(raw.Genre),
      country: isMissing(raw.Country) ? "-" : raw.Country,
      actors: parseActors(raw.Actors),
      imdbLink: imdbLink(raw.imdbID),
      poster: isMissing(raw.Poster) ? "" : raw.Poster,
      type: raw.Type
    };
  }

  function mapSearchItem(raw) {
    return {
      title: raw.Title,
      year: raw.Year,
      imdbID: raw.imdbID,
      type: raw.Type,
      poster: isMissing(raw.Poster) ? "" : raw.Poster
    };
  }

  // --- red y almacenamiento ---

  // la key entra por parametro y no se lee de localStorage adentro para que esta funcion se pueda testear sin browser
  function buildUrl(params, key) {
    const url = new URL(BASE_URL);
    url.searchParams.set("apikey", key);
    Object.keys(params).forEach(function (name) {
      url.searchParams.set(name, params[name]);
    });
    return url.toString();
  }

  function setKey(key) {
    localStorage.setItem(KEY_STORAGE, String(key).trim());
  }

  function getKey() {
    return localStorage.getItem(KEY_STORAGE) || "";
  }

  // un cache corrupto no puede tumbar la busqueda, se descarta y se vuelve a llenar
  function parseCache(text) {
    try {
      const parsed = JSON.parse(text || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (err) {
      return {};
    }
  }

  function readCache() {
    return parseCache(localStorage.getItem(CACHE_STORAGE));
  }

  function writeCache(cache) {
    localStorage.setItem(CACHE_STORAGE, JSON.stringify(cache));
  }

  function clearCache() {
    localStorage.removeItem(CACHE_STORAGE);
  }

  // el plan gratuito son 1000 llamadas por dia: cacheamos por clave para que reabrir la pagina o repetir el panel de asserts no queme cupo
  function request(params, cacheKey) {
    const cache = readCache();
    if (cacheKey && cache[cacheKey]) {
      return Promise.resolve(cache[cacheKey]);
    }
    const key = getKey();
    if (!key) {
      return Promise.reject(new Error("falta la api key de omdb"));
    }
    return fetch(buildUrl(params, key)).then(function (response) {
      return response.json();
    }).then(function (data) {
      // omdb contesta 200 con Response "False" tanto para una key invalida como para un titulo inexistente
      if (data.Response === "False") {
        throw new Error(data.Error || "omdb respondio Response False sin detalle");
      }
      if (cacheKey) {
        cache[cacheKey] = data;
        writeCache(cache);
      }
      return data;
    });
  }

  function search(query) {
    const normalized = String(query).trim();
    if (!normalized) {
      return Promise.resolve([]);
    }
    return request({ s: normalized }, "s:" + normalized.toLowerCase()).then(function (data) {
      return (data.Search || []).map(mapSearchItem);
    }).catch(function (err) {
      // "Movie not found!" y "Too many results." son respuestas validas de omdb, no fallos de red: devolvemos lista vacia
      if (/not found|too many results/i.test(err.message)) {
        return [];
      }
      throw err;
    });
  }

  function getTitle(imdbID) {
    return request({ i: imdbID, plot: "short" }, "i:" + imdbID).then(function (raw) {
      if (raw.Type !== "series" || parseInt(raw.totalSeasons, 10) !== 1) {
        return { mapped: mapTitle(raw, 0), raw: raw };
      }
      // una serie de temporada unica se mide en episodios y omdb no manda ese conteo en el detalle: hay que pedir la temporada aparte
      return request({ i: imdbID, Season: 1 }, "season1:" + imdbID).then(function (season) {
        return { mapped: mapTitle(raw, (season.Episodes || []).length), raw: raw };
      });
    });
  }

  return {
    isMissing: isMissing,
    parseReleased: parseReleased,
    parseRuntime: parseRuntime,
    parseSeriesDuration: parseSeriesDuration,
    parseGenres: parseGenres,
    parseActors: parseActors,
    parseRating: parseRating,
    imdbLink: imdbLink,
    mapTitle: mapTitle,
    mapSearchItem: mapSearchItem,
    buildUrl: buildUrl,
    setKey: setKey,
    getKey: getKey,
    parseCache: parseCache,
    readCache: readCache,
    writeCache: writeCache,
    clearCache: clearCache,
    search: search,
    getTitle: getTitle
  };
})();
