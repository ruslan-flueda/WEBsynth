const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadApp } = require('./helpers/load-app.cjs');
function setup() {
  const { app } = loadApp();
  const engine = new app.Engine();
  engine.context = { state: 'running' };
  const seq = { engine, running: true, soloId: null, bpm: 110,
    visualFrame: { step: 1, active: Object.fromEntries(app.lanes.map(l => [l.id, 1])), hits: [] } };
  const state = new app.WorldState();
  const advance = (seconds, reduced = false) => { for (let i = 0; i < seconds * 30; i++) state.update(1 / 30, seq, reduced); };
  const bar = () => { seq.visualFrame = { ...seq.visualFrame, step: 0 }; state.update(1 / 30, seq, false); };
  return { app, seq, state, advance, bar };
}
test('full ensemble becomes saturated; Solo and zero volume remove muted channel influence', () => {
  const { seq, state, advance } = setup();
  const params = JSON.stringify(seq.engine.params);
  advance(5); assert.ok(state.color > .99);
  assert.equal(JSON.stringify(seq.engine.params), params);
  seq.soloId = 'melody'; advance(5);
  assert.equal(state.levels.bass, 0); assert.ok(state.color < .2);
  seq.engine.params.melody.volume = 0; advance(5);
  assert.ok(state.energy < .001);
});
test('effect parameters affect visual state only when their channels are audible', () => {
  const { seq, state, advance } = setup();
  seq.soloId = 'melody';
  seq.engine.params.melody.delay = 100; seq.engine.params.melody.vibrato = 100;
  advance(3); assert.ok(state.effects.echo > .99); assert.ok(state.effects.sway > .99);
  seq.engine.params.bass.drive = 100; advance(2);
  assert.ok(state.effects.grit < .0001);
});
test('route transitions finish before another branch; both route types are reachable', () => {
  const { state, seq, bar, advance } = setup();
  const branch = () => {
    state.bars = 6; state.routeBars = 5; state.encounter = -1; state.trade = -1;
    state.lastVillageRoute = state.routeCount;
    bar();
  };
  seq.soloId = 'bass'; advance(3); branch();
  assert.equal(state.route, 'mine'); assert.equal(state.transition, 0);
  seq.soloId = 'winds';
  for (let i = 0; i < 7; i++) bar();
  assert.equal(state.route, 'mine');
  advance(6); branch(); assert.equal(state.route, 'surface');
  advance(6); branch(); assert.equal(state.route, 'heights');
});
test('dragon encounter has a cooldown, Stop clears it, reduced motion freezes travel', () => {
  const { state, seq, advance, bar } = setup();
  advance(3); for (let i = 0; i < 3; i++) bar();
  assert.equal(state.dragon, 0); assert.equal(state.dragonCooldown, 48);
  advance(15); bar(); assert.equal(state.dragon, -1);
  const travel = state.travel; advance(2, true);
  assert.equal(state.travel, travel); assert.equal(state.dragon, -1);
  seq.running = false; advance(2);
  assert.equal(state.travel, travel); assert.equal(state.burst, 0);
});

