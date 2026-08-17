# Movie Vault

App personal para guardar reviews de peliculas, con una estanteria paternoster 3D como interfaz de la coleccion.

## Language

**Ficha**:
La pagina/tarjeta de una pelicula, compuesta por `js/movie-source.js` a partir de la fuente primaria (TMDB) mas el IMDb rating (OMDb). Es la unica cara que consume el resto de la app.
_Avoid_: detail, card, pagina de pelicula

**IMDb rating**:
Nota 0-10 que aporta OMDb, el unico campo que TMDB no tiene (`vote_average` de TMDB es otro numero, no es el mismo dato). Se pinta en la ficha cuando la promesa de rating resuelve; si OMDb no responde queda en blanco, sin bloquear el resto de la ficha.
_Avoid_: rating, imdbRating, puntaje, score

**Rating pendiente**:
Un imdbID cuyo `MV.omdb.getRating` fallo (sin internet, OMDb caido, sin key) y quedo encolado en `localStorage` (`MV.omdb.getPendingRatings`). Se reintenta solo con el evento `online` del browser (`MV.omdb.retryPendingRatings`), sin prioridad sobre el resto de las llamadas del cupo diario de OMDb. Sale de la cola apenas el reintento resuelve un numero.
_Avoid_: cola de omdb, pending rating, reintento
