import test from 'node:test';
import assert from 'node:assert/strict';
import { ROUTINES, EXERCISES, routineById } from '../js/routines.js';
import {
  READY_SECS, exercisesClash, blockClashes, blockRounds, timingFields, adjustTiming, applyOverrides, isWorkout, blockPhases, blockDuration, phaseAt, blockTitle, startRoutine, routineElapsed,
  finishRoutine, normalizeState, defaultState,
} from '../js/logic.js';

test('every routine item points at a known exercise', () => {
  const ids = new Set();
  for (const rt of ROUTINES) {
    assert.ok(!ids.has(rt.id), `duplicate id ${rt.id}`);
    ids.add(rt.id);
    for (const b of rt.blocks) {
      assert.ok(['interval', 'amrap', 'emom', 'circuit'].includes(b.kind));
      for (const it of b.items) assert.ok(EXERCISES[it.ex], `${rt.id}: unknown exercise ${it.ex}`);
    }
  }
});

test('interval phases: rest between items, round rest between rounds, none at the end', () => {
  const block = { kind: 'interval', rounds: 2, work: 15, rest: 0, roundRest: 30, items: [{ ex: 'a' }, { ex: 'b', secs: 20 }] };
  const phases = blockPhases(block);
  assert.deepEqual(phases.map((p) => `${p.kind}${p.secs}`), ['ready10', 'work15', 'work20', 'rest30', 'work15', 'work20']);
  assert.equal(phases[3].next.ex, 'a');
  assert.equal(blockDuration(block), 15 + 20 + 30 + 15 + 20);
});

test('default tabata is 12 min of 20/10: 3 circuits of 8 intervals, cycling through the exercises', () => {
  const tab = routineById.a1.blocks[1];
  const work = blockPhases(tab).filter((p) => p.kind === 'work');
  assert.equal(work.length, 24);
  assert.deepEqual(work.slice(0, 5).map((p) => p.item.ex), ['chin-up', 'push-up', 'planche-lean', 'plank', 'chin-up']);
  assert.equal(work[7].round, 1);
  assert.equal(work[8].round, 2);
  assert.equal(work[23].round, 3);
  assert.equal(blockRounds(tab), 3);
  assert.equal(blockDuration(tab), 12 * 60);
  // with 5 exercises the list doesn't line up with circuits, but it's still 3 × 4 min
  const five = blockPhases(routineById.a12.blocks[3]).filter((p) => p.kind === 'work');
  assert.equal(five[8].item.ex, 'australian'); // circuit 2 picks up where the list left off
  assert.equal(blockRounds(routineById.a12.blocks[3]), 3);
});

test('tabata with explicit rounds keeps them', () => {
  const tab = routineById.a8.blocks[0];
  assert.equal(tab.minutes, undefined);
  assert.equal(blockPhases(tab).filter((p) => p.kind === 'work').length, 16);
});

test('amrap, emom and circuit timelines', () => {
  const amrap = { kind: 'amrap', minutes: 12, items: [] };
  assert.equal(blockDuration(amrap), 720);
  const emom = { kind: 'emom', every: 75, rounds: 6, items: [] };
  assert.equal(blockPhases(emom).length, 1 + 6);
  assert.equal(blockDuration(emom), 450);
  assert.equal(blockPhases({ kind: 'circuit', rounds: 3, items: [{}] }), null);
});

test('phaseAt walks the timeline', () => {
  const phases = [{ secs: 10 }, { secs: 20 }, { secs: 5 }];
  assert.equal(phaseAt(phases, 0).index, 0);
  assert.equal(phaseAt(phases, 9.5).remaining, 0.5);
  assert.equal(phaseAt(phases, 10).index, 1);
  assert.equal(phaseAt(phases, 29).into, 19);
  assert.equal(phaseAt(phases, 35).index, 3);
  assert.equal(phaseAt(phases, 35).phase, null);
});

test('block titles', () => {
  assert.equal(blockTitle(routineById.a1.blocks[0]), '4 × 30s / 45s');
  assert.equal(blockTitle(routineById.a1.blocks[1]), 'Tabata · 12 min · 20s / 10s');
  assert.equal(blockTitle(routineById.a8.blocks[1]), 'Tabata · 3 × 30s / 20s');
  assert.equal(blockTitle(routineById.a2.blocks[2]), 'AMRAP 12 min');
  assert.equal(blockTitle(routineById.a9.blocks[0]), 'Every 1:15 × 6');
  assert.equal(blockTitle(routineById.a10.blocks[0]), 'EMOM 8 min');
});

test('elapsed time excludes pauses', () => {
  const a = startRoutine(routineById.a1, 0);
  assert.equal(routineElapsed(a, 5000), null);
  a.blockStartedAt = 1000;
  a.pausedMs = 2000;
  assert.equal(routineElapsed(a, 13000), 10);
  a.pausedAt = 8000;
  assert.equal(routineElapsed(a, 60000), 5);
});

