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
  assert.deepEqual(s.settings, { sound: false, suggestMinutes: 60, name: '', recovery: 90, voice: true, vibrate: true, lang: 'en' }); // 90 min no longer exists
});

test('formatters', () => {
  assert.equal(formatClock(90), '1:30');
  assert.equal(formatClock(0.2), '0:01');
  assert.equal(formatDuration(65000), '1m 05s');
  assert.equal(formatDuration(3720000), '1h 2m');
});

test("today's equipment applies only on the day it was set", async () => {
  const { effectiveProfile, dayKey } = await import('../js/logic.js');
  const now = new Date(2026, 9, 16, 10).getTime();
  const state = { profile: { level: 2, equipment: ['bar', 'dip'] }, today: { date: dayKey(now), equipment: [] } };
  assert.deepEqual(effectiveProfile(state, now), { level: 2, equipment: [] });
  assert.deepEqual(effectiveProfile(state, now + 86400000), { level: 2, equipment: ['bar', 'dip'] });
  assert.deepEqual(effectiveProfile({ ...state, today: null }, now).equipment, ['bar', 'dip']);
  assert.equal(normalizeState({ today: { date: '2026-10-16', equipment: ['bar', 'jetpack'] } }).today.equipment.join(), 'bar');
});

test('per-group levels: rating a group easy twice offers the next level; the user decides', async () => {
  const { levelFor, trainedGroups, rateGroup, groupAdvice, answerGroupAdvice, workoutsSinceBackup } = await import('../js/logic.js');
  const sess = (t) => ({ kind: 'routine', startedAt: t, endedAt: t + 1, blocks: [
    { ex: ['pull-up', 'chin-up', 'push-up'], result: 'done' }, { ex: ['plank'], result: 'skipped' }, { ex: ['jumping-jacks'], result: 'done' },
  ] });
  const state = { ...defaultState(), profile: { level: 2, equipment: [] }, sessions: [sess(1), sess(2), sess(3)] };
  assert.deepEqual(trainedGroups(state.sessions[0]), ['back', 'chest']); // skipped and warm-up don't count

  rateGroup(state, 1, 'back', 1);
  assert.equal(groupAdvice(state, 'back'), null); // once isn't enough
  rateGroup(state, 2, 'back', 1);
  assert.deepEqual(groupAdvice(state, 'back'), { mg: 'back', to: 3 });
  rateGroup(state, 2, 'back', 2); // changed their mind on that workout
  assert.equal(groupAdvice(state, 'back'), null);
  rateGroup(state, 2, 'back', 1);
  answerGroupAdvice(state, 'back', false); // "not yet": streak starts over, level unchanged
  assert.equal(levelFor(state.profile, 'back'), 2);
  assert.equal(groupAdvice(state, 'back'), null);

  rateGroup(state, 3, 'back', 1);
  rateGroup(state, 1, 'back', 1);
  answerGroupAdvice(state, 'back', true);
  assert.equal(levelFor(state.profile, 'back'), 3);
  assert.equal(levelFor(state.profile, 'chest'), 2); // other groups keep the overall level
  assert.equal(state.sessions[2].groupFeel.back, 1);

  // hard twice → one level down; never below 1 or above 3
  state.groupFeelings.chest = [{ v: 3, level: 2, session: 3 }, { v: 3, level: 2, session: 2 }];
  assert.deepEqual(groupAdvice(state, 'chest'), { mg: 'chest', to: 1 });
  state.groupFeelings.back = [{ v: 1, level: 3, session: 3 }, { v: 1, level: 3, session: 2 }];
  assert.equal(groupAdvice(state, 'back'), null);
  // ratings made at an older level don't count
  state.groupFeelings.core = [{ v: 1, level: 1, session: 3 }, { v: 1, level: 1, session: 2 }];
  assert.equal(groupAdvice(state, 'core'), null);

  // stored levels and ratings survive a reload, bad ones are dropped
  const reloaded = normalizeState(JSON.parse(JSON.stringify({ ...state, profile: { ...state.profile, groupLevels: { back: 3, wings: 2, legs: 7 } } })));
  assert.deepEqual(reloaded.profile.groupLevels, { back: 3 });

  // backup reminder counter
  assert.equal(workoutsSinceBackup(state), 3);
  assert.equal(workoutsSinceBackup({ ...state, lastBackup: { at: 1, sessions: 2 } }), 1);
});

test('the generator uses the level of each muscle group', async () => {
  const { generateWorkout, suggestPlan, rng, usable } = await import('../js/generator.js');
  const { EXERCISES } = await import('../js/exercises.js');
  const profile = { level: 1, equipment: ['bar', 'lowbar', 'dip', 'parallettes'], groupLevels: { back: 3 } };
  assert.equal(usable(EXERCISES['archer-pull-up'], profile), true); // back at 3
  assert.equal(usable(EXERCISES['archer-push-up'], profile), false); // chest still 1
  for (const seed of [1, 2, 3, 4, 5]) {
    const w = generateWorkout({ minutes: 60, plan: suggestPlan(60, rng(seed)), seed, profile });
    for (const it of w.blocks.flatMap((b) => b.items)) {
      const e = EXERCISES[it.ex];
      // Level 1 elsewhere, or one level up (never at the bar) to avoid a repeat.
      if (e.mg && e.mg !== 'back') assert.ok(e.level <= 1 || (e.level === 2 && !e.needs.includes('bar')), `${it.ex} above level 1`);
    }
  }
});
