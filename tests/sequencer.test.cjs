const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadApp } = require("./helpers/load-app.cjs");

function setup() {
  const { app, timers } = loadApp();
  const engine = {
    context: { currentTime: 0 }, calls: [], events: [],
    async init() {}, start() {}, stop() {}, setBpm(value) { this.bpm = value; },
    setSolo(value) { this.soloId = value; },
    setChannel(id, on, time) { this.calls.push({ id, on, time }); },
    trigger(id, event, time) { this.events.push({ id, event, time }); },
  };
  const sequencer = new app.Sequencer(engine);
  const scheduleOne = () => {
    engine.context.currentTime = sequencer.nextTime - 0.05;
    sequencer.tick();
  };
  return { app, engine, sequencer, timers, scheduleOne };
}

test("pattern and shuffle changes land on the next bar with independent pending states", async () => {
  const { engine, sequencer, scheduleOne } = setup();
  await sequencer.start();
  assert.equal(sequencer.queue.length, 1);
  sequencer.select("melody", 3);
  sequencer.shuffle("bells");
  assert.ok(sequencer.isPending("melody"));
  assert.equal(sequencer.isShufflePending("melody"), false);
  assert.equal(sequencer.isPending("bells"), false);
  for (let step = 1; step < 16; step += 1) {
    scheduleOne();
    assert.equal(sequencer.active.melody, 0);
    assert.equal(sequencer.shuffleSeeds.bells, 0);
  }
  scheduleOne();
  assert.equal(sequencer.active.melody, 3);
  assert.equal(sequencer.shuffleSeeds.bells, 1);
  assert.ok(sequencer.isPending("melody"));
  assert.equal(sequencer.isShufflePending("melody"), false);
  engine.context.currentTime = sequencer.scheduledPatterns.melody;
  sequencer.draw();
  assert.equal(sequencer.isPending("melody"), false);
  assert.equal(sequencer.playhead.bar, 1);
});

test("repeat clicks cancel pending choices; Stop commits remaining choices", async () => {
  const { sequencer, timers } = setup();
  await sequencer.start();
  sequencer.select("melody", 2);
  sequencer.select("melody", 2);
  assert.equal(sequencer.requested("melody"), 0);
  sequencer.shuffle("bells");
  sequencer.shuffle("bells");
  assert.equal(sequencer.requestedShuffle("bells"), 0);
  sequencer.select("bass", 2);
  sequencer.shuffle("bass");
  sequencer.stop();
  assert.equal(sequencer.active.bass, 2);
  assert.ok(sequencer.shuffleSeeds.bass > 0);
  assert.equal(timers.size, 0);
  await sequencer.start();
  assert.equal(timers.size, 1);
  sequencer.stop();
});

test("Solo enables a silent lane and keeps other pattern selections", async () => {
  const { engine, sequencer } = setup();
  sequencer.select("bass", 2);
  await sequencer.start();
  sequencer.select("winds", 3);
  sequencer.solo("winds");
  assert.equal(sequencer.active.winds, 3);
  assert.equal(sequencer.active.bass, 2);
  assert.equal(sequencer.soloId, "winds");
  assert.equal(engine.soloId, "winds");
  sequencer.solo("winds");
  assert.equal(engine.soloId, null);
  assert.equal(sequencer.active.bass, 2);
});

test("tempo belongs to each sequencer and changes subsequent scheduling intervals", async () => {
  const { app, engine, sequencer, scheduleOne } = setup();
  const other = new app.Sequencer(engine);
  sequencer.setBpm(132);
  assert.equal(other.bpm, 110);
  assert.equal(engine.bpm, 132);
  for (const invalid of [64, 181, NaN, "abc", 120.5]) assert.equal(sequencer.setBpm(invalid), 132);
  await sequencer.start();
  const next = sequencer.nextTime;
  sequencer.setBpm(180);
  scheduleOne();
  assert.ok(Math.abs(sequencer.nextTime - next - 60 / 180 / 4) < 1e-9);
});

test("Stop during audio initialization cancels the pending start", async () => {
  const { engine, sequencer, timers } = setup();
  let resume;
  engine.init = () => new Promise((resolve) => { resume = resolve; });
  const start = sequencer.start();
  sequencer.stop();
  resume();
  await start;
  assert.equal(sequencer.running, false);
  assert.equal(timers.size, 0);
});

test("a delayed timer recovers without a burst of obsolete notes", async () => {
  const { engine, sequencer } = setup();
  sequencer.select("drums", 1);
  await sequencer.start();
  engine.context.currentTime = 100;
  const count = engine.events.length;
  sequencer.tick();
  assert.ok(engine.events.length - count <= 3);
  assert.ok(sequencer.nextTime > 100);
});

test("Solo cancels a pending mute on its channel", async () => {
  const { sequencer } = setup();
  sequencer.select("bass", 2);
  await sequencer.start();
  sequencer.select("bass", 2);
  assert.equal(sequencer.requested("bass"), 0);
  sequencer.solo("bass");
  assert.ok(sequencer.active.bass > 0);
  assert.equal(sequencer.isPending("bass"), false);
});
