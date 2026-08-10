const test = require("node:test");
const assert = require("node:assert/strict");
const { loadOmdb } = require("./load-omdb");

const omdb = loadOmdb();

test("parseReleased convierte el formato de omdb a dd/mm/yyyy", function () {
  assert.equal(omdb.parseReleased("11 Mar 2010", "2010"), "11/03/2010");
  assert.equal(omdb.parseReleased("01 Mar 2024", "2024"), "01/03/2024");
  assert.equal(omdb.parseReleased("22 Sep 1995", "1995"), "22/09/1995");
  // released manda cuando esta presente, year no debe pisarlo aunque no coincidan
  assert.equal(omdb.parseReleased("11 Mar 2010", "1999"), "11/03/2010");
  // dia de un solo digito se rellena a dos, el contrato de la coleccion es dd/mm/yyyy estricto
  assert.equal(omdb.parseReleased("1 Mar 2010", "2010"), "01/03/2010");
});

test("parseReleased cae al año suelto cuando omdb no tiene fecha", function () {
  assert.equal(omdb.parseReleased("N/A", "2026"), "2026");
  assert.equal(omdb.parseReleased("N/A", "2016-2025"), "2016");
});

test("parseReleased cae al año cuando la fecha viene en un formato que no reconoce", function () {
  assert.equal(omdb.parseReleased("2010", "2010"), "2010");
  assert.equal(omdb.parseReleased("March 2010", "2010"), "2010");
});

test("parseReleased devuelve guion cuando no hay ni fecha ni año", function () {
  assert.equal(omdb.parseReleased("N/A", "N/A"), "-");
  assert.equal(omdb.parseReleased(undefined, undefined), "-");
});

test("isMissing reconoce el N/A literal que manda omdb y los vacios", function () {
  assert.equal(omdb.isMissing("N/A"), true);
  assert.equal(omdb.isMissing(""), true);
  assert.equal(omdb.isMissing(null), true);
  assert.equal(omdb.isMissing(undefined), true);
  assert.equal(omdb.isMissing("R"), false);
  assert.equal(omdb.isMissing(0), false);
});
