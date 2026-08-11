const test = require("node:test");
const assert = require("node:assert/strict");
const { loadOmdb } = require("./load-omdb");
const { loadTestData } = require("./load-omdb");
const testData = loadTestData();

const omdb = loadOmdb();

test("parseReleased convierte el formato de omdb a dd/mm/yyyy", function () {
  assert.equal(omdb.parseReleased("11 Mar 2010", "2010"), "11/03/2010");
  assert.equal(omdb.parseReleased("01 Mar 2024", "2024"), "01/03/2024");
  assert.equal(omdb.parseReleased("22 Sep 1995", "1995"), "22/09/1995");
  // released manda cuando esta presente, year no debe pisarlo aunque no coincidan
  assert.equal(omdb.parseReleased("11 Mar 2010", "1999"), "11/03/2010");
  // dia de un solo digito se rellena a dos, el contrato de la coleccion es dd/mm/yyyy estricto
  assert.equal(omdb.parseReleased("1 Mar 2010", "2010"), "01/03/2010");
});

test("parseReleased cae al año suelto cuando omdb no tiene fecha", function () {
  assert.equal(omdb.parseReleased("N/A", "2026"), "2026");
  assert.equal(omdb.parseReleased("N/A", "2016-2025"), "2016");
});

test("parseReleased corta el año aunque omdb mande un guion largo", function () {
  assert.equal(omdb.parseReleased("N/A", testData.RAW.seriesMultiSeason.Year), "2016");
  assert.equal(omdb.parseReleased("N/A", testData.RAW.seriesOneSeason.Year), "2026");
});

test("parseReleased cae al año cuando la fecha viene en un formato que no reconoce", function () {
  assert.equal(omdb.parseReleased("2010", "2010"), "2010");
  assert.equal(omdb.parseReleased("March 2010", "2010"), "2010");
});

test("parseReleased devuelve guion cuando no hay ni fecha ni año", function () {
  assert.equal(omdb.parseReleased("N/A", "N/A"), "-");
  assert.equal(omdb.parseReleased(undefined, undefined), "-");
});

test("isMissing reconoce el N/A literal que manda omdb y los vacios", function () {
  assert.equal(omdb.isMissing("N/A"), true);
  assert.equal(omdb.isMissing(""), true);
  assert.equal(omdb.isMissing(null), true);
  assert.equal(omdb.isMissing(undefined), true);
  assert.equal(omdb.isMissing("R"), false);
  assert.equal(omdb.isMissing(0), false);
});

test("parseRuntime pasa los minutos de omdb al formato de la coleccion", function () {
  assert.equal(omdb.parseRuntime("138 min"), "2h 18min");
  assert.equal(omdb.parseRuntime("166 min"), "2h 46min");
  assert.equal(omdb.parseRuntime("101 min"), "1h 41min");
});

test("parseRuntime rellena los minutos con cero a la izquierda", function () {
  assert.equal(omdb.parseRuntime("127 min"), "2h 07min");
});

test("parseRuntime devuelve guion cuando no hay duracion", function () {
  assert.equal(omdb.parseRuntime("N/A"), "-");
  assert.equal(omdb.parseRuntime(undefined), "-");
});

test("parseSeriesDuration cuenta temporadas cuando hay mas de una", function () {
  assert.equal(omdb.parseSeriesDuration("5", 0), "5 temp");
  assert.equal(omdb.parseSeriesDuration("3", 0), "3 temp");
});

test("parseSeriesDuration cuenta episodios cuando la serie tiene una sola temporada", function () {
  assert.equal(omdb.parseSeriesDuration("1", 8), "8 eps");
});

test("parseSeriesDuration cae a temporadas si la temporada unica no trae episodios", function () {
  assert.equal(omdb.parseSeriesDuration("1", 0), "1 temp");
  assert.equal(omdb.parseSeriesDuration("N/A", 0), "-");
});

