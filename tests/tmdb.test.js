const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-omdb");

const tmdb = loadScripts(["js/tmdb.js"]).tmdb;

test("parseRuntime pasa los minutos de tmdb al formato de la coleccion", function () {
  assert.equal(tmdb.parseRuntime(138), "2h 18min");
  assert.equal(tmdb.parseRuntime(101), "1h 41min");
  assert.equal(tmdb.parseRuntime(127), "2h 07min");
  assert.equal(tmdb.parseRuntime(45), "45min");
});

test("parseRuntime devuelve guion cuando tmdb no sabe la duracion", function () {
  assert.equal(tmdb.parseRuntime(0), "-");
  assert.equal(tmdb.parseRuntime(null), "-");
  assert.equal(tmdb.parseRuntime(undefined), "-");
});

test("parseDate da vuelta la fecha iso de tmdb", function () {
  assert.equal(tmdb.parseDate("2010-02-14"), "14/02/2010");
  assert.equal(tmdb.parseDate("2024-02-29"), "29/02/2024");
});

test("parseDate devuelve guion cuando la fecha viene vacia o mal formada", function () {
  assert.equal(tmdb.parseDate(""), "-");
  assert.equal(tmdb.parseDate(null), "-");
  assert.equal(tmdb.parseDate("2010"), "-");
});

test("parseGenres une los nombres con el separador de la coleccion", function () {
  assert.equal(tmdb.parseGenres([{ id: 18, name: "Drama" }, { id: 80, name: "Crime" }]), "Drama - Crime");
  assert.equal(tmdb.parseGenres([]), "-");
  assert.equal(tmdb.parseGenres(undefined), "-");
});

test("parseActors escribe el personaje entre parentesis como la coleccion", function () {
  const cast = [
    { name: "Leonardo DiCaprio", character: "Teddy Daniels" },
    { name: "Mark Ruffalo", character: "Chuck Aule" }
  ];
  assert.deepEqual(tmdb.parseActors(cast, 4), ["Leonardo DiCaprio (Teddy Daniels)", "Mark Ruffalo (Chuck Aule)"]);
});

test("parseActors corta en el limite pedido", function () {
  const cast = [{ name: "A", character: "a" }, { name: "B", character: "b" }, { name: "C", character: "c" }];
  assert.deepEqual(tmdb.parseActors(cast, 2), ["A (a)", "B (b)"]);
});

test("parseActors omite el parentesis cuando tmdb no sabe el personaje", function () {
  assert.deepEqual(tmdb.parseActors([{ name: "Zendaya", character: "" }], 4), ["Zendaya"]);
  assert.deepEqual(tmdb.parseActors(undefined, 4), []);
});

test("parseCountry se queda con el primer pais de produccion", function () {
  assert.equal(tmdb.parseCountry([{ name: "Mexico" }, { name: "United States of America" }]), "Mexico");
  assert.equal(tmdb.parseCountry([]), "-");
});

test("posterUrl arma la url absoluta de la imagen", function () {
  assert.equal(tmdb.posterUrl("/abc.jpg"), "https://image.tmdb.org/t/p/w500/abc.jpg");
});

test("posterUrl devuelve string vacio cuando la pelicula no tiene portada", function () {
  assert.equal(tmdb.posterUrl(null), "");
  assert.equal(tmdb.posterUrl(""), "");
});

const RELEASE_DATES = [
  { iso_3166_1: "AR", release_dates: [{ certification: "+16", type: 3, release_date: "2010-03-11T00:00:00.000Z" }] },
  { iso_3166_1: "US", release_dates: [{ certification: "R", type: 3, release_date: "2010-02-18T00:00:00.000Z" }] },
  { iso_3166_1: "ES", release_dates: [{ certification: "12", type: 3, release_date: "2010-02-14T00:00:00.000Z" }] }
];

test("pickReleaseDate toma el estreno de estados unidos aunque haya uno argentino", function () {
  assert.equal(tmdb.pickReleaseDate(RELEASE_DATES, "2010-02-14"), "18/02/2010");
});

test("pickReleaseDate cae al estreno global cuando no hay fecha de estados unidos", function () {
  const sinUS = RELEASE_DATES.filter(function (row) { return row.iso_3166_1 !== "US"; });
  assert.equal(tmdb.pickReleaseDate(sinUS, "2010-02-14"), "14/02/2010");
  assert.equal(tmdb.pickReleaseDate([], "2010-02-14"), "14/02/2010");
  assert.equal(tmdb.pickReleaseDate(undefined, "2010-02-14"), "14/02/2010");
});

