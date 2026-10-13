/** Four bars per variation. Index 0 means the channel is off. */
(() => {
  "use strict";

  const { event } = WebSynth;
  WebSynth.patterns.drums = [
    null,
    // 1: Straight pulse.
    [
      // Bar 1.
      [
        event(0, "kick", null, 1, 1),
        event(4, "kick", null, 1, 0.77),
        event(8, "kick", null, 1, 0.77),
        event(12, "kick", null, 1, 0.77),
        event(4, "rim", null, 1, 0.78),
        event(12, "rim", null, 1, 0.78),
        event(2, "hat", null, 1, 0.68),
        event(6, "hat", null, 1, 0.68),
        event(10, "hat", null, 1, 0.68),
        event(14, "hat", null, 1, 0.68),
      ],
      // Bar 2.
      [
        event(0, "kick", null, 1, 1),
        event(4, "kick", null, 1, 0.77),
        event(8, "kick", null, 1, 0.77),
        event(12, "kick", null, 1, 0.77),
        event(15, "kick", null, 1, 0.77),
        event(4, "rim", null, 1, 0.78),
        event(12, "rim", null, 1, 0.78),
        event(2, "hat", null, 1, 0.68),
        event(6, "hat", null, 1, 0.68),
        event(10, "hat", null, 1, 0.68),
        event(14, "hat", null, 1, 0.68),
      ],
      // Bar 3.
      [
        event(0, "kick", null, 1, 1),
        event(4, "kick", null, 1, 0.77),
        event(7, "kick", null, 1, 0.77),
        event(8, "kick", null, 1, 0.77),
        event(12, "kick", null, 1, 0.77),
        event(4, "rim", null, 1, 0.78),
        event(12, "rim", null, 1, 0.78),
        event(2, "hat", null, 1, 0.68),
        event(6, "hat", null, 1, 0.68),
        event(10, "hat", null, 1, 0.68),
        event(14, "hat", null, 1, 0.68),
      ],
      // Bar 4.
      [
        event(0, "kick", null, 1, 1),
        event(4, "kick", null, 1, 0.77),
        event(8, "kick", null, 1, 0.77),
        event(12, "kick", null, 1, 0.77),
        event(15, "kick", null, 1, 0.77),
        event(4, "rim", null, 1, 0.78),
        event(12, "rim", null, 1, 0.78),
        event(2, "hat", null, 1, 0.68),
        event(6, "hat", null, 1, 0.68),
        event(10, "hat", null, 1, 0.68),
        event(14, "hat", null, 1, 0.68),
        event(15, "hat", null, 1, 0.48),
      ],
    ],
    // 2: Broken beat.
    [
      // Bar 1.
      [
        event(0, "kick", null, 1, 1),
        event(3, "kick", null, 1, 0.77),
        event(8, "kick", null, 1, 0.77),
        event(10, "kick", null, 1, 0.77),
        event(14, "kick", null, 1, 0.77),
        event(4, "rim", null, 1, 0.78),
        event(12, "rim", null, 1, 0.78),
        event(2, "hat", null, 1, 0.68),
        event(5, "hat", null, 1, 0.48),
        event(6, "hat", null, 1, 0.68),
        event(9, "hat", null, 1, 0.48),
        event(11, "hat", null, 1, 0.48),
        event(15, "hat", null, 1, 0.48),
      ],
      // Bar 2.
      [
        event(0, "kick", null, 1, 1),
        event(6, "kick", null, 1, 0.77),
        event(8, "kick", null, 1, 0.77),
        event(11, "kick", null, 1, 0.77),
        event(14, "kick", null, 1, 0.77),
        event(4, "rim", null, 1, 0.78),
        event(12, "rim", null, 1, 0.78),
        event(2, "hat", null, 1, 0.68),
        event(5, "hat", null, 1, 0.48),
        event(7, "hat", null, 1, 0.48),
        event(10, "hat", null, 1, 0.68),
        event(14, "hat", null, 1, 0.68),
        event(15, "hat", null, 1, 0.48),
      ],
      // Bar 3.
      [
        event(0, "kick", null, 1, 1),
        event(3, "kick", null, 1, 0.77),
        event(8, "kick", null, 1, 0.77),
        event(10, "kick", null, 1, 0.77),
        event(14, "kick", null, 1, 0.77),
        event(4, "rim", null, 1, 0.78),
        event(12, "rim", null, 1, 0.78),
        event(2, "hat", null, 1, 0.68),
        event(5, "hat", null, 1, 0.48),
        event(6, "hat", null, 1, 0.68),
        event(9, "hat", null, 1, 0.48),
        event(11, "hat", null, 1, 0.48),
        event(15, "hat", null, 1, 0.48),
      ],
      // Bar 4.
      [
        event(0, "kick", null, 1, 1),
        event(6, "kick", null, 1, 0.77),
        event(8, "kick", null, 1, 0.77),
        event(11, "kick", null, 1, 0.77),
        event(15, "kick", null, 1, 0.77),
        event(4, "rim", null, 1, 0.78),
        event(12, "rim", null, 1, 0.78),
        event(2, "hat", null, 1, 0.68),
        event(6, "hat", null, 1, 0.68),
        event(7, "hat", null, 1, 0.48),
        event(10, "hat", null, 1, 0.68),
        event(14, "hat", null, 1, 0.68),
        event(15, "hat", null, 1, 0.48),
      ],
    ],
    // 3: Spacious half-time.
    [
      // Bar 1.
      [
        event(0, "kick", null, 1, 1),
        event(7, "kick", null, 1, 0.77),
        event(8, "kick", null, 1, 0.77),
        event(14, "kick", null, 1, 0.77),
        event(4, "rim", null, 1, 0.78),
        event(12, "rim", null, 1, 0.78),
        event(2, "hat", null, 1, 0.68),
        event(5, "hat", null, 1, 0.48),
        event(10, "hat", null, 1, 0.68),
        event(13, "hat", null, 1, 0.48),
      ],
      // Bar 2.
      [
        event(0, "kick", null, 1, 1),
        event(6, "kick", null, 1, 0.77),
        event(8, "kick", null, 1, 0.77),
        event(15, "kick", null, 1, 0.77),
        event(4, "rim", null, 1, 0.78),
        event(12, "rim", null, 1, 0.78),
        event(2, "hat", null, 1, 0.68),
        event(6, "hat", null, 1, 0.68),
        event(11, "hat", null, 1, 0.48),
        event(14, "hat", null, 1, 0.68),
      ],
      // Bar 3.
      [
        event(0, "kick", null, 1, 1),
        event(7, "kick", null, 1, 0.77),
        event(8, "kick", null, 1, 0.77),
        event(13, "kick", null, 1, 0.77),
        event(4, "rim", null, 1, 0.78),
        event(12, "rim", null, 1, 0.78),
        event(2, "hat", null, 1, 0.68),
        event(5, "hat", null, 1, 0.48),
        event(10, "hat", null, 1, 0.68),
        event(15, "hat", null, 1, 0.48),
      ],
      // Bar 4.
      [
        event(0, "kick", null, 1, 1),
        event(6, "kick", null, 1, 0.77),
        event(8, "kick", null, 1, 0.77),
        event(14, "kick", null, 1, 0.77),
        event(15, "kick", null, 1, 0.77),
        event(4, "rim", null, 1, 0.78),
        event(12, "rim", null, 1, 0.78),
        event(2, "hat", null, 1, 0.68),
        event(6, "hat", null, 1, 0.68),
        event(11, "hat", null, 1, 0.48),
        event(14, "hat", null, 1, 0.68),
      ],
    ],
  ];
})();
