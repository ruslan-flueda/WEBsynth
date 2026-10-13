/** Four bars per variation. Index 0 means the channel is off. */
(() => {
  "use strict";

  const { event } = WebSynth;
  WebSynth.patterns.bells = [
    null,
    // 1: Bells.
    [
      // Bar 1.
      [
        event(2, "bell", 86, 1, 0.55),
        event(10, "bell", 81, 1, 0.39),
      ],
      // Bar 2.
      [
        event(6, "bell", 84, 1, 0.48),
        event(14, "bell", 79, 1, 0.35),
      ],
      // Bar 3.
      [
        event(3, "bell", 86, 1, 0.5),
        event(11, "bell", 81, 1, 0.42),
      ],
      // Bar 4.
      [
        event(7, "bell", 84, 1, 0.45),
        event(15, "bell", 74, 1, 0.44),
      ],
    ],
    // 2: Cowbell.
    [
      // Bar 1.
      [
        event(0, "cowbell", 74, 1, 0.55),
        event(6, "cowbell", 77, 1, 0.42),
        event(10, "cowbell", 74, 1, 0.51),
        event(14, "cowbell", 79, 1, 0.38),
      ],
      // Bar 2.
      [
        event(0, "cowbell", 74, 1, 0.53),
        event(5, "cowbell", 79, 1, 0.43),
        event(10, "cowbell", 74, 1, 0.52),
        event(15, "cowbell", 77, 1, 0.41),
      ],
      // Bar 3.
      [
        event(0, "cowbell", 74, 1, 0.57),
        event(6, "cowbell", 77, 1, 0.44),
        event(11, "cowbell", 74, 1, 0.5),
        event(14, "cowbell", 81, 1, 0.39),
      ],
      // Bar 4.
      [
        event(0, "cowbell", 74, 1, 0.55),
        event(5, "cowbell", 79, 1, 0.43),
        event(10, "cowbell", 77, 1, 0.46),
        event(15, "cowbell", 74, 1, 0.55),
      ],
    ],
    // 3: Bells and cowbell.
    [
      // Bar 1.
      [
        event(1, "bell", 86, 1, 0.47),
        event(9, "bell", 81, 1, 0.38),
        event(13, "cowbell", 74, 1, 0.29),
      ],
      // Bar 2.
      [
        event(3, "cowbell", 74, 1, 0.4),
        event(7, "bell", 84, 1, 0.51),
        event(15, "bell", 79, 1, 0.31),
      ],
      // Bar 3.
      [
        event(2, "bell", 86, 1, 0.44),
        event(11, "bell", 81, 1, 0.37),
        event(14, "cowbell", 77, 1, 0.29),
      ],
      // Bar 4.
      [
        event(0, "cowbell", 74, 1, 0.38),
        event(6, "bell", 84, 1, 0.47),
        event(14, "bell", 86, 1, 0.4),
      ],
    ],
  ];
})();
