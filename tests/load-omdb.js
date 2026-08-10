// carga los scripts clasicos de js/ tal cual estan, sin tocarles el estilo ni convertirlos a modulos
// corren en el realm del proceso y no en uno nuevo de vm a proposito: un array creado dentro de un vm no es Array del host y assert/strict falla por identidad de prototipo aunque el contenido sea igual
// ojo: al correr en el realm del host, fetch es el fetch real de node, asi que no escribir tests que llamen a search ni a getTitle

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

// doble de test de localStorage, no un polyfill: alcanza para probar el guard de json corrupto de la Task 5
// se crea una instancia nueva por cada loadScripts para que no se filtre estado entre tests
function createFakeLocalStorage() {
  const store = new Map();
  return {
    getItem: function (key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem: function (key, value) {
      store.set(key, String(value));
    },
    removeItem: function (key) {
      store.delete(key);
    }
  };
}

function loadScripts(relativePaths) {
  // window tiene que ser el propio sandbox porque en un browser real window === globalThis
  // el with(window) hace que la "MV" suelta resuelva contra el sandbox, que es como esta escrito js/omdb.js
  const sandbox = { localStorage: createFakeLocalStorage() };
  sandbox.window = sandbox;
  relativePaths.forEach(function (relativePath) {
    const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
    const factory = new Function("window", "localStorage", "with (window) {\n" + source + "\n}");
    factory(sandbox, sandbox.localStorage);
  });
  return sandbox.MV;
}

function loadOmdb() {
  return loadScripts(["js/omdb.js"]).omdb;
}

function loadTestData() {
  return loadScripts(["js/omdb-testdata.js"]).omdbTestData;
}

module.exports = { loadScripts: loadScripts, loadOmdb: loadOmdb, loadTestData: loadTestData };