test("parseGenres cambia las comas de omdb por el separador de la coleccion", function () {
  assert.equal(omdb.parseGenres("Drama, Mystery, Thriller"), "Drama - Mystery - Thriller");
  assert.equal(omdb.parseGenres("Drama"), "Drama");
});

test("parseGenres devuelve guion cuando no hay generos", function () {
  assert.equal(omdb.parseGenres("N/A"), "-");
});

test("parseActors parte la lista de omdb en un array de nombres", function () {
  assert.deepEqual(omdb.parseActors("Keanu Reeves, Michael Nyqvist, Alfie Allen"), ["Keanu Reeves", "Michael Nyqvist", "Alfie Allen"]);
});

test("parseActors devuelve lista vacia cuando no hay elenco", function () {
  assert.deepEqual(omdb.parseActors("N/A"), []);
});

test("parseRating devuelve numero, no string", function () {
  assert.equal(omdb.parseRating("8.2"), 8.2);
  assert.equal(omdb.parseRating("8.0"), 8);
});

test("parseRating devuelve null cuando la pelicula todavia no tiene puntaje", function () {
  assert.equal(omdb.parseRating("N/A"), null);
});

test("imdbLink arma la url en el locale es que usa la coleccion", function () {
  assert.equal(omdb.imdbLink("tt2911666"), "https://www.imdb.com/es/title/tt2911666/");
});

test("imdbLink devuelve string vacio sin id", function () {
  assert.equal(omdb.imdbLink("N/A"), "");
});

test("parseGenres ignora comas colgadas", function () {
  assert.equal(omdb.parseGenres("Drama,"), "Drama");
  assert.equal(omdb.parseGenres("Drama,, Horror"), "Drama - Horror");
});

test("parseActors ignora comas colgadas y no inventa actores vacios", function () {
  assert.deepEqual(omdb.parseActors("Brad Pitt,"), ["Brad Pitt"]);
  assert.deepEqual(omdb.parseActors("Brad Pitt,, Morgan Freeman"), ["Brad Pitt", "Morgan Freeman"]);
});

test("parseRuntime no escribe la hora cuando la duracion no llega a una", function () {
  assert.equal(omdb.parseRuntime("45 min"), "45min");
  assert.equal(omdb.parseRuntime("60 min"), "1h 00min");
});

test("parseRating devuelve null cuando el puntaje no tiene forma de numero", function () {
  assert.equal(omdb.parseRating("8,2"), null);
  assert.equal(omdb.parseRating("ocho"), null);
  assert.equal(omdb.parseRating("8.2/10"), null);
});

test("isMissing trata el espacio en blanco como ausente pero no al cero", function () {
  assert.equal(omdb.isMissing("   "), true);
  assert.equal(omdb.isMissing(" N/A "), true);
  assert.equal(omdb.isMissing(0), false);
  assert.equal(omdb.isMissing(false), false);
});

test("parseSeriesDuration acepta totalSeasons como numero y no solo como string", function () {
  assert.equal(omdb.parseSeriesDuration(5, 0), "5 temp");
  assert.equal(omdb.parseSeriesDuration(1, 8), "8 eps");
});

test("mapTitle arma el shape completo de una pelicula", function () {
  const mapped = omdb.mapTitle(testData.RAW.movie, 0);
  assert.deepEqual(mapped, {
    title: "Shutter Island",
    releaseDate: "19/02/2010",
    duration: "2h 18min",
    imdbRating: 8.2,
    parental: "R",
    genres: "Drama - Mystery - Thriller",
    country: "Canada, United States",
    actors: ["Leonardo DiCaprio", "Emily Mortimer", "Mark Ruffalo"],
    imdbLink: "https://www.imdb.com/es/title/tt1130884/",
    poster: "https://m.media-amazon.com/images/M/MV5BN2FjNWExYzEtY2YzOC00YjNlLTllMTQtNmIwM2Q1YzBhOWM1XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg",
    type: "movie"
  });
});

