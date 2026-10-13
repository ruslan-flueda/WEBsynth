/** Shared definitions. Runtime state belongs to the engine and sequencer. */
(() => {
  "use strict";

  const control = (key, label, initial) => Object.freeze({ key, label, initial });
  const volume = (initial) => control("volume", "ГРОМКОСТЬ", initial);
  const lane = (id, name, controls) => Object.freeze({
    id,
    name,
    controls: Object.freeze(controls),
  });

  window.WebSynth = {
    config: Object.freeze({
      defaultBpm: 110,
      minBpm: 65,
      maxBpm: 180,
      stepsPerBeat: 4,
      stepsPerBar: 16,
      barsPerPattern: 4,
      schedulerIntervalMs: 25,
      lookaheadSeconds: 0.1,
      startDelaySeconds: 0.08,
      lateThresholdSeconds: 0.15,
      recoveryDelaySeconds: 0.035,
    }),
    lanes: Object.freeze([
      lane("drums", "Drums", [
        volume(66), control("filter", "ФИЛЬТР", 84),
        control("reverb", "ROOM", 18), control("drive", "DRIVE", 15),
      ]),
      lane("percussion", "Percussion", [
        volume(68), control("reverb", "РЕВЕРБЕРАЦИЯ", 10),
        control("tone", "TONE", 68), control("drive", "GRIT", 18),
      ]),
      lane("bass", "Bass", [
        volume(70), control("filter", "ФИЛЬТР", 53),
        control("drive", "DRIVE", 28), control("delay", "ECHO", 8),
      ]),
      lane("melody", "Melody", [
        volume(78), control("delay", "ДИЛЭЙ", 17),
        control("vibrato", "VIBRATO", 18), control("reverb", "SPACE", 20),
      ]),
      lane("chords", "Chords", [
        volume(38), control("reverb", "РЕВЕРБЕРАЦИЯ", 17),
        control("tone", "TONE", 65), control("delay", "ECHO", 14),
      ]),
      lane("winds", "Winds", [
        volume(67), control("breath", "ДЫХАНИЕ", 42),
        control("vibrato", "VIBRATO", 32), control("reverb", "SPACE", 38),
      ]),
      lane("bells", "Bells", [
        volume(54), control("shimmer", "ОБЕРТОНЫ", 44),
        control("delay", "ECHO", 32), control("reverb", "SPACE", 22),
      ]),
    ]),
    patterns: {},
  };
})();