test("pickReleaseDate toma el estreno en cines y no el primero que aparece", function () {
  // caso real de Shutter Island: primero figura el estreno en Nueva York (type 1) y despues el de cines (type 3)
  const conPremiere = [
    { iso_3166_1: "US", release_dates: [
      { certification: "", type: 1, release_date: "2010-02-17T00:00:00.000Z" },
      { certification: "R", type: 3, release_date: "2010-02-18T00:00:00.000Z" }
    ] }
  ];
  assert.equal(tmdb.pickReleaseDate(conPremiere, "2010-02-14"), "18/02/2010");
});

test("pickReleaseDate toma el estreno digital cuando la pelicula no paso por cines", function () {
  // caso real de Frankenstein: no tiene ningun type 3, y el primero de la lista es una funcion de festival que no es un estreno
  const frankenstein = [
    { iso_3166_1: "US", release_dates: [
      { certification: "", type: 1, release_date: "2025-08-30T00:00:00.000Z", note: "Telluride Film Festival" },
      { certification: "", type: 1, release_date: "2025-10-17T00:00:00.000Z", note: "Chicago International Film Festival" },
      { certification: "R", type: 2, release_date: "2025-10-17T00:00:00.000Z", note: "" },
      { certification: "R", type: 4, release_date: "2025-11-07T00:00:00.000Z", note: "Netflix" },
      { certification: "R", type: 5, release_date: "2026-10-27T00:00:00.000Z", note: "" }
    ] }
  ];
  assert.equal(tmdb.pickReleaseDate(frankenstein, "2025-10-17"), "07/11/2025");
});

test("pickReleaseDate sigue prefiriendo el estreno en cines cuando existe", function () {
  const conCines = [
    { iso_3166_1: "US", release_dates: [
      { certification: "", type: 1, release_date: "2021-10-07T00:00:00.000Z" },
      { certification: "PG-13", type: 4, release_date: "2021-10-21T00:00:00.000Z", note: "HBO Max" },
      { certification: "PG-13", type: 3, release_date: "2021-10-22T00:00:00.000Z" }
    ] }
  ];
  assert.equal(tmdb.pickReleaseDate(conCines, "2021-09-15"), "22/10/2021");
});

test("pickReleaseDate ignora el premiere y se va al estreno global", function () {
  const soloPremiere = [
    { iso_3166_1: "US", release_dates: [{ certification: "", type: 1, release_date: "2025-08-30T00:00:00.000Z" }] }
  ];
  assert.equal(tmdb.pickReleaseDate(soloPremiere, "2025-10-17"), "17/10/2025");
});

test("pickReleaseDate ignora el estreno limitado y se va al estreno global", function () {
  const soloLimitado = [
    { iso_3166_1: "US", release_dates: [
      { certification: "", type: 1, release_date: "2025-08-30T00:00:00.000Z" },
      { certification: "R", type: 2, release_date: "2025-10-17T00:00:00.000Z" }
    ] }
  ];
  assert.equal(tmdb.pickReleaseDate(soloLimitado, "2025-12-25"), "25/12/2025");
});

test("pickReleaseDate ordena digital sobre fisico y fisico sobre tv", function () {
  const sinCines = [
    { iso_3166_1: "US", release_dates: [
      { certification: "R", type: 6, release_date: "2026-03-01T00:00:00.000Z" },
      { certification: "R", type: 5, release_date: "2026-02-01T00:00:00.000Z" },
      { certification: "R", type: 4, release_date: "2026-01-01T00:00:00.000Z" }
    ] }
  ];
  assert.equal(tmdb.pickReleaseDate(sinCines, "2025-12-01"), "01/01/2026");
});

test("pickCertification toma la de estados unidos aunque haya una argentina", function () {
  assert.equal(tmdb.pickCertification(RELEASE_DATES), "R");
});

test("pickCertification devuelve guion cuando estados unidos no clasifico la pelicula", function () {
  assert.equal(tmdb.pickCertification([{ iso_3166_1: "AR", release_dates: [{ certification: "+16", type: 3 }] }]), "-");
  assert.equal(tmdb.pickCertification([]), "-");
  assert.equal(tmdb.pickCertification(undefined), "-");
});

