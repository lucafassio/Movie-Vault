const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts } = require("./load-omdb");

// se cargan tmdb.js y omdb.js reales (no solo sus testdata) porque los fixtures se arman
// con sus funciones puras (mapMovie, parseRating) -- asi el test de composicion no vuelve
// a probar el mapeo, que ya esta cubierto en tmdb.test.js y omdb.test.js
function loadMovieSource() {
  return loadScripts(["js/tmdb.js", "js/omdb.js", "js/tmdb-testdata.js", "js/omdb-testdata.js", "js/movie-source.js"]);
}

function buildFakeTmdb(MV, overrides) {
  const mapped = MV.tmdb.mapMovie(MV.tmdbTestData.MOVIE);
  return Object.assign({
    getMovie: function () {
      return Promise.resolve({ mapped: mapped, raw: MV.tmdbTestData.MOVIE });
    },
    search: function () {
      return Promise.resolve([]);
    }
  }, overrides);
}

function buildFakeOmdb(MV, overrides) {
  const rating = MV.omdb.parseRating(MV.omdbTestData.RAW.movie.imdbRating);
  return Object.assign({
    getRating: function () {
      return Promise.resolve(rating);
    }
  }, overrides);
}

test("getMovie compone el mapped de tmdb con imdbRating null como placeholder", function () {
  const MV = loadMovieSource();
  const fakeTmdb = buildFakeTmdb(MV);
  const fakeOmdb = buildFakeOmdb(MV);
  return MV.movieSource.getMovie(11324, { tmdb: fakeTmdb, omdb: fakeOmdb }).then(function (result) {
    assert.equal(result.mapped.title, "Shutter Island");
    assert.equal(result.mapped.imdbRating, null);
    assert.equal(result.raw, MV.tmdbTestData.MOVIE);
  });
});

test("getMovie pasa el imdbID del mapeo de tmdb al pedido de rating de omdb", function () {
  const MV = loadMovieSource();
  let receivedImdbId = null;
  const fakeTmdb = buildFakeTmdb(MV);
  const fakeOmdb = buildFakeOmdb(MV, {
    getRating: function (imdbID) {
      receivedImdbId = imdbID;
      return Promise.resolve(8.2);
    }
  });
  return MV.movieSource.getMovie(11324, { tmdb: fakeTmdb, omdb: fakeOmdb }).then(function (result) {
    return result.rating.then(function (rating) {
      assert.equal(receivedImdbId, "tt1130884");
      assert.equal(rating, 8.2);
    });
  });
});

test("getMovie usa MV.tmdb y MV.omdb cuando no se pasan adapters", function () {
  const MV = loadMovieSource();
  MV.tmdb.getMovie = function () {
    return Promise.resolve({ mapped: { title: "desde MV.tmdb" }, raw: {} });
  };
  MV.omdb.getRating = function () {
    return Promise.resolve(9.9);
  };
  return MV.movieSource.getMovie(1).then(function (result) {
    assert.equal(result.mapped.title, "desde MV.tmdb");
    return result.rating.then(function (rating) {
      assert.equal(rating, 9.9);
    });
  });
});

test("getMovie propaga el rechazo de tmdb sin atraparlo", function () {
  const MV = loadMovieSource();
  const fakeTmdb = buildFakeTmdb(MV, {
    getMovie: function () {
      return Promise.reject(new Error("sin internet"));
    }
  });
  const fakeOmdb = buildFakeOmdb(MV);
  return assert.rejects(
    MV.movieSource.getMovie(11324, { tmdb: fakeTmdb, omdb: fakeOmdb }),
    /sin internet/
  );
});

test("getMovie no atrapa un rechazo de omdb: la responsabilidad de nunca rechazar es de omdb.js", function () {
  const MV = loadMovieSource();
  const fakeTmdb = buildFakeTmdb(MV);
  const fakeOmdb = buildFakeOmdb(MV, {
    getRating: function () {
      return Promise.reject(new Error("omdb caido"));
    }
  });
  return MV.movieSource.getMovie(11324, { tmdb: fakeTmdb, omdb: fakeOmdb }).then(function (result) {
    return assert.rejects(result.rating, /omdb caido/);
  });
});

test("search delega en tmdb.search con el adapter inyectado", function () {
  const MV = loadMovieSource();
  let receivedQuery = null;
  const fakeTmdb = buildFakeTmdb(MV, {
    search: function (query) {
      receivedQuery = query;
      return Promise.resolve([{ tmdbId: 1, title: "match" }]);
    }
  });
  return MV.movieSource.search("shutter", { tmdb: fakeTmdb }).then(function (results) {
    assert.equal(receivedQuery, "shutter");
    assert.deepEqual(results, [{ tmdbId: 1, title: "match" }]);
  });
});

test("search usa MV.tmdb cuando no se pasa adapter", function () {
  const MV = loadMovieSource();
  MV.tmdb.search = function (query) {
    return Promise.resolve([{ tmdbId: 2, title: query }]);
  };
  return MV.movieSource.search("dune").then(function (results) {
    assert.deepEqual(results, [{ tmdbId: 2, title: "dune" }]);
  });
});
