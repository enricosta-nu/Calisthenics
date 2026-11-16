// Languages: English (the source) and Italian.
//
// Screen text goes through t('English text', { params }): the English text is the key, and
// a missing translation falls back to English. Names that live in data (exercises, options,
// intensities, coaching tips) are switched in place by setLang, so every screen picks them up.

import { IT } from './i18n-it.js';
import { EXERCISES_IT, MUSCLES_IT } from './i18n-it-exercises.js';
import { COACHING_IT } from './coaching-it.js';

export const LANGS = [
  { id: 'en', name: 'English' },
  { id: 'it', name: 'Italiano' },
];

let lang = 'en';
export const getLang = () => lang;
export const locale = () => (lang === 'it' ? 'it-IT' : 'en-GB');

export function defaultLang() {
  const nav = typeof navigator !== 'undefined' ? navigator.language ?? '' : '';
  return nav.toLowerCase().startsWith('it') ? 'it' : 'en';
}

export function t(text, params) {
  let out = lang === 'it' ? IT[text] ?? text : text;
  if (params) for (const [k, v] of Object.entries(params)) out = out.replaceAll(`{${k}}`, v);
  return out;
}

// "Lats, biceps, lower & middle trapezius" → each muscle translated, keeping the capital.
export function tMuscles(text) {
  if (lang !== 'it' || !text) return text ?? '';
  return text.split(', ').map((m) => {
    const it = MUSCLES_IT[m.toLowerCase()];
    if (!it) return m;
    return m[0] === m[0].toUpperCase() ? it[0].toUpperCase() + it.slice(1) : it;
  }).join(', ');
}

// Objects whose `name` / `blurb` / `cue` change with the language: { object: { field: english } }.
const originals = new Map();
const registered = [];

// Register lists of objects with English `name` / `blurb` fields (options, intensities…).
export function translatable(...lists) {
  for (const list of lists) for (const obj of list) registered.push(obj);
  apply();
}

let exercises = null;
let coaching = null;
export function registerData({ EXERCISES, COACHING }) {
  exercises = EXERCISES;
  coaching = COACHING;
  apply();
}

function remember(obj, fields) {
  if (!originals.has(obj)) originals.set(obj, Object.fromEntries(fields.filter((f) => f in obj).map((f) => [f, obj[f]])));
  return originals.get(obj);
}

function apply() {
  for (const obj of registered) {
    const en = remember(obj, ['name', 'blurb']);
    for (const [f, v] of Object.entries(en)) obj[f] = t(v);
  }
  if (exercises) {
    for (const [id, ex] of Object.entries(exercises)) {
      const en = remember(ex, ['name', 'cue']);
      const it = lang === 'it' ? EXERCISES_IT[id] : null;
      ex.name = it?.[0] ?? en.name;
      ex.cue = it?.[1] ?? en.cue;
    }
  }
  if (coaching) {
    for (const [id, co] of Object.entries(coaching)) {
      const en = remember(co, ['how', 'safe', 'most']);
      const it = lang === 'it' ? COACHING_IT[id] : null;
      for (const f of ['how', 'safe', 'most']) co[f] = it?.[f] ?? en[f];
    }
  }
}

// The English text of a translated field, e.g. to store names in one language.
export function englishOf(obj, field = 'name') {
  return originals.get(obj)?.[field] ?? obj[field];
}

export function setLang(next) {
  lang = next === 'it' ? 'it' : 'en';
  apply();
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}
