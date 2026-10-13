/** Audio-clock scheduling. Pattern/shuffle changes commit at bar boundaries. */
(() => {
  "use strict";

  const { config, lanes, patterns, eventsFor } = WebSynth;
  const emptySelection = () => Object.fromEntries(lanes.map(({ id }) => [id, 0]));

  class Sequencer {
    constructor(engine, onChange = () => {}) {
      this.engine = engine;
      this.onChange = onChange;
      this.bpm = config.defaultBpm;
      this.active = emptySelection();
      this.shuffleSeeds = emptySelection();
      this.pendingPatterns = {};
      this.pendingShuffles = {};
      this.scheduledPatterns = {};
      this.scheduledShuffles = {};
      this.nextShuffleSeed = 1;
      this.soloId = null;
      this.running = false;
      this.startVersion = 0;
      this.timer = null;
      this.step = 0;
      this.bar = 0;
      this.queue = [];
      this.playhead = { step: -1, bar: 0 };
      this.barEvents = {};
    }

    async start() {
      if (this.running) return;
      const version = ++this.startVersion;
      await this.engine.init();
      if (version !== this.startVersion) return;
      this.running = true;
      this.step = 0;
      this.bar = 0;
      this.queue = [];
      this.playhead = { step: -1, bar: 0 };
      this.nextTime = this.engine.context.currentTime + config.startDelaySeconds;
      this.engine.start(this.active, this.nextTime, this.soloId);
      this.tick();
      this.timer = setInterval(() => this.tick(), config.schedulerIntervalMs);
      this.onChange();
    }

    stop() {
      // Also cancel a Play awaiting AudioContext.resume(), e.g. on pagehide.
      this.startVersion += 1;
      if (!this.running) return;
      this.running = false;
      clearInterval(this.timer);
      this.timer = null;
      Object.assign(this.active, this.pendingPatterns);
      Object.assign(this.shuffleSeeds, this.pendingShuffles);
      this.pendingPatterns = {};
      this.pendingShuffles = {};
      this.scheduledPatterns = {};
      this.scheduledShuffles = {};
      this.queue = [];
      this.barEvents = {};
      this.playhead = { step: -1, bar: 0 };
      this.engine.stop();
      this.onChange();
    }

    select(laneId, variation) {
      if (!Object.hasOwn(this.active, laneId) || !Number.isInteger(variation)) return;
      if (variation < 1 || variation >= patterns[laneId].length) return;
      if (this.running && this.pendingPatterns[laneId] === variation) {
        delete this.pendingPatterns[laneId];
      } else {
        const target = this.requested(laneId) === variation ? 0 : variation;
        if (!this.running) this.active[laneId] = target;
        else if (target === this.active[laneId]) delete this.pendingPatterns[laneId];
        else this.pendingPatterns[laneId] = target;
      }
      this.onChange();
    }

    requested(laneId) {
      return this.pendingPatterns[laneId] ?? this.active[laneId];
    }

    requestedShuffle(laneId) {
      return this.pendingShuffles[laneId] ?? this.shuffleSeeds[laneId];
    }

    isPending(laneId) {
      return Object.hasOwn(this.pendingPatterns, laneId)
        || this.scheduledPatterns[laneId] > this.engine.context?.currentTime;
    }

    isShufflePending(laneId) {
      return Object.hasOwn(this.pendingShuffles, laneId)
        || this.scheduledShuffles[laneId] > this.engine.context?.currentTime;
    }

    shuffle(laneId) {
      if (!Object.hasOwn(this.active, laneId)) return;
      if (this.running && Object.hasOwn(this.pendingShuffles, laneId)) {
        delete this.pendingShuffles[laneId];
      } else {
        const target = this.shuffleSeeds[laneId] === 0 ? this.nextShuffleSeed++ : 0;
        if (this.running) this.pendingShuffles[laneId] = target;
        else this.shuffleSeeds[laneId] = target;
      }
      this.onChange();
    }

    solo(laneId) {
      if (!Object.hasOwn(this.active, laneId)) return;
      this.soloId = this.soloId === laneId ? null : laneId;
      const requested = this.requested(laneId);
      if (this.soloId && (this.active[laneId] === 0 || requested === 0)) {
        this.active[laneId] = requested || 1;
        delete this.pendingPatterns[laneId];
        delete this.scheduledPatterns[laneId];
        this.barEvents[laneId] = null;
        if (this.running) this.engine.setChannel(laneId, true, this.engine.context.currentTime);
      }
      if (this.running) this.engine.setSolo(this.soloId);
      this.onChange();
    }

    setBpm(value) {
      const bpm = Number(value);
      if (!Number.isInteger(bpm) || bpm < config.minBpm || bpm > config.maxBpm) return this.bpm;
      this.bpm = bpm;
      this.engine.setBpm(bpm);
      return bpm;
    }

    applyBarChanges(time) {
      for (const [laneId, variation] of Object.entries(this.pendingPatterns)) {
        this.active[laneId] = variation;
        this.engine.setChannel(laneId, variation !== 0, time);
        this.scheduledPatterns[laneId] = time;
      }
      for (const [laneId, seed] of Object.entries(this.pendingShuffles)) {
        this.shuffleSeeds[laneId] = seed;
        this.scheduledShuffles[laneId] = time;
      }
      this.pendingPatterns = {};
      this.pendingShuffles = {};
      this.barEvents = {};
    }

    scheduleStep(time) {
      const beatDuration = 60 / this.bpm;
      if (this.step === 0) this.applyBarChanges(time);
      for (const { id } of lanes) {
        const variation = this.active[id];
        if (variation === 0) continue;
        // Calculate shuffled events once per bar, not on every sixteenth note.
        this.barEvents[id] ??= eventsFor(id, variation, this.bar, this.shuffleSeeds[id]);
        for (const event of this.barEvents[id]) {
          if (event.step === this.step) this.engine.trigger(id, event, time, beatDuration);
        }
      }
      this.queue.push({ time, step: this.step, bar: this.bar });
      this.nextTime += beatDuration / config.stepsPerBeat;
      this.step = (this.step + 1) % config.stepsPerBar;
      if (this.step === 0) this.bar = (this.bar + 1) % config.barsPerPattern;
    }

    tick() {
      if (!this.running) return;
      const now = this.engine.context.currentTime;
      if (this.nextTime < now - config.lateThresholdSeconds) {
        this.nextTime = now + config.recoveryDelaySeconds;
      }
      let scheduled = false;
      while (this.nextTime < now + config.lookaheadSeconds) {
        this.scheduleStep(this.nextTime);
        scheduled = true;
      }
      if (scheduled) this.onChange();
    }

    draw() {
      if (!this.running) return;
      const now = this.engine.context.currentTime;
      let latest = null;
      while (this.queue.length && this.queue[0].time <= now) latest = this.queue.shift();
      for (const scheduled of [this.scheduledPatterns, this.scheduledShuffles]) {
        for (const [id, time] of Object.entries(scheduled)) {
          if (time <= now) delete scheduled[id];
        }
      }
      if (latest) {
        this.playhead = { step: latest.step, bar: latest.bar };
        this.onChange();
      }
    }
  }

  WebSynth.Sequencer = Sequencer;
})();
