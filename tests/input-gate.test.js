const test = require("node:test");
const assert = require("node:assert/strict");
const { loadInputGate } = require("./load-index");

const inputGate = loadInputGate();

test("inputGate deja pasar el evento cuando la etapa es front", function () {
  assert.equal(inputGate("front"), true);
});

test("inputGate bloquea el evento durante el viaje room->front", function () {
  assert.equal(inputGate("viaje"), false);
});

test("inputGate bloquea el evento en la etapa room", function () {
  assert.equal(inputGate("room"), false);
});
