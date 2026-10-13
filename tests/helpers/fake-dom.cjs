/** Minimal DOM for UI behavior tests; deliberately does not simulate layout. */
class Element {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.attributes = {};
    this.handlers = {};
    this.textContent = "";
    this.className = "";
    this.classList = {
      contains: (name) => this.className.split(" ").includes(name),
      add: (name) => this.classList.toggle(name, true),
      toggle: (name, enabled) => {
        const names = new Set(this.className.split(" ").filter(Boolean));
        if (enabled) names.add(name);
        else names.delete(name);
        this.className = [...names].join(" ");
      },
    };
  }

  append(...children) { this.children.push(...children); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name]; }
  addEventListener(type, handler) { (this.handlers[type] ??= []).push(handler); }
  async fire(type) {
    for (const handler of this.handlers[type] ?? []) await handler({ target: this });
  }
  descendants(tag) {
    return this.children.flatMap((child) => [
      ...(child.tagName === tag ? [child] : []), ...child.descendants(tag),
    ]);
  }
}

class FakeDocument {
  constructor() {
    this.elements = Object.fromEntries(["transport", "status", "tempo", "tempo-value", "channels"]
      .map((id) => [id, new Element("div")]));
  }
  createElement(tag) { return new Element(tag); }
  createElementNS(namespace, tag) { return new Element(tag); }
  querySelector(selector) { return this.elements[selector.slice(1)]; }
}

module.exports = { FakeDocument };