test("pickCertification saltea la entrada sin clasificacion y sigue en el mismo pais", function () {
  // caso real de Shutter Island: el estreno en Nueva York viene con certification vacia y el de cines con R
  const conVacia = [
    { iso_3166_1: "US", release_dates: [
      { certification: "", type: 1, release_date: "2010-02-17T00:00:00.000Z" },
      { certification: "R", type: 3, release_date: "2010-02-18T00:00:00.000Z" }
    ] }
  ];
  assert.equal(tmdb.pickCertification(conVacia), "R");
});

const testData = loadScripts(["js/tmdb.js", "js/tmdb-testdata.js"]).tmdbTestData;

test("mapMovie arma el shape completo de una pelicula", function () {
  assert.deepEqual(tmdb.mapMovie(testData.MOVIE), {
    tmdbId: 11324,
    imdbID: "tt1130884",
    title: "Shutter Island",
    releaseDate: "18/02/2010",
    duration: "2h 18min",
    parental: "R",
    genres: "Drama - Thriller - Mystery",
    country: "United States of America",
    actors: ["Leonardo DiCaprio (Teddy Daniels)", "Mark Ruffalo (Chuck Aule)", "Ben Kingsley (Dr. Cawley)", "Max von Sydow (Dr. Naehring)"],
    poster: "https://image.tmdb.org/t/p/w500/nrmXQ0zcZUL8jFLrakWc90IR8z9.jpg",
    imdbLink: "https://www.imdb.com/es/title/tt1130884/"
  });
});

test("mapMovie no inventa imdbRating: ese campo lo completa movie-source con omdb", function () {
  assert.equal("imdbRating" in tmdb.mapMovie(testData.MOVIE), false);
});

test("mapMovie usa el estreno de cines de estados unidos y no el global ni el de prensa", function () {
  // el release_date global es 2010-02-14 y el estreno de prensa en Nueva York es el 17: el que vale es el de cines, el 18
  assert.equal(tmdb.mapMovie(testData.MOVIE).releaseDate, "18/02/2010");
});

test("mapMovie corta el elenco en CAST_LIMIT aunque tmdb mande mas", function () {
  assert.equal(testData.MOVIE.credits.cast.length, 5);
  assert.equal(tmdb.mapMovie(testData.MOVIE).actors.length, tmdb.CAST_LIMIT);
});

test("mapMovie aguanta una pelicula sin imdb id y no arma un link roto", function () {
  const sinImdb = Object.assign({}, testData.MOVIE, { imdb_id: null });
  const mapped = tmdb.mapMovie(sinImdb);
  assert.equal(mapped.imdbID, "");
  assert.equal(mapped.imdbLink, "");
});

test("mapSearchItem deja el año y la portada listos para la lista de resultados", function () {
  const items = testData.SEARCH.results.map(tmdb.mapSearchItem);
  assert.deepEqual(items[0], {
    tmdbId: 11324,
    title: "Shutter Island",
    year: "2010",
    poster: "https://image.tmdb.org/t/p/w500/nrmXQ0zcZUL8jFLrakWc90IR8z9.jpg"
  });
  assert.equal(items[1].year, "-");
  assert.equal(items[1].poster, "");
});

test("buildUrl mete la key, el idioma y los parametros en la query", function () {
  const url = tmdb.buildUrl("/movie/11324", { append_to_response: "credits,release_dates" }, "abc123");
  assert.match(url, /^https:\/\/api\.themoviedb\.org\/3\/movie\/11324\?/);
  assert.match(url, /api_key=abc123/);
  assert.match(url, /language=en-US/);
  assert.match(url, /append_to_response=credits%2Crelease_dates/);
});

test("buildUrl escapa el texto de busqueda", function () {
  const url = tmdb.buildUrl("/search/movie", { query: "shutter island" }, "abc123");
  assert.match(url, /query=shutter\+island/);
});

test("buildUrl no rompe cuando no le pasan parametros extra", function () {
  const url = tmdb.buildUrl("/configuration", undefined, "abc123");
  assert.match(url, /^https:\/\/api\.themoviedb\.org\/3\/configuration\?/);
  assert.match(url, /api_key=abc123/);
});
