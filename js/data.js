// dataset de prueba convertido de los csvs de data/, se preservan los quirks de fechas y duraciones como strings porque asi vienen del origen
// cuando exista la api real de imdb este archivo se reemplaza por el cliente http, la firma de searchMovies no cambia

window.MV = window.MV || {};

MV.data = (function () {
  const BASE_MOVIES = [
    {
      title: "Shutter Island",
      releaseDate: "11/03/2010",
      duration: "2h 18min",
      imdbRating: 8.2,
      parental: "B15",
      genres: "Drama - Misterio - Suspenso",
      country: "Canada",
      actors: [
        "Leonardo DiCaprio (Teddy Daniels)",
        "Mark Ruffalo (Chuck Aule)",
        "Ben Kingsley (Dr. Cawley)",
        "Max von Sydow (Dr. Naehring)"
      ],
      imdbLink: "https://www.imdb.com/es/title/tt1130884/?ref_=ls_i_1",
      watchedDate: "-",
      personalRating: 9.0,
      review: "No es el mejor papel de Di Caprio y Ruffalo lo hace muy bien pero la tension y lo bien que maneja el suspenso esta pelicula lo vi en pocas a lo largo de mi vida. La historia es muy buena pero ademas el ambiente que la envuelve le sube muchos puntos"
    },
    {
      title: "Dune: Part Two",
      releaseDate: "01/03/2024",
      duration: "2h 46min",
      imdbRating: 8.4,
      parental: "PG-13",
      genres: "Action - Adventure - Drama",
      country: "United States",
      actors: ["Timothee Chalamet", "Zendaya", "Rebecca Ferguson"],
      imdbLink: "https://www.imdb.com/es/title/tt15239678/",
      watchedDate: "20/02/2026",
      personalRating: 8.4,
      review: "Misma contra que la parte uno, comienza medio lenta pero al menos entre con mas contexto a esta. La accion que propone esta es mas dinamica y por eso levanta mucho mas que la primera que esta muy centrada en la politica del planeta, esta se encarga mas en desarrollar a los personajes importantes y mueve mas la historia. Sume una pelicula a la lista de las que vere en el cine"
    },
    {
      title: "Dune: Part One",
      releaseDate: "22/10/2021",
      duration: "2h 35min",
      imdbRating: 8.0,
      parental: "PG-13",
      genres: "Action - Adventure - Drama",
      country: "United States",
      actors: ["Timothee Chalamet", "Rebecca Ferguson", "Zendaya"],
      imdbLink: "https://www.imdb.com/es/title/tt1160419/",
      watchedDate: "19/02/2026",
      personalRating: 7.7,
      review: "Fue como ver Star Wars sin saber nada de lo que pasa. Mi recomendacion si no conoces la historia es al principio no trates de enteder a cada personaje ni quien es cada uno, solo un par son los picantes que tenez que conocer y se hacen notar. Se nota que es una Parte Uno porque es como que toda la pelicula se siente como una introduccion, igualmente me gusto mucho siento que aunque la primera mitad cuesta mucho seguirla, al final te das cuenta que mucho de lo que tratabas de explicarte no es tan relevante y te deja bien claro que es lo que tenes que prestar atencion"
    },
    {
      title: "Wonder Man",
      releaseDate: "27/01/2026",
      duration: "8 eps",
      imdbRating: 7.6,
      parental: "TV-14",
      genres: "Action - Adventure - Comedy",
      country: "United States",
      actors: ["Yahya Abdul-Mateen II", "Ben Kingsley", "X Mayo"],
      imdbLink: "https://www.imdb.com/es/title/tt21066182/",
      watchedDate: "29/01/2026",
      personalRating: 8.0,
      review: "Totalmente distinto a lo que me esperaba, es muy buena. No es una serie comun de Marvel, es mas tranquila y filosofica, me encanto"
    },
    {
      title: "John Wick",
      releaseDate: "24/10/2014",
      duration: "1h 41min",
      imdbRating: 7.5,
      parental: "R",
      genres: "Action - Crime - Thriller",
      country: "United States",
      actors: ["Keanu Reeves", "Michael Nyqvist", "Alfie Allen"],
      imdbLink: "https://www.imdb.com/es/title/tt2911666/",
      watchedDate: "04/01/2026",
      personalRating: 5.0,
      review: "Jhon Wick es un personajazo y esta buena la accion pero me la esperaba mejor. Decepciono bastante la verdad, muy aburrida"
    },
    {
      title: "Stranger Things",
      releaseDate: "15/07/2016",
      duration: "5 temp",
      imdbRating: 8.6,
      parental: "TV-MA",
      genres: "Drama - Fantasy - Horror",
      country: "United States",
      actors: ["Millie Bobby Brown", "Finn Wolfhard", "Winona Ryder"],
      imdbLink: "https://www.imdb.com/es/title/tt4574334/",
      watchedDate: "2026",
      personalRating: 7.9,
      review: "Es muy entretenida pero hay partes donde siento que fuerzan el guion a seguir un camino que no tiene mucho sentido. Igualmente Hopper goat"
    },
    {
      title: "Euphoria",
      releaseDate: "16/06/2019",
      duration: "3 temp",
      imdbRating: 8.2,
      parental: "TV-MA",
      genres: "Drama",
      country: "United States",
      actors: ["Zendaya", "Hunter Schafer", "Jacob Elordi"],
      imdbLink: "https://www.imdb.com/es/title/tt8772296/",
      watchedDate: "2026",
      personalRating: 3.7,
      review: "No entiendo la obsesion con esta serie, posta. Lo unico rescatable es lo buena que esta Sydney Sweeney. Despues es solo un monton de escenas de sexo y boludeces, ni siquiera pude seguir el hilo si es que hay alguna trama. Me sorprendio que es como un Elite pero Yankee, sin una historia interesante y Casey no le llega ni a la uña a Ester Exposito, no sabia que se podia meter mas drogas y sexo en menos tiempo. La deje en la primer temporada"
    },
    {
      title: "Bad Boys II",
      releaseDate: "18/07/2003",
      duration: "2h 27min",
      imdbRating: 6.6,
      parental: "R",
      genres: "Action - Comedy - Crime",
      country: "United States",
      actors: ["Martin Lawrence", "Will Smith", "Jordi Molla"],
      imdbLink: "https://www.imdb.com/es/title/tt0172156/",
      watchedDate: "29/11/2025",
      personalRating: 7.0,
      review: "Es un estallo"
    },
    {
      title: "Frankenstein",
      releaseDate: "07/11/2025",
      duration: "2h 29min",
      imdbRating: 7.5,
      parental: "R",
      genres: "Drama - Fantasy - Horror",
      country: "Mexico",
      actors: ["Mia Goth", "Burn Gorman", "Charles Dance"],
      imdbLink: "https://www.imdb.com/es/title/tt1312221/",
      watchedDate: "14/11/2025",
      personalRating: 8.4,
      review: "Supero altamente mis expectativas. Es muy explicita, lo cual es algo bueno, asi tenia que ser. Maneja muy bien el drama en todo momento tanto para los dos puntos de vista que presenta y lo acompaña con un mensaje buenisimo de fondo"
    },
    {
      title: "Se7en",
      releaseDate: "22/9/1995",
      duration: "2h 07min",
      imdbRating: 8.6,
      parental: "R",
      genres: "Crime - Drama - Mystery",
      country: "United States",
      actors: ["Morgan Freeman", "Brad Pitt", "Kevin Spacey"],
      imdbLink: "https://www.imdb.com/es/title/tt0114369/",
      watchedDate: "13/11/2025",
      personalRating: 8.5,
      review: "Ya habia leido el libro pero no puedo bajarla por saber toda la historia, la tension se siente igual a pesar de claramente no haber podido vivir con el suspenso de la pelicula. Aun asi, es un clasico, la historia es muy buena y el misterio mezclado con el juego de los pecados capitales esta muy bien elaborado"
    }
  ];

  const STORAGE_KEY = "movievault.added";

  // estos titulos arrancan fuera de la estanteria para poder demostrar el flujo de compra desde la computadora
  const NOT_ON_SHELF = new Set(["Wonder Man", "Bad Boys II"]);

  function loadAdded() {
    // fallback a lista vacia porque localStorage puede venir corrupto o vacio
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  }

  function saveAdded(addedMovies) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addedMovies));
  }

  function getCollection() {
    // la coleccion visible es la base sin los titulos comprables mas los agregados del usuario, la base nunca se persiste
    const shelfBase = BASE_MOVIES.filter(function (movie) {
      return !NOT_ON_SHELF.has(movie.title);
    });
    return shelfBase.concat(loadAdded());
  }

  function addMovie(movie) {
    const addedMovies = loadAdded();
    addedMovies.push(movie);
    saveAdded(addedMovies);
  }

  function searchMovies(query) {
    // mock de la api de imdb, async a proposito para que el swap por la api real no cambie la firma
    const normalized = query.trim().toLowerCase();
    return new Promise(function (resolve) {
      setTimeout(function () {
        if (!normalized) {
          resolve([]);
          return;
        }
        const inCollection = new Set(getCollection().map(function (m) { return m.title; }));
        const results = BASE_MOVIES.filter(function (movie) {
          return movie.title.toLowerCase().includes(normalized);
        }).map(function (movie) {
          return Object.assign({}, movie, { alreadyOwned: inCollection.has(movie.title) });
        });
        resolve(results);
      }, 350);
    });
  }

  return {
    getCollection: getCollection,
    addMovie: addMovie,
    searchMovies: searchMovies
  };
})();
