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

const main = (it) => EXERCISES[it.ex].g[0];

test('a block never repeats a muscle group back to back, and only repeats at all when it must', () => {
  const plans = [
    ['emom', 'intervals', 'holds', 'intervals', 'holds', 'tabata', 'amrap'],
    ['emom', 'emom', 'circuit', 'amrap', 'tabata'],
  ];
  for (const focus of ['balanced', 'push', 'pull', 'legs', 'core', 'handstand']) {
    for (const plan of plans) {
      for (const seed of SEEDS) {
        const w = generateWorkout({ minutes: 90, plan, focus, seed });
        for (const b of w.blocks) {
          if (!b.items[0] || !EXERCISES[b.items[0].ex].g.length) continue; // warm-up, cool-down
          const groups = b.items.map(main);
          const k = groups.length;
          const where = `${focus}/${seed} ${b.kind} ${groups.join(',')}`;
          for (let i = 0; i < k; i++) {
            const next = groups[(i + 1) % k];
            if (k > 1 && (i < k - 1 || k > 2)) assert.notEqual(groups[i], next, `${where}: back to back`);
          }
          const groupCount = focus === 'handstand' ? 5 : 4;
          if (k <= groupCount) assert.equal(new Set(groups).size, k, `${where}: repeated a group`);
        }
      }
    }
  }
});

test('EMOM pairs two different groups', () => {
  for (const seed of SEEDS) {
    const w = generateWorkout({ minutes: 45, plan: ['emom', 'emom', 'emom'], seed, focus: 'core' });
    for (const b of w.blocks.filter((x) => x.kind === 'emom')) {
      const [a, c] = b.items.map(main);
      assert.notEqual(a, c);
      assert.ok(a === 'core' || c === 'core', 'focus is in every block');
    }
  }
});

test('a focused Tabata gives the focus the extra slots', () => {
  for (const seed of SEEDS) {
    const w = generateWorkout({ minutes: 60, plan: ['tabata'], focus: 'legs', seed });
    const groups = w.blocks.find((b) => b.title === 'Tabata').items.map(main);
    assert.equal(groups.filter((g) => g === 'legs').length, 3, groups.join(','));
  }
});
