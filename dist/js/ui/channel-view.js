/** Build and update one channel card. Musical state is owned by the sequencer. */
(() => {
  "use strict";

  const displayLabels = {
    volume: "volume", filter: "filter", reverb: "room", drive: "drive",
    tone: "tone", delay: "echo", vibrato: "vibrato", breath: "breath", shimmer: "shimmer",
  };

  class ChannelView {
    constructor(document, lane, handlers) {
      this.document = document;
      this.lane = lane;
      this.element = this.create("div", "channel");
      this.element.dataset.channel = lane.id;
      const label = this.create("span", "channel-name", lane.id === "melody" ? "Mel*dy" : lane.name);
      const choices = this.create("div", "choices");
      const variations = WebSynth.patterns[lane.id].length - 1;
      this.buttons = Array.from({ length: variations }, (_, index) => {
        const variation = index + 1;
        const button = this.createPatternButton(variation);
        button.addEventListener("click", () => handlers.select(variation));
        choices.append(button);
        return button;
      });

      const sliders = this.create("div", "sliders");
      for (const control of lane.controls) {
        sliders.append(this.createSlider(control, handlers.changeParam));
      }
      const actions = this.create("div", "channel-actions");
      this.shuffle = this.createButton("action-button shuffle-button", "shuffle");
      this.shuffle.addEventListener("click", handlers.shuffle);
      this.solo = this.createButton("action-button solo-button", "solo");
      this.solo.setAttribute("aria-label", `${lane.name}: слушать только этот канал`);
      this.solo.addEventListener("click", handlers.solo);
      actions.append(this.solo, this.shuffle);
      const selection = this.create("div", "channel-selection");
      selection.append(choices, actions);
      this.element.append(label, selection, sliders);
    }

    create(tag, className, text) {
      const element = this.document.createElement(tag);
      element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    }

    createButton(className, text) {
      const button = this.create("button", className, text);
      button.type = "button";
      button.setAttribute("aria-pressed", "false");
      return button;
    }

    patternName(variation) {
      return `Паттерн ${variation}`;
    }

    createPatternButton(variation) {
      const button = this.createButton("choice", String(variation));
      const label = `${this.lane.name}: ${this.patternName(variation)}`;
      button.setAttribute("aria-label", label);
      button.title = label;
      return button;
    }

    createSlider({ key, label, initial }, onChange) {
      const wrapper = this.create("label", "slider");
      wrapper.title = `${this.lane.name} · ${label}`;
      const caption = this.create("span", "slider-caption", displayLabels[key] || key);
      const track = this.create("span", "slider-track");
      track.setAttribute("aria-hidden", "true");
      const ticks = Array.from({ length: 30 }, () => this.create("span", "slider-tick", "-"));
      track.append(...ticks);
      const showValue = value => {
        const position = Math.round(value / 100 * (ticks.length - 1));
        ticks.forEach((tick, i) => {
          tick.textContent = i === position ? "/" : "-";
          tick.classList.toggle("slider-cursor", i === position);
          tick.classList.toggle("slider-past", i < position);
        });
        wrapper.title = `${this.lane.name} · ${label}: ${value}%`;
      };
      showValue(initial);
      const input = this.document.createElement("input");
      input.type = "range";
      input.min = "0";
      input.max = "100";
      input.step = "1";
      input.value = String(initial);
      input.setAttribute("aria-label", `${this.lane.name}: ${label}`);
      input.addEventListener("input", () => {
        const value = Number(input.value);
        showValue(value);
        onChange(key, label, value);
      });
      wrapper.append(caption, track, input);
      return wrapper;
    }

    render(sequencer) {
      const { id, name } = this.lane;
      const selected = sequencer.requested(id);
      const pending = sequencer.isPending(id);
      this.buttons.forEach((button, index) => {
        const active = selected === index + 1;
        button.setAttribute("aria-pressed", String(active));
        button.classList.toggle("pending", pending && active);
      });
      const shuffled = sequencer.requestedShuffle(id) !== 0;
      this.shuffle.textContent = "shuffle";
      this.shuffle.setAttribute("aria-pressed", String(shuffled));
      this.shuffle.setAttribute("aria-label", `${name}: ${shuffled ? "вернуть исходный ритм" : "перемешать ритм"}`);
      this.shuffle.classList.toggle("pending", sequencer.isShufflePending(id));
      this.solo.setAttribute("aria-pressed", String(sequencer.soloId === id));
      this.element.classList.toggle("solo-muted", sequencer.soloId !== null && sequencer.soloId !== id);
    }
  }

  WebSynth.ChannelView = ChannelView;
})();
