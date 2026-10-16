import test from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES } from '../js/exercises.js';
import {
  generateWorkout, suggestPlan, createPlan, skillSection, workoutDuration, rng, MAIN_GROUPS, usable, partOf,
} from '../js/generator.js';
import { isWorkout, blockClashes } from '../js/logic.js';
import { moduleById } from '../js/options.js';

const SEEDS = [1, 2, 3, 42, 99, 1234, 777, 2026];
const main = (it) => EXERCISES[it.ex].g[0];
const part = (m) => moduleById[m].part;

// Exercises counted by their slot group (push, pull, legs, core, handstand).
function groupCounts(workout) {
  const counts = Object.fromEntries([...MAIN_GROUPS, 'handstand'].map((g) => [g, 0]));
  for (const b of workout.blocks) for (const it of b.items) if (EXERCISES[it.ex].g.length) counts[main(it)] += 1;
  return counts;
}

// Exercises counted by their muscle group in the approved reference.
function muscleCounts(workout) {
  const counts = {};
  for (const b of workout.blocks) for (const it of b.items) {
    const { mg } = EXERCISES[it.ex];
    if (mg) counts[mg] = (counts[mg] ?? 0) + 1;
  }
  return counts;
}

test('suggested plans follow the skeleton: opener, skill section, finisher (split at 75 min)', () => {
  for (const seed of SEEDS) {
    for (const minutes of [45, 60]) {
      const plan = suggestPlan(minutes, rng(seed));
      assert.equal(part(plan[0]), 'opener');
      assert.equal(part(plan.at(-1)), 'finisher');
      assert.ok(plan.slice(1, -1).every((m) => part(m) === 'skill'), plan.join());
      assert.equal(plan.at(-2), 'skill-holds', 'handstand right before the finisher');
    }
    const long = suggestPlan(75, rng(seed));
    assert.equal(part(long[0]), 'opener');
    assert.deepEqual(long.slice(-3).map(part), ['finisher', 'skill', 'finisher'], long.join());
    assert.equal(long.at(-2), 'skill-holds', 'handstand between the two finishers');
    assert.notEqual(long.at(-3), long.at(-1), 'two different finishers');
  }
});

test('suggestions avoid repeating the last finisher', () => {
  for (const seed of SEEDS) {
    assert.notEqual(suggestPlan(45, rng(seed), 'amrap').at(-1), 'amrap');
    assert.notEqual(suggestPlan(60, rng(seed), 'tabata').at(-1), 'tabata');
  }
});

test('suggested workouts land close to 45 / 60 / 75 minutes and are valid', () => {
  for (const minutes of [45, 60, 75]) {
    for (const seed of SEEDS) {
      const w = generateWorkout({ minutes, plan: suggestPlan(minutes, rng(seed)), seed });
      assert.ok(isWorkout(w), `${minutes}/${seed} is valid`);
      const got = workoutDuration(w) / 60;
      assert.ok(Math.abs(got - minutes) <= minutes * 0.1, `${minutes} min, seed ${seed}: got ${got.toFixed(1)}`);
      assert.equal(w.blocks[0].title, 'Warm-up');
      assert.equal(w.blocks.at(-1).title, 'Cool-down');
      for (const g of MAIN_GROUPS) assert.ok(groupCounts(w)[g] > 0, `${minutes}/${seed} trains ${g}`);
    }
  }
});

test('the opener is pull + push, the skill section is shoulders + core, legs only in the finisher', () => {
  for (const seed of SEEDS) {
    for (const opener of ['opener-strength', 'opener-emom', 'opener-circuit']) {
      const w = generateWorkout({ minutes: 60, plan: [opener, 'skill-intervals', 'skill-holds', 'amrap'], seed });
      const [, op, skill, holds] = w.blocks;
      const groups = op.items.map(main);
      assert.equal(groups[0], 'pull', `${opener}: ${groups}`);
      assert.equal(groups[1], 'push', `${opener}: ${groups}`);
      assert.deepEqual([EXERCISES[skill.items[0].ex].mg, EXERCISES[skill.items[1].ex].mg], ['shoulders', 'core']);
      assert.equal(main(holds.items[0]), 'handstand', 'the first hold block is handstand work');
      for (const b of w.blocks) {
        if (partOf(b) === 'finisher') continue;
        assert.ok(b.items.every((it) => EXERCISES[it.ex].mg !== 'legs'), `no legs in ${b.module}`);
      }
    }
  }
});

