# Movie-Vault

App personal para guardar reviews de peliculas. La interfaz es una habitacion de noche: un escritorio con computadora para agregar peliculas y una estanteria donde cada review vive como una caja de DVD.

## Correr

Es frontend estatico puro, alcanza con cualquier server de archivos:

```bash
python -m http.server 8123
```

y abrir `http://localhost:8123`.

## Estado actual

Etapa visual: el buscador de la computadora opera sobre un dataset mock embebido (`js/data.js`, convertido de los CSVs de `data/`). La API real de IMDB se enchufa despues reemplazando `searchMovies` sin cambiar la firma. Las peliculas agregadas persisten en `localStorage`.

## Interaccion

- Click en la computadora: buscar una pelicula, "comprarla" y completar fecha, puntaje y review. La caja vuela a la estanteria.
- Click en la estanteria y despues en un lomo: la caja sale del estante y se abre mostrando disco e info completa.
- `esc` o el boton volver retroceden un nivel.
