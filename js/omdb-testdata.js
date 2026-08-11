// datos para los tests del cliente de omdb: RAW son respuestas crudas de la api, EXPECTED es la coleccion actual como verdad de comparacion
// EXPECTED esta transcripto a mano de js/data.js porque BASE_MOVIES es privado dentro de su IIFE y no lo exporta
// RAW ya no es shape copiado a mano: son capturas reales, tomadas el 2026-08-11 contra la api de omdb con una key valida
// imdbRating e imdbVotes de estas capturas cambian con el tiempo (la comunidad sigue votando) -- ningun test debe compararlos contra la api en vivo, solo contra este snapshot fijo

window.MV = window.MV || {};

MV.omdbTestData = (function () {
  const RAW = {
    movie: {
      Title: "Shutter Island",
      Year: "2010",
      Rated: "R",
      Released: "19 Feb 2010",
      Runtime: "138 min",
      Genre: "Drama, Mystery, Thriller",
      Director: "Martin Scorsese",
      Writer: "Laeta Kalogridis, Dennis Lehane",
      Actors: "Leonardo DiCaprio, Emily Mortimer, Mark Ruffalo",
      Plot: "Two US marshals are sent to a mental institution on an inhospitable island in order to investigate the disappearance of a patient.",
      Language: "English, German",
      Country: "Canada, United States",
      Awards: "11 wins & 66 nominations total",
      Poster: "https://m.media-amazon.com/images/M/MV5BN2FjNWExYzEtY2YzOC00YjNlLTllMTQtNmIwM2Q1YzBhOWM1XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg",
      Ratings: [
        { Source: "Internet Movie Database", Value: "8.2/10" },
        { Source: "Rotten Tomatoes", Value: "69%" },
        { Source: "Metacritic", Value: "63/100" }
      ],
      Metascore: "63",
      imdbRating: "8.2",
      imdbVotes: "1,644,111",
      imdbID: "tt1130884",
      Type: "movie",
      DVD: "N/A",
      BoxOffice: "$128,012,934",
      Production: "N/A",
      Website: "N/A",
      Response: "True"
    },
    seriesMultiSeason: {
      Title: "Stranger Things",
      // el guion de "2016-2025" es un guion largo (en dash, U+2013), no un guion corto -- asi lo manda omdb, no es un typo nuestro
      Year: "2016–2025",
      Rated: "TV-MA",
      Released: "15 Jul 2016",
      Runtime: "51 min",
      Genre: "Drama, Fantasy, Horror",
      Director: "N/A",
      Writer: "Matt Duffer, Ross Duffer",
      Actors: "Millie Bobby Brown, Finn Wolfhard, Winona Ryder",
      Plot: "In 1980s Indiana, a group of young friends witness supernatural forces and secret government exploits. As they search for answers, the children unravel a series of extraordinary mysteries.",
      Language: "English",
      Country: "United States",
      Awards: "Won 12 Primetime Emmys. 122 wins & 335 nominations total",
      Poster: "https://m.media-amazon.com/images/M/MV5BNjRiMTA4NWUtNmE0ZC00NGM0LWJhMDUtZWIzMDM5ZDIzNTg3XkEyXkFqcGc@._V1_QL75_UY562_CR35,0,380,562_.jpg",
      Ratings: [{ Source: "Internet Movie Database", Value: "8.6/10" }],
      Metascore: "N/A",
      imdbRating: "8.6",
      imdbVotes: "1,691,532",
      imdbID: "tt4574334",
      Type: "series",
      totalSeasons: "5",
      Response: "True"
    },
    seriesOneSeason: {
      Title: "Wonder Man",
      // "2026-" tambien es en dash (U+2013), no guion corto -- serie en emision, sin año de cierre
      Year: "2026–",
      Rated: "TV-14",
      Released: "27 Jan 2026",
      Runtime: "N/A",
      Genre: "Action, Adventure, Comedy",
      Director: "N/A",
      Writer: "Destin Daniel Cretton",
      Actors: "Yahya Abdul-Mateen II, Ben Kingsley, X Mayo",
      Plot: "Small-time actor Simon Williams struggles to reckon with his personal life while hiding his super-powers as he tries to land his dream role. Meanwhile, a shady government agent leverages a new friendship in order to save his own job.",
      Language: "English",
      Country: "United States",
      Awards: "N/A",
      Poster: "https://m.media-amazon.com/images/M/MV5BMDk5YzQ3NjQtNzY3MC00NzM3LWE4NzYtZGRkNDQxYjdiZDkyXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg",
      Ratings: [{ Source: "Internet Movie Database", Value: "7.4/10" }],
      Metascore: "N/A",
      imdbRating: "7.4",
      imdbVotes: "31,966",
      imdbID: "tt21066182",
      Type: "series",
      totalSeasons: "1",
      Response: "True"
    },
    seasonOneOfWonderMan: {
      Title: "Wonder Man",
      Season: "1",
      totalSeasons: "1",
      Episodes: [
        // episodio 1 real vino con Released "N/A", el resto con fecha -- no es un hueco nuestro, dejarlo tal cual
        { Title: "Episode #1.1", Released: "N/A", Episode: "1", imdbRating: "N/A", imdbID: "tt21941138" },
        { Title: "Episode #1.2", Released: "2026-01-27", Episode: "2", imdbRating: "N/A", imdbID: "tt27774495" },
        { Title: "Episode #1.3", Released: "2026-01-27", Episode: "3", imdbRating: "N/A", imdbID: "tt31260214" },
        { Title: "Episode #1.4", Released: "2026-01-27", Episode: "4", imdbRating: "N/A", imdbID: "tt29258523" },
        { Title: "Episode #1.5", Released: "2026-01-27", Episode: "5", imdbRating: "N/A", imdbID: "tt31260217" },
        { Title: "Episode #1.6", Released: "2026-01-27", Episode: "6", imdbRating: "N/A", imdbID: "tt31260218" },
        { Title: "Episode #1.7", Released: "2026-01-27", Episode: "7", imdbRating: "N/A", imdbID: "tt27739623" },
        { Title: "Episode #1.8", Released: "2026-01-27", Episode: "8", imdbRating: "N/A", imdbID: "tt27739622" }
      ],
      Response: "True"
    },
    search: {
      Search: [
        { Title: "Dune: Part One", Year: "2021", imdbID: "tt1160419", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BNWIyNmU5MGYtZDZmNi00ZjAwLWJlYjgtZTc0ZGIxMDE4ZGYwXkEyXkFqcGc@._V1_QL75_UY562_CR1,0,380,562_.jpg" },
        { Title: "Dune: Part Two", Year: "2024", imdbID: "tt15239678", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BNTc0YmQxMjEtODI5MC00NjFiLTlkMWUtOGQ5NjFmYWUyZGJhXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
        // esta tercera entrada es armada a mano, no capturada: ningun resultado real de "dune" vino con Poster "N/A" y el caso hay que seguir cubriendolo
        { Title: "Dune", Year: "2000", imdbID: "tt0142032", Type: "series", Poster: "N/A" }
      ],
      // omdb pagina de a 10: totalResults cuenta el universo entero, no lo que trae este Search -- no "corregir" a 3
      totalResults: "103",
      Response: "True"
    },
    notFound: { Response: "False", Error: "Movie not found!" }
  };

  const EXPECTED = [
    { imdbID: "tt1130884", type: "movie", title: "Shutter Island", releaseDate: "11/03/2010", duration: "2h 18min", imdbRating: 8.2, parental: "B15", genres: "Drama - Misterio - Suspenso", country: "Canada", actors: ["Leonardo DiCaprio", "Mark Ruffalo", "Ben Kingsley", "Max von Sydow"] },
    { imdbID: "tt15239678", type: "movie", title: "Dune: Part Two", releaseDate: "01/03/2024", duration: "2h 46min", imdbRating: 8.4, parental: "PG-13", genres: "Action - Adventure - Drama", country: "United States", actors: ["Timothee Chalamet", "Zendaya", "Rebecca Ferguson"] },
    { imdbID: "tt1160419", type: "movie", title: "Dune: Part One", releaseDate: "22/10/2021", duration: "2h 35min", imdbRating: 8.0, parental: "PG-13", genres: "Action - Adventure - Drama", country: "United States", actors: ["Timothee Chalamet", "Rebecca Ferguson", "Zendaya"] },
    { imdbID: "tt21066182", type: "series", title: "Wonder Man", releaseDate: "27/01/2026", duration: "8 eps", imdbRating: 7.6, parental: "TV-14", genres: "Action - Adventure - Comedy", country: "United States", actors: ["Yahya Abdul-Mateen II", "Ben Kingsley", "X Mayo"] },
    { imdbID: "tt2911666", type: "movie", title: "John Wick", releaseDate: "24/10/2014", duration: "1h 41min", imdbRating: 7.5, parental: "R", genres: "Action - Crime - Thriller", country: "United States", actors: ["Keanu Reeves", "Michael Nyqvist", "Alfie Allen"] },
    { imdbID: "tt4574334", type: "series", title: "Stranger Things", releaseDate: "15/07/2016", duration: "5 temp", imdbRating: 8.6, parental: "TV-MA", genres: "Drama - Fantasy - Horror", country: "United States", actors: ["Millie Bobby Brown", "Finn Wolfhard", "Winona Ryder"] },
    { imdbID: "tt8772296", type: "series", title: "Euphoria", releaseDate: "16/06/2019", duration: "3 temp", imdbRating: 8.2, parental: "TV-MA", genres: "Drama", country: "United States", actors: ["Zendaya", "Hunter Schafer", "Jacob Elordi"] },
    { imdbID: "tt0172156", type: "movie", title: "Bad Boys II", releaseDate: "18/07/2003", duration: "2h 27min", imdbRating: 6.6, parental: "R", genres: "Action - Comedy - Crime", country: "United States", actors: ["Martin Lawrence", "Will Smith", "Jordi Molla"] },
    { imdbID: "tt1312221", type: "movie", title: "Frankenstein", releaseDate: "07/11/2025", duration: "2h 29min", imdbRating: 7.5, parental: "R", genres: "Drama - Fantasy - Horror", country: "Mexico", actors: ["Mia Goth", "Burn Gorman", "Charles Dance"] },
    { imdbID: "tt0114369", type: "movie", title: "Se7en", releaseDate: "22/9/1995", duration: "2h 07min", imdbRating: 8.6, parental: "R", genres: "Crime - Drama - Mystery", country: "United States", actors: ["Morgan Freeman", "Brad Pitt", "Kevin Spacey"] }
  ];

  // el pipeline nuevo es solo peliculas: las series quedan en EXPECTED pero fuera de las comparaciones por ahora
  function movies() {
    return EXPECTED.filter(function (movie) {
      return movie.type === "movie";
    });
  }

  return {
    RAW: RAW,
    EXPECTED: EXPECTED,
    movies: movies
  };
})();
