// index.html no expone nada por script src (todo va inline a proposito, ver .claude/CLAUDE.md),
// asi que para testear su fisica pura sin arrastrar el IIFE completo (que toca document apenas
// carga) se lee el archivo y se extrae solo el bloque marcado entre los centinelas de abajo
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const MARCA_INICIO = "// ---- fase pura (ver tests/paternoster.test.js): plateState ----";
const MARCA_FIN = "// ---- fin plateState ----";

function loadPlateState() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const inicio = html.indexOf(MARCA_INICIO);
  const fin = html.indexOf(MARCA_FIN);
  if (inicio === -1 || fin === -1) {
    throw new Error("no se encontraron los centinelas de plateState en index.html");
  }
  const bloque = html.slice(inicio, fin);
  const factory = new Function(bloque + "\nreturn plateState;");
  return factory();
}

module.exports = { loadPlateState: loadPlateState };