test('createPlan builds the skeleton from the choices, splitting two finishers around the handstand', () => {
  const base = { opener: 'opener-emom', skillBlocks: 2, skillKinds: ['skill-intervals', 'skill-holds'] };
  assert.deepEqual(createPlan({ ...base, finishers: ['tabata'] }), ['opener-emom', 'skill-intervals', 'skill-holds', 'tabata']);
  assert.deepEqual(createPlan({ ...base, finishers: ['tabata', 'amrap'] }), ['opener-emom', 'skill-intervals', 'tabata', 'skill-holds', 'amrap']);
  assert.deepEqual(createPlan({ ...base, skillBlocks: 0, finishers: ['circuit'] }), ['opener-emom', 'circuit']);
  assert.deepEqual(skillSection(3, ['skill-intervals', 'skill-holds']), ['skill-intervals', 'skill-intervals', 'skill-holds']);
  assert.deepEqual(skillSection(1, ['skill-intervals', 'skill-holds']), ['skill-holds']);
  assert.deepEqual(skillSection(2, ['skill-holds']), ['skill-holds', 'skill-holds']);
});

test('same options and seed give the same workout; a new seed shuffles it', () => {
  const opts = { minutes: 60, plan: ['opener-strength', 'skill-intervals', 'skill-holds', 'amrap'], focus: 'back' };
  assert.deepEqual(generateWorkout({ ...opts, seed: 5 }), generateWorkout({ ...opts, seed: 5 }));
  assert.notDeepEqual(generateWorkout({ ...opts, seed: 5 }), generateWorkout({ ...opts, seed: 6 }));
});

test('a focus muscle group gets more work than any other', () => {
  const plan = ['opener-strength', 'skill-intervals', 'skill-holds', 'tabata', 'circuit'];
  for (const focus of ['back', 'chest', 'shoulders', 'core', 'legs']) {
    for (const seed of SEEDS) {
      const counts = muscleCounts(generateWorkout({ minutes: 75, plan, focus, seed }));
      for (const [mg, n] of Object.entries(counts)) {
        if (mg !== focus) assert.ok(counts[focus] > n, `${focus}/${seed}: ${JSON.stringify(counts)}`);
      }
    }
  }
});

test('an Arms focus brings in more arm exercises than a balanced workout', () => {
  let arms = 0;
  let balanced = 0;
  const plan = ['opener-strength', 'skill-intervals', 'tabata', 'circuit'];
  for (const seed of SEEDS) {
    arms += muscleCounts(generateWorkout({ minutes: 60, plan, focus: 'arms', seed })).arms ?? 0;
    balanced += muscleCounts(generateWorkout({ minutes: 60, plan, seed })).arms ?? 0;
  }
  assert.ok(arms > balanced * 1.5, `arms ${arms} vs balanced ${balanced}`);
});

test('tabata is 12 minutes with 8 different exercises when there is room, shorter when not', () => {
  const long = generateWorkout({ minutes: 60, plan: ['opener-strength', 'skill-holds', 'tabata'], seed: 1 });
  const tab = long.blocks.find((b) => b.module === 'tabata');
  assert.equal(tab.minutes, 12);
  assert.equal(new Set(tab.items.map((it) => it.ex)).size, 8);
  const short = generateWorkout({ minutes: 30, plan: ['opener-strength', 'skill-intervals', 'tabata', 'amrap'], seed: 1 });
  assert.ok(short.blocks.find((b) => b.module === 'tabata').minutes < 12);
});

test('warm-up can be turned off, and EMOMs only use rep exercises', () => {
  const w = generateWorkout({ minutes: 30, plan: ['opener-emom', 'amrap'], warmup: false, seed: 9 });
  assert.equal(w.blocks.length, 2);
  for (const it of w.blocks[0].items) assert.equal(EXERCISES[it.ex].t, 'reps');
});