test("mapTitle mide una serie de varias temporadas en temporadas", function () {
  const mapped = omdb.mapTitle(testData.RAW.seriesMultiSeason, 0);
  assert.equal(mapped.duration, "5 temp");
  assert.equal(mapped.type, "series");
});

test("mapTitle mide una serie de temporada unica en episodios", function () {
  const episodeCount = testData.RAW.seasonOneOfWonderMan.Episodes.length;
  const mapped = omdb.mapTitle(testData.RAW.seriesOneSeason, episodeCount);
  assert.equal(mapped.duration, "8 eps");
});

test("mapTitle ignora el Runtime por episodio de una serie", function () {
  const mapped = omdb.mapTitle(testData.RAW.seriesMultiSeason, 0);
  assert.notEqual(mapped.duration, "51min");
});

test("mapSearchItem deja el poster vacio cuando omdb manda N/A", function () {
  const items = testData.RAW.search.Search.map(omdb.mapSearchItem);
  assert.equal(items[0].title, "Dune: Part One");
  assert.equal(items[0].poster, "https://m.media-amazon.com/images/M/MV5BNWIyNmU5MGYtZDZmNi00ZjAwLWJlYjgtZTc0ZGIxMDE4ZGYwXkEyXkFqcGc@._V1_QL75_UY562_CR1,0,380,562_.jpg");
  assert.equal(items[1].imdbID, "tt15239678");
  assert.equal(items[2].poster, "");
});

test("EXPECTED cubre las diez peliculas de la coleccion", function () {
  assert.equal(testData.EXPECTED.length, 10);
  testData.EXPECTED.forEach(function (movie) {
    assert.match(movie.imdbID, /^tt\d+$/);
  });
});

test("buildUrl mete la key y los parametros en la query", function () {
  const url = omdb.buildUrl({ i: "tt1130884", plot: "short" }, "abc123");
  assert.match(url, /^https:\/\/www\.omdbapi\.com\/\?/);
  assert.match(url, /apikey=abc123/);
  assert.match(url, /i=tt1130884/);
  assert.match(url, /plot=short/);
});

test("buildUrl escapa el texto de busqueda", function () {
  const url = omdb.buildUrl({ s: "shutter island" }, "abc123");
  assert.match(url, /s=shutter\+island/);
});

test("parseCache descarta un cache corrupto en vez de tumbar la busqueda", function () {
  assert.deepEqual(omdb.parseCache("{ esto no es json"), {});
  assert.deepEqual(omdb.parseCache("null"), {});
  assert.deepEqual(omdb.parseCache("5"), {});
  assert.deepEqual(omdb.parseCache(null), {});
  assert.deepEqual(omdb.parseCache(""), {});
});

test("parseCache devuelve el cache cuando el json esta sano", function () {
  assert.deepEqual(omdb.parseCache('{"i:tt1130884":{"Title":"Shutter Island"}}'), { "i:tt1130884": { Title: "Shutter Island" } });
});

test("setKey y getKey guardan la key sin espacios sobrantes", function () {
  const fresh = loadOmdb();
  assert.equal(fresh.getKey(), "");
  fresh.setKey("  abc123  ");
  assert.equal(fresh.getKey(), "abc123");
});

test("clearCache vacia el cache guardado", function () {
  const fresh = loadOmdb();
  fresh.setKey("abc123");
  assert.deepEqual(fresh.readCache(), {});
  fresh.writeCache({ "i:tt0114369": { Title: "Se7en" } });
  assert.deepEqual(fresh.readCache(), { "i:tt0114369": { Title: "Se7en" } });
  fresh.clearCache();
  assert.deepEqual(fresh.readCache(), {});
  // la key no se toca al limpiar el cache, son dos cosas distintas
  assert.equal(fresh.getKey(), "abc123");
});
