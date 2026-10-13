/** Build and update one channel card. Musical state is owned by the sequencer. */
(() => {
  "use strict";

  const melodyShapes = [
    null,
    { name: "Дуга", path: "M3 18 Q16 2 29 18" },
    { name: "Зигзаг", path: "M3 17 L9 5 L16 18 L23 5 L29 14" },
    {
      name: "Четыре точки",
      path: "M3 17 L11 8 L20 15 L29 5",
      points: [[3, 17], [11, 8], [20, 15], [29, 5]],
    },
  ];

  class ChannelView {
    constructor(document, lane, handlers) {
      this.document = document;
      this.lane = lane;
      this.element = this.create("div", "channel");
      this.element.dataset.channel = lane.id;
      const label = this.create("span", "channel-name", lane.name);
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
      this.shuffle = this.createButton("action-button shuffle-button", "SHUFFLE");
      this.shuffle.addEventListener("click", handlers.shuffle);
      this.solo = this.createButton("action-button solo-button", "SOLO");
      this.solo.setAttribute("aria-label", `${lane.name}: слушать только этот канал`);
      this.solo.addEventListener("click", handlers.solo);
      actions.append(this.shuffle, this.solo);
      this.element.append(label, choices, sliders, actions);
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
      return this.lane.id === "melody"
        ? melodyShapes[variation].name
        : `Паттерн ${variation}`;
    }

    createPatternButton(variation) {
      const button = this.createButton("choice");
      const label = `${this.lane.name}: ${this.patternName(variation)}`;
      button.setAttribute("aria-label", label);
      button.title = label;
      if (this.lane.id === "melody") {
        button.classList.add("shape-choice");
        button.append(this.createShape(melodyShapes[variation]));
      } else {
        button.textContent = String(variation);
      }
      return button;
    }

    createShape(shape) {
      const namespace = "http://www.w3.org/2000/svg";
      const svg = this.document.createElementNS(namespace, "svg");
      svg.setAttribute("viewBox", "0 0 32 24");
      svg.setAttribute("aria-hidden", "true");
      const path = this.document.createElementNS(namespace, "path");
      path.setAttribute("d", shape.path);
      svg.append(path);
      for (const [x, y] of shape.points ?? []) {
        const dot = this.document.createElementNS(namespace, "circle");
        dot.setAttribute("cx", x);
        dot.setAttribute("cy", y);
        dot.setAttribute("r", "1.8");
        svg.append(dot);
      }
      return svg;
    }

    createSlider({ key, label, initial }, onChange) {
      const wrapper = this.create("label", "slider");
      wrapper.title = `${this.lane.name} · ${label}`;
      const fill = this.create("span", "slider-fill");
      fill.style.width = `${initial}%`;
      const input = this.document.createElement("input");
      input.type = "range";
      input.min = "0";
      input.max = "100";
      input.step = "1";
      input.value = String(initial);
      input.setAttribute("aria-label", `${this.lane.name}: ${label}`);
      input.addEventListener("input", () => {
        const value = Number(input.value);
        fill.style.width = `${value}%`;
        onChange(key, label, value);
      });
      wrapper.append(fill, input);
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
      this.shuffle.textContent = shuffled ? "ORIGINAL" : "SHUFFLE";
      this.shuffle.setAttribute("aria-pressed", String(shuffled));
      this.shuffle.setAttribute("aria-label", `${name}: ${shuffled ? "вернуть исходный ритм" : "перемешать ритм"}`);
      this.shuffle.classList.toggle("pending", sequencer.isShufflePending(id));
      this.solo.setAttribute("aria-pressed", String(sequencer.soloId === id));
      this.element.classList.toggle("solo-muted", sequencer.soloId !== null && sequencer.soloId !== id);
    }
  }

  WebSynth.ChannelView = ChannelView;
})();
