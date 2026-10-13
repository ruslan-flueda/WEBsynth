/** Per-channel filter, drive, pattern gate, solo gate, level and effect sends. */
(() => {
  "use strict";

  class AudioChannel {
    constructor(context, laneId) {
      this.context = context;
      this.laneId = laneId;
      this.input = context.createGain();
      this.filter = context.createBiquadFilter();
      this.dry = context.createGain();
      this.drive = context.createWaveShaper();
      this.driveWet = context.createGain();
      this.patternGate = context.createGain();
      this.soloGate = context.createGain();
      this.level = context.createGain();
      this.reverbSend = context.createGain();
      this.delaySend = context.createGain();

      this.filter.type = "lowpass";
      this.filter.Q.value = 0.45;
      this.patternGate.gain.value = 0;
      this.soloGate.gain.value = 1;
      this.drive.curve = WebSynth.createDriveCurve(2048, 3);
      this.drive.oversample = "2x";

      this.input.connect(this.filter);
      this.filter.connect(this.dry).connect(this.patternGate);
      this.filter.connect(this.drive).connect(this.driveWet).connect(this.patternGate);
      this.patternGate.connect(this.soloGate).connect(this.level);
    }

    connect(effects) {
      this.level.disconnect();
      this.reverbSend.disconnect();
      this.delaySend.disconnect();
      this.level.connect(effects.input);
      this.level.connect(this.reverbSend).connect(effects.reverbInput);
      this.level.connect(this.delaySend).connect(effects.delayInput);
    }

    update(params) {
      const time = this.context.currentTime;
      const drive = (params.drive ?? 0) / 100;
      let cutoff = this.laneId === "winds" ? 4200 : 14000;

      if (params.filter !== undefined) {
        cutoff = 160 + 15840 * Math.pow(params.filter / 100, 2);
      } else if (params.tone !== undefined) {
        cutoff = 650 + 12350 * Math.pow(params.tone / 100, 1.5);
      }

      this.level.gain.setTargetAtTime(Math.pow(params.volume / 100, 1.4), time, 0.018);
      this.filter.frequency.setTargetAtTime(cutoff, time, 0.025);
      this.dry.gain.setTargetAtTime(1 - 0.32 * drive, time, 0.03);
      this.driveWet.gain.setTargetAtTime(0.65 * drive, time, 0.03);
      this.reverbSend.gain.setTargetAtTime((params.reverb ?? 0) / 100 * 0.62, time, 0.03);
      this.delaySend.gain.setTargetAtTime((params.delay ?? 0) / 100 * 0.52, time, 0.03);
    }

    setEnabled(enabled, time = this.context.currentTime) {
      this.patternGate.gain.cancelScheduledValues(time);
      this.patternGate.gain.setTargetAtTime(enabled ? 1 : 0, time, 0.012);
    }

    setSoloAudible(audible) {
      // Solo must not cancel a pattern switch already scheduled for the next bar.
      const time = this.context.currentTime;
      this.soloGate.gain.cancelScheduledValues(time);
      this.soloGate.gain.setTargetAtTime(audible ? 1 : 0, time, 0.012);
    }
  }

  WebSynth.AudioChannel = AudioChannel;
})();
