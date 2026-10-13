const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "../..");

function loadApp(overrides = {}, directory = "src") {
  const timers = new Map();
  let timerId = 0;
  const sandbox = {
    performance: { now: () => 0 },
    setInterval(callback) {
      const id = ++timerId;
      timers.set(id, callback);
      return id;
    },
    clearInterval(id) { timers.delete(id); },
    ...overrides,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  const root = path.join(projectRoot, directory);
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const scripts = [...html.matchAll(/<script defer src="([^"]+)"/g)].map((match) => match[1]);
  for (const file of scripts.filter((file) => file !== "js/main.js")) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file });
  }
  const runMain = () => vm.runInContext(
    fs.readFileSync(path.join(root, "js/main.js"), "utf8"), sandbox, { filename: "js/main.js" },
  );
  return { app: sandbox.WebSynth, sandbox, timers, scripts, runMain };
}

module.exports = { loadApp, projectRoot };
