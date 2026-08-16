# Movie-Vault

App personal para guardar reviews de peliculas. La interfaz es una habitacion de noche: un escritorio con computadora para agregar peliculas y una estanteria donde cada review vive como una caja de DVD.

## Correr

Es frontend estatico puro, alcanza con cualquier server de archivos:

```bash
python -m http.server 8123
```

y abrir `http://localhost:8123`.

## Estado actual

`index.html` es la app: escena horneada en Blender (habitacion, viaje room->estanteria) con un paternoster de 13 estantes en CSS/DOM. La ficha de cada pelicula sale de TMDB (`js/tmdb.js`) con el puntaje de IMDb via OMDb (`js/omdb.js`), compuestos en `js/movie-source.js`. Buscador, lomos y caja abierta todavia no estan montados en `index.html` (`reference/open-case.js` + `reference/open-case.css` quedan como punto de partida de una version anterior descartada).

Detalle completo en `.claude/CLAUDE.md` y `.claude/rules/`.
