// captura real de tmdb del 2026-08-11, recortada a los campos que usa el mapeo: /movie/11324?language=en-US&append_to_response=credits,release_dates
// se dejan tres paises en release_dates a proposito para que la prioridad de US se pruebe contra datos reales y no contra un caso de laboratorio
// el elenco viene con order 0..4 y solo se mapean los primeros CAST_LIMIT, por eso quedan cinco y no cuatro

window.MV = window.MV || {};

MV.tmdbTestData = (function () {
  const MOVIE = {
    id: 11324,
    imdb_id: "tt1130884",
    title: "Shutter Island",
    release_date: "2010-02-14",
    runtime: 138,
    genres: [
      { id: 18, name: "Drama" },
      { id: 53, name: "Thriller" },
      { id: 9648, name: "Mystery" }
    ],
    production_countries: [{ iso_3166_1: "US", name: "United States of America" }],
    poster_path: "/nrmXQ0zcZUL8jFLrakWc90IR8z9.jpg",
    credits: {
      cast: [
        { name: "Leonardo DiCaprio", character: "Teddy Daniels", order: 0 },
        { name: "Mark Ruffalo", character: "Chuck Aule", order: 1 },
        { name: "Ben Kingsley", character: "Dr. Cawley", order: 2 },
        { name: "Max von Sydow", character: "Dr. Naehring", order: 3 },
        { name: "Michelle Williams", character: "Dolores", order: 4 }
      ]
    },
    release_dates: {
      results: [
        { iso_3166_1: "ES", release_dates: [{ certification: "12", type: 3, release_date: "2010-02-14T00:00:00.000Z" }] },
        { iso_3166_1: "US", release_dates: [
          { certification: "", type: 1, release_date: "2010-02-17T00:00:00.000Z", note: "New York City, New York" },
          { certification: "R", type: 3, release_date: "2010-02-18T00:00:00.000Z", note: "" },
          { certification: "", type: 5, release_date: "2010-06-08T00:00:00.000Z", note: "DVD / Blu-ray" }
        ] }
      ]
    }
  };

  const SEARCH = {
    page: 1,
    results: [
      { id: 11324, title: "Shutter Island", release_date: "2010-02-14", poster_path: "/nrmXQ0zcZUL8jFLrakWc90IR8z9.jpg" },
      // esta segunda entrada es armada a mano, no capturada: la busqueda real de "shutter island" trajo un solo resultado y el caso sin portada hay que cubrirlo
      { id: 999999, title: "Sin Portada", release_date: "", poster_path: null }
    ],
    total_results: 1
  };

  return {
    MOVIE: MOVIE,
    SEARCH: SEARCH
  };
})();
