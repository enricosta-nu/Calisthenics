import test from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES } from '../js/exercises.js';
import { generateWorkout, suggestPlan, createPlan, workoutDuration, rng, MAIN_GROUPS } from '../js/generator.js';
import { isWorkout } from '../js/logic.js';

const SEEDS = [1, 2, 3, 42, 99, 1234, 777, 2026];

// Exercises counted by their main muscle group.
function groupCounts(workout) {
  const counts = Object.fromEntries([...MAIN_GROUPS, 'handstand'].map((g) => [g, 0]));
  for (const b of workout.blocks) for (const it of b.items) if (EXERCISES[it.ex].g.length) counts[EXERCISES[it.ex].g[0]] += 1;
  return counts;
}

test('suggested workouts land close to the chosen duration and cover every muscle group', () => {
  for (const minutes of [45, 60, 90]) {
    for (const seed of SEEDS) {
      const w = generateWorkout({ minutes, plan: suggestPlan(minutes, rng(seed)), seed });
      assert.ok(isWorkout(w), `${minutes}/${seed} is valid`);
      const got = workoutDuration(w) / 60;
      assert.ok(Math.abs(got - minutes) <= minutes * 0.1, `${minutes} min, seed ${seed}: got ${got.toFixed(1)}`);
      const counts = groupCounts(w);
      for (const g of MAIN_GROUPS) assert.ok(counts[g] > 0, `${minutes}/${seed} trains ${g}`);
      assert.equal(w.blocks[0].title, 'Warm-up');
      assert.equal(w.blocks.at(-1).title, 'Cool-down');
    }
  }
});

test('same options and seed give the same workout; a new seed shuffles it', () => {
  const opts = { minutes: 60, plan: ['intervals', 'tabata', 'amrap'], focus: 'pull' };
  assert.deepEqual(generateWorkout({ ...opts, seed: 5 }), generateWorkout({ ...opts, seed: 5 }));
  assert.notDeepEqual(generateWorkout({ ...opts, seed: 5 }), generateWorkout({ ...opts, seed: 6 }));
});

test('a focus gets more work than any other group, but every group still shows up', () => {
  for (const focus of MAIN_GROUPS) {
    for (const seed of SEEDS) {
      const w = generateWorkout({ minutes: 60, plan: ['intervals', 'tabata', 'circuit', 'amrap'], focus, seed });
      const counts = groupCounts(w);
      for (const g of MAIN_GROUPS) {
        assert.ok(counts[g] > 0, `${focus}/${seed} trains ${g}`);
        if (g !== focus) assert.ok(counts[focus] > counts[g], `${focus}/${seed}: ${JSON.stringify(counts)}`);
      }
    }
  }
});

test('tabata is 12 minutes when the workout has room, shorter when it does not', () => {
  const long = generateWorkout({ minutes: 60, plan: ['intervals', 'tabata', 'amrap'], seed: 1 });
  const tab = long.blocks.find((b) => b.title === 'Tabata');
  assert.equal(tab.minutes, 12);
  assert.equal(tab.items.length, 8);
  assert.equal(new Set(tab.items.map((it) => it.ex)).size, 8);
  const short = generateWorkout({ minutes: 30, plan: ['intervals', 'tabata', 'emom', 'amrap'], seed: 1 });
  assert.ok(short.blocks.find((b) => b.title === 'Tabata').minutes < 12);
});

test('createPlan uses only the chosen kinds, in a sensible order', () => {
  const rand = rng(3);
  assert.deepEqual(createPlan(['amrap', 'tabata'], 4, rand), ['tabata', 'tabata', 'amrap', 'amrap']);
  const two = createPlan(['amrap', 'tabata', 'emom', 'holds'], 2, rand);
  assert.equal(two.length, 2);
  assert.deepEqual(createPlan([], 1, rand), ['intervals']);
  assert.deepEqual(createPlan(['amrap', 'emom'], 2, rand), ['emom', 'amrap']);
});

test('warm-up can be turned off, and EMOM only uses rep exercises', () => {
  const w = generateWorkout({ minutes: 45, plan: ['emom', 'emom'], warmup: false, seed: 9 });
  assert.equal(w.blocks.length, 2);
  for (const b of w.blocks) for (const it of b.items) assert.equal(EXERCISES[it.ex].t, 'reps');
});
