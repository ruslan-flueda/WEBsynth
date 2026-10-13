/** Four bars per variation. Index 0 means the channel is off. */
(() => {
  "use strict";

  const { event } = WebSynth;
  WebSynth.patterns.winds = [
    null,
    // 1: Long phrases.
    [
      // Bar 1.
      [
        event(2, "wind", 74, 5, 0.67),
        event(10, "wind", 77, 4, 0.55),
      ],
      // Bar 2.
      [
        event(3, "wind", 79, 5, 0.61),
        event(11, "wind", 77, 4, 0.49),
      ],
      // Bar 3.
      [
        event(1, "wind", 76, 5, 0.58),
        event(9, "wind", 81, 5, 0.61),
      ],
      // Bar 4.
      [
        event(2, "wind", 77, 4, 0.59),
        event(10, "wind", 74, 6, 0.73),
      ],
    ],
    // 2: Short phrases.
    [
      // Bar 1.
      [
        event(0, "wind", 74, 2, 0.65),
        event(5, "wind", 77, 2, 0.54),
        event(11, "wind", 79, 3, 0.58),
      ],
      // Bar 2.
      [
        event(2, "wind", 81, 2, 0.62),
        event(7, "wind", 79, 2, 0.52),
        event(12, "wind", 77, 3, 0.56),
      ],
      // Bar 3.
      [
        event(0, "wind", 76, 2, 0.59),
        event(6, "wind", 77, 2, 0.57),
        event(11, "wind", 81, 3, 0.63),
      ],
      // Bar 4.
      [
        event(1, "wind", 79, 2, 0.6),
        event(6, "wind", 77, 2, 0.57),
        event(12, "wind", 74, 4, 0.72),
      ],
    ],
    // 3: Displaced phrases.
    [
      // Bar 1.
      [
        event(4, "wind", 77, 6, 0.62),
        event(12, "wind", 81, 4, 0.53),
      ],
      // Bar 2.
      [
        event(0, "wind", 79, 6, 0.57),
        event(9, "wind", 76, 5, 0.5),
      ],
      // Bar 3.
      [
        event(3, "wind", 74, 6, 0.66),
        event(11, "wind", 77, 5, 0.55),
      ],
      // Bar 4.
      [
        event(1, "wind", 81, 5, 0.54),
        event(9, "wind", 74, 7, 0.73),
      ],
    ],
  ];
})();
