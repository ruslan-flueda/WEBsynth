/** UI controller: DOM events become engine/sequencer commands. */
(() => {
  "use strict";

  const { config, lanes, Engine, Sequencer, ChannelView } = WebSynth;

  class App {
    constructor(document, engine = new Engine()) {
      this.engine = engine;
      this.sequencer = new Sequencer(engine, () => this.render());
      this.starting = false;
      this.feedback = null;
      this.channelViews = new Map();
      this.transport = document.querySelector("#transport");
      this.status = document.querySelector("#status");
      this.tempo = document.querySelector("#tempo");
      this.tempoValue = document.querySelector("#tempo-value");
      const channels = document.querySelector("#channels");

      for (const lane of lanes) {
        const view = new ChannelView(document, lane, {
          select: (variation) => this.select(lane, variation),
          shuffle: () => this.shuffle(lane),
          solo: () => this.solo(lane),
          changeParam: (key, label, value) => {
            this.engine.setParam(lane.id, key, value);
            this.showFeedback(`${lane.name} · ${label} ${value}%`, 1400);
          },
        });
        this.channelViews.set(lane.id, view);
        channels.append(view.element);
      }

      this.tempo.min = String(config.minBpm);
      this.tempo.max = String(config.maxBpm);
      this.tempo.value = String(this.sequencer.bpm);
      this.tempoValue.textContent = String(this.sequencer.bpm);
      this.tempo.addEventListener("input", () => {
        const bpm = this.sequencer.setBpm(this.tempo.value);
        this.tempoValue.textContent = String(bpm);
        this.showFeedback(`ТЕМП ${bpm} BPM`, 1400);
      });
      this.transport.addEventListener("click", () => this.togglePlayback());
      this.render();
    }

    select(lane, variation) {
      this.sequencer.select(lane.id, variation);
      const selected = this.sequencer.requested(lane.id);
      const name = selected ? this.channelViews.get(lane.id).patternName(selected) : "ВЫКЛ";
      const pending = this.sequencer.isPending(lane.id) ? " · СЛЕДУЮЩИЙ ТАКТ" : "";
      this.showFeedback(`${lane.name} · ${name}${pending}`);
    }

    shuffle(lane) {
      this.sequencer.shuffle(lane.id);
      const name = this.sequencer.requestedShuffle(lane.id) ? "ПЕРЕМЕШКА" : "ОРИГИНАЛ";
      const pending = this.sequencer.isShufflePending(lane.id) ? " · СЛЕДУЮЩИЙ ТАКТ" : "";
      this.showFeedback(`${lane.name} · ${name}${pending}`);
    }

    solo(lane) {
      this.sequencer.solo(lane.id);
      this.showFeedback(this.sequencer.soloId
        ? `${lane.name} · SOLO`
        : "SOLO ВЫКЛ · МИКС ВОССТАНОВЛЕН");
    }

    showFeedback(text, durationMs = 1700) {
      this.feedback = { text: text.toUpperCase(), until: performance.now() + durationMs };
      this.render();
    }

    async togglePlayback() {
      if (this.starting) return;
      if (this.sequencer.running) {
        this.feedback = null;
        this.sequencer.stop();
        return;
      }
      this.starting = true;
      this.feedback = null;
      this.render();
      try {
        await this.sequencer.start();
      } catch (error) {
        // Persist the error until the next action, including the render in finally.
        this.showFeedback(error.message || "НЕ УДАЛОСЬ ЗАПУСТИТЬ АУДИО", Infinity);
      } finally {
        this.starting = false;
        this.render();
      }
    }

    statusText() {
      if (this.starting) return "ЗАГРУЗКА АУДИО…";
      if (this.feedback && performance.now() < this.feedback.until) return this.feedback.text;
      if (!this.sequencer.running) return "ГОТОВО · НАЖМИ PLAY";
      const pending = lanes.some(({ id }) => this.sequencer.isPending(id) || this.sequencer.isShufflePending(id));
      const state = pending ? "СЛЕДУЮЩИЙ ТАКТ" : "ИГРАЕТ";
      const bar = this.sequencer.playhead.bar + 1;
      const solo = this.sequencer.soloId ? ` · SOLO ${this.sequencer.soloId.toUpperCase()}` : "";
      return `${state} · ТАКТ ${bar}/${config.barsPerPattern}${solo}`;
    }

    render() {
      this.transport.disabled = this.starting;
      this.transport.setAttribute("aria-pressed", String(this.sequencer.running));
      this.transport.setAttribute("aria-label", this.sequencer.running
        ? "Остановить воспроизведение" : "Начать воспроизведение");
      for (const view of this.channelViews.values()) view.render(this.sequencer);
      const text = this.statusText();
      // Avoid repeating identical announcements in the live region every step.
      if (this.status.textContent !== text) this.status.textContent = text;
    }
  }

  WebSynth.App = App;
})();
