// index.html no expone nada por script src (todo va inline a proposito, ver .claude/CLAUDE.md),
// asi que para testear su fisica pura sin arrastrar el IIFE completo (que toca document apenas
// carga) se lee el archivo y se extrae solo el bloque marcado entre los centinelas de abajo
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

function loadPureBlock(marcaInicio, marcaFin, nombre) {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const inicio = html.indexOf(marcaInicio);
  const fin = html.indexOf(marcaFin);
  if (inicio === -1 || fin === -1) {
    throw new Error("no se encontraron los centinelas de " + nombre + " en index.html");
  }
  const bloque = html.slice(inicio, fin);
  const factory = new Function(bloque + "\nreturn " + nombre + ";");
  return factory();
}

function loadPlateState() {
  return loadPureBlock(
    "// ---- fase pura (ver tests/paternoster.test.js): plateState ----",
    "// ---- fin plateState ----",
    "plateState"
  );
}

function loadInputGate() {
  return loadPureBlock(
    "// ---- fase pura (ver tests/input-gate.test.js): inputGate ----",
    "// ---- fin inputGate ----",
    "inputGate"
  );
}

module.exports = { loadPlateState: loadPlateState, loadInputGate: loadInputGate };