test('disabled channels stop travel and make camp; note gaps do not; music resumes the route', () => {
  const { seq, state, advance } = setup();
  advance(2);
  assert.equal(state.camp, 0); // Active patterns have no note hits in this fixture.
  const travel = state.travel;
  for (const id in seq.visualFrame.active) seq.visualFrame.active[id] = 0;
  advance(3);
  assert.equal(state.travel, travel);
  assert.equal(state.knightAction(), 'sit');
  assert.ok(state.campTime > 0);
  seq.visualFrame.active.melody = 1;
  advance(1);
  assert.equal(state.camp, 0);
  assert.equal(state.knightAction(), 'walk');
  assert.ok(state.travel > travel);
});
test('zero volumes and Stop both trigger camp; a ladder finishes before sitting', () => {
  const { seq, state, advance } = setup();
  advance(1);
  state.transition = .3; state.route = 'mine';
  for (const params of Object.values(seq.engine.params)) params.volume = 0;
  advance(.3); assert.equal(state.knightAction(), 'climb'); assert.equal(state.camp, 0);
  advance(5); assert.equal(state.transition, 1); assert.equal(state.knightAction(), 'sit');
  seq.running = false;
  const t = state.campTime;
  advance(1); assert.ok(state.campTime > t);
  advance(1, true); const frozen = state.campTime;
  advance(1, true); assert.equal(state.campTime, frozen);
});
test('knight fights on the road, shields fire, then returns arrows; silence clears combat', () => {
  const { seq, state, advance, bar } = setup();
  advance(1); bar(); bar();
  assert.equal(state.encounter, 0);
  const travel = state.travel;
  advance(2.5); assert.equal(state.knightAction(), 'strike'); assert.equal(state.travel, travel);
  advance(2.1); assert.equal(state.encounter, -1);
  state.dragon = 3.5; assert.equal(state.knightAction(), 'bow');
  state.dragon = 6; assert.equal(state.knightAction(), 'guard');
  state.dragon = 10; assert.equal(state.knightAction(), 'bow');
  state.encounter = 2.5;
  seq.running = false; advance(3);
  assert.equal(state.encounter, -1); assert.equal(state.dragon, -1);
  assert.equal(state.knightAction(), 'sit');
});


test('weather follows audible combinations with a four-bar hold and fades in silence', () => {
  const { state, seq, advance, bar } = setup();
  for (const id in seq.visualFrame.active) seq.visualFrame.active[id] = ['drums', 'bass', 'winds'].includes(id) ? 1 : 0;
  advance(1); bar(); advance(5);
  assert.equal(state.weather, 'rain'); assert.ok(state.rain > .9);
  for (const id in seq.visualFrame.active) seq.visualFrame.active[id] = ['melody', 'bells'].includes(id) ? 1 : 0;
  bar(); assert.equal(state.weather, 'rain');
  bar(); bar(); bar(); advance(6);
  assert.equal(state.weather, 'sun'); assert.ok(state.sun > .95); assert.ok(state.rain < .05);
  seq.running = false; advance(6); assert.ok(state.sun < .05);
});
test('all five monster types are reachable and attack before the knight replies', () => {
  const { state } = setup();
  const seen = new Set();
  for (const route of ['surface', 'mine', 'heights']) {
    state.route = route;
    for (let i = 0; i < 6; i++) { state.startEncounter(); seen.add(state.monster); }
  }
  assert.deepEqual([...seen].sort(), ['bat', 'goblin', 'slime', 'spider', 'wolf']);
  state.encounter = 1.7; assert.equal(state.knightAction(), 'guard');
  state.encounter = 2.6; assert.equal(state.knightAction(), 'strike');
});
test('village trade blocks travel and combat then releases the traveller; silence cancels it', () => {
  const { state, seq, advance, bar } = setup();
  seq.soloId = 'melody'; advance(1);
  state.bars = 3; bar();
  assert.equal(state.trade, 0); assert.equal(state.knightAction(), 'trade');
  const travel = state.travel;
  advance(5); bar();
  assert.equal(state.travel, travel); assert.equal(state.encounter, -1); assert.equal(state.dragon, -1);
  advance(4); assert.equal(state.trade, -1); assert.ok(state.travel > travel);
  state.trade = 2; seq.running = false; advance(3);
  assert.equal(state.trade, -1); assert.equal(state.knightAction(), 'sit');
});
test('torch covers mine entry and exit, while reduced motion clears encounters', () => {
  const { state, advance } = setup();
  assert.equal(state.hasTorch(), false);
  state.route = 'mine'; state.transition = .1; assert.equal(state.hasTorch(), true);
  state.previousRoute = 'mine'; state.route = 'surface'; state.transition = .8;
  assert.equal(state.hasTorch(), true);
  state.transition = 1; assert.equal(state.hasTorch(), false);
  state.trade = 2; state.encounter = 1; advance(1, true);
  assert.equal(state.trade, -1); assert.equal(state.encounter, -1);
});
