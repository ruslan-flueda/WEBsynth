/** Four bars per variation. Index 0 means the channel is off. */
(() => {
  "use strict";

  const { event } = WebSynth;
  WebSynth.patterns.chords = [
    null,
    // 1: Sustained chord pulses.
    [
      // Bar 1.
      [
        event(0, "chord", [50, 57, 64], 5, 0.55),
        event(8, "chord", [50, 57, 64], 5, 0.45),
      ],
      // Bar 2.
      [
        event(0, "chord", [50, 60, 64], 5, 0.55),
        event(8, "chord", [50, 60, 64], 5, 0.45),
      ],
      // Bar 3.
      [
        event(0, "chord", [50, 58, 65], 5, 0.55),
        event(8, "chord", [50, 58, 65], 5, 0.45),
      ],
      // Bar 4.
      [
        event(0, "chord", [50, 57, 64], 5, 0.55),
        event(8, "chord", [50, 57, 64], 5, 0.45),
      ],
    ],
    // 2: Short chords and arpeggio.
    [
      // Bar 1.
      [
        event(2, "chord", [50, 57, 64], 2, 0.57),
        event(10, "chord", [50, 57, 64], 2, 0.52),
        event(14, "arp", 74, 1, 0.43),
      ],
      // Bar 2.
      [
        event(2, "chord", [50, 60, 64], 2, 0.57),
        event(10, "chord", [50, 60, 64], 2, 0.52),
        event(14, "arp", 74, 1, 0.43),
      ],
      // Bar 3.
      [
        event(2, "chord", [50, 58, 65], 2, 0.57),
        event(10, "chord", [50, 58, 65], 2, 0.52),
        event(14, "arp", 74, 1, 0.43),
      ],
      // Bar 4.
      [
        event(2, "chord", [50, 57, 64], 2, 0.57),
        event(10, "chord", [50, 57, 64], 2, 0.52),
        event(14, "arp", 74, 1, 0.43),
      ],
    ],
    // 3: Long chords and response.
    [
      // Bar 1.
      [
        event(0, "chord", [50, 57, 64], 6, 0.39),
        event(6, "arp", 69, 2, 0.42),
        event(12, "chord", [50, 57, 64], 4, 0.47),
      ],
      // Bar 2.
      [
        event(0, "chord", [50, 60, 64], 6, 0.39),
        event(6, "arp", 72, 2, 0.42),
        event(12, "chord", [50, 60, 64], 4, 0.47),
      ],
      // Bar 3.
      [
        event(0, "chord", [50, 58, 65], 6, 0.39),
        event(6, "arp", 70, 2, 0.42),
        event(12, "chord", [50, 58, 65], 4, 0.47),
      ],
      // Bar 4.
      [
        event(0, "chord", [50, 57, 64], 6, 0.39),
        event(6, "arp", 69, 2, 0.42),
        event(12, "chord", [50, 57, 64], 4, 0.47),
      ],
    ],
  ];
})();
