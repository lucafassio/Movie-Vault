// datos para los tests del cliente de omdb: RAW son respuestas crudas de la api, EXPECTED es la coleccion actual como verdad de comparacion
// EXPECTED esta transcripto a mano de js/data.js porque BASE_MOVIES es privado dentro de su IIFE y no lo exporta

window.MV = window.MV || {};

MV.omdbTestData = (function () {
  const RAW = {
    movie: {
      Title: "Shutter Island",
      Year: "2010",
      Rated: "R",
      Released: "19 Feb 2010",
      Runtime: "138 min",
      Genre: "Mystery, Thriller",
      Director: "Martin Scorsese",
      Writer: "Laeta Kalogridis, Dennis Lehane",
      Actors: "Leonardo DiCaprio, Emily Mortimer, Mark Ruffalo",
      Plot: "Two US marshals are sent to a mental institution on an inhospitable island.",
      Language: "English",
      Country: "United States",
      Awards: "11 wins & 66 nominations total",
      Poster: "https://m.media-amazon.com/images/M/shutter.jpg",
      Ratings: [{ Source: "Internet Movie Database", Value: "8.2/10" }],
      Metascore: "63",
      imdbRating: "8.2",
      imdbVotes: "1,400,000",
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
      Year: "2016-2025",
      Rated: "TV-14",
      Released: "15 Jul 2016",
      Runtime: "51 min",
      Genre: "Drama, Fantasy, Horror",
      Actors: "Millie Bobby Brown, Finn Wolfhard, Winona Ryder",
      Country: "United States",
      Poster: "https://m.media-amazon.com/images/M/stranger.jpg",
      imdbRating: "8.6",
      imdbID: "tt4574334",
      Type: "series",
      totalSeasons: "5",
      Response: "True"
    },
    seriesOneSeason: {
      Title: "Wonder Man",
      Year: "2026-",
      Rated: "TV-14",
      Released: "27 Jan 2026",
      Runtime: "N/A",
      Genre: "Action, Adventure, Comedy",
      Actors: "Yahya Abdul-Mateen II, Ben Kingsley, X Mayo",
      Country: "United States",
      Poster: "https://m.media-amazon.com/images/M/wonderman.jpg",
      imdbRating: "7.6",
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
        { Title: "Episode 1", Episode: "1", imdbID: "tt00000001" },
        { Title: "Episode 2", Episode: "2", imdbID: "tt00000002" },
        { Title: "Episode 3", Episode: "3", imdbID: "tt00000003" },
        { Title: "Episode 4", Episode: "4", imdbID: "tt00000004" },
        { Title: "Episode 5", Episode: "5", imdbID: "tt00000005" },
        { Title: "Episode 6", Episode: "6", imdbID: "tt00000006" },
        { Title: "Episode 7", Episode: "7", imdbID: "tt00000007" },
        { Title: "Episode 8", Episode: "8", imdbID: "tt00000008" }
      ],
      Response: "True"
    },
    search: {
      Search: [
        { Title: "Dune: Part One", Year: "2021", imdbID: "tt1160419", Type: "movie", Poster: "https://m.media-amazon.com/images/M/dune1.jpg" },
        { Title: "Dune: Part Two", Year: "2024", imdbID: "tt15239678", Type: "movie", Poster: "N/A" }
      ],
      totalResults: "2",
      Response: "True"
    },
    notFound: { Response: "False", Error: "Movie not found!" }
  };

  const EXPECTED = [
    { imdbID: "tt1130884", title: "Shutter Island", releaseDate: "11/03/2010", duration: "2h 18min", imdbRating: 8.2, parental: "B15", genres: "Drama - Misterio - Suspenso", country: "Canada", actors: ["Leonardo DiCaprio", "Mark Ruffalo", "Ben Kingsley", "Max von Sydow"] },
    { imdbID: "tt15239678", title: "Dune: Part Two", releaseDate: "01/03/2024", duration: "2h 46min", imdbRating: 8.4, parental: "PG-13", genres: "Action - Adventure - Drama", country: "United States", actors: ["Timothee Chalamet", "Zendaya", "Rebecca Ferguson"] },
    { imdbID: "tt1160419", title: "Dune: Part One", releaseDate: "22/10/2021", duration: "2h 35min", imdbRating: 8.0, parental: "PG-13", genres: "Action - Adventure - Drama", country: "United States", actors: ["Timothee Chalamet", "Rebecca Ferguson", "Zendaya"] },
    { imdbID: "tt21066182", title: "Wonder Man", releaseDate: "27/01/2026", duration: "8 eps", imdbRating: 7.6, parental: "TV-14", genres: "Action - Adventure - Comedy", country: "United States", actors: ["Yahya Abdul-Mateen II", "Ben Kingsley", "X Mayo"] },
    { imdbID: "tt2911666", title: "John Wick", releaseDate: "24/10/2014", duration: "1h 41min", imdbRating: 7.5, parental: "R", genres: "Action - Crime - Thriller", country: "United States", actors: ["Keanu Reeves", "Michael Nyqvist", "Alfie Allen"] },
    { imdbID: "tt4574334", title: "Stranger Things", releaseDate: "15/07/2016", duration: "5 temp", imdbRating: 8.6, parental: "TV-MA", genres: "Drama - Fantasy - Horror", country: "United States", actors: ["Millie Bobby Brown", "Finn Wolfhard", "Winona Ryder"] },
    { imdbID: "tt8772296", title: "Euphoria", releaseDate: "16/06/2019", duration: "3 temp", imdbRating: 8.2, parental: "TV-MA", genres: "Drama", country: "United States", actors: ["Zendaya", "Hunter Schafer", "Jacob Elordi"] },
    { imdbID: "tt0172156", title: "Bad Boys II", releaseDate: "18/07/2003", duration: "2h 27min", imdbRating: 6.6, parental: "R", genres: "Action - Comedy - Crime", country: "United States", actors: ["Martin Lawrence", "Will Smith", "Jordi Molla"] },
    { imdbID: "tt1312221", title: "Frankenstein", releaseDate: "07/11/2025", duration: "2h 29min", imdbRating: 7.5, parental: "R", genres: "Drama - Fantasy - Horror", country: "Mexico", actors: ["Mia Goth", "Burn Gorman", "Charles Dance"] },
    { imdbID: "tt0114369", title: "Se7en", releaseDate: "22/9/1995", duration: "2h 07min", imdbRating: 8.6, parental: "R", genres: "Crime - Drama - Mystery", country: "United States", actors: ["Morgan Freeman", "Brad Pitt", "Kevin Spacey"] }
  ];

  return {
    RAW: RAW,
    EXPECTED: EXPECTED
  };
})();
