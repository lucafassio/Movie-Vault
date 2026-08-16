# Movie Vault

App personal para guardar reviews de peliculas, con una estanteria paternoster 3D como interfaz de la coleccion.

## Language

**Ficha**:
La pagina/tarjeta de una pelicula, compuesta por `js/movie-source.js` a partir de la fuente primaria (TMDB) mas el IMDb rating (OMDb). Es la unica cara que consume el resto de la app.
_Avoid_: detail, card, pagina de pelicula

**IMDb rating**:
Nota 0-10 que aporta OMDb, el unico campo que TMDB no tiene (`vote_average` de TMDB es otro numero, no es el mismo dato). Se pinta en la ficha cuando la promesa de rating resuelve; si OMDb no responde queda en blanco, sin bloquear el resto de la ficha.
_Avoid_: rating, imdbRating, puntaje, score
