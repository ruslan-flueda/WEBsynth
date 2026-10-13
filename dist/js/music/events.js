/**
 * @typedef {Object} MusicEvent
 * @property {number} step Sixteenth-note position within a bar (0–15).
 * @property {string} sound Voice ID from audio/voices.js.
 * @property {number | number[] | null} note MIDI pitch, chord, or unpitched hit.
 * @property {number} duration Duration in sixteenth notes.
 * @property {number} velocity Relative intensity (0–1).
 */
(() => {
  "use strict";

  const { config, patterns } = WebSynth;
  const shuffleOffsets = [-3, -2, -1, 1, 2, 3];

  function event(step, sound, note, duration, velocity) {
    return Object.freeze({
      step,
      sound,
      note: Array.isArray(note) ? Object.freeze(note) : note,
      duration,
      velocity,
    });
  }

  /** Same seed repeats the same four-bar rhythm; source patterns stay intact. */
  function eventsFor(laneId, variation, bar, seed = 0) {
    const events = patterns[laneId][variation][bar];
    if (!seed) return events;

    return events.map((event, index) => {
      // Keep the downbeat anchored while moving the surrounding notes.
      if (event.step === 0) return event;
      const hash = Math.abs(Math.sin(
        seed * 127.1 + (index + 1) * 311.7 + bar * 29.3 + laneId.length * 17.3,
      ));
      const offset = shuffleOffsets[Math.min(5, Math.floor(hash * 6))];
      const lastStep = config.stepsPerBar - event.duration;
      const step = Math.max(0, Math.min(lastStep, event.step + offset));
      return { ...event, step };
    }).sort((left, right) => left.step - right.step);
  }

  WebSynth.event = event;
  WebSynth.eventsFor = eventsFor;
})();
