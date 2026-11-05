import test from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES } from '../js/exercises.js';
import { FIGURES, FLOOR, figureFrame, musclesOf, poseAt, reachGaps } from '../js/figures.js';
import { COACHING } from '../js/coaching.js';

test('every exercise has a figure and an explanation', () => {
  for (const [id, ex] of Object.entries(EXERCISES)) {
    assert.ok(FIGURES[id], `figure for ${id}`);
    const co = COACHING[id];
    assert.ok(co?.how.length, `how-to for ${id}`);
    if (ex.mg) {
      assert.ok(co.safe.length >= 2, `safety tips for ${id}`);
      assert.ok(co.most.length >= 2, `tips for ${id}`);
    }
  }
});

test('hands and feet stay on the floor, bars and boxes they are placed on', () => {
  for (const [id, spec] of Object.entries(FIGURES)) {
    const supports = new Set([FLOOR, ...(spec.props ?? []).map((p) => p[2])]);
    spec.keys.forEach((k, i) => {
      const gaps = reachGaps(k);
      for (const part of ['hand', 'hand2', 'foot', 'foot2']) {
        const target = k[part] ?? k[part.replace('2', '')];
        if (supports.has(target[1])) assert.ok(gaps[part] <= 1.5, `${id} key ${i}: ${part} misses its support by ${gaps[part].toFixed(1)}`);
      }
    });
  }
});

test('frames are well formed at any time', () => {
  for (const id of Object.keys(FIGURES)) {
    for (const t of [null, 0, 0.37, 1.9, 7.3]) assert.doesNotMatch(figureFrame(id, t), /NaN|undefined/, id);
    assert.ok(poseAt(FIGURES[id], 1e6).hip, id);
  }
});

test('every reference exercise highlights at least one main muscle', () => {
  for (const [id, ex] of Object.entries(EXERCISES)) {
    if (!ex.mg) continue;
    assert.ok(Object.values(musclesOf(id)).includes(1), `main muscle shown for ${id}`);
  }
  assert.equal(musclesOf('pull-up').upperback, 1);
  assert.equal(musclesOf('pull-up').biceps, 2);
  assert.equal(musclesOf('push-up').chest, 1);
  assert.equal(musclesOf('squat').quads, 1);
});
