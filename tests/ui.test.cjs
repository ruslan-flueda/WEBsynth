const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadApp } = require("./helpers/load-app.cjs");
const { FakeAudioContext } = require("./helpers/fake-audio.cjs");
const { FakeDocument } = require("./helpers/fake-dom.cjs");

function setup() {
  const { app } = loadApp({ AudioContext: FakeAudioContext });
  const document = new FakeDocument();
  const ui = new app.App(document);
  return { app, ui, document };
}

test("UI exposes seven cards, 21 patterns, 28 sliders, Shuffle and Solo", async () => {
  const { ui, document } = setup();
  assert.equal(document.elements.channels.children.length, 7);
  assert.equal(document.elements.channels.descendants("input").length, 28);
  assert.equal(document.elements.channels.descendants("button").length, 35);
  const melody = ui.channelViews.get("melody");
  assert.equal(melody.element.descendants("svg").length, 3);
  await melody.buttons[2].fire("click");
  assert.equal(ui.sequencer.active.melody, 3);
  assert.equal(melody.buttons[2].getAttribute("aria-pressed"), "true");
  await melody.shuffle.fire("click");
  assert.equal(melody.shuffle.textContent, "ORIGINAL");
  await melody.solo.fire("click");
  assert.equal(melody.solo.getAttribute("aria-pressed"), "true");
  assert.ok(ui.channelViews.get("bass").element.classList.contains("solo-muted"));
});

test("sliders and tempo send values to the engine and reflect status", async () => {
  const { ui, document } = setup();
  const breath = ui.channelViews.get("winds").element.descendants("input")[1];
  breath.value = "81";
  await breath.fire("input");
  assert.equal(ui.engine.params.winds.breath, 81);
  assert.match(document.elements.status.textContent, /ДЫХАНИЕ 81%/);
  document.elements.tempo.value = "132";
  await document.elements.tempo.fire("input");
  assert.equal(ui.sequencer.bpm, 132);
  assert.equal(document.elements["tempo-value"].textContent, "132");
});

test("audio startup error remains visible and Play is available for retry", async () => {
  const { ui, document } = setup();
  ui.engine.init = async () => { throw new Error("Аудио недоступно"); };
  await ui.togglePlayback();
  ui.render();
  assert.equal(document.elements.status.textContent, "АУДИО НЕДОСТУПНО");
  assert.equal(document.elements.transport.disabled, false);
  assert.equal(ui.sequencer.running, false);
});

test("Play/Stop updates accessible button state and restarts at bar one", async () => {
  const { ui, document } = setup();
  await ui.togglePlayback();
  assert.equal(document.elements.transport.getAttribute("aria-pressed"), "true");
  ui.sequencer.playhead.bar = 3;
  await ui.togglePlayback();
  assert.equal(document.elements.transport.getAttribute("aria-pressed"), "false");
  await ui.togglePlayback();
  assert.equal(ui.sequencer.playhead.bar, 0);
  await ui.togglePlayback();
});

test("built entry point stops timers on pagehide and restores one animation loop on pageshow", async () => {
  const document = new FakeDocument();
  const listeners = {};
  const frames = new Map();
  let frameId = 0;
  const { timers, runMain } = loadApp({
    document,
    AudioContext: FakeAudioContext,
    addEventListener(type, callback) { listeners[type] = callback; },
    requestAnimationFrame(callback) {
      const id = ++frameId;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) { frames.delete(id); },
  }, "dist");
  runMain();
  assert.equal(document.elements.channels.children.length, 7);
  assert.equal(frames.size, 1);
  await document.elements.transport.fire("click");
  assert.equal(timers.size, 1);
  listeners.pagehide();
  assert.equal(timers.size, 0);
  assert.equal(frames.size, 0);
  listeners.pageshow();
  listeners.pageshow();
  assert.equal(frames.size, 1);
  assert.equal(document.elements.transport.getAttribute("aria-pressed"), "false");
});
