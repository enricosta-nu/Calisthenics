import test from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES } from '../js/exercises.js';
import { generateWorkout, suggestPlan, createPlan, workoutDuration, rng, MAIN_GROUPS, usable } from '../js/generator.js';
import { isWorkout, blockClashes } from '../js/logic.js';

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
  const opts = { minutes: 60, plan: ['intervals', 'tabata', 'amrap'], focus: 'back' };
  assert.deepEqual(generateWorkout({ ...opts, seed: 5 }), generateWorkout({ ...opts, seed: 5 }));
  assert.notDeepEqual(generateWorkout({ ...opts, seed: 5 }), generateWorkout({ ...opts, seed: 6 }));
});

// Exercises counted by their muscle group in the approved reference.
function muscleCounts(workout) {
  const counts = {};
  for (const b of workout.blocks) for (const it of b.items) {
    const mg = EXERCISES[it.ex].mg;
    if (mg) counts[mg] = (counts[mg] ?? 0) + 1;
  }
  return counts;
}

test('a focus muscle group gets more work than any other, and the main slot groups still show up', () => {
  for (const focus of ['back', 'chest', 'shoulders', 'core', 'legs']) {
    for (const seed of SEEDS) {
      const w = generateWorkout({ minutes: 60, plan: ['intervals', 'holds', 'tabata', 'circuit', 'amrap'], focus, seed });
      const slots = groupCounts(w);
      for (const g of MAIN_GROUPS) assert.ok(slots[g] > 0, `${focus}/${seed} trains ${g}`);
      const counts = muscleCounts(w);
      for (const [mg, n] of Object.entries(counts)) {
        if (mg !== focus) assert.ok(counts[focus] > n, `${focus}/${seed}: ${JSON.stringify(counts)}`);
      }
    }
  }
});

test('an Arms focus brings in more arm exercises than a balanced workout', () => {
  let arms = 0;
  let balanced = 0;
  for (const seed of SEEDS) {
    const plan = ['intervals', 'tabata', 'circuit', 'amrap'];
    arms += muscleCounts(generateWorkout({ minutes: 60, plan, focus: 'arms', seed })).arms ?? 0;
    balanced += muscleCounts(generateWorkout({ minutes: 60, plan, seed })).arms ?? 0;
  }
  assert.ok(arms > balanced * 1.5, `arms ${arms} vs balanced ${balanced}`);
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

test('generated blocks never put clashing exercises next to each other', () => {
  const plans = [
    ['emom', 'intervals', 'holds', 'intervals', 'holds', 'tabata', 'amrap'],
    ['emom', 'emom', 'circuit', 'amrap', 'tabata'],
    ['intervals', 'intervals', 'intervals', 'intervals'],
  ];
  for (const focus of ['balanced', 'back', 'chest', 'shoulders', 'arms', 'core', 'legs']) {
    for (const plan of plans) {
      for (const seed of SEEDS) {
        const w = generateWorkout({ minutes: 90, plan, focus, seed });
        for (const b of w.blocks) {
          const groups = b.items.map(main);
          const where = `${focus}/${seed} ${b.kind} ${b.items.map((it) => it.ex).join(',')}`;
          assert.deepEqual(blockClashes(b), [], where);
          // Legs and core never come up twice in a block that has room for every group.
          const room = focus === 'shoulders' ? 5 : 4;
          if (groups.length <= room) {
            for (const g of ['legs', 'core']) assert.ok(groups.filter((x) => x === g).length <= 1, where);
          }
        }
      }
    }
  }
});

test('push/pull supersets alternate and pair a dynamic move with a hold of the same group', () => {
  let seen = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const w = generateWorkout({ minutes: 90, plan: ['intervals', 'intervals', 'intervals'], seed });
    for (const b of w.blocks.filter((x) => x.kind === 'interval' && x.items.length === 3)) {
      const groups = b.items.map(main);
      if (groups[0] !== groups[2]) continue;
      seen++;
      assert.ok(['push', 'pull'].includes(groups[0]) && ['push', 'pull'].includes(groups[1]) && groups[0] !== groups[1], groups.join(','));
      assert.deepEqual(b.items.map((it) => EXERCISES[it.ex].t), ['reps', 'reps', 'hold']);
    }
  }
  assert.ok(seen > 0, 'the superset pattern shows up');
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

const PROFILES = [
  { level: 1, equipment: [] },
  { level: 1, equipment: ['bar', 'band', 'dip'] },
  { level: 2, equipment: ['bar', 'lowbar', 'dip', 'parallettes'] },
  { level: 3, equipment: ['bar', 'lowbar', 'dip', 'parallettes', 'rings'] },
  { level: 2, equipment: ['parallettes'] },
];

test('only exercises that fit the level and equipment are picked', () => {
  for (const profile of PROFILES) {
    for (const seed of SEEDS) {
      const w = generateWorkout({ minutes: 90, plan: suggestPlan(90, rng(seed)), seed, profile });
      for (const b of w.blocks) {
        for (const it of b.items) {
          const e = EXERCISES[it.ex];
          if (!e.g.length) continue; // warm-up, stretches
          const where = `L${profile.level} [${profile.equipment}] ${it.ex}`;
          assert.ok(usable(e, profile), where);
          if (e.level > profile.level) assert.equal(it.note, 'with resistance band', where);
        }
        assert.deepEqual(blockClashes(b), [], `L${profile.level} [${profile.equipment}] ${b.items.map((x) => x.ex)}`);
      }
      if (!profile.equipment.includes('bar')) {
        assert.ok(w.blocks.every((b) => b.items.every((it) => it.ex !== 'dead-hang-stretch')), 'no bar, no hang in the cool-down');
      }
    }
  }
});

test('beginners with a band get band-assisted pull-ups, chin-ups or dips; others never see band notes', () => {
  let banded = 0;
  for (const seed of SEEDS) {
    const w = generateWorkout({ minutes: 60, plan: ['intervals', 'tabata', 'amrap'], focus: 'back', seed, profile: PROFILES[1] });
    banded += w.blocks.flatMap((b) => b.items).filter((it) => it.note === 'with resistance band').length;
    const pro = generateWorkout({ minutes: 60, plan: ['intervals', 'tabata', 'amrap'], focus: 'back', seed, profile: PROFILES[2] });
    assert.ok(pro.blocks.flatMap((b) => b.items).every((it) => !it.note?.includes('band')));
  }
  assert.ok(banded > 0);
  // without a band, a beginner never gets a level-2 bar exercise
  assert.equal(usable(EXERCISES['pull-up'], { level: 1, equipment: ['bar'] }), false);
  assert.equal(usable(EXERCISES['pull-up'], { level: 1, equipment: ['bar', 'band'] }), true);
  assert.equal(usable(EXERCISES['archer-pull-up'], { level: 1, equipment: ['bar', 'band'] }), false);
  // the bench dip is the no-equipment alternative to the upright dip
  assert.equal(usable(EXERCISES['triceps-dip'], { level: 2, equipment: [] }), false);
  assert.equal(usable(EXERCISES['bench-dip'], { level: 2, equipment: [] }), true);
});
