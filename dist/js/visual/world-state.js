/** Visual state only. Audio-clock snapshots enter; no audio commands leave. */
(() => {
  'use strict';
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const hash = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const mix = (a, b, t) => a + (b - a) * t;
  class WorldState {
    constructor() {
      this.time = 0; this.travel = 0; this.energy = 0; this.color = .15;
      this.pulse = 0; this.jump = 0; this.snapshot = null; this.bars = 0;
      this.route = 'surface'; this.previousRoute = 'surface'; this.transition = 1;
      this.routeCount = 0; this.routeBars = 0; this.dragon = -1; this.dragonCooldown = 0;
      this.levels = {}; this.effects = { tone: .5, space: .2, echo: .1, grit: .1, sway: .1, shimmer: .2 };
      this.monster = 'goblin'; this.monsterCount = 0;
      this.trade = -1; this.tradeCount = 0; this.lastVillageRoute = -1; this.villageTravel = null;
      this.weather = 'clear'; this.weatherBars = 4; this.rain = 0; this.sun = 0;
      this.camp = 0; this.campTime = 0; this.silent = true; this.encounter = -1;
      this.running = false; this.reduced = false; this.burst = 0; this.notes = 0;
    }
    knightAction() {
      if (this.transition < 1) return 'climb';
      if (this.camp > .35) return this.camp < 1.8 ? 'kindle' : 'sit';
      if (this.dragon >= 5 && this.dragon < 9.2) return 'guard';
      if ((this.dragon >= 3 && this.dragon < 5) || (this.dragon >= 9.2 && this.dragon < 12)) return 'bow';
      if (this.trade >= 0) return 'trade';
      if (this.encounter >= 1.3 && this.encounter < 2.2) return 'guard';
      if (this.encounter >= 2 && this.encounter < 3.4) return 'strike';
      if (this.encounter >= 0 || this.dragon >= 0) return 'ready';
      return this.silent ? 'ready' : 'walk';
    }
    hasTorch() {
      return this.route === 'mine' || (this.transition < 1 && this.previousRoute === 'mine');
    }
    startEncounter() {
      const pools = { surface: ['goblin', 'slime', 'wolf'], mine: ['spider', 'slime', 'goblin'], heights: ['bat', 'wolf'] };
      const pool = pools[this.route] || pools.surface;
      this.monster = pool[this.monsterCount++ % pool.length];
      this.encounter = 0;
    }
    updateWeather() {
      if (++this.weatherBars < 4) return;
      const l = this.levels;
      const wet = l.drums > .05 && l.bass > .05 && (l.winds > .05 || l.percussion > .05);
      const bright = l.melody > .05 && l.bells > .05;
      this.weather = wet && (!bright || this.bars % 12 < 8) ? 'rain' : bright ? 'sun' : 'clear';
      this.weatherBars = 0;
    }
    chooseRoute() {
      // Each branch completes before another is chosen. A soft bias avoids a fixed loop.
      if (this.route !== 'surface') return 'surface';
      const l = this.levels;
      const underground = (l.bass || 0) + (l.drums || 0) * .4 + this.effects.grit;
      const elevated = (l.winds || 0) + (l.bells || 0) * .6 + this.effects.space;
      return hash(this.routeCount * 19 + this.bars) < underground / Math.max(.01, underground + elevated) ? 'mine' : 'heights';
    }
    update(dt, seq, reduced) {
      this.reduced = reduced;
      this.running = seq.running && seq.engine.context?.state === 'running';
      const snapshot = seq.visualFrame;
      let sum = 0, count = 0;
      for (const { id } of WebSynth.lanes) {
        const value = this.running && snapshot?.active[id] && (!seq.soloId || seq.soloId === id)
          ? seq.engine.params[id].volume / 100 : 0;
        this.levels[id] = value; sum += value; if (value > .025) count++;
      }
      const weighted = (keys, fallback = 0) => {
        let total = 0, weight = 0;
        for (const { id } of WebSynth.lanes) for (const key of keys) {
          const p = seq.engine.params[id][key];
          if (p !== undefined && this.levels[id]) { total += p / 100 * this.levels[id]; weight += this.levels[id]; }
        }
        return weight ? total / weight : fallback;
      };
      const targets = { tone: weighted(['filter', 'tone'], .5), space: weighted(['reverb']),
        echo: weighted(['delay']), grit: weighted(['drive']), sway: weighted(['vibrato', 'breath']), shimmer: weighted(['shimmer']) };
      for (const key in targets) this.effects[key] = mix(this.effects[key], targets[key], 1 - Math.exp(-dt * 3));
      this.energy = mix(this.energy, clamp(sum / 4.2), 1 - Math.exp(-dt * 3));
      this.color = mix(this.color, count === 7 ? 1 : .12 + .62 * (count / 7) ** 2, 1 - Math.exp(-dt * 1.2));
      this.pulse *= Math.exp(-dt * 5); this.burst = Math.max(0, this.burst - dt);
      this.jump = Math.max(0, this.jump - dt * 1.7);
      this.silent = sum < .0001;
      const weatherEase = 1 - Math.exp(-dt * .65);
      this.rain = mix(this.rain, !this.silent && this.weather === 'rain' ? 1 : 0, weatherEase);
      this.sun = mix(this.sun, !this.silent && this.weather === 'sun' ? 1 : 0, weatherEase);
      if (this.silent) {
        this.trade = -1;
        this.dragon = -1; this.encounter = -1; this.jump = 0; this.burst = 0;
        // Reach a landing before resting; never light a fire halfway down a ladder.
        this.transition = reduced ? 1 : Math.min(1, this.transition + dt / 2);
        if (this.transition === 1) this.camp = Math.min(4, this.camp + dt);
        if (!reduced) this.campTime += dt;
      } else {
        this.camp = Math.max(0, this.camp - dt * 6);
        if (this.camp === 0) this.campTime = 0;
      }
      if (!this.running) {
        this.dragon = -1; this.jump = 0; this.burst = 0; this.snapshot = null;
        this.dragonCooldown = 0; this.bars = 0; this.routeBars = 0;
        return;
      }
      if (!reduced) {
        this.time += dt;
        if (!this.silent && this.camp === 0 && this.encounter < 0 && this.dragon < 0 && this.trade < 0) {
          this.travel += dt * (1.4 + this.energy * 6) * seq.bpm / 110;
        }
        this.transition = Math.min(1, this.transition + dt / 5);
        this.dragonCooldown = Math.max(0, this.dragonCooldown - dt);
        if (this.trade >= 0) { this.trade += dt; if (this.trade > 8) this.trade = -1; }
        if (this.encounter >= 0) { this.encounter += dt; if (this.encounter > 4.5) this.encounter = -1; }
        if (this.dragon >= 0) { this.dragon += dt; if (this.dragon > 14) this.dragon = -1; }
      } else { this.trade = -1; this.dragon = -1; this.encounter = -1; this.jump = 0; this.burst = 0; }
      if (this.silent || this.camp > 0 || !snapshot || snapshot === this.snapshot) return;
      this.snapshot = snapshot;
      const hits = snapshot.hits.filter(hit => this.levels[hit.id] > 0);
      this.notes += hits.length;
      this.pulse = clamp(hits.reduce((sum, hit) => sum + hit.velocity * this.levels[hit.id], 0));
      if (!reduced && this.transition === 1 && hits.some(hit => hit.id === 'drums')
        && snapshot.step === 8 && this.energy > .4 && this.dragon < 0 && this.encounter < 0 && this.trade < 0) this.jump = 1;
      if (snapshot.step !== 0) return;
      this.bars++; this.routeBars++;
      this.updateWeather();
      // A visit is tied to a surface clearing and finishes before travel/combat resumes.
      const visitDue = this.routeCount > 0 && this.lastVillageRoute !== this.routeCount
        || this.bars % 8 === 4;
      if (!reduced && this.route === 'surface' && this.transition === 1 && this.dragon < 0
        && this.encounter < 0 && this.trade < 0 && visitDue) {
        this.trade = 0; this.tradeCount++; this.lastVillageRoute = this.routeCount;
        this.villageTravel = this.travel;
      }
      if (!reduced && this.levels.melody && this.levels.bells) this.burst = 1.6;
      // Stay on the surface for the first encounter; travel decisions follow musical phrases.
      if (!reduced && this.routeBars >= 6 && this.transition === 1 && this.dragon < 0 && this.encounter < 0 && this.trade < 0 && count > 0) {
        this.previousRoute = this.route; this.route = this.chooseRoute();
        this.transition = 0; this.routeBars = 0; this.routeCount++;
      }
      if (!reduced && this.route === 'surface' && this.transition === 1 && this.bars >= 3
        && this.trade < 0 && this.dragonCooldown === 0 && this.levels.drums && this.levels.bass && this.levels.winds && this.energy > .48) {
        this.dragon = 0; this.dragonCooldown = 48; this.encounter = -1;
      }
      if (!reduced && this.transition === 1 && this.dragon < 0 && this.encounter < 0
        && this.trade < 0 && this.bars % 4 === 2 && count > 0) this.startEncounter();
    }
  }
  WebSynth.WorldMath = { clamp, hash, smooth, mix };
  WebSynth.WorldState = WorldState;
})();
