const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadApp } = require("./helpers/load-app.cjs");
const { FakeAudioContext, reaches } = require("./helpers/fake-audio.cjs");

function setup() {
  const { app } = loadApp({ AudioContext: FakeAudioContext });
  return { app, engine: new app.Engine() };
}

test("real effects and every channel route dry/reverb/delay to the output", async () => {
  const { app, engine } = setup();
  await engine.init();
  assert.equal(Object.keys(engine.channels).length, 7);
  for (const { id } of app.lanes) {
    const channel = engine.channels[id];
    for (const node of [channel.input, channel.reverbSend, channel.delaySend]) {
      assert.ok(reaches(node, engine.context.destination), `${id}: disconnected signal path`);
    }
  }
  const delay = engine.effects.delay;
  const feedbackPath = [...delay.connections][0];
  assert.ok(reaches(feedbackPath, delay), "delay feedback loop is disconnected");
});

test("all patterns can trigger their voices with valid automation at both tempo limits", async () => {
  const { app, engine } = setup();
  await engine.init();
  for (const bpm of [65, 180]) {
    for (const { id } of app.lanes) {
      for (const bars of app.patterns[id].slice(1)) {
        for (const events of bars) {
          for (const event of events) engine.trigger(id, event, 1, 60 / bpm);
        }
      }
    }
  }
  assert.ok(engine.synthesis.sources.size > 0);
  engine.context.advance(20);
  assert.equal(engine.synthesis.sources.size, 0, "finished voices leaked sources");
});

test("Solo preserves next-bar pattern automation", async () => {
  const { engine } = setup();
  await engine.init();
  engine.setChannel("bass", true, 2);
  const patternAutomation = JSON.stringify(engine.channels.bass.patternGate.gain.events);
  engine.setSolo("winds");
  assert.equal(engine.channels.bass.soloGate.gain.value, 0);
  assert.equal(engine.channels.winds.soloGate.gain.value, 1);
  assert.equal(JSON.stringify(engine.channels.bass.patternGate.gain.events), patternAutomation);
  engine.setSolo(null);
  assert.equal(engine.channels.bass.soloGate.gain.value, 1);
});

test("parameters clamp input and reach the intended effects, including before Play", async () => {
  const { engine } = setup();
  engine.setParam("bass", "drive", 75);
  engine.setBpm(132);
  await engine.init();
  assert.equal(engine.channels.bass.driveWet.gain.value, 0.65 * 0.75);
  assert.equal(engine.effects.delay.delayTime.value, 60 / 132 * 0.75);
  engine.setParam("winds", "reverb", 120);
  assert.equal(engine.params.winds.reverb, 100);
  assert.equal(engine.channels.winds.reverbSend.gain.value, 0.62);
  engine.setParam("bells", "delay", -10);
  assert.equal(engine.channels.bells.delaySend.gain.value, 0);
  engine.setParam("bells", "delay", NaN);
  assert.equal(engine.params.bells.delay, 0);
  engine.setParam("missing", "volume", 50);
  engine.setParam("bells", "notAnEffect", 50);
  assert.equal(engine.params.bells.notAnEffect, undefined);
});

test("Stop ends atmosphere and voices; restart discards old wet tails", async () => {
  const { app, engine } = setup();
  await engine.init();
  const active = Object.fromEntries(app.lanes.map(({ id }) => [id, 1]));
  engine.start(active, 0.08, null);
  assert.equal(engine.synthesis.sources.size, 2, "atmosphere should start with playback only");
  engine.trigger("winds", app.patterns.winds[1][0][0], 0.1, 60 / 110);
  engine.stop();
  const oldEffects = engine.effects;
  const oldNodes = [...oldEffects.nodes];
  engine.context.advance(0.2);
  assert.equal(engine.synthesis.sources.size, 0, "Stop left generators running");
  engine.start(active, 0.28, "bells");
  assert.notEqual(engine.effects, oldEffects);
  assert.ok(oldNodes.every((node) => node.connections.size === 0));
  assert.equal(engine.channels.bass.soloGate.gain.value, 0);
  assert.equal(engine.channels.bells.soloGate.gain.value, 1);
  assert.equal(engine.synthesis.sources.size, 2);
  engine.stop();
  engine.context.advance(0.4);
  assert.equal(engine.synthesis.sources.size, 0);
});

test("rapid restart stops the old sources without stopping new atmosphere", async () => {
  const { app, engine } = setup();
  await engine.init();
  const active = Object.fromEntries(app.lanes.map(({ id }) => [id, 1]));
  engine.start(active, 0.08, null);
  engine.stop();
  engine.start(active, 0.08, null);
  engine.context.advance(0.01);
  assert.equal(engine.synthesis.sources.size, 2);
});