test('finishRoutine saves a summary only when something was done', () => {
  const rt = routineById.a2;
  const state = { ...defaultState(), activeRoutine: startRoutine(rt, 0) };
  const empty = finishRoutine(state, 1000);
  assert.equal(empty.session, null);
  assert.equal(empty.state.sessions.length, 0);
  assert.equal(empty.state.activeRoutine, null);

  state.activeRoutine.results[0].status = 'done';
  state.activeRoutine.results[2] = { status: 'done', rounds: 4 };
  const r = finishRoutine(state, 60000);
  assert.equal(r.state.sessions.length, 1);
  assert.deepEqual(r.session.blocks.map((b) => b.result), ['done', 'skipped', '4 rounds']);
  assert.equal(r.session.kind, 'routine');
});

test('normalizeState keeps a valid in-progress routine and drops a broken one', () => {
  const a = startRoutine(routineById.a3, 0);
  assert.deepEqual(normalizeState({ activeRoutine: a }).activeRoutine, a);
  // a generated workout carries its own blocks, so no id lookup is needed
  assert.deepEqual(normalizeState({ activeRoutine: { ...a, id: 'gen' } }).activeRoutine.id, 'gen');
  const broken = { ...a, id: 'gen', routine: { ...a.routine, blocks: [{ kind: 'amrap', minutes: 5, items: [{ ex: 'nope' }] }] } };
  assert.equal(normalizeState({ activeRoutine: broken }).activeRoutine, null);
  assert.equal(normalizeState({ activeRoutine: { ...a, id: 'gone', routine: undefined } }).activeRoutine, null);
  assert.equal(normalizeState({ activeRoutine: { ...a, results: [] } }).activeRoutine, null);
});

test('reference: blocks sum into a sensible workout length', () => {
  for (const rt of ROUTINES) {
    const mins = rt.blocks.reduce((s, b) => s + blockDuration(b), 0) / 60;
    assert.ok(mins > 10 && mins < 70, `${rt.name}: ${mins} min`);
  }
  assert.equal(READY_SECS, 10);
});

test('timing edits: fields per block kind, limits, and single-exercise rest', () => {
  const holds = routineById.a1.blocks[2]; // 4 × 30s handstand, 30s rest
  assert.deepEqual(timingFields(holds), ['rounds', 'work', 'rest']);
  assert.deepEqual(adjustTiming(holds, 'rest', 1), { rest: 35, roundRest: 35 });
  assert.deepEqual(adjustTiming(holds, 'rounds', -1), { rounds: 3 });
  assert.deepEqual(timingFields(routineById.a1.blocks[1]), ['minutes', 'work', 'rest', 'roundRest']);
  assert.deepEqual(timingFields(routineById.a2.blocks[2]), ['minutes']);
  assert.deepEqual(adjustTiming({ kind: 'interval', items: [{}, {}], rest: 0 }, 'rest', -1), { rest: 0 });
  assert.deepEqual(adjustTiming({ kind: 'emom', every: 60 }, 'every', 1), { every: 75 });
});

test('applyOverrides merges edits per block without touching the original', () => {
  const rt = routineById.a1;
  const edited = applyOverrides(rt, { 2: { rest: 45, roundRest: 45 } });
  assert.equal(edited.blocks[2].rest, 45);
  assert.equal(rt.blocks[2].rest, 30);
  assert.equal(edited.blocks[0], edited.blocks[0]);
  assert.equal(blockDuration(edited.blocks[2]), 4 * 30 + 3 * 45);
});

test('isWorkout rejects unknown exercises and empty blocks', () => {
  assert.ok(ROUTINES.every(isWorkout));
  assert.ok(!isWorkout({ id: 'x', name: 'x', blocks: [] }));
  assert.ok(!isWorkout({ id: 'x', name: 'x', blocks: [{ kind: 'amrap', minutes: 5, items: [{ ex: 'moonwalk' }] }] }));
});

test('clash rule: same group and same style clash; iso + dynamic and alternation are fine', () => {
  assert.equal(exercisesClash('pull-up-iso', 'pull-up'), false); // iso + dynamic, same muscles
  assert.equal(exercisesClash('pull-up', 'push-up'), false);
  assert.equal(exercisesClash('push-up', 'dip'), true); // two dynamic chest pushes back to back
  assert.equal(exercisesClash('pike-push-up', 'push-up'), false); // shoulders vs chest
  assert.equal(exercisesClash('plank', 'hollow-hold'), true); // two core holds
  assert.equal(exercisesClash('planche-lean', 'rest'), false);
  // pull, push, pull hold: the wrap puts the hold before the pull again, which is fine
  assert.deepEqual(blockClashes(routineById.a6.blocks[0]), []);
  // a single-pass circuit doesn't wrap
  assert.deepEqual(blockClashes({ kind: 'circuit', rounds: 1, items: [{ ex: 'dip' }, { ex: 'pull-up' }, { ex: 'push-up' }] }), []);
  assert.deepEqual(blockClashes({ kind: 'circuit', rounds: 3, items: [{ ex: 'dip' }, { ex: 'pull-up' }, { ex: 'push-up' }] }), [[2, 0]]);
});

