const test = require("node:test");
const assert = require("node:assert/strict");
const { loadPlateState } = require("./load-index");

const plateState = loadPlateState();

function closeTo(actual, expected, tol) {
  assert.ok(Math.abs(actual - expected) < (tol || 1e-6), actual + " no esta cerca de " + expected);
}

test("plateState devuelve dentro=false cuando la placa esta fuera del tramo visible", function () {
  const st = plateState(0, 2.0);
  assert.equal(st.dentro, false);
});

test("plateState en el centro del tramo recto no gira ni tiene sombra", function () {
  const st = plateState(0, 0);
  assert.equal(st.dentro, true);
  assert.equal(st.giro, 0);
  assert.equal(st.girando, false);
  assert.equal(st.som, 0);
  assert.equal(st.somAbajo, false);
  assert.equal(st.origen, "50% 50%");
  closeTo(st.top, -0.002222, 1e-3);
});

test("plateState pivota en el canto de arriba al entrar por el limite superior", function () {
  const st = plateState(0, -0.05);
  assert.equal(st.dentro, true);
  assert.equal(st.origen, "50% 0%");
  assert.equal(st.girando, true);
  closeTo(st.giro, 21.220659, 1e-4);
  assert.equal(st.som, 0);
});

test("plateState arranca la sombra de abajo antes del arco, sin girar todavia", function () {
  const st = plateState(0, 1.27);
  assert.equal(st.dentro, true);
  assert.equal(st.giro, 0);
  assert.equal(st.girando, false);
  assert.equal(st.somAbajo, true);
  closeTo(st.som, 0.173538, 1e-4);
});

test("plateState pivota en el canto de abajo y satura la sombra al pasar el limite inferior", function () {
  const st = plateState(0, 1.43);
  assert.equal(st.dentro, true);
  assert.equal(st.origen, "50% 100%");
  assert.equal(st.girando, true);
  closeTo(st.giro, -21.220659, 1e-4);
  assert.equal(st.somAbajo, true);
  closeTo(st.som, 0.715513, 1e-4);
});