test('generated blocks never put clashing exercises next to each other', () => {
  for (const focus of ['balanced', 'back', 'chest', 'shoulders', 'arms', 'core', 'legs']) {
    for (const minutes of [45, 60, 75]) {
      for (const seed of SEEDS) {
        const w = generateWorkout({ minutes, plan: suggestPlan(minutes, rng(seed)), focus, seed });
        for (const b of w.blocks) assert.deepEqual(blockClashes(b), [], `${focus}/${seed} ${b.module} ${b.items.map((it) => it.ex)}`);
      }
    }
  }
});

test('a Tabata repeats groups only when it must, never back to back', () => {
  for (const seed of SEEDS) {
    const w = generateWorkout({ minutes: 60, plan: ['opener-strength', 'tabata'], focus: 'legs', seed });
    const groups = w.blocks.find((b) => b.module === 'tabata').items.map(main);
    groups.forEach((g, i) => assert.notEqual(g, groups[(i + 1) % groups.length], groups.join()));
    assert.equal(groups.filter((g) => g === 'legs').length, 3, groups.join());
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
      const w = generateWorkout({ minutes: 75, plan: suggestPlan(75, rng(seed)), seed, profile });
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
  const plan = ['opener-strength', 'skill-intervals', 'tabata', 'amrap'];
  for (const seed of SEEDS) {
    const w = generateWorkout({ minutes: 60, plan, focus: 'back', seed, profile: PROFILES[1] });
    banded += w.blocks.flatMap((b) => b.items).filter((it) => it.note === 'with resistance band').length;
    const pro = generateWorkout({ minutes: 60, plan, focus: 'back', seed, profile: PROFILES[2] });
    assert.ok(pro.blocks.flatMap((b) => b.items).every((it) => !it.note?.includes('band')));
  }
  assert.ok(banded > 0);
  assert.equal(usable(EXERCISES['pull-up'], { level: 1, equipment: ['bar'] }), false);
  assert.equal(usable(EXERCISES['pull-up'], { level: 1, equipment: ['bar', 'band'] }), true);
  assert.equal(usable(EXERCISES['archer-pull-up'], { level: 1, equipment: ['bar', 'band'] }), false);
  assert.equal(usable(EXERCISES['triceps-dip'], { level: 2, equipment: [] }), false);
  assert.equal(usable(EXERCISES['bench-dip'], { level: 2, equipment: [] }), true);
});

test('history: recent exercises come up less, tired muscle groups get lighter, nothing is excluded', async () => {
  const { trainingHistory } = await import('../js/logic.js');
  const now = 1_000_000_000_000;
  const sess = (hoursAgo, ex, result = 'done') => ({
    kind: 'routine', startedAt: now - hoursAgo * 3600e3, endedAt: now - hoursAgo * 3600e3, blocks: [{ ex, result }],
  });
  const h = trainingHistory([
    sess(100, ['squat']),
    sess(72, ['pull-up', 'plank']),
    sess(48, ['chin-up']),
    sess(10, ['pull-up', 'chin-up', 'australian', 'archer-pull-up']),
    sess(5, ['dip'], 'skipped'),
  ], now);
  assert.deepEqual(h.recent, { 'pull-up': 3, 'chin-up': 3, australian: 3, 'archer-pull-up': 3, plank: 1 });
  assert.deepEqual(h.tired, ['back']);

  // across many seeds, a tired Back and recently done exercises appear less often
  const plan = ['opener-strength', 'skill-intervals', 'skill-holds', 'tabata', 'circuit'];
  const count = (history, pred) => SEEDS.reduce((n, seed) => n + generateWorkout({ minutes: 75, plan, seed, history })
    .blocks.flatMap((b) => b.items).filter((it) => pred(it.ex)).length, 0);
  const isBack = (id) => EXERCISES[id].mg === 'back';
  assert.ok(count({ recent: {}, tired: ['back'] }, isBack) < count(undefined, isBack));
  const recent = { 'push-up': 3, 'pull-up': 3, 'hollow-hold': 3 };
  const inRecent = (id) => id in recent;
  assert.ok(count({ recent, tired: [] }, inRecent) < count(undefined, inRecent));
  // and still valid workouts with no clashes
  for (const seed of SEEDS) {
    const w = generateWorkout({ minutes: 60, plan, seed, history: { recent, tired: ['back', 'core'] } });
    assert.ok(isWorkout(w));
    for (const b of w.blocks) assert.deepEqual(blockClashes(b), []);
  }
});
