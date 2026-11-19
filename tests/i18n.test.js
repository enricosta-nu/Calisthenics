import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { IT } from '../js/i18n-it.js';
import { EXERCISES_IT, MUSCLES_IT } from '../js/i18n-it-exercises.js';
import { COACHING_IT } from '../js/coaching-it.js';
import { COACHING } from '../js/coaching.js';
import { EXERCISES, ROUTINES } from '../js/routines.js';
import { PARTS, MODULES, FOCUS, LEVELS, EQUIPMENT } from '../js/options.js';
import { INTENSITY, FEELINGS, GROUP_FEELINGS, blockTitle } from '../js/logic.js';
import { t, tMuscles, setLang, translatable, registerData, englishOf } from '../js/i18n.js';

// Every literal passed to t() in the app.
function keysIn(file) {
  const src = fs.readFileSync(new URL(`../js/${file}`, import.meta.url), 'utf8');
  const keys = [];
  for (const m of src.matchAll(/\bt\(\s*(?:[^'"`()]*\?\s*)?(['"])((?:\\.|(?!\1).)*)\1(?:\s*:\s*(['"])((?:\\.|(?!\3).)*)\3)?/g)) {
    keys.push(m[2].replace(/\\'/g, "'"));
    if (m[4]) keys.push(m[4].replace(/\\'/g, "'"));
  }
  return keys;
}

test('every screen text has an Italian translation', () => {
  const missing = [...keysIn('app.js'), ...keysIn('logic.js')].filter((k) => !(k in IT));
  assert.deepEqual(missing, []);
});

test('options, intensities, ratings, notes and titles have Italian translations', () => {
  const texts = [
    ...[PARTS, MODULES, FOCUS, LEVELS, EQUIPMENT, INTENSITY, FEELINGS, GROUP_FEELINGS].flat().flatMap((o) => [o.name, o.blurb]),
    ...ROUTINES.flatMap((r) => r.blocks.flatMap((b) => [b.note, b.title, ...b.items.map((it) => it.note)])),
    'with resistance band', 'band if needed', 'Rest the remainder of each minute.', 'Warm-up', 'Cool-down',
    'Rounds', 'Total time', 'Work', 'Every', 'Rest between rounds', 'Hold', 'Reps', 'Stretch',
  ].filter(Boolean);
  assert.deepEqual(texts.filter((x) => !(x in IT)), []);
});

test('every exercise, muscle and coaching tip has an Italian version', () => {
  for (const [id, ex] of Object.entries(EXERCISES)) {
    assert.ok(EXERCISES_IT[id]?.[0] && EXERCISES_IT[id][1], `name and cue for ${id}`);
    for (const f of ['main', 'secondary']) {
      for (const m of (ex[f] ?? '').split(', ').filter(Boolean)) assert.ok(MUSCLES_IT[m.toLowerCase()], `muscle "${m}"`);
    }
  }
  for (const [id, co] of Object.entries(COACHING)) {
    const it = COACHING_IT[id];
    assert.ok(it, `coaching for ${id}`);
    for (const f of ['how', 'safe', 'most']) assert.equal(it[f].length, co[f].length, `${id}.${f}`);
  }
});

test('switching language changes names in place and back', () => {
  const levels = [{ name: 'Beginner', blurb: 'Building the basics: push-ups, rows, squats' }];
  translatable(levels);
  registerData({ EXERCISES, COACHING });
  setLang('it');
  assert.equal(t('Resume'), 'Riprendi');
  assert.equal(t('Round {n} of {total}', { n: 2, total: 4 }), 'Giro 2 di 4');
  assert.equal(levels[0].name, 'Principiante');
  assert.equal(englishOf(levels[0]), 'Beginner');
  assert.equal(EXERCISES['pull-up'].name, 'Trazioni prone');
  assert.equal(tMuscles('Lats, biceps'), 'Dorsali, bicipiti');
  assert.match(COACHING['pull-up'].how[0], /sbarra/);
  assert.equal(blockTitle({ kind: 'circuit', rounds: 3, items: [] }), '3 giri');
  setLang('en');
  assert.equal(EXERCISES['pull-up'].name, 'Pull-up');
  assert.equal(levels[0].name, 'Beginner');
  assert.equal(t('Resume'), 'Resume');
});
