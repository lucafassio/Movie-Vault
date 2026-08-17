// cliente de la api de omdb (omdbapi.com): busca titulos y mapea la respuesta cruda al shape de la coleccion
// omdb es la unica fuente del buscador porque es la unica de una sola key que trae imdbRating y Rated juntos

window.MV = window.MV || {};

MV.omdb = (function () {
  const MONTHS = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
  const BASE_URL = "https://www.omdbapi.com/";
  const KEY_STORAGE = "movievault.omdbKey";
  const CACHE_STORAGE = "movievault.omdbCache";
  const PENDING_STORAGE = "movievault.omdbPendingRatings";

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

  // un pendiente corrupto no puede tumbar nada, se descarta y arranca vacio
  function parsePending(text) {
    try {
      const parsed = JSON.parse(text || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function readPending() {
    return parsePending(localStorage.getItem(PENDING_STORAGE));
  }

  function writePending(list) {
    localStorage.setItem(PENDING_STORAGE, JSON.stringify(list));
  }

  // encola sin duplicar: getRating llama esto cada vez que el pedido falla, no solo la primera
  function queuePendingRating(imdbID) {
    if (isMissing(imdbID)) {
      return;
    }
    const list = readPending();
    if (list.indexOf(imdbID) === -1) {
      list.push(imdbID);
      writePending(list);
    }
  }

  function dequeuePendingRating(imdbID) {
    const list = readPending();
    const next = list.filter(function (id) { return id !== imdbID; });
    if (next.length !== list.length) {
      writePending(next);
    }
  }

  function getPendingRatings() {
    return readPending();
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

  // unico aporte de omdb en el pipeline nuevo: tmdb no tiene el puntaje de imdb, su vote_average es otro numero (Shutter Island: 8.197 contra 8.2)
  // reusa el mismo cacheKey "i:<imdbID>" que getTitle, asi un titulo ya visto no gasta una segunda llamada del cupo diario
  // si falla (sin internet, omdb caido, sin key) encola el imdbID para reintentar cuando vuelva el evento "online";
  // si contesta bien lo saca de la cola por si venia de un fallo anterior
  function getRating(imdbID) {
    if (isMissing(imdbID)) {
      return Promise.resolve(null);
    }
    return request({ i: imdbID, plot: "short" }, "i:" + imdbID).then(function (raw) {
      const rating = parseRating(raw.imdbRating);
      // solo saca de la cola cuando el reintento resuelve un numero real: un 200 con imdbRating "N/A"
      // (pelicula sin votos todavia) no es la falla de conectividad que este encolamiento resuelve
      if (rating !== null) {
        dequeuePendingRating(imdbID);
      }
      return rating;
    }).catch(function () {
      // el puntaje es un extra: si omdb no contesta o no hay key, la ficha igual se muestra con el rating vacio
      queuePendingRating(imdbID);
      return null;
    });
  }

  // reintenta cada imdbID pendiente con el mismo getRating (mismo cupo, sin prioridad especial) y devuelve
  // los que se recuperaron; los que siguen fallando quedan en la cola para el proximo evento "online"
  // en serie y no en paralelo, mismo criterio que el panel de asserts de api-test.html: una racha larga
  // sin internet puede acumular varios pendientes, y el evento "online" no debe dispararlos todos juntos
  // contra el cupo diario de omdb
  function retryPendingRatings() {
    const ids = readPending();
    const recovered = {};
    return ids.reduce(function (chain, imdbID) {
      return chain.then(function () {
        return getRating(imdbID).then(function (rating) {
          if (rating !== null) {
            recovered[imdbID] = rating;
          }
        });
      });
    }, Promise.resolve()).then(function () {
      return recovered;
    });
  }

  const api = {
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
    getTitle: getTitle,
    getRating: getRating,
    queuePendingRating: queuePendingRating,
    dequeuePendingRating: dequeuePendingRating,
    getPendingRatings: getPendingRatings,
    retryPendingRatings: retryPendingRatings
  };

  // en browser real, reintenta la cola sola cuando vuelve la conexion -- no hace falta que el usuario rebusque la pelicula
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("online", function () {
      retryPendingRatings();
    });
  }

  return api;
})();
