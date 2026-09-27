import test from 'node:test';
import assert from 'node:assert/strict';
import { ROUTINES, EXERCISES, routineById } from '../js/routines.js';
import {
  READY_SECS, blockPhases, blockDuration, phaseAt, blockTitle, startRoutine, routineElapsed,
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

test('tabata 20/10 over 4 exercises × 2 rounds is 8 work intervals, 4 minutes minus the final rest', () => {
  const tab = routineById.a1.blocks[1];
  const phases = blockPhases(tab);
  assert.equal(phases.filter((p) => p.kind === 'work').length, 8);
  assert.equal(blockDuration(tab), 8 * 20 + 7 * 10);
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
  assert.equal(blockTitle(routineById.a1.blocks[1]), 'Tabata · 2 × 20s / 10s');
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
  const empty = finishRoutine(state, rt, 1000);
  assert.equal(empty.session, null);
  assert.equal(empty.state.sessions.length, 0);
  assert.equal(empty.state.activeRoutine, null);

  state.activeRoutine.results[0].status = 'done';
  state.activeRoutine.results[2] = { status: 'done', rounds: 4 };
  const r = finishRoutine(state, rt, 60000);
  assert.equal(r.state.sessions.length, 1);
  assert.deepEqual(r.session.blocks.map((b) => b.result), ['done', 'skipped', '4 rounds']);
  assert.equal(r.session.kind, 'routine');
});

test('normalizeState keeps a valid in-progress routine and drops a broken one', () => {
  const a = startRoutine(routineById.a3, 0);
  assert.deepEqual(normalizeState({ activeRoutine: a }).activeRoutine, a);
  assert.equal(normalizeState({ activeRoutine: { ...a, id: 'gone' } }).activeRoutine, null);
  assert.equal(normalizeState({ activeRoutine: { ...a, results: [] } }).activeRoutine, null);
});

test('reference: blocks sum into a sensible workout length', () => {
  for (const rt of ROUTINES) {
    const mins = rt.blocks.reduce((s, b) => s + blockDuration(b), 0) / 60;
    assert.ok(mins > 10 && mins < 70, `${rt.name}: ${mins} min`);
  }
  assert.equal(READY_SECS, 10);
});
