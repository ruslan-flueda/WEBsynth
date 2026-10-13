const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { test } = require("node:test");
const { loadApp } = require("./helpers/load-app.cjs");

const { app } = loadApp();
const toTuple = ({ step, sound, note, duration, velocity }) => [step, sound, note, duration, velocity];

// Captured before the refactor: guards every original note, rhythm and velocity.
const originalHash = "d76b023d2191212825d3a332a5268e32570a889cc5ab35eeec35f7769cc9c471";

test("all 21 musical patterns match the pre-refactor composition", () => {
  const tuples = Object.fromEntries(Object.entries(app.patterns).map(([id, variations]) => [
    id, variations.map((bars) => bars && bars.map((events) => events.map(toTuple))),
  ]));
  assert.equal(createHash("sha256").update(JSON.stringify(tuples)).digest("hex"), originalHash);
});

test("every lane has valid controls, three four-bar patterns and supported voices", () => {
  const dMinor = new Set([0, 2, 4, 5, 7, 9, 10]);
  assert.equal(app.lanes.length, 7);
  for (const lane of app.lanes) {
    assert.equal(lane.controls.length, 4);
    assert.equal(new Set(lane.controls.map(({ key }) => key)).size, 4);
    assert.equal(app.patterns[lane.id].length, 4);
    for (const control of lane.controls) assert.ok(control.initial >= 0 && control.initial <= 100);
    for (const bars of app.patterns[lane.id].slice(1)) {
      assert.equal(bars.length, 4);
      for (const events of bars) {
        for (const event of events) {
          assert.ok(app.voices[event.sound], event.sound);
          assert.ok(Number.isInteger(event.step) && event.step >= 0 && event.step < 16);
          assert.ok(event.duration > 0 && event.step + event.duration <= 16);
          assert.ok(event.velocity > 0 && event.velocity <= 1);
          const notes = event.note === null ? [] : [].concat(event.note);
          for (const pitch of notes) assert.ok(dMinor.has(pitch % 12), `${lane.id}: ${pitch}`);
        }
      }
    }
  }
});

test("shuffle is repeatable, bounded and preserves all musical material", () => {
  const original = JSON.stringify(app.patterns);
  let changed = false;
  for (const { id } of app.lanes) {
    for (let variation = 1; variation <= 3; variation += 1) {
      for (let bar = 0; bar < 4; bar += 1) {
        const events = app.eventsFor(id, variation, bar);
        const material = (values) => JSON.stringify(values.map((event) => toTuple(event).slice(1)).sort());
        for (const seed of [1, 2, 3, 19]) {
          const shuffled = app.eventsFor(id, variation, bar, seed);
          assert.equal(material(shuffled), material(events));
          assert.equal(JSON.stringify(shuffled), JSON.stringify(app.eventsFor(id, variation, bar, seed)));
          for (const event of shuffled) assert.ok(event.step >= 0 && event.step + event.duration <= 16);
          if (JSON.stringify(shuffled) !== JSON.stringify(events)) changed = true;
        }
      }
    }
  }
  assert.ok(changed);
  assert.equal(JSON.stringify(app.patterns), original);
});
