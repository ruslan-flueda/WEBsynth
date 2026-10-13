/** Oscillator/noise primitives and ownership of every active sound source. */
(() => {
  "use strict";

  const midiToFrequency = (note) => 440 * Math.pow(2, (note - 69) / 12);
  const attackSeconds = { winds: 0.045, melody: 0.003, chords: 0.025 };

  class Synthesis {
    constructor(context, channels, params) {
      this.context = context;
      this.channels = channels;
      this.params = params;
      this.sources = new Set();
      this.noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) {
        data[index] = Math.random() * 2 - 1;
      }
    }

    track(source, endTime, nodes = []) {
      this.sources.add(source);
      source.onended = () => {
        this.sources.delete(source);
        source.disconnect();
        for (const node of nodes) node.disconnect();
      };
      if (endTime !== undefined) source.stop(endTime);
    }

    stopAll(time) {
      for (const source of this.sources) source.stop(time);
    }

    tone(laneId, note, time, duration, volume, options = {}) {
      const { type = "sine", cutoff = 1800, detune = 0 } = options;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      oscillator.type = type;
      oscillator.frequency.value = midiToFrequency(note);
      oscillator.detune.value = detune;
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(cutoff, time);
      filter.frequency.exponentialRampToValueAtTime(Math.max(100, cutoff * 0.38), time + duration);

      if (laneId === "melody") {
        oscillator.detune.setValueAtTime(detune - 24, time);
        oscillator.detune.linearRampToValueAtTime(detune, time + Math.min(0.045, duration * 0.3));
      }

      const attack = Math.min(attackSeconds[laneId] ?? 0.006, duration * 0.5);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(volume, time + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      oscillator.connect(filter).connect(gain).connect(this.channels[laneId].input);
      this.addVibrato(laneId, oscillator, time, duration);
      oscillator.start(time);
      this.track(oscillator, time + duration + 0.02, [filter, gain]);
    }

    addVibrato(laneId, oscillator, time, duration) {
      const amount = this.params[laneId].vibrato ?? 0;
      if (amount === 0) return;
      const lfo = this.context.createOscillator();
      const depth = this.context.createGain();
      lfo.frequency.value = laneId === "winds" ? 4.8 : 5.2;
      depth.gain.value = amount * 0.24;
      lfo.connect(depth).connect(oscillator.detune);
      lfo.start(time);
      this.track(lfo, time + duration + 0.02, [depth]);
    }

    noise(laneId, time, duration, volume, type, frequency) {
      const source = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      source.buffer = this.noiseBuffer;
      filter.type = type;
      filter.frequency.value = frequency;
      filter.Q.value = 0.8;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      source.connect(filter).connect(gain).connect(this.channels[laneId].input);
      source.start(time, Math.random());
      this.track(source, time + duration + 0.01, [filter, gain]);
    }

    startAtmosphere(time) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 73.416;
      gain.gain.value = 0.016;
      oscillator.connect(gain).connect(this.channels.chords.input);
      oscillator.start(time);
      this.track(oscillator, undefined, [gain]);

      const noise = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const hiss = this.context.createGain();
      noise.buffer = this.noiseBuffer;
      noise.loop = true;
      filter.type = "lowpass";
      filter.frequency.value = 700;
      hiss.gain.value = 0.003;
      noise.connect(filter).connect(hiss).connect(this.channels.chords.input);
      noise.start(time);
      this.track(noise, undefined, [filter, hiss]);
    }
  }

  WebSynth.Synthesis = Synthesis;
})();
