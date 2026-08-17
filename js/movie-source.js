// une las dos fuentes: tmdb manda en todo y omdb solo completa el imdbRating, que es el unico campo que tmdb no tiene
// es la unica cara que consume la pagina, para que cambiar de fuente no se note mas arriba

window.MV = window.MV || {};

MV.movieSource = (function () {
  // adapters inyectables por parametro, default a los clientes reales: prod sigue llamando
  // search(query) y getMovie(id) sin el segundo argumento, el seam solo lo usan los tests
  // (ver tests/movie-source.test.js), que pisan tmdb/omdb con fixtures y no pegan a la red

  // la busqueda es 100% tmdb: no gasta ni una llamada del cupo diario de omdb
  function search(query, adapters) {
    const tmdb = (adapters || {}).tmdb || MV.tmdb;
    return tmdb.search(query);
  }

  // el rating vuelve como promesa aparte y no resuelto adentro del mapped: asi la pagina pinta la ficha con lo de tmdb sin esperar a omdb
  // si tmdb rechaza (sin internet, id invalido) el rechazo se propaga tal cual, sin ficha no hay pagina
  // si omdb rechaza o no responde, el rating queda en null -- esa garantia la da MV.omdb, este modulo no vuelve a atraparla
  function getMovie(tmdbId, adapters) {
    const tmdb = (adapters || {}).tmdb || MV.tmdb;
    const omdb = (adapters || {}).omdb || MV.omdb;
    return tmdb.getMovie(tmdbId).then(function (result) {
      const mapped = Object.assign({ imdbRating: null }, result.mapped);
      return {
        mapped: mapped,
        raw: result.raw,
        rating: omdb.getRating(mapped.imdbID)
      };
    });
  }

  return {
    search: search,
    getMovie: getMovie
  };
})();