test('the 12 trainings follow the rotation rules', () => {
  for (const rt of ROUTINES) {
    rt.blocks.forEach((b, i) => assert.deepEqual(blockClashes(b), [], `${rt.name} block ${i + 1}`));
  }
});

test('intensity: harder adds time and rounds, easier removes time, exercises never change', async () => {
  const { intensify, applyIntensity, applyOverrides } = await import('../js/logic.js');
  const holds = routineById.a1.blocks[2]; // 4 × 30s / 30s handstand
  assert.deepEqual([1, 2, 3, -1].map((s) => [intensify(holds, s).rounds, intensify(holds, s).work]), [[4, 35], [5, 35], [5, 40], [4, 25]]);
  const tab = routineById.a1.blocks[1]; // 12 min Tabata stays 12 min with 10s rest
  assert.deepEqual([intensify(tab, 1).minutes, intensify(tab, 1).work, intensify(tab, 1).rest], [12, 25, 10]);
  assert.equal(intensify(routineById.a2.blocks[2], 2).minutes, 16); // AMRAP 12 → 16
  assert.equal(intensify(routineById.a2.blocks[2], -1).minutes, 10);
  assert.equal(intensify(routineById.a10.blocks[0], 1).rounds, 9); // EMOM 8 → 9
  assert.equal(intensify(routineById.a11.blocks[0], 1).rounds, 5); // circuit 4 → 5
  // timed items inside an AMRAP keep their seconds; timed items in intervals grow with the work
  assert.equal(intensify(routineById.a7.blocks[1], 1).items[1].secs, 35);
  // stretching never changes; nor do the exercises
  assert.equal(intensify(routineById.a9.blocks[6], 3), routineById.a9.blocks[6]);
  const hard = applyIntensity(routineById.a4, 3);
  assert.deepEqual(hard.blocks.map((b) => b.items.map((it) => it.ex)), routineById.a4.blocks.map((b) => b.items.map((it) => it.ex)));
  assert.equal(applyIntensity(routineById.a4, 0), routineById.a4);
  // a manual timing edit wins over intensity for that value
  const both = applyOverrides(applyIntensity(routineById.a1, 1), { 2: { work: 45 } });
  assert.equal(both.blocks[2].work, 45);
  assert.equal(both.blocks[0].work, 35);
});

test('intensity is stored per workout and kept within range', () => {
  const s = normalizeState({ intensity: { a1: 2, a2: 9, suggest: -5, bad: 'x' } });
  assert.deepEqual(s.intensity, { a1: 2, a2: 3, suggest: -1 });
  const a = startRoutine(routineById.a1, 0, 2);
  assert.equal(a.intensity, 2);
  const state = { ...defaultState(), activeRoutine: { ...a, results: a.results.map(() => ({ status: 'done', rounds: 0 })) } };
  assert.equal(finishRoutine(state, 1000).session.intensity, 2);
});

test('how it felt: the rating is remembered per workout and only ever offers a change', async () => {
  const { intensityAdvice, rateSession } = await import('../js/logic.js');
  const at = (feel, intensity) => ({ feel, intensity, at: 1 });
  assert.deepEqual(intensityAdvice(at(1, 0), 0), { to: 1 });
  assert.deepEqual(intensityAdvice(at(3, 0), 0), { to: 1 }); // just right → offer harder
  assert.equal(intensityAdvice(at(4, 0), 0), null); // hard → keep, no question
  assert.deepEqual(intensityAdvice(at(5, 1), 1), { to: 0 }); // very hard → offer easier
  assert.equal(intensityAdvice(at(2, 0), 1), null); // already changed since then
  assert.equal(intensityAdvice(at(2, 3), 3), null); // already at the top
  assert.equal(intensityAdvice(at(5, -1), -1), null); // already at the bottom
  assert.equal(intensityAdvice(undefined, 0), null);

  const rt = routineById.a3;
  let state = { ...defaultState(), activeRoutine: startRoutine(rt, 100, 1, 'a3') };
  state.activeRoutine.results[0].status = 'done';
  state = finishRoutine(state, 5000).state;
  rateSession(state, 100, 3);
  assert.equal(state.sessions[0].feel, 3);
  assert.deepEqual(state.feelings.a3, { feel: 3, intensity: 1, at: 5000 });
  rateSession(state, 100, 9); // not a valid rating
  assert.equal(state.sessions[0].feel, 3);
  assert.deepEqual(normalizeState(JSON.parse(JSON.stringify(state))).feelings, state.feelings);
  assert.deepEqual(normalizeState({ feelings: { x: { feel: 7, intensity: 0, at: 1 }, y: 'no' } }).feelings, {});
});
