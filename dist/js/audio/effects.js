/** Shared dry path, reverb, tempo delay and output dynamics. */
(() => {
  "use strict";

  function createDriveCurve(length, strength) {
    const curve = new Float32Array(length);
    for (let index = 0; index < length; index += 1) {
      const input = index * 2 / (length - 1) - 1;
      curve[index] = Math.tanh(input * strength) / Math.tanh(strength);
    }
    return curve;
  }

  function createImpulse(context) {
    const length = Math.round(context.sampleRate * 1.6);
    const impulse = context.createBuffer(2, length, context.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let index = 0; index < length; index += 1) {
        data[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / length, 3) * 0.55;
      }
    }
    return impulse;
  }

  class Effects {
    constructor(context, bpm) {
      this.context = context;
      this.nodes = [];
      this.input = this.node("createGain");
      this.sum = this.node("createGain");
      this.reverbInput = this.node("createGain");
      this.delayInput = this.node("createGain");
      this.master = this.node("createGain");
      this.master.gain.value = 0;

      this.connectDryPath();
      this.connectReverb();
      this.connectDelay(bpm);
      this.connectOutput();
    }

    node(factory, ...args) {
      const node = this.context[factory](...args);
      this.nodes.push(node);
      return node;
    }

    connectDryPath() {
      const filter = this.node("createBiquadFilter");
      const clean = this.node("createGain");
      const dirty = this.node("createGain");
      const shaper = this.node("createWaveShaper");
      filter.type = "lowpass";
      filter.frequency.value = 16000;
      filter.Q.value = 0.45;
      clean.gain.value = 0.9;
      dirty.gain.value = 0.12;
      shaper.curve = createDriveCurve(4096, 2.8);
      shaper.oversample = "2x";
      this.input.connect(filter);
      filter.connect(clean).connect(this.sum);
      filter.connect(shaper).connect(dirty).connect(this.sum);
    }

    connectReverb() {
      const reverb = this.node("createConvolver");
      const wet = this.node("createGain");
      reverb.buffer = createImpulse(this.context);
      wet.gain.value = 0.5;
      this.reverbInput.connect(reverb).connect(wet).connect(this.sum);
    }

    connectDelay(bpm) {
      this.delay = this.node("createDelay", 2);
      const filter = this.node("createBiquadFilter");
      const feedback = this.node("createGain");
      const wet = this.node("createGain");
      filter.type = "lowpass";
      filter.frequency.value = 2400;
      feedback.gain.value = 0.18;
      wet.gain.value = 0.4;
      this.delay.delayTime.value = 60 / bpm * 0.75;
      this.delayInput.connect(this.delay).connect(filter);
      filter.connect(feedback).connect(this.delay);
      filter.connect(wet).connect(this.sum);
    }

    connectOutput() {
      const compressor = this.node("createDynamicsCompressor");
      compressor.threshold.value = -18;
      compressor.knee.value = 14;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.2;

      const limiter = this.node("createDynamicsCompressor");
      limiter.threshold.value = -3;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.001;
      limiter.release.value = 0.09;
      this.sum.connect(compressor).connect(this.master);
      this.master.connect(limiter).connect(this.context.destination);
    }

    setBpm(bpm) {
      this.delay.delayTime.setTargetAtTime(60 / bpm * 0.75, this.context.currentTime, 0.03);
    }

    setPlaying(playing) {
      const time = this.context.currentTime;
      this.master.gain.cancelScheduledValues(time);
      this.master.gain.setTargetAtTime(playing ? 0.68 : 0, time, 0.025);
    }

    dispose() {
      for (const node of this.nodes) node.disconnect();
      this.nodes = [];
    }
  }

  WebSynth.createDriveCurve = createDriveCurve;
  WebSynth.Effects = Effects;
})();
