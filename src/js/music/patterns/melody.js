/** Four bars per variation. Index 0 means the channel is off. */
(() => {
  "use strict";

  const { event } = WebSynth;
  WebSynth.patterns.melody = [
    null,
    // 1: Arc.
    [
      // Bar 1.
      [
        event(2, "melody", 74, 2, 0.82),
        event(7, "melody", 77, 2, 0.68),
        event(12, "melody", 76, 3, 0.72),
      ],
      // Bar 2.
      [
        event(2, "melody", 74, 2, 0.78),
        event(8, "melody", 79, 2, 0.76),
        event(13, "melody", 77, 2, 0.65),
      ],
      // Bar 3.
      [
        event(1, "melody", 76, 2, 0.73),
        event(6, "melody", 77, 2, 0.68),
        event(11, "melody", 79, 3, 0.78),
      ],
      // Bar 4.
      [
        event(2, "melody", 77, 2, 0.68),
        event(7, "melody", 76, 2, 0.7),
        event(12, "melody", 74, 4, 0.88),
      ],
    ],
    // 2: Zigzag.
    [
      // Bar 1.
      [
        event(1, "melody", 74, 1, 0.83),
        event(4, "melody", 81, 2, 0.63),
        event(7, "melody", 76, 1, 0.76),
        event(10, "melody", 79, 2, 0.72),
        event(14, "melody", 77, 2, 0.57),
      ],
      // Bar 2.
      [
        event(0, "melody", 77, 1, 0.72),
        event(3, "melody", 84, 1, 0.56),
        event(6, "melody", 76, 2, 0.78),
        event(11, "melody", 81, 1, 0.69),
        event(14, "melody", 74, 2, 0.75),
      ],
      // Bar 3.
      [
        event(1, "melody", 74, 1, 0.84),
        event(5, "melody", 79, 1, 0.72),
        event(7, "melody", 76, 2, 0.67),
        event(10, "melody", 84, 1, 0.58),
        event(13, "melody", 77, 3, 0.68),
      ],
      // Bar 4.
      [
        event(0, "melody", 81, 1, 0.7),
        event(3, "melody", 76, 2, 0.75),
        event(7, "melody", 79, 1, 0.68),
        event(10, "melody", 77, 2, 0.64),
        event(13, "melody", 74, 3, 0.88),
      ],
    ],
    // 3: Four points.
    [
      // Bar 1.
      [
        event(0, "melody", 74, 1, 0.93),
        event(3, "melody", 77, 1, 0.58),
        event(9, "melody", 81, 1, 0.7),
        event(14, "melody", 76, 2, 0.63),
      ],
      // Bar 2.
      [
        event(1, "melody", 74, 1, 0.83),
        event(6, "melody", 79, 1, 0.71),
        event(10, "melody", 77, 1, 0.64),
        event(15, "melody", 76, 1, 0.48),
      ],
      // Bar 3.
      [
        event(0, "melody", 76, 1, 0.69),
        event(4, "melody", 84, 1, 0.57),
        event(11, "melody", 79, 1, 0.72),
        event(14, "melody", 77, 2, 0.58),
      ],
      // Bar 4.
      [
        event(2, "melody", 81, 1, 0.7),
        event(7, "melody", 77, 1, 0.63),
        event(10, "melody", 76, 1, 0.59),
        event(14, "melody", 74, 2, 0.96),
      ],
    ],
  ];
})();
