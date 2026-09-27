import test from 'node:test';
import assert from 'node:assert/strict';
import { TRACKS, TEMPLATES } from '../js/data.js';
import {
  defaultState, normalizeState, buildWorkout, evaluate, suggestions, finishWorkout,
  sessionTotals, stats, weekKey, trackHistory, lastPerformance, formatClock, formatDuration,
} from '../js/logic.js';

const DAY = 86400000;

test('every template references real tracks and every step is well-formed', () => {
  const ids = new Set(TRACKS.map((t) => t.id));
  for (const t of TEMPLATES) for (const id of t.tracks) assert.ok(ids.has(id), `${t.id} -> ${id}`);
  for (const t of TRACKS) {
    for (const s of t.steps) {
      assert.ok(['reps', 'hold'].includes(s.type));
      assert.ok(s.sets > 0 && s.min > 0 && s.max >= s.min, `${t.id}/${s.name}`);
    }
  }
});

test('buildWorkout uses the current level per track', () => {
  const levels = { ...defaultState().levels, push: 3 };
  const w = buildWorkout('full', levels, 1000);
  assert.equal(w.exercises[0].track, 'push');
  assert.equal(w.exercises[0].name, 'Push-up');
  assert.equal(w.startedAt, 1000);
  assert.throws(() => buildWorkout('nope', levels));
});

test('evaluate: advance, stay, regress', () => {
  const ex = { sets: 3, min: 8, max: 12, done: [] };
  assert.equal(evaluate({ ...ex, done: [12, 12] }), 'stay');
  assert.equal(evaluate({ ...ex, done: [12, 13, 12] }), 'advance');
  assert.equal(evaluate({ ...ex, done: [12, 11, 12] }), 'stay');
  assert.equal(evaluate({ ...ex, done: [5, 6, 7] }), 'regress');
  // extra sets beyond the prescription don't count against you
  assert.equal(evaluate({ ...ex, done: [12, 12, 12, 4] }), 'advance');
});

test('suggestions respect the ends of the ladder', () => {
  const levels = defaultState().levels;
  const first = { track: 'push', level: 0, sets: 1, min: 10, max: 20, done: [1] };
  assert.deepEqual(suggestions({ exercises: [first] }, levels), []);
  const up = { ...first, done: [20] };
  const [s] = suggestions({ exercises: [up] }, levels);
  assert.equal(s.kind, 'advance');
  assert.equal(s.level, 1);
  const lastLevel = TRACKS.find((t) => t.id === 'push').steps.length - 1;
  const top = { ...up, level: lastLevel };
  assert.deepEqual(suggestions({ exercises: [top] }, { ...levels, push: lastLevel }), []);
});

test('finishWorkout saves only exercises with logged sets', () => {
  let state = defaultState();
  state.active = buildWorkout('lower', state.levels, 0);
  state.active.exercises[0].done = [10, 10, 10];
  const r = finishWorkout(state, 60000);
  assert.equal(r.state.active, null);
  assert.equal(r.state.sessions.length, 1);
  assert.equal(r.session.exercises.length, 1);
  assert.equal(r.session.endedAt, 60000);

  state = defaultState();
  state.active = buildWorkout('lower', state.levels, 0);
  const empty = finishWorkout(state);
  assert.equal(empty.session, null);
  assert.equal(empty.state.sessions.length, 0);
});

test('sessionTotals separates reps and hold seconds', () => {
  const t = sessionTotals({ exercises: [
    { type: 'reps', done: [10, 8] },
    { type: 'hold', done: [30, 20] },
  ] });
  assert.deepEqual(t, { reps: 18, seconds: 50, sets: 4 });
});

test('weekKey is Monday-based', () => {
  const sun = new Date(2026, 8, 27, 12).getTime();
  const mon = new Date(2026, 8, 21, 8).getTime();
  assert.equal(weekKey(sun), '2026-09-21');
  assert.equal(weekKey(mon), '2026-09-21');
  assert.equal(weekKey(new Date(2026, 8, 28).getTime()), '2026-09-28');
});

test('stats week streak tolerates an empty current week', () => {
  const now = new Date(2026, 8, 30, 12).getTime(); // Wednesday
  const s = (ts) => ({ startedAt: ts, endedAt: ts, exercises: [{ type: 'reps', done: [5] }] });
  const lastWeek = [s(now - 7 * DAY), s(now - 14 * DAY), s(now - 28 * DAY)];
  assert.equal(stats(lastWeek, now).weekStreak, 2);
  assert.equal(stats([s(now), ...lastWeek], now).weekStreak, 3);
  assert.equal(stats([s(now)], now).thisWeek, 1);
  assert.equal(stats([], now).weekStreak, 0);
});

test('history helpers find the latest matching sets', () => {
  const sessions = [
    { startedAt: 1, exercises: [{ track: 'push', level: 3, name: 'Push-up', type: 'reps', done: [8, 7] }] },
    { startedAt: 2, exercises: [{ track: 'push', level: 3, name: 'Push-up', type: 'reps', done: [10, 9] }] },
  ];
  assert.deepEqual(lastPerformance(sessions, 'push', 3), [10, 9]);
  assert.equal(lastPerformance(sessions, 'push', 4), null);
  assert.deepEqual(trackHistory(sessions, 'push').map((p) => p.best), [8, 10]);
});

test('normalizeState repairs bad input', () => {
  assert.deepEqual(normalizeState(null), defaultState());
  const s = normalizeState({ levels: { push: 99, pull: -3, legs: 'x' }, sessions: [{}, { startedAt: 1, exercises: [] }], settings: { rest: 5 } });
  assert.equal(s.levels.push, TRACKS[0].steps.length - 1);
  assert.equal(s.levels.pull, 0);
  assert.equal(s.levels.legs, 0);
  assert.equal(s.sessions.length, 1);
  assert.equal(s.settings.rest, 15);
});

test('formatters', () => {
  assert.equal(formatClock(90), '1:30');
  assert.equal(formatClock(0.2), '0:01');
  assert.equal(formatDuration(65000), '1m 05s');
  assert.equal(formatDuration(3720000), '1h 2m');
});
