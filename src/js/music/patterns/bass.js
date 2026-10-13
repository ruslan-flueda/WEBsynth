/** Four bars per variation. Index 0 means the channel is off. */
(() => {
  "use strict";

  const { event } = WebSynth;
  WebSynth.patterns.bass = [
    null,
    // 1: Main groove.
    [
      // Bar 1.
      [
        event(0, "bass", 38, 2, 0.94),
        event(3, "bass", 45, 1, 0.49),
        event(8, "bass", 38, 2, 0.83),
        event(11, "bass", 36, 1, 0.48),
        event(14, "bass", 45, 1, 0.57),
      ],
      // Bar 2.
      [
        event(0, "bass", 38, 2, 0.93),
        event(6, "bass", 45, 1, 0.52),
        event(8, "bass", 38, 2, 0.81),
        event(12, "bass", 36, 1, 0.48),
        event(15, "bass", 45, 1, 0.52),
      ],
      // Bar 3.
      [
        event(0, "bass", 38, 2, 0.94),
        event(3, "bass", 45, 1, 0.5),
        event(8, "bass", 38, 2, 0.84),
        event(11, "bass", 34, 1, 0.5),
        event(14, "bass", 45, 1, 0.56),
      ],
      // Bar 4.
      [
        event(0, "bass", 38, 2, 0.96),
        event(6, "bass", 45, 1, 0.5),
        event(8, "bass", 38, 2, 0.83),
        event(12, "bass", 36, 1, 0.5),
        event(15, "bass", 38, 1, 0.58),
      ],
    ],
    // 2: Syncopated groove.
    [
      // Bar 1.
      [
        event(0, "bass", 38, 2, 0.93),
        event(4, "bass", 38, 1, 0.55),
        event(7, "bass", 45, 1, 0.49),
        event(10, "bass", 38, 2, 0.82),
        event(14, "bass", 36, 1, 0.5),
      ],
      // Bar 2.
      [
        event(0, "bass", 38, 2, 0.94),
        event(3, "bass", 45, 1, 0.47),
        event(6, "bass", 38, 1, 0.58),
        event(10, "bass", 38, 2, 0.84),
        event(14, "bass", 36, 1, 0.5),
      ],
      // Bar 3.
      [
        event(0, "bass", 38, 2, 0.94),
        event(4, "bass", 38, 1, 0.57),
        event(7, "bass", 45, 1, 0.5),
        event(10, "bass", 38, 2, 0.83),
        event(14, "bass", 34, 1, 0.52),
      ],
      // Bar 4.
      [
        event(0, "bass", 38, 2, 0.96),
        event(3, "bass", 45, 1, 0.48),
        event(6, "bass", 38, 1, 0.58),
        event(10, "bass", 38, 2, 0.83),
        event(14, "bass", 36, 1, 0.52),
      ],
    ],
    // 3: Long notes.
    [
      // Bar 1.
      [
        event(0, "bass", 38, 3, 0.9),
        event(7, "bass", 45, 1, 0.49),
        event(9, "bass", 38, 2, 0.81),
        event(14, "bass", 41, 1, 0.46),
      ],
      // Bar 2.
      [
        event(0, "bass", 38, 2, 0.88),
        event(5, "bass", 36, 1, 0.49),
        event(9, "bass", 38, 2, 0.82),
        event(13, "bass", 45, 2, 0.52),
      ],
      // Bar 3.
      [
        event(0, "bass", 38, 3, 0.91),
        event(6, "bass", 45, 1, 0.48),
        event(10, "bass", 34, 2, 0.68),
        event(14, "bass", 38, 2, 0.54),
      ],
      // Bar 4.
      [
        event(0, "bass", 38, 2, 0.94),
        event(7, "bass", 41, 1, 0.51),
        event(9, "bass", 38, 2, 0.83),
        event(13, "bass", 45, 1, 0.57),
      ],
    ],
  ];
})();
