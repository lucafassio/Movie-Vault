// plantilla de credenciales: copiar este archivo a js/config.local.js y pegar ahi los valores reales
// js/config.local.js esta en .gitignore, este de ejemplo si se trackea y documenta que keys pide el proyecto
// sin build step no hay proceso que inyecte variables de entorno ni que lea un .env: el config es un script clasico mas, cargado antes que los clientes de api

window.MV = window.MV || {};

MV.config = (function () {
  const CREDENTIALS = {
    TMDB_API_KEY: "",
    TMDB_READ_ACCESS_TOKEN: "",
    OMDB_API_KEY: ""
  };

  // devuelve "" y no undefined para un nombre desconocido, asi el que la usa chequea con un if suelto igual que con getKey() de omdb
  function get(name) {
    const value = CREDENTIALS[name];
    return typeof value === "string" ? value.trim() : "";
  }

  function has(name) {
    return get(name) !== "";
  }

  // los nombres que faltan, para poder avisar en pantalla en vez de fallar recien en la request
  function missing() {
    return Object.keys(CREDENTIALS).filter(function (name) {
      return !has(name);
    });
  }

  return {
    get: get,
    has: has,
    missing: missing
  };
})();
