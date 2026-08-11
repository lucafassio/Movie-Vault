// une las dos fuentes: tmdb manda en todo y omdb solo completa el imdbRating, que es el unico campo que tmdb no tiene
// es la unica cara que consume la pagina, para que cambiar de fuente no se note mas arriba

window.MV = window.MV || {};

MV.movieSource = (function () {
  // la busqueda es 100% tmdb: no gasta ni una llamada del cupo diario de omdb
  function search(query) {
    return MV.tmdb.search(query);
  }

  // el rating vuelve como promesa aparte y no resuelto adentro del mapped: asi la pagina pinta la ficha con lo de tmdb sin esperar a omdb
  function getMovie(tmdbId) {
    return MV.tmdb.getMovie(tmdbId).then(function (result) {
      const mapped = Object.assign({ imdbRating: null }, result.mapped);
      return {
        mapped: mapped,
        raw: result.raw,
        rating: MV.omdb.getRating(mapped.imdbID)
      };
    });
  }

  return {
    search: search,
    getMovie: getMovie
  };
})();
