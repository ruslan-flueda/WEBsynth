/** Voice recipes. Timing and MIDI data are supplied by the sequencer. */
(() => {
  "use strict";

  function kick(synth, event, time) {
    const oscillator = synth.context.createOscillator();
    const gain = synth.context.createGain();
    oscillator.frequency.setValueAtTime(135, time);
    oscillator.frequency.exponentialRampToValueAtTime(45, time + 0.085);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.58 * event.velocity, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);
    oscillator.connect(gain).connect(synth.channels.drums.input);
    oscillator.start(time);
    synth.track(oscillator, time + 0.3, [gain]);
  }

  function rim(synth, { velocity }, time) {
    synth.tone("drums", 75, time, 0.067, 0.11 * velocity, { type: "triangle" });
    synth.tone("drums", 91, time, 0.028, 0.055 * velocity, { cutoff: 2200 });
    synth.noise("drums", time, 0.08, 0.08 * velocity, "bandpass", 1500);
  }

  function hat(synth, { velocity }, time) {
    synth.noise("drums", time, 0.055, 0.055 * velocity, "highpass", 6500);
  }

  function jingle(synth, { velocity }, time) {
    synth.noise("percussion", time, 0.12, 0.13 * velocity, "highpass", 5000);
    synth.tone("percussion", 104, time, 0.105, 0.024 * velocity, { type: "square", cutoff: 6500 });
  }

  const strokes = {
    dum: { pitch: 45, length: 0.24, cutoff: 850, noiseLength: 0.13, noiseType: "lowpass", noiseFrequency: 680 },
    tak: { pitch: 73, length: 0.095, cutoff: 2700, noiseLength: 0.07, noiseType: "bandpass", noiseFrequency: 2600 },
    slap: { pitch: 79, length: 0.13, cutoff: 2700, noiseLength: 0.07, noiseType: "bandpass", noiseFrequency: 3500 },
  };

  function percussion(synth, { sound, velocity }, time) {
    const stroke = strokes[sound];
    synth.tone("percussion", stroke.pitch, time, stroke.length, 0.21 * velocity, {
      type: "triangle", cutoff: stroke.cutoff,
    });
    synth.noise("percussion", time, stroke.noiseLength, 0.17 * velocity, stroke.noiseType, stroke.noiseFrequency);
    if (sound === "slap") {
      synth.noise("percussion", time, 0.035, 0.09 * velocity, "highpass", 5100);
    }
  }

  function bass(synth, { note, velocity }, time, duration) {
    synth.tone("bass", note, time, duration * 0.9, 0.25 * velocity, { type: "triangle", cutoff: 700 });
    synth.tone("bass", note, time, duration * 0.8, 0.035 * velocity, { type: "sawtooth", cutoff: 420 });
  }

  function melody(synth, { note, velocity }, time, duration) {
    synth.tone("melody", note, time, duration * 0.84, 0.15 * velocity, { type: "triangle", cutoff: 2400 });
    synth.tone("melody", note, time + 0.006, duration * 0.65, 0.042 * velocity, {
      type: "sawtooth", cutoff: 1250, detune: -8,
    });
  }

  function wind(synth, { note, velocity }, time, duration) {
    const breath = synth.params.winds.breath / 100;
    synth.tone("winds", note, time, duration * 0.95, 0.14 * velocity, { cutoff: 3400 });
    synth.tone("winds", note, time + 0.008, duration * 0.85, 0.025 * velocity, {
      type: "triangle", cutoff: 2200, detune: 4,
    });
    if (breath > 0) {
      synth.noise("winds", time, Math.min(duration * 0.7, 0.42), 0.05 * velocity * breath, "bandpass", 1800);
    }
  }

  function bell(synth, { note, velocity }, time) {
    const shimmer = synth.params.bells.shimmer / 100;
    synth.tone("bells", note, time, 0.72, 0.1 * velocity, { cutoff: 9000 });
    synth.tone("bells", note + 19, time, 0.36, 0.026 * velocity * shimmer, { cutoff: 11000 });
  }

  function cowbell(synth, { note, velocity }, time) {
    synth.tone("bells", note, time, 0.13, 0.085 * velocity, { type: "square", cutoff: 2300 });
    synth.tone("bells", note + 7, time, 0.11, 0.038 * velocity, { type: "square", cutoff: 3000 });
    synth.noise("bells", time, 0.045, 0.035 * velocity, "bandpass", 3100);
  }

  function chord(synth, { note: notes, velocity }, time, duration) {
    notes.forEach((note, index) => {
      const start = time + index * 0.012;
      synth.tone("chords", note, start, duration, 0.046 * velocity, { type: "triangle", cutoff: 2300 });
      synth.tone("chords", note + 12, start, duration * 0.48, 0.007 * velocity, { cutoff: 3000 });
    });
  }

  function arp(synth, { note, velocity }, time, duration) {
    synth.tone("chords", note, time, duration, 0.055 * velocity, { type: "square", cutoff: 1200 });
  }

  WebSynth.voices = Object.freeze({
    kick, rim, hat, jingle, dum: percussion, tak: percussion, slap: percussion,
    bass, melody, wind, bell, cowbell, chord, arp,
  });
})();
