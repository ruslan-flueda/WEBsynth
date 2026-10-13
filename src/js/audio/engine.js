/** Audio lifecycle and the public interface used by the UI and sequencer. */
(() => {
  "use strict";

  const { config, lanes, AudioChannel, Effects, Synthesis, voices } = WebSynth;

  class Engine {
    constructor() {
      this.context = null;
      this.effects = null;
      this.synthesis = null;
      this.channels = {};
      this.bpm = config.defaultBpm;
      this.needsReset = false;
      this.params = Object.fromEntries(lanes.map(({ id, controls }) => [
        id, Object.fromEntries(controls.map(({ key, initial }) => [key, initial])),
      ]));
    }

    async init() {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) throw new Error("Этот браузер не поддерживает Web Audio.");
        this.context = new AudioContext();
        this.effects = new Effects(this.context, this.bpm);
        for (const lane of lanes) {
          const channel = new AudioChannel(this.context, lane.id);
          channel.connect(this.effects);
          channel.update(this.params[lane.id]);
          this.channels[lane.id] = channel;
        }
        this.synthesis = new Synthesis(this.context, this.channels, this.params);
      }
      if (this.context.state !== "running") await this.context.resume();
      if (this.context.state !== "running") {
        throw new Error("Нажмите Play ещё раз, чтобы разрешить звук.");
      }
    }

    setParam(laneId, key, value) {
      if (!Object.hasOwn(this.params, laneId) || !Object.hasOwn(this.params[laneId], key)) return;
      const amount = Number(value);
      if (!Number.isFinite(amount)) return;
      this.params[laneId][key] = Math.max(0, Math.min(100, amount));
      this.channels[laneId]?.update(this.params[laneId]);
    }

    setBpm(bpm) {
      this.bpm = bpm;
      this.effects?.setBpm(bpm);
    }

    setChannel(laneId, enabled, time) {
      this.channels[laneId].setEnabled(enabled, time);
    }

    setSolo(laneId) {
      for (const [id, channel] of Object.entries(this.channels)) {
        channel.setSoloAudible(laneId === null || laneId === id);
      }
    }

    start(activePatterns, time, soloId) {
      if (this.needsReset) {
        // Rebuild wet effects so an old delay/reverb tail cannot return on Play.
        this.synthesis.stopAll(this.context.currentTime);
        this.effects.dispose();
        this.effects = new Effects(this.context, this.bpm);
        for (const channel of Object.values(this.channels)) channel.connect(this.effects);
        this.needsReset = false;
      }
      this.effects.setPlaying(true);
      for (const [id, variation] of Object.entries(activePatterns)) {
        this.setChannel(id, variation !== 0, this.context.currentTime);
      }
      this.setSolo(soloId);
      this.synthesis.startAtmosphere(time);
    }

    stop() {
      if (!this.context) return;
      this.effects.setPlaying(false);
      this.synthesis.stopAll(this.context.currentTime + 0.14);
      this.needsReset = true;
    }

    trigger(laneId, event, time, beatDuration) {
      const voice = voices[event.sound];
      if (!voice) throw new Error(`Неизвестный звук: ${event.sound}`);
      const duration = event.duration * beatDuration / config.stepsPerBeat;
      voice(this.synthesis, event, time, duration);
    }
  }

  WebSynth.Engine = Engine;
})();
