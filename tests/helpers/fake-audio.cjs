/** Records graph edges, parameter automation and source lifetimes; no sound rendering. */
class AudioParam {
  constructor(value = 0) {
    this.value = value;
    this.events = [];
  }

  record(type, value, time) {
    if (!Number.isFinite(value) || !Number.isFinite(time) || time < 0) {
      throw new Error(`Invalid ${type} automation: ${value} at ${time}`);
    }
    this.events.push({ type, value, time });
    this.value = value;
  }

  setTargetAtTime(value, time, constant) {
    if (!(constant > 0)) throw new Error("Invalid time constant");
    this.record("target", value, time);
  }

  setValueAtTime(value, time) { this.record("value", value, time); }
  linearRampToValueAtTime(value, time) { this.record("linear", value, time); }
  exponentialRampToValueAtTime(value, time) {
    if (!(value > 0)) throw new Error("Exponential ramp target must be positive");
    this.record("exponential", value, time);
  }

  cancelScheduledValues(time) {
    this.events = this.events.filter((event) => event.time < time);
  }
}

class AudioNode {
  constructor(context, kind) {
    this.context = context;
    this.kind = kind;
    this.connections = new Set();
    for (const name of ["gain", "frequency", "detune", "Q", "delayTime", "threshold", "knee", "ratio", "attack", "release"]) {
      this[name] = new AudioParam(name === "gain" ? 1 : 0);
    }
  }

  connect(node) { this.connections.add(node); return node; }
  disconnect() { this.connections.clear(); }
  start(time = 0) {
    if (this.startTime !== undefined) throw new Error("Source started twice");
    this.startTime = time;
  }
  stop(time = 0) {
    if (this.startTime === undefined) throw new Error("Source stopped before start");
    this.stopTime = time;
  }
}

class FakeAudioContext {
  constructor() {
    this.sampleRate = 8000;
    this.currentTime = 0;
    this.state = "suspended";
    this.nodes = [];
    this.destination = this.createNode("destination");
  }

  createNode(kind) {
    const node = new AudioNode(this, kind);
    this.nodes.push(node);
    return node;
  }

  async resume() { this.state = "running"; }
  createGain() { return this.createNode("gain"); }
  createBiquadFilter() { return this.createNode("filter"); }
  createWaveShaper() { return this.createNode("shaper"); }
  createConvolver() { return this.createNode("convolver"); }
  createDelay() { return this.createNode("delay"); }
  createDynamicsCompressor() { return this.createNode("compressor"); }
  createOscillator() { return this.createNode("oscillator"); }
  createBufferSource() { return this.createNode("bufferSource"); }
  createBuffer(channels, length, sampleRate) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { duration: length / sampleRate, getChannelData: (channel) => data[channel] };
  }

  advance(time) {
    this.currentTime = time;
    for (const node of this.nodes) {
      if (!node.ended && node.stopTime <= time) {
        node.ended = true;
        node.onended?.();
      }
    }
  }
}

function reaches(source, destination, visited = new Set()) {
  if (source === destination) return true;
  if (visited.has(source)) return false;
  visited.add(source);
  return [...(source.connections ?? [])].some((node) => reaches(node, destination, visited));
}

module.exports = { FakeAudioContext, reaches };
