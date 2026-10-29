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
  assert.deepEqual(Array.from(melody.buttons, button => button.textContent), ["1", "2", "3"]);
  await melody.buttons[2].fire("click");
  assert.equal(ui.sequencer.active.melody, 3);
  assert.equal(melody.buttons[2].getAttribute("aria-pressed"), "true");
  await melody.shuffle.fire("click");
  assert.equal(melody.shuffle.textContent, "shuffle");
  assert.equal(melody.shuffle.getAttribute("aria-pressed"), "true");
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
  assert.deepEqual(Array.from(ui.tempoButtons, button => button.textContent), ["60", "90", "110"]);
  for (const button of ui.tempoButtons) {
    await button.fire("click");
    assert.equal(ui.sequencer.bpm, Number(button.textContent));
    assert.equal(ui.engine.bpm, Number(button.textContent));
    assert.equal(button.getAttribute("aria-pressed"), "true");
    assert.equal(ui.tempoButtons.filter(b => b.getAttribute("aria-pressed") === "true").length, 1);
  }
});

test("audio startup error remains visible and Play is available for retry", async () => {
  const { ui, document } = setup();
  ui.engine.init = async () => { throw new Error("Аудио недоступно"); };
  await ui.togglePlayback();
  ui.render();
  assert.equal(document.elements.status.textContent, "АУДИО НЕДОСТУПНО");
  assert.equal(document.elements.transport.disabled, false);
  assert.ok(document.elements.status.classList.contains("status-error"));
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


test("ASCII slider marker tracks exact parameter values including endpoints", async () => {
  const { ui } = setup();
  const slider = ui.channelViews.get("bass").element.children[2].children[0];
  const track = slider.children[1], input = slider.children[2];
  for (const value of [0, 51, 100]) {
    input.value = String(value);
    await input.fire("input");
    assert.equal(ui.engine.params.bass.volume, value);
    assert.equal(track.children.filter(tick => tick.textContent === "/").length, 1);
    assert.equal(track.children[Math.round(value / 100 * 29)].textContent, "/");
  }
});
