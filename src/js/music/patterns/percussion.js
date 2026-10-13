/** Four bars per variation. Index 0 means the channel is off. */
(() => {
  "use strict";

  const { event } = WebSynth;
  WebSynth.patterns.percussion = [
    null,
    // 1: Low and edge strokes.
    [
      // Bar 1.
      [
        event(0, "dum", null, 1, 1),
        event(3, "tak", null, 1, 0.57),
        event(6, "slap", null, 1, 0.75),
        event(8, "dum", null, 1, 0.88),
        event(11, "tak", null, 1, 0.53),
        event(14, "slap", null, 1, 0.77),
      ],
      // Bar 2.
      [
        event(0, "dum", null, 1, 0.94),
        event(3, "tak", null, 1, 0.53),
        event(6, "tak", null, 1, 0.72),
        event(8, "dum", null, 1, 0.86),
        event(11, "tak", null, 1, 0.54),
        event(14, "slap", null, 1, 0.81),
      ],
      // Bar 3.
      [
        event(0, "dum", null, 1, 1),
        event(3, "tak", null, 1, 0.57),
        event(6, "slap", null, 1, 0.77),
        event(8, "dum", null, 1, 0.88),
        event(11, "tak", null, 1, 0.53),
        event(14, "slap", null, 1, 0.8),
      ],
      // Bar 4.
      [
        event(0, "dum", null, 1, 0.95),
        event(3, "tak", null, 1, 0.55),
        event(6, "slap", null, 1, 0.78),
        event(8, "dum", null, 1, 0.86),
        event(11, "tak", null, 1, 0.55),
        event(14, "slap", null, 1, 0.87),
        event(15, "jingle", null, 1, 0.39),
      ],
    ],
    // 2: Jingle accents.
    [
      // Bar 1.
      [
        event(0, "dum", null, 1, 1),
        event(2, "jingle", null, 1, 0.3),
        event(3, "tak", null, 1, 0.56),
        event(6, "slap", null, 1, 0.82),
        event(7, "jingle", null, 1, 0.34),
        event(8, "dum", null, 1, 0.85),
        event(11, "tak", null, 1, 0.55),
        event(14, "slap", null, 1, 0.83),
      ],
      // Bar 2.
      [
        event(0, "dum", null, 1, 0.95),
        event(3, "tak", null, 1, 0.56),
        event(5, "jingle", null, 1, 0.29),
        event(6, "slap", null, 1, 0.78),
        event(8, "dum", null, 1, 0.83),
        event(10, "jingle", null, 1, 0.28),
        event(11, "tak", null, 1, 0.55),
        event(14, "slap", null, 1, 0.85),
      ],
      // Bar 3.
      [
        event(0, "dum", null, 1, 1),
        event(2, "jingle", null, 1, 0.3),
        event(3, "tak", null, 1, 0.56),
        event(6, "slap", null, 1, 0.84),
        event(7, "jingle", null, 1, 0.34),
        event(8, "dum", null, 1, 0.87),
        event(11, "tak", null, 1, 0.57),
        event(14, "slap", null, 1, 0.86),
      ],
      // Bar 4.
      [
        event(0, "dum", null, 1, 0.96),
        event(3, "tak", null, 1, 0.58),
        event(6, "slap", null, 1, 0.85),
        event(7, "jingle", null, 1, 0.36),
        event(8, "dum", null, 1, 0.86),
        event(11, "tak", null, 1, 0.57),
        event(13, "jingle", null, 1, 0.28),
        event(14, "slap", null, 1, 0.9),
        event(15, "jingle", null, 1, 0.43),
      ],
    ],
    // 3: Sparse response.
    [
      // Bar 1.
      [
        event(0, "dum", null, 1, 0.95),
        event(5, "tak", null, 1, 0.48),
        event(9, "slap", null, 1, 0.72),
        event(13, "jingle", null, 1, 0.34),
      ],
      // Bar 2.
      [
        event(0, "dum", null, 1, 0.86),
        event(3, "jingle", null, 1, 0.31),
        event(7, "tak", null, 1, 0.52),
        event(12, "slap", null, 1, 0.75),
      ],
      // Bar 3.
      [
        event(0, "dum", null, 1, 0.96),
        event(6, "slap", null, 1, 0.76),
        event(10, "tak", null, 1, 0.5),
        event(15, "jingle", null, 1, 0.38),
      ],
      // Bar 4.
      [
        event(0, "dum", null, 1, 0.91),
        event(4, "tak", null, 1, 0.51),
        event(9, "slap", null, 1, 0.8),
        event(14, "jingle", null, 1, 0.42),
      ],
    ],
  ];
})();
