import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultState, normalizeState, stats, weekKey, formatClock, formatDuration, exerciseLog, muscleLoad,
} from '../js/logic.js';

const DAY = 86400000;
const workout = (startedAt, blocks) => ({ kind: 'routine', startedAt, endedAt: startedAt + 30 * 60000, exercises: [], blocks });

test('weekKey is Monday-based', () => {
  assert.equal(weekKey(new Date(2026, 8, 27, 12).getTime()), '2026-09-21');
  assert.equal(weekKey(new Date(2026, 8, 21, 8).getTime()), '2026-09-21');
  assert.equal(weekKey(new Date(2026, 8, 28).getTime()), '2026-09-28');
});

test('stats: week streak tolerates an empty current week; minutes add up', () => {
  const now = new Date(2026, 8, 30, 12).getTime(); // Wednesday
  const lastWeek = [workout(now - 7 * DAY, []), workout(now - 14 * DAY, []), workout(now - 28 * DAY, [])];
  assert.equal(stats(lastWeek, now).weekStreak, 2);
  assert.equal(stats([workout(now, []), ...lastWeek], now).weekStreak, 3);
  assert.equal(stats([workout(now, [])], now).thisWeek, 1);
  assert.equal(stats(lastWeek, now).minutes, 90);
  assert.deepEqual(stats([], now), { total: 0, thisWeek: 0, weekStreak: 0, minutes: 0 });
});

test('exercise log and muscle load count done blocks only, and skip warm-up and stretches', () => {
  const sessions = [
    workout(1000, [
      { ex: ['jumping-jacks', 'arm-circles'], result: 'done' },
      { ex: ['pull-up', 'push-up'], result: 'done' },
      { ex: ['plank'], result: 'skipped' },
      { ex: ['leg-stretch'], result: 'done' },
    ]),
    workout(5000, [{ ex: ['pull-up', 'squat'], result: 'partial' }]),
    { kind: 'old', startedAt: 9000, endedAt: 9999, exercises: [{ name: 'Push-up', done: [10] }] },
  ];
  assert.deepEqual(exerciseLog(sessions), {
    'pull-up': { count: 2, last: 5000 }, 'push-up': { count: 1, last: 1000 }, squat: { count: 1, last: 5000 },
  });
  assert.deepEqual(muscleLoad(sessions), { back: 2, chest: 1, legs: 1 });
  assert.deepEqual(muscleLoad(sessions, 2000), { back: 1, legs: 1 });
});

test('first launch shows the welcome; existing users skip it', () => {
  assert.equal(defaultState().onboarded, false);
  assert.equal(normalizeState({}).onboarded, false);
  assert.equal(normalizeState({ onboarded: true }).onboarded, true);
  assert.equal(normalizeState({ sessions: [workout(1, [])] }).onboarded, true);
  assert.equal(normalizeState({ profile: { level: 1, equipment: [] } }).onboarded, true);
});

test('normalizeState repairs bad input and drops what no longer exists', () => {
  assert.deepEqual(normalizeState(null), defaultState());
  const s = normalizeState({
    levels: { push: 3 }, active: { exercises: [] },
    sessions: [{}, workout(1, []), { startedAt: 2, endedAt: 3, exercises: [] }],
    settings: { rest: 5, sound: false, suggestMinutes: 90 },
  });
  assert.equal(s.sessions.length, 2);
  assert.equal('levels' in s, false);
  assert.equal('active' in s, false);
  assert.deepEqual(s.settings, { sound: false, suggestMinutes: 60 }); // 90 min no longer exists
});

test('formatters', () => {
  assert.equal(formatClock(90), '1:30');
  assert.equal(formatClock(0.2), '0:01');
  assert.equal(formatDuration(65000), '1m 05s');
  assert.equal(formatDuration(3720000), '1h 2m');
});
