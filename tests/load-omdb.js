// carga js/omdb.js tal cual esta, sin tocarle el estilo de script clasico: lo corremos dentro de un vm con un window falso
// asi el mismo archivo que sirve el browser es el que testeamos, sin ES modules ni bundler

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

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
  // window tiene que ser el propio contexto (como en un browser real window === globalThis)
  // asi "window.MV = ..." tambien deja "MV" como global suelta, que es como esta escrito js/omdb.js
  const context = { URL: URL, URLSearchParams: URLSearchParams, console: console, localStorage: createFakeLocalStorage() };
  context.window = context;
  vm.createContext(context);
  relativePaths.forEach(function (relativePath) {
    const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
    vm.runInContext(source, context, { filename: relativePath });
  });
  return context.window.MV;
}

function loadOmdb() {
  return loadScripts(["js/omdb.js"]).omdb;
}

function loadTestData() {
  return loadScripts(["js/omdb-testdata.js"]).omdbTestData;
}

module.exports = { loadScripts: loadScripts, loadOmdb: loadOmdb, loadTestData: loadTestData };
