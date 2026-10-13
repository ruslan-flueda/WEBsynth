/** Browser entry point. All dependencies are deferred scripts in index.html. */
(() => {
  "use strict";

  const app = new WebSynth.App(document);
  let frameId = null;

  function animate() {
    app.sequencer.draw();
    // Expire temporary feedback even when playback is stopped.
    if (app.feedback && performance.now() >= app.feedback.until) {
      app.feedback = null;
      app.render();
    }
    frameId = requestAnimationFrame(animate);
  }

  window.addEventListener("pagehide", () => {
    app.sequencer.stop();
    cancelAnimationFrame(frameId);
    frameId = null;
  });
  window.addEventListener("pageshow", () => {
    if (frameId === null) animate();
  });
  animate();
})();
