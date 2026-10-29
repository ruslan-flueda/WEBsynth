/** Pixel ASCII renderer. A cell buffer keeps silhouettes solid and glyphs aligned. */
(() => {
  'use strict';
  const { hash, smooth, mix, clamp } = WebSynth.WorldMath;
  const walk = [
    ['   /~    ', '  /==\\   ', '  |--|   ', ' )/##\\ + ', ' )|##|=|=', '  /==\\ | ', ' /|  >   ', '/_   |_  '],
    ['   /~    ', '  /==\\   ', '  |--|   ', ' )/##\\ + ', ' )|##|=|=', '  /==\\ | ', '  |> |   ', '  /_ |_  '],
    ['   /~    ', '  /==\\   ', '  |--|   ', ' )/##\\ + ', ' )|##|=|=', '  /==\\ | ', '  <  |\\  ', ' _|   _\\ '],
    ['   /~    ', '  /==\\   ', '  |--|   ', ' )/##\\ + ', ' )|##|=|=', '  /==\\ | ', '  | <|   ', ' _|  _\\  '],
  ];
  const climb = [
    ['   /~  / ', '  /==\\ | ', '  |--|/  ', ' )/##|   ', ' )|##|   ', '  /==\\   ', ' /|  |   ', ' _|  /_  '],
    [' \\ /~    ', ' |/==\\   ', '  |--|   ', '  |##\\(  ', '  |##|(  ', '  /==\\   ', '  |  |\\  ', '  \\_ |_  '],
  ];
  const poses = {
    trade: ['   /~     ', '  /==\\    ', '  |--|    ', ' )/##\\___ ', ' )|##|    ', '  /==\\    ', '  |  |    ', ' _|  |_   '],
    ready: ['   /~    ', '  /==\\   ', '  |--| + ', ' )/##\\ | ', ' )|##|=+=', '  /==\\ | ', '  |  |   ', ' _|  |_  '],
    guard: ['    /~ ___ ', '   /==/+++\\', '   |--|+#+|', '  /###|+#+|', '  |###\\++/ ', '  /===\\ V  ', ' /|   |    ', '/_|   |_   '],
    bow: ['   /~    ) ', '  /==\\  |)', '  |--|\\ |)', '  /##|--+->', '  |##| / |)', '  /==\\  |)', '  |  |   ) ', ' _|  |_    '],
    strike: ['   /~       ', '  /==\\   /  ', '  |--|  /   ', ' )/##\\=+    ', ' )|##|  \\   ', '  /==\\      ', ' /|   >     ', '/_|   |_    '],
    kindle: ['   /~      ', '  /==\\     ', '  |--|     ', '  /##\\_    ', ' /###/ +   ', '_/==/___   '],
    sit: ['   /~      ', '  /==\\     ', '  |--|     ', '  /##|_    ', ' (###|_\\   ', ' _/==___>  '],
  };

  class AsciiWorld {
    constructor(canvas, sequencer) {
      this.canvas = canvas;
      this.ctx = canvas?.getContext?.('2d', { alpha: false });
      this.seq = sequencer;
      this.state = new WebSynth.WorldState();
      this.last = 0;
      this.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      if (this.ctx) this.font = new WebSynth.PixelFont();
    }
    resize() {
      const w = window.innerWidth, h = window.innerHeight, dpr = window.devicePixelRatio || 1;
      if (w === this.w && h === this.h && dpr === this.dpr) return;
      this.w = w; this.h = h; this.dpr = dpr;
      this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
      // Integer physical blocks remain sharp at fractional browser zoom as well as Retina.
      this.unit = Math.max(1, Math.round(dpr));
      this.cw = 8 * this.unit; this.ch = 11 * this.unit;
      this.cols = Math.ceil(this.canvas.width / this.cw); this.rows = Math.ceil(this.canvas.height / this.ch);
      this.chars = new Uint8Array(this.cols * this.rows);
      this.colors = new Uint8Array(this.chars.length);
      this.ctx.imageSmoothingEnabled = false;
    }
    put(char, x, y, color = 96) {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
      const i = y * this.cols + x;
      this.chars[i] = char.charCodeAt(0); this.colors[i] = color;
    }
    text(text, x, y, color = 96) { [...text].forEach((c, i) => this.put(c, x + i, y, color)); }
    sprite(lines, x, y, color = 96, clear = false) {
      lines.forEach((line, row) => [...line].forEach((c, col) => {
        if (c !== ' ' || clear) this.put(c, x + col, y + row, typeof color === 'function' ? color(col, row) : color);
      }));
    }
    ink(hue, shade, x = 0, y = 0) {
      const s = this.state;
      // Full ensemble launches a travelling spectrum, not a whole-screen flash.
      const wave = s.color > .7 ? (s.time * 13 + x * 1.2 + y * 2 + Math.sin(x * .06 + s.time) * 25) * smooth((s.color - .7) / .3) : 0;
      hue = ((hue + wave) % 360 + 360) % 360;
      return (Math.round(hue / 15) % 24) * 4 + Math.round(clamp(shade + (s.effects.tone - .5) * 1.5, 0, 3));
    }
    line(x1, y1, x2, y2, char, color) {
      const n = Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)));
      for (let i = 0; i <= n; i++) this.put(char, mix(x1, x2, i / (n || 1)), mix(y1, y2, i / (n || 1)), color);
    }
    ground(x) {
      const z = x + this.state.travel;
      return Math.round(this.rows * .87 + Math.sin(z * .035) * 1.8 + Math.sin(z * .083) * .7);
    }
    update(now) {
      if (!this.ctx || document.hidden) { this.last = now; return; }
      if (now - this.last < 1000 / 30) return;
      const dt = Math.min(.08, (now - (this.last || now)) / 1000);
      this.last = now; this.resize();
      this.state.update(dt, this.seq, !!this.reduced?.matches);
      this.font.palette(this.state.color);
      this.draw();
    }
    sky() {
      const s = this.state, { cols, rows } = this;
      for (let i = 0; i < 100; i++) {
        const x = (hash(i * 3) * cols - s.travel * .08 % cols + cols) % cols;
        const y = hash(i + 40) * rows * .81;
        const twinkle = s.effects.shimmer * Math.sin(s.time * 1.5 + i);
        this.put(i % 14 === 0 ? '+' : '.', x, y, this.ink(190 + i, y < rows * .35 ? 0 : 1 + (twinkle > .4 ? 1 : 0), x, y));
      }
      // Long ribbons emerge with reverb; they are made of sparse symbols, never blur.
      for (let band = 0; band < 1 + Math.floor(s.effects.space * 4); band++) {
        for (let x = 0; x < cols; x += 2) {
          const y = rows * .44 + Math.sin(x * .035 + band * .8 + s.time * .13) * 3 + band * 2;
          this.put('~', x, y, this.ink(190 + band * 25, band ? 0 : 1, x, y));
        }
      }
    }
    rockFloor(offset, mine = false) {
      const s = this.state;
      for (let x = 0; x < this.cols; x++) {
        const top = this.ground(x) + offset;
        const wx = Math.floor(x + s.travel);
        this.put(wx % 5 ? '=' : '"', x, top, this.ink(mine ? 30 : 80, 3, x, top));
        for (let y = Math.max(0, top + 1); y < Math.min(this.rows, top + 18); y++) {
          const depth = y - top, h = hash(wx * 11 + depth * 31);
          const vein = Math.sin(wx * .13 + depth * .9) > .82;
          if (h > .34 || depth < 3) this.put(vein ? ':' : h > .82 ? '%' : h > .6 ? ';' : '.', x, y,
            this.ink(vein ? 165 : mine ? 25 : 38, depth < 3 ? 2 : vein ? 2 : 1, x, y));
          if (s.effects.grit > .55 && (wx + depth * 3) % 23 === 0) this.put('/', x, y, this.ink(10, 2, x, y));
        }
      }
    }
    tree(x, base, seed, distant = false) {
      const s = this.state;
      const height = 12 + Math.floor(hash(seed) * 11), width = 4 + hash(seed + 2) * 5;
      const bend = Math.sin(s.time * 1.1 + seed) * s.effects.sway * 1.5;
      const hue = 110 + hash(seed + 4) * 45;
      for (let y = 0; y < height; y++) {
        const u = y / height;
        const center = x + bend * (1 - u);
        const radius = Math.sin(u * Math.PI) * width * (.7 + hash(seed + Math.floor(y / 3)) * .5);
        for (let dx = -Math.ceil(radius); dx <= radius; dx++) {
          if (Math.abs(dx) > radius || hash(seed * 31 + dx * 19 + y * 3) < .19) continue;
          const char = 'wW@*^'[Math.floor(hash(dx * 8 + y + seed) * 5)];
          this.put(char, center + dx, base - height - 3 + y, this.ink(hue + dx * 3, distant ? 0 : (dx < -1 ? 1 : 2), x + dx, base - height + y));
        }
      }
      for (let y = base - height / 2; y < base; y++) {
        this.text(y % 3 ? '|o|' : '|#|', x - 1, y, this.ink(35, distant ? 1 : 2, x, y));
      }
      this.text('_/|\\_', x - 2, base - 1, this.ink(45, distant ? 1 : 2, x, base));
    }
    crystal(x, y, seed, shade = 3) {
      const hue = 180 + hash(seed) * 90;
      this.sprite(['  /\\ ', ' /:+\\', ' |*/|', ' /##\\'], x, y - 4,
        (a, b) => this.ink(hue + a * 10, b === 3 ? 1 : shade, x + a, y + b));
    }
    surface(offset) {
      const s = this.state;
      // Ridges have coherent slopes and material, instead of repeating triangle outlines.
      for (let x = 0; x < this.cols; x++) {
        const wx = x + s.travel * .18;
        const peak = Math.round(this.rows * .65 - Math.sin(wx * .026) * 7 - Math.sin(wx * .061) * 3) + offset;
        for (let y = Math.max(0, peak); y < this.rows * .88 + offset; y++) {
          const h = hash(Math.floor(wx) * 17 + (y - offset) * 13);
          if (y === peak || h > .78) this.put(y === peak ? '_' : (h > .9 ? ':' : '.'), x, y, this.ink(200, y === peak ? 1 : 0, x, y));
        }
      }
      // Broken watchtowers give the distant landscape a recognisable scale.
      for (let i = -1; i < Math.ceil(this.cols / 67) + 1; i++) {
        const x = i * 67 - s.travel * .24 % 67 + 24;
        const y = this.rows * .63 + offset + hash(i + 9) * 5;
        this.sprite([' _   _   _ ', '| |_| |_| |', '|: : : : :|', '|  []  [] |', '|: : : : :|', '| []   [] |', '|: : : : :|', '|   /\\   |', '|__/  \\__|'], x, y, this.ink(210, 1, x, y));
      }
      const shift = s.travel * .6;
      const start = Math.floor(shift / 26) - 1;
      for (let i = start; i < start + Math.ceil(this.cols / 26) + 3; i++) {
        const x = i * 26 + hash(i * 3) * 14 - shift;
        this.tree(x, this.ground(x) + offset, i + 50);
      }
      this.rockFloor(offset);
      const near = Math.floor(s.travel / 21) - 1;
      for (let i = near; i < near + Math.ceil(this.cols / 21) + 3; i++) {
        const x = i * 21 + hash(i) * 8 - s.travel;
        const y = this.ground(x) + offset;
        if (i % 3 === 0) this.crystal(x, y, i, 2);
        else if (i % 3 === 1) this.sprite(['  ___ ', ' /:%#\\', '/__#_%\\'], x, y - 3, this.ink(40, 2, x, y));
        else this.sprite(['  _  _', ' (_)o)', '  |/| ', ',,|,|,'], x, y - 4, this.ink(145, 2, x, y));
      }
    }
    mine(offset) {
      const s = this.state, ceiling = Math.round(this.rows * .48) + offset;
      // Distant mineral seams and a second gallery stay dim behind the supports.
      for (let x = 0; x < this.cols; x++) {
        const wx = Math.floor(x + s.travel * .25);
        for (let y = Math.max(0, ceiling + 8); y < this.rows * .85 + offset; y++) {
          if (hash(wx * 19 + (y - offset) * 37) > .93) this.put(':', x, y, this.ink(240, 0, x, y));
        }
        const gallery = this.rows * .73 + offset + Math.sin(wx * .04) * 2;
        this.put('=', x, gallery, this.ink(220, 1, x, gallery));
        if (wx % 19 === 0) this.line(x, gallery, x, gallery + 6, '|', this.ink(220, 0));
      }
      for (let x = 0; x < this.cols; x++) {
        const wx = Math.floor(x + s.travel * .8);
        const edge = ceiling + Math.floor(hash(Math.floor(wx / 7)) * 4);
        for (let y = Math.max(0, ceiling - 5); y <= edge; y++) {
          if (hash(wx * 17 + y) > .3) this.put(y === edge ? 'v' : '#', x, y, this.ink(240, y === edge ? 2 : 0, x, y));
        }
        if (wx % 13 === 0) this.sprite(['\\/', ' V'], x, edge + 1, this.ink(200, 2, x, edge));
      }
      const span = 30, start = Math.floor(s.travel / span) - 1;
      for (let i = start; i < start + Math.ceil(this.cols / span) + 3; i++) {
        const x = i * span - s.travel;
        const base = this.ground(x) + offset;
        for (let y = ceiling + 3; y < base; y++) {
          this.text('|#|', x, y, this.ink(28, 1, x, y));
          if (y % 5 === 0) this.text('[=]', x, y, this.ink(28, 2, x, y));
        }
        this.text('===============================', x, ceiling + 3, this.ink(32, 2, x, ceiling));
        this.line(x + 3, ceiling + 7, x + 8, ceiling + 4, '/', this.ink(32, 1));
        this.sprite([' | ', '[*]', ' v '], x + 16, ceiling + 4, this.ink(45, 3, x, ceiling));
        this.crystal(x + 8, base, i + 9);
        this.crystal(x + 21, base, i + 49, 2);
        for (let j = 0; j < 6; j++) this.put('+', x + 6 + j * 2, base + 2 + (j % 2), this.ink(270, 2, x + j, base));
      }
      this.rockFloor(offset, true);
    }
    heights(offset) {
      const s = this.state;
      for (let i = 0; i < 8; i++) {
        const x = (hash(i + 8) * (this.cols + 40) - s.travel * .3 % (this.cols + 40) + this.cols + 40) % (this.cols + 40) - 20;
        const y = this.rows * (.56 + hash(i + 3) * .24) + offset;
        this.sprite(['    .--.     ', ' .-(    ).   ', '(_________)  '], x, y, this.ink(210, 1, x, y));
      }
      // Ruined pillars and little hanging gardens add a second level above the route.
      for (let i = -1; i < Math.ceil(this.cols / 58) + 1; i++) {
        const x = i * 58 + 10 - s.travel * .28 % 58;
        const y = this.rows * .65 + Math.sin(i * 8) * 4 + offset;
        this.sprite(['     _[]_     ', '    | [] |    ', '  ,w|:  :|w,  ', '__ww|____|ww__', ' \\#:##:::#/ ', '  \\:#:#:/  ', '    \\#:/   ', '     |:     ', '     :      '], x, y, this.ink(205, 1, x, y));
      }
      const start = Math.floor(s.travel / 42) - 1;
      for (let i = start; i < start + Math.ceil(this.cols / 42) + 3; i++) {
        const x = i * 42 - s.travel, y = this.ground(x) + offset;
        for (let a = 0; a < 18; a++) {
          this.put('=', x + a, y, this.ink(130, 3, x + a, y));
          for (let b = 1; b < 10; b++) if (a > b * .65 && a < 18 - b * .9) this.put('#:.%'[(a + b) % 4], x + a, y + b, this.ink(220, b > 4 ? 0 : 1, x + a, y + b));
        }
        this.sprite(['  /\\ ', ' /::\\', '/_[]_\\', '| [] |', '|____|'], x + 4, y - 5, this.ink(200, 2, x, y));
        for (let a = 18; a < 42; a++) {
          const bridgeY = this.ground(x + a) + offset;
          this.put('=', x + a, bridgeY, this.ink(38, 3, x + a, bridgeY));
          this.put('~', x + a, bridgeY - 4, this.ink(38, 2, x + a, bridgeY));
          if (a % 3 === 0) this.line(x + a, bridgeY - 3, x + a, bridgeY - 1, '|', this.ink(35, 1));
        }
      }
    }
    scene(route, offset) { this[route === 'mine' ? 'mine' : route === 'heights' ? 'heights' : 'surface'](offset); }
    terrain() {
      const s = this.state;
      if (s.transition === 1) { this.scene(s.route, 0); return; }
      const down = s.route === 'mine' || s.previousRoute === 'heights';
      const direction = down ? -1 : 1, p = smooth(s.transition), distance = this.rows * .48;
      this.scene(s.previousRoute, direction * p * distance);
      this.scene(s.route, -direction * (1 - p) * distance);
      const x = Math.floor(this.cols * .29) + 3;
      for (let y = this.rows * .44; y < this.rows; y++) this.text('|=|', x, y, this.ink(40, 2, x, y));
    }
    weather() {
      const s = this.state;
      const underground = s.route === 'mine' ? (s.transition < 1 ? smooth(s.transition) : 1)
        : s.previousRoute === 'mine' && s.transition < 1 ? 1 - smooth(s.transition) : 0;
      const rain = s.rain * (1 - underground), sun = s.sun * (1 - underground);
      const t = s.reduced ? 0 : s.time;
      if (sun > .06) {
        const x = this.cols * .78, y = this.rows * .43;
        this.sprite(['    \\ | /    ', '  -- .-. --  ', ' -- ( @ ) -- ', '  -- `-\' --  ', '    / | \\    '], x, y, sun > .55 ? 97 : this.ink(45, 2));
        for (let i = 0; i < Math.floor(sun * 18); i++) {
          const rx = x - 20 + i * 3, ry = y + 9 + Math.sin(i + t * .3) * 4;
          this.put('.', rx, ry, this.ink(45, 2));
        }
      }
      if (rain < .06) return;
      for (let i = 0; i < Math.ceil(this.cols / 34); i++) {
        this.sprite(['    .----.     ', ' .-( :::: )-.  ', '(____________) '], i * 34 - (t * .5 % 34), this.rows * .40 + i % 3,
          this.ink(215, rain > .55 ? 2 : 1));
      }
      const count = Math.floor(this.cols * 1.5 * rain);
      for (let i = 0; i < count; i++) {
        const phase = (hash(i + 900) + t * (.22 + hash(i + 5) * .18)) % 1;
        const x = (hash(i + 340) * this.cols - phase * 8 + this.cols) % this.cols;
        const y = this.rows * .47 + phase * this.rows * .42;
        this.put(i % 4 ? '/' : '.', x, y, this.ink(205, i % 5 ? 1 : 2));
      }
      for (let i = 0; i < this.cols / 11 * rain; i++) {
        const x = (i * 17 + Math.floor(t * 3) * 7) % this.cols;
        this.text('.,', x, this.ground(x) - 1, this.ink(195, 2));
      }
    }
    village() {
      const s = this.state;
      if (s.villageTravel === null || s.route !== 'surface' || s.transition < 1) return;
      const anchor = Math.floor(this.cols * .29 + 13 + s.villageTravel - s.travel);
      // The clearing stays in world space and scrolls away after the conversation.
      if (anchor < -75 || anchor > this.cols + 40) return;
      for (let i = 0; i < 3; i++) {
        const x = anchor - 22 + i * 26, y = this.ground(x) - 13;
        this.sprite(['       []       ', '     /^^^^\\     ', '    /######\\    ', '   /##/\\###\\   ', '  /__/__\\___\\  ', '  | []   [] |   ', '  | ::   :: |   ', '  |    __   |   ', '  | []|  |[]|   ', '  |___|__|__|   '], x, y,
          (a, b) => this.ink(b < 5 ? 25 : 45, b < 5 ? 2 : 1, x + a, y + b));
        this.text('_|_|_|_|_|_', x + 2, this.ground(x) - 1, this.ink(38, 2));
      }
      this.sprite([' /==========\\', '/_/__/__/__/__\\', '| [o] [!] [*] |', '|=============|', ' |           | '], anchor + 7, this.ground(anchor + 7) - 5,
        (a, b) => this.ink(b < 2 ? 165 : 35, 2, anchor + a, b));
      const age = s.trade;
      const approach = age < 0 ? 0 : smooth(age / 1.5) * (1 - smooth((age - 6.5) / 1.5));
      const merchantX = anchor + 10 - approach * 8;
      const merchantY = this.ground(merchantX) - 6;
      this.sprite(['  ___  ', ' /___\\ ', ' (o_o) ', ' /|#|\\ ', '  | |  ', ' _| |_ '], merchantX, merchantY,
        (a, b) => b === 2 ? 97 : this.ink(160, b < 3 ? 3 : 2), true);
      const villagerX = anchor + 34 + Math.sin(s.time * .35) * 2;
      this.sprite(['  /\\  ', ' (oo) ', ' /||\\ ', ' /##\\ ', ' _||_ '], villagerX, this.ground(villagerX) - 5, this.ink(310, 2), true);
      if (age >= 1.5 && age < 6.5) {
        this.text(age < 3.5 ? '[o?]' : '[!+]', merchantX - 1, merchantY - 2, 97);
        const returning = age >= 4, p = clamp((age - (returning ? 4 : 2)) / 1.7);
        const from = this.cols * .29 + 8, to = merchantX;
        this.put(returning ? '!' : 'o', mix(returning ? to : from, returning ? from : to, p), merchantY + 3 - Math.sin(p * Math.PI) * 2, returning ? this.ink(170, 3) : 98);
      }
    }
    torch() {
      const s = this.state;
      if (!s.hasTorch() || s.camp > .35) return;
      const fighting = s.encounter >= 0;
      const x = this.heroX + (fighting ? -2 : 9), y = this.heroY + 1;
      const t = s.reduced ? 0 : s.time;
      // Recolour existing glyphs near the flame, leaving a hard pixel edge and no blur.
      for (let dy = -6; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++) {
        const px = Math.round(x + dx), py = Math.round(y + dy), d = Math.hypot(dx * .7, dy);
        if (d > 8 || px < 0 || py < 0 || px >= this.cols || py >= this.rows) continue;
        const index = py * this.cols + px;
        if (this.chars[index] > 32) this.colors[index] = d < 3 ? 97 : 2 * 4 + (d < 6 ? 3 : 2);
      }
      if (!fighting) for (let row = 1; row < 6; row++) this.text('    ', this.heroX + 7, this.heroY + row, 96);
      this.line(this.heroX + (fighting ? 1 : 5), this.heroY + 4, x, y + 3, '-', 96);
      this.text('|', x, y + 2, 98); this.text('|', x, y + 3, 98); this.text('|', x, y + 4, 98);
      this.sprite([Math.floor(t * 8) % 2 ? " .' " : " ' .", ' ^*^', '  # '], x - 2, y - 1,
        (a, b) => b === 1 && a === 2 ? 97 : b === 0 ? 99 : 98);
      this.put('.', x + Math.sin(t * 3), y - 3 - t % 2, 98);
    }
    hero() {
      const s = this.state, action = s.knightAction();
      const x = Math.floor(this.cols * .29 + (s.transition < 1 ? 0 : Math.sin(s.travel * .045) * 2));
      const pose = action === 'climb' ? climb[Math.floor(s.time * 4) % 2]
        : action === 'walk' ? walk[s.reduced ? 0 : Math.floor(s.travel * .8) % 4] : poses[action];
      const lift = s.reduced || s.encounter >= 0 || s.dragon >= 0 || s.trade >= 0 ? 0 : Math.sin(s.jump * Math.PI) * 3;
      const y = action === 'climb' ? this.rows * .76 + Math.sin(s.transition * Math.PI * 2) * 2
        : this.ground(x) - pose.length - lift;
      if (action === 'walk') for (let echo = Math.floor(s.effects.echo * 4); echo > 0; echo--) {
        this.sprite(pose, x - echo * 6, y + echo % 2, this.ink(190 + echo * 30, 1));
      }
      this.sprite(pose, x, y, (a, b) => b === 0 ? 99 : b < 3 ? 96 : a < 2 ? this.ink(270, 2) : b < 6 ? this.ink(205, 3, x, y) : 96, true);
      if (action === 'walk' && !s.reduced) {
        for (let i = 0; i < 6; i++) this.put(i % 2 ? '.' : "'", x - 1 - i, this.ground(x) - 1 - hash(i + Math.floor(s.travel)) * 2, this.ink(40, 1));
      }
      this.heroX = x; this.heroY = y;
    }
    campfire() {
      const s = this.state;
      if (s.camp <= .35 || s.transition < 1) return;
      const x = this.heroX + 13, base = this.ground(this.heroX);
      const t = s.reduced ? 0 : s.campTime;
      // Sword and bow are set beside the resting knight.
      this.sprite([' +  )', '=|= |)', ' |  )', '_|___'], this.heroX - 6, base - 4, 96);
      this.text('o_\\/\\_o', x - 3, base - 1, 98);
      this.text(' /==\\ ', x - 2, base, 99);
      if (s.camp < 1.2) return;
      const height = s.camp < 1.8 ? 2 : 5;
      for (let row = 0; row < height; row++) {
        const radius = Math.max(0, Math.floor((height - row) / 2));
        for (let col = -radius; col <= radius; col++) {
          const flicker = hash(col * 13 + row * 19 + Math.floor(t * 8));
          this.put(row === height - 1 ? "'" : '*^+:'[Math.floor(flicker * 4)], x + col, base - 2 - row,
            row < 2 && Math.abs(col) < 1 ? 97 : row < 3 ? 98 : 99);
        }
      }
      for (let i = 0; i < 5; i++) {
        const p = (t * .6 + i * .7) % 4;
        this.put(i % 2 ? '.' : "'", x + Math.sin(p + i) * 2, base - 6 - p * 1.3, i % 2 ? 98 : this.ink(30, 1));
      }
    }
    skirmish() {
      const s = this.state, age = s.encounter;
      if (age < 0) return;
      const attack = age >= 1.3 && age < 2.2;
      const lunge = attack ? Math.sin((age - 1.3) / .9 * Math.PI) * 5 : 0;
      const x = this.heroX + 12 + (1 - smooth(age / 1.3)) * Math.min(24, this.cols * .25) - lunge;
      const frame = Math.floor(s.time * 5) % 2;
      const monsters = {
        goblin: { hue: 105, lines: [' /\\_/\\ ', ' <o_o> ', ' /###\\ ', '  /|\\  ', frame ? ' _/ \\_ ' : ' /_ _\\ '] },
        slime: { hue: 135, lines: frame ? ['   ___   ', ' _/o o\\_ ', '/::___::\\', '~~~~~~~~~'] : ['  .---.  ', ' / o o \\ ', '/::___::\\', '___~~~___'] },
        wolf: { hue: 30, lines: [' /\\ /\\     ', '<o V o>____/', ' \\vv/####/', '  /#/#/#/ ', frame ? ' _/  /_   ' : '  /_  _\\  '] },
        spider: { hue: 275, lines: [' \\  |  / ', '  \\(oo)/  ', '<==(@@)==>', frame ? ' _/ || \\_ ' : ' /_ || _\\ '] },
        bat: { hue: 215, lines: frame ? [' \\   /\\   / ', '  \\_(oo)_/  ', '   /_vv_\\   ', '     \\/     '] : ['  /\\ /\\ /\\ ', ' /  VooV  \\ ', '/___/vv\\___\\', '     \\/     '] },
      };
      const monster = monsters[s.monster] || monsters.goblin;
      const hop = s.monster === 'slime' ? Math.abs(Math.sin(age * 4)) * 2
        : s.monster === 'bat' ? 4 + Math.sin(age * 4) * 2 - (attack ? lunge * .5 : 0) : 0;
      const y = this.ground(x) - monster.lines.length - hop;
      if (age < 3.3) {
        this.sprite(monster.lines, x, y, (a, b) => b === 1 ? 98 : this.ink(monster.hue, 3, x, y), true);
        if (attack) {
          this.text('<<', this.heroX + 10, this.heroY + 4, 99);
          this.put('*', this.heroX + 10, this.heroY + 2, 97);
        }
        if (age > 2.2) {
          const swing = (age - 2.2) / 1.1;
          this.line(this.heroX + 7, this.heroY + 3, x + 1, y + 2 - Math.sin(swing * Math.PI) * 5, '/', 97);
          if (age > 2.7) this.sprite([' .+.', '+*+*', ' .+.'], x, y + 1, 97);
        }
      } else {
        const p = (age - 3.3) / 1.2;
        for (let i = 0; i < 12; i++) this.put(i % 2 ? '+' : '.', x + 2 + (hash(i) - .5) * p * 16,
          y + 2 - p * (2 + hash(i + 7) * 5), this.ink(monster.hue, p < .5 ? 3 : 1));
      }
    }
    counterattack() {
      const s = this.state, age = s.dragon;
      if (age < 0) return;
      const target = this.dragonPosition();
      const launch = age >= 9.2 ? 9.2 : 3;
      if ((age >= 3 && age < 5) || (age >= 9.2 && age < 12)) {
        const flight = ((age - launch) % .9) / .9;
        const x = mix(this.heroX + 10, target.x + 5, flight);
        const y = mix(this.heroY + 3, target.y + 7, flight) - Math.sin(flight * Math.PI) * 3;
        this.text('=/>>', x, y, 97);
        if (flight > .8) this.sprite([' .+. ', '+ * +', ' .+. '], target.x + 3, target.y + 5, 98);
      }
      if (age >= 5 && age < 9.2) {
        // Restore the shield over the flame edge; the knight stays visible behind it.
        this.sprite([' /+++\\', ' |+#+|', ' |+#+|', ' \\++/ ', '  V   '], this.heroX + 6, this.heroY + 1, 96);
        for (let i = 0; i < 8; i++) {
          const p = (s.time * 3 + i * .21) % 1;
          this.put(i % 2 ? '+' : '.', this.heroX + 11 + p * 4, this.heroY + 2 + (hash(i) - .5) * 7 * p, i % 2 ? 98 : 97);
        }
      }
    }
    dragonPosition() {
      const age = this.state.dragon;
      const enter = smooth(age / 3), leave = smooth((age - 10) / 4);
      return { x: mix(this.cols + 6, this.cols * .57, enter) - leave * (this.cols + 55),
        y: this.rows * .47 + Math.sin(age * 1.2) * 1.3 - leave * 8 };
    }
    dragon() {
      const s = this.state, age = s.dragon;
      if (age < 0) return;
      const { x, y } = this.dragonPosition();
      const flap = Math.sin(age * 3.4), wingHeight = 10 + flap * 4;
      // Two articulated membranes: ribs and stippled scales have separate tones.
      for (let wing = 1; wing >= 0; wing--) {
        const rootX = x + 20 + wing * 4, rootY = y + 6;
        const tipX = rootX + (wing ? 20 : -14), tipY = rootY - wingHeight - wing * 2;
        for (let i = 0; i < 22; i++) {
          const t = i / 21, bx = mix(rootX - 7, rootX + 17, t);
          const by = rootY + Math.sin(t * Math.PI * 3) * 2;
          for (let j = 0; j < 12; j++) {
            const u = j / 12, px = mix(bx, tipX, u), py = mix(by, tipY, u);
            if ((i + j) % 3) this.put(i % 4 === 0 ? '/' : ':', px, py, this.ink(270 + wing * 30, wing ? 1 : 2, px, py));
          }
        }
        this.line(rootX - 7, rootY, tipX, tipY, '/', this.ink(300, 3, x, y));
        this.line(tipX, tipY, rootX + 17, rootY, '\\', this.ink(290, 2, x, y));
        this.line(rootX, rootY, tipX, tipY, '/', this.ink(310, 3, x, y));
      }
      // Sinuous tail; the head faces the hero on the left.
      for (let i = 0; i < 24; i++) {
        const ty = y + 8 + Math.sin(i * .16 + age * 1.4) * (i / 8);
        this.put(i < 14 ? '#' : '~', x + 32 + i, ty, this.ink(280 + i * 2, i < 14 ? 2 : 1, x + i, ty));
      }
      const body = [
        '             /\\ /\\ /\\ /\\',
        '       _____/##V##V##V##V##\\___',
        '   ___/##%%##%%##%%##%%##%%##%#\\',
        ' _/##/##%%##%%##%%##%%##%%##%%##)',
        '/___/____/____/____/____/_____/ ',
        '       \\_\\     \\_\\     \\_\\',
        '        /_/      /_/      /_/',
      ];
      this.sprite(body, x + 4, y + 3, (a, b) => this.ink(265 + b * 10, b < 2 ? 3 : 2, x + a, y + b), true);
      const breathing = age > 5 && age < 9;
      this.sprite(breathing ? [' /\\_/\\', '<O  #/', ' \\___\\', '  VVV  ', ' <___/ '] : [' /\\_/\\', '<O  #/', '<____/ ', '  VV   '], x - 1, y + 6,
        (a, b) => b === 1 && a === 1 ? 97 : this.ink(300, 3, x + a, y + b), true);
      if (breathing) {
        const mouthX = x - 1, mouthY = y + 9;
        const power = smooth((age - 5) / .5) * (1 - smooth((age - 8.3) / .7));
        const tx = this.heroX + 11, ty = this.heroY + 3;
        const n = Math.ceil(Math.hypot(tx - mouthX, ty - mouthY));
        for (let i = 0; i < n * power; i++) {
          const t = i / n, fx = mix(mouthX, tx, t), fy = mix(mouthY, ty, t);
          const width = 1 + t * (3 + s.effects.grit * 4);
          for (let k = -Math.ceil(width); k <= width; k++) {
            const h = hash(i * 17 + k * 43 + Math.floor(s.time * 15));
            if (Math.abs(k) > width * (.6 + h * .5) || fx + k < this.heroX + 9) continue;
            this.put('*+%:.'[Math.min(4, Math.floor(Math.abs(k) / width * 5))], fx + k, fy + Math.sin(i * .6 - age * 12) * t,
              Math.abs(k) < width * .28 ? 97 : Math.abs(k) < width * .65 ? 98 : 99);
          }
        }
      }
      if (age > 8 && age < 12) for (let i = 0; i < 24; i++) {
        this.put(i % 3 ? '.' : '*', this.heroX + (hash(i) - .4) * 16, this.ground(this.heroX) - (age - 8) * (1 + hash(i + 5) * 3), i % 2 ? 98 : 99);
      }
    }
    motes() {
      const s = this.state;
      if (s.reduced || !s.running || s.silent) return;
      const count = 10 + Math.floor(s.effects.space * 35 + s.effects.shimmer * 25);
      for (let i = 0; i < count; i++) {
        const x = (hash(i + 67) * this.cols + Math.sin(s.time * .5 + i) * 3 + this.cols) % this.cols;
        const y = this.rows * .5 + ((hash(i + 4) * this.rows * .4 - s.time * (.3 + s.effects.sway) + this.rows * 10) % (this.rows * .4));
        this.put(i % 7 ? '.' : '+', x, y, this.ink(170 + i * 9, i % 7 ? 1 : 2, x, y));
      }
      if (s.burst > 0) for (let i = 0; i < 30; i++) {
        const age = 1.6 - s.burst, angle = hash(i + s.bars * 3) * Math.PI * 2;
        const radius = age * (3 + hash(i + 40) * 8);
        const x = this.heroX + 2 + Math.cos(angle) * radius;
        const y = this.heroY - 3 + Math.sin(angle) * radius * .5 - age * 4;
        this.put(s.burst > .8 ? '+' : '.', x, y, this.ink(175 + i * 4, s.burst > .6 ? 3 : 1, x, y));
      }
    }
    draw() {
      this.chars.fill(32);
      this.sky(); this.terrain(); this.village(); this.weather(); this.hero(); this.torch(); this.skirmish(); this.dragon(); this.counterattack(); this.campfire(); this.motes();
      const s = this.state;
      const label = s.trade >= 0 ? 'VILLAGE MARKET' : s.camp > 1.8 && s.transition === 1 ? 'CAMPFIRE REST' : s.transition < 1 ? (s.route === 'mine' || s.previousRoute === 'heights' ? 'DESCENDING' : 'CLIMBING')
        : { surface: 'THE WILDS', mine: 'CRYSTAL MINES', heights: 'SKY BRIDGES' }[s.route];
      this.text(label, 3, this.rows - 3, this.ink(170, 2));
      if (s.color > .9) this.text('FULL SPECTRUM', this.cols - 16, this.rows - 3, this.ink(s.time * 30, 3));
      const ctx = this.ctx, u = this.unit;
      ctx.fillStyle = '#030505'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      for (let i = 0; i < this.chars.length; i++) {
        const char = this.chars[i]; if (char <= 32 || char >= 128) continue;
        ctx.drawImage(this.font.atlas, (char - 32) * 6, this.colors[i] * 8, 5, 7,
          (i % this.cols) * this.cw, Math.floor(i / this.cols) * this.ch, 5 * u, 7 * u);
      }
    }
  }
  WebSynth.AsciiWorld = AsciiWorld;
})();
