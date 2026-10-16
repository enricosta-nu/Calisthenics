// Pure state logic: no DOM access, so it can be unit-tested with `node --test`.
import { routineById, EXERCISES } from './routines.js';
import {
  MODULES, FOCUS, SUGGEST_MINUTES, CREATE_MINUTES, SKILL_BLOCKS, MAX_FINISHERS, DEFAULT_BUILDER, LEVELS, EQUIPMENT,
  DEFAULT_PROFILE,
} from './options.js';

export const STORAGE_KEY = 'calisthenics.v1';

export function defaultState() {
  return {
    version: 1,
    onboarded: false, // the welcome (level + equipment) has been shown
    sessions: [],
    activeRoutine: null,
    custom: [], // workouts saved from Create
    overrides: {}, // { routineId: { blockIndex: { work, rest, ... } } } timing edits
    intensity: {}, // { routineId | 'suggest' | 'create': step } see INTENSITY
    feelings: {}, // { same keys: { feel: 1–5, intensity, at } } the latest rating
    builder: copyBuilder(DEFAULT_BUILDER),
    // Level + equipment for Surprise me! and Create. A new user starts at Beginner with nothing
    // ticked and sets both in the welcome; saved data without a profile gets DEFAULT_PROFILE.
    profile: { level: 1, equipment: [] },
    settings: { sound: true, suggestMinutes: 60 },
  };
}

// Merge anything loaded from storage or an import file onto a valid default shape.
export function normalizeState(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const sessions = Array.isArray(raw.sessions) ? raw.sessions.filter(isSession) : [];
  return {
    version: 1,
    // Anyone with saved data already chose a profile (or used the defaults) before the welcome existed.
    onboarded: raw.onboarded === true || sessions.length > 0 || Boolean(raw.profile),
    sessions,
    activeRoutine: isActiveRoutine(raw.activeRoutine) ? raw.activeRoutine : null,
    custom: Array.isArray(raw.custom) ? raw.custom.filter(isWorkout) : [],
    overrides: raw.overrides && typeof raw.overrides === 'object' && !Array.isArray(raw.overrides) ? raw.overrides : {},
    intensity: normalizeIntensity(raw.intensity),
    feelings: normalizeFeelings(raw.feelings),
    builder: normalizeBuilder(raw.builder),
    profile: normalizeProfile(raw.profile),
    settings: {
      sound: typeof raw.settings?.sound === 'boolean' ? raw.settings.sound : base.settings.sound,
      suggestMinutes: SUGGEST_MINUTES.includes(raw.settings?.suggestMinutes) ? raw.settings.suggestMinutes : base.settings.suggestMinutes,
    },
  };
}

function normalizeFeelings(map) {
  if (!map || typeof map !== 'object' || Array.isArray(map)) return {};
  return Object.fromEntries(Object.entries(map).filter(([, f]) =>
    f && Number.isInteger(f.feel) && f.feel >= 1 && f.feel <= 5 && Number.isInteger(f.intensity) && typeof f.at === 'number'));
}

function normalizeIntensity(map) {
  if (!map || typeof map !== 'object' || Array.isArray(map)) return {};
  return Object.fromEntries(Object.entries(map)
    .filter(([, v]) => Number.isInteger(v))
    .map(([k, v]) => [k, clamp(v, INTENSITY_RANGE.min, INTENSITY_RANGE.max)]));
}

function normalizeProfile(p) {
  const d = DEFAULT_PROFILE;
  if (!p || typeof p !== 'object') return { ...d, equipment: [...d.equipment] };
  return {
    level: LEVELS.some((l) => l.id === p.level) ? p.level : d.level,
    equipment: Array.isArray(p.equipment) ? p.equipment.filter((k) => EQUIPMENT.some((e) => e.id === k)) : [...d.equipment],
  };
}

const copyBuilder = (b) => ({ ...b, skillKinds: [...b.skillKinds], finishers: [...b.finishers] });
const modulesOf = (part, list) => (Array.isArray(list) ? list : [])
  .filter((id) => MODULES.some((m) => m.id === id && m.part === part));

// Older saved choices (block kinds and count) don't map onto the skeleton; they reset to defaults.
function normalizeBuilder(b) {
  const d = DEFAULT_BUILDER;
  if (!b || typeof b !== 'object') return copyBuilder(d);
  const skillKinds = [...new Set(modulesOf('skill', b.skillKinds))];
  const finishers = modulesOf('finisher', b.finishers).slice(0, MAX_FINISHERS);
  return {
    minutes: CREATE_MINUTES.includes(b.minutes) ? b.minutes : d.minutes,
    opener: modulesOf('opener', [b.opener])[0] ?? d.opener,
    skillBlocks: Number.isInteger(b.skillBlocks) ? clamp(b.skillBlocks, SKILL_BLOCKS.min, SKILL_BLOCKS.max) : d.skillBlocks,
    skillKinds: skillKinds.length ? skillKinds : [...d.skillKinds],
    finishers: finishers.length ? finishers : [...d.finishers],
    focus: FOCUS.some((f) => f.id === b.focus) ? b.focus : d.focus,
    warmup: typeof b.warmup === 'boolean' ? b.warmup : d.warmup,
  };
}

const BLOCK_TYPES = ['interval', 'amrap', 'emom', 'circuit'];

// A workout from storage or an import file is only used if every exercise exists.
export function isWorkout(w) {
  return Boolean(w && typeof w.id === 'string' && typeof w.name === 'string' && Array.isArray(w.blocks) && w.blocks.length
    && w.blocks.every((b) => b && BLOCK_TYPES.includes(b.kind) && Array.isArray(b.items) && b.items.length
      && b.items.every((it) => it && EXERCISES[it.ex])));
}

function isActiveRoutine(a) {
  const routine = a && (a.routine ?? routineById[a.id]);
  return Boolean(isWorkout(routine) && Array.isArray(a.results) && a.results.length === routine.blocks.length);
}

// Workouts, plus sets-and-reps sessions from the first version of the app (kept in history).
function isSession(s) {
  return Boolean(s && typeof s.startedAt === 'number' && typeof s.endedAt === 'number'
    && (Array.isArray(s.blocks) || Array.isArray(s.exercises)));
}

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// Monday-based local week key, e.g. "2026-09-21".
export function weekKey(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function stats(sessions, now = Date.now()) {
  const weeks = new Set(sessions.map((s) => weekKey(s.startedAt)));
  const thisWeek = weekKey(now);
  // Consecutive weeks with at least one workout. The current week only
  // breaks the streak once it's over, so start from last week if empty.
  let streak = 0;
  const cursor = new Date(now);
  if (!weeks.has(thisWeek)) cursor.setDate(cursor.getDate() - 7);
  while (weeks.has(weekKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }
  return {
    total: sessions.length,
    thisWeek: sessions.filter((s) => weekKey(s.startedAt) === thisWeek).length,
    weekStreak: streak,
    minutes: Math.round(sessions.reduce((a, s) => a + (s.endedAt - s.startedAt), 0) / 60000),
  };
}

export function formatDuration(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---------- personal routines (timed blocks) ----------

export const READY_SECS = 10;

const itemWork = (block, it) => it.secs ?? block.work;

// The timeline of a timed block, starting with a short "get ready".
// Returns null for untimed circuits.
export function blockPhases(block) {
  if (block.kind === 'circuit') return null;
  const phases = [{ kind: 'ready', secs: READY_SECS, round: 1 }];
  if (block.kind === 'amrap') {
    phases.push({ kind: 'work', secs: block.minutes * 60, round: 1, items: block.items });
  } else if (block.kind === 'emom') {
    for (let round = 1; round <= block.rounds; round++) {
      phases.push({ kind: 'work', secs: block.every, round, items: block.items });
    }
  } else if (block.minutes) {
    // Cycle through the list until the clock runs out.
    const total = block.minutes * 60;
    const n = block.items.length;
    const perRound = block.circuit ?? n;
    for (let i = 0, t = 0; t < total; i++) {
      const it = block.items[i % n];
      const round = Math.floor(i / perRound) + 1;
      const work = Math.min(itemWork(block, it), total - t);
      phases.push({ kind: 'work', secs: work, round, item: it });
      t += work;
      const rest = Math.min(i % n === n - 1 ? block.roundRest : block.rest, total - t);
      if (rest > 0) phases.push({ kind: 'rest', secs: rest, round, next: block.items[(i + 1) % n] });
      t += rest;
    }
  } else {
    for (let round = 1; round <= block.rounds; round++) {
      block.items.forEach((it, i) => {
        phases.push({ kind: 'work', secs: itemWork(block, it), round, item: it });
        const lastOfRound = i === block.items.length - 1;
        if (lastOfRound && round === block.rounds) return;
        const rest = lastOfRound ? block.roundRest : block.rest;
        if (rest > 0) phases.push({ kind: 'rest', secs: rest, round, next: lastOfRound ? block.items[0] : block.items[i + 1] });
      });
    }
  }
  return phases;
}

// How many rounds the block has, for "Round x of y". Null for AMRAP.
export function blockRounds(block) {
  if (block.kind === 'amrap') return null;
  if (block.kind === 'interval' && block.minutes) {
    const works = blockPhases(block).filter((p) => p.kind === 'work').length;
    return Math.ceil(works / (block.circuit ?? block.items.length));
  }
  return block.rounds;
}

export function blockDuration(block) {
  const phases = blockPhases(block);
  if (!phases) return block.rounds * block.items.length * 30;
  return phases.reduce((a, p) => a + p.secs, 0) - READY_SECS;
}

// Where `elapsed` seconds lands in the timeline. index === phases.length means finished.
export function phaseAt(phases, elapsed) {
  let start = 0;
  for (let i = 0; i < phases.length; i++) {
    const end = start + phases[i].secs;
    if (elapsed < end) return { index: i, phase: phases[i], remaining: end - elapsed, into: elapsed - start };
    start = end;
  }
  return { index: phases.length, phase: null, remaining: 0, into: 0 };
}

export function blockTitle(block) {
  switch (block.kind) {
    case 'amrap': return `AMRAP ${block.minutes} min`;
    case 'emom': return block.every === 60 ? `EMOM ${block.rounds} min` : `Every ${formatClock(block.every)} × ${block.rounds}`;
    case 'circuit': return block.rounds > 1 ? `${block.rounds} rounds` : 'At your pace';
    default: {
      const rest = block.rest ? ` / ${block.rest}s` : '';
      const prefix = block.title ? `${block.title} · ` : '';
      if (block.minutes) return `${prefix}${block.minutes} min · ${block.work}s${rest}`;
      // A single pass through a list reads better as "6 × 45s" than "1 × 45s".
      const count = block.rounds === 1 ? block.items.length : block.rounds;
      return `${prefix}${count} × ${block.work}s${rest}`;
    }
  }
}

// Short name for a block, from its exercises.
export function blockName(block) {
  const names = block.items.map((it) => EXERCISES[it.ex].name);
  if (block.kind === 'amrap') return `AMRAP ${block.minutes}'`;
  if (block.kind === 'emom') return 'EMOM';
  if (block.kind === 'circuit') return names.length === 1 ? names[0] : 'Circuit';
  if (block.title) return block.title;
  return names.join(' + ');
}

// ---------- muscle-group rotation ----------

// Two exercises next to each other clash when they work the same main muscle group in the
// same way: both dynamic (reps) or both isometric (holds). An iso next to a dynamic move of
// the same group is fine (pull-up hold → pull-up), and pushes and pulls can repeat in a
// block as long as they alternate (push, pull, push). A shoulder push (pike push-up) next to
// a chest push (push-up) is fine too. Rest and stretches never clash.
export function exercisesClash(a, b) {
  const ea = EXERCISES[a];
  const eb = EXERCISES[b];
  if (!ea?.g.length || !eb?.g.length) return false;
  return ea.g[0] === eb.g[0] && ea.t === eb.t && ea.area === eb.area;
}

// Neighbouring pairs in a block that clash, counting the wrap from the last exercise back to
// the first when the block goes round more than once. Returns [[i, j], ...] item indexes.
export function blockClashes(block) {
  const items = block.items;
  const k = items.length;
  const loops = block.kind !== 'circuit' || block.rounds > 1;
  const out = [];
  for (let i = 0; i < k; i++) {
    const j = i + 1 < k ? i + 1 : loops && k > 2 ? 0 : null;
    if (j != null && exercisesClash(items[i].ex, items[j].ex)) out.push([i, j]);
  }
  return out;
}

// The workout being played. Older saved state only has the id of a built-in routine.
export function routineOf(active) {
  return active.routine ?? routineById[active.id];
}

// ---------- intensity ----------
// The same workout, harder or easier, by changing only time and rounds (never the exercises).

export const INTENSITY = [
  { step: -1, name: 'Easier', blurb: '5s shorter sets · AMRAP −2 min · EMOM and circuits −1 round' },
  { step: 0, name: 'Standard', blurb: 'As written' },
  { step: 1, name: 'Harder', blurb: '+5s per set · AMRAP +2 min · EMOM and circuits +1 round' },
  { step: 2, name: 'Harder +', blurb: '+5s per set and +1 round · AMRAP +4 min · EMOM +2 rounds' },
  { step: 3, name: 'Hardest', blurb: '+10s per set and +1 round · AMRAP +6 min · EMOM +3 rounds' },
];
export const INTENSITY_RANGE = { min: -1, max: 3 };
export const intensityOf = (step) => INTENSITY.find((i) => i.step === step) ?? INTENSITY[1];

// Warm-up, stretching and rest-only blocks never change.
function isEasyBlock(block) {
  if (block.module === 'warmup' || block.module === 'cooldown') return true;
  if (block.title === 'Warm-up' || block.title === 'Cool-down') return true;
  return block.items.every((it) => ['stretch', 'rest', 'warmup'].includes(EXERCISES[it.ex]?.t));
}

export function intensify(block, step) {
  if (!step || isEasyBlock(block)) return block;
  const secsDelta = step < 0 ? -5 : step >= 3 ? 10 : 5;
  const moreSecs = (v) => clamp(v + secsDelta, 10, 300);
  switch (block.kind) {
    case 'interval': {
      const roundsDelta = step >= 2 ? 1 : 0;
      return {
        ...block,
        work: moreSecs(block.work),
        ...(block.rounds ? { rounds: Math.max(1, block.rounds + roundsDelta) } : {}),
        items: block.items.map((it) => (it.secs != null ? { ...it, secs: moreSecs(it.secs) } : it)),
      };
    }
    case 'amrap':
      return { ...block, minutes: clamp(block.minutes + 2 * step, 3, 40) };
    case 'emom':
      return { ...block, rounds: clamp(block.rounds + step, 3, 30) };
    case 'circuit':
      return { ...block, rounds: Math.max(1, block.rounds + (step < 0 ? -1 : Math.ceil(step / 2))) };
    default:
      return block;
  }
}

// ---------- how it felt ----------
// The user rates each workout; next time the app offers (never forces) a change of intensity.

export const FEELINGS = [
  { value: 1, name: 'Very easy' },
  { value: 2, name: 'Easy' },
  { value: 3, name: 'Just right' },
  { value: 4, name: 'Hard' },
  { value: 5, name: 'Very hard' },
];
export const feelingOf = (value) => FEELINGS.find((f) => f.value === value);

// What to offer before starting a workout again, given how it felt last time.
// Rated 1–3 → one level harder; 4 → nothing; 5 → one level easier. Nothing either if the
// intensity has changed since that rating (the user already decided).
export function intensityAdvice(feeling, currentStep) {
  if (!feeling || feeling.intensity !== currentStep) return null;
  if (feeling.feel <= 3 && currentStep < INTENSITY_RANGE.max) return { to: currentStep + 1 };
  if (feeling.feel === 5 && currentStep > INTENSITY_RANGE.min) return { to: currentStep - 1 };
  return null;
}

// Record a rating on the session and as the latest feeling for that workout.
export function rateSession(state, startedAt, feel) {
  const session = state.sessions.find((x) => x.startedAt === startedAt);
  if (!session || !feelingOf(feel)) return state;
  session.feel = feel;
  if (session.key) {
    state.feelings[session.key] = { feel, intensity: session.intensity ?? 0, at: session.endedAt };
  }
  return state;
}

export function applyIntensity(routine, step) {
  return step ? { ...routine, blocks: routine.blocks.map((b) => intensify(b, step)) } : routine;
}

// ---------- timing edits ----------

const TIMING_LIMITS = {
  rounds: [1, 20, 1], minutes: [1, 60, 1], work: [5, 300, 5], rest: [0, 300, 5], roundRest: [0, 600, 5], every: [15, 300, 15],
};

// The timing fields a block exposes for editing, in display order.
export function timingFields(block) {
  if (block.kind === 'amrap') return ['minutes'];
  if (block.kind === 'emom') return ['every', 'rounds'];
  if (block.kind === 'circuit') return ['rounds'];
  const fields = [block.minutes ? 'minutes' : 'rounds', 'work', 'rest'];
  // With one exercise the only rest is between rounds, which "rest" already covers.
  if (block.items.length > 1) fields.push('roundRest');
  return fields;
}

// Fields to merge into a block after a +/- tap on one timing value.
export function adjustTiming(block, field, direction) {
  const [lo, hi, step] = TIMING_LIMITS[field];
  const value = clamp((block[field] ?? 0) + direction * step, lo, hi);
  const patch = { [field]: value };
  if (block.kind === 'interval' && block.items.length === 1 && field === 'rest') patch.roundRest = value;
  return patch;
}

export function applyOverrides(routine, overrides = {}) {
  return { ...routine, blocks: routine.blocks.map((b, i) => ({ ...b, ...(overrides[i] ?? {}) })) };
}

// `key` is what ratings and intensity are remembered under: the routine id, or 'suggest' /
// 'create' for generated workouts (new every time, so the section is what's remembered).
export function startRoutine(routine, now = Date.now(), intensity = 0, key = routine.id) {
  return {
    id: routine.id,
    key,
    name: routine.name,
    intensity,
    routine: JSON.parse(JSON.stringify({ id: routine.id, name: routine.name, blocks: routine.blocks })),
    startedAt: now,
    block: 0,
    blockStartedAt: null,
    pausedAt: null,
    pausedMs: 0,
    results: routine.blocks.map(() => ({ rounds: 0, status: 'todo' })),
  };
}

// Seconds into the current block's timeline, or null if its timer hasn't started.
export function routineElapsed(active, now = Date.now()) {
  if (!active.blockStartedAt) return null;
  return ((active.pausedAt ?? now) - active.blockStartedAt - active.pausedMs) / 1000;
}

export function resultText(block, res) {
  if (block.kind === 'amrap' || block.kind === 'circuit') {
    if (res.rounds) return `${res.rounds} round${res.rounds === 1 ? '' : 's'}`;
  }
  return { done: 'done', partial: 'partial', todo: 'skipped' }[res.status];
}

export function finishRoutine(state, now = Date.now()) {
  const a = state.activeRoutine;
  if (!a) return { state, session: null };
  const routine = routineOf(a);
  const touched = a.results.some((res) => res.status !== 'todo' || res.rounds > 0);
  const session = {
    kind: 'routine',
    routine: a.id,
    name: a.name,
    ...(a.intensity ? { intensity: a.intensity } : {}),
    ...(a.key ? { key: a.key } : {}),
    startedAt: a.startedAt,
    endedAt: now,
    exercises: [],
    blocks: routine.blocks.map((b, i) => ({
      name: blockName(b), title: blockTitle(b), result: resultText(b, a.results[i]), ...(b.module ? { module: b.module } : {}),
      ex: b.items.map((it) => it.ex),
    })),
  };
  const next = { ...state, activeRoutine: null };
  if (touched) next.sessions = [...state.sessions, session];
  return { state: next, session: touched ? session : null };
}

// ---------- looking back: variety and recovery ----------

const HOUR = 3600000;

// What the generator should know about recent training:
//  recent — how recently each exercise was done in the last 3 workouts (3 = last one, 2, 1),
//           so new workouts favour exercises you haven't done lately;
//  tired  — muscle groups worked hard (4+ exercises) in the last 36 hours, to go lighter on them.
// Skipped blocks don't count.
export function trainingHistory(sessions, now = Date.now()) {
  const done = (b) => b.ex && b.result !== 'skipped';
  const workouts = sessions.filter((x) => x.kind === 'routine' && x.blocks?.some(done));
  const recent = {};
  workouts.slice(-3).reverse().forEach((sess, i) => {
    for (const b of sess.blocks.filter(done)) {
      for (const id of b.ex) recent[id] = Math.max(recent[id] ?? 0, 3 - i);
    }
  });
  const load = {};
  for (const sess of workouts.filter((x) => now - x.endedAt < 36 * HOUR)) {
    for (const b of sess.blocks.filter(done)) {
      for (const id of b.ex) {
        const mg = EXERCISES[id]?.mg;
        if (mg) load[mg] = (load[mg] ?? 0) + 1;
      }
    }
  }
  return { recent, tired: Object.keys(load).filter((mg) => load[mg] >= 4) };
}

// ---------- progress ----------

// Exercises done (blocks not skipped) in workouts since `since`: { id: { count, last } }.
export function exerciseLog(sessions, since = 0) {
  const log = {};
  for (const sess of sessions) {
    if (sess.kind !== 'routine' || sess.startedAt < since) continue;
    for (const b of sess.blocks) {
      if (!b.ex || b.result === 'skipped') continue;
      for (const id of b.ex) {
        if (!EXERCISES[id]?.g.length) continue; // warm-up, stretches
        const entry = (log[id] ??= { count: 0, last: 0 });
        entry.count += 1;
        entry.last = Math.max(entry.last, sess.startedAt);
      }
    }
  }
  return log;
}

// How many exercises of each muscle group were done since `since`.
export function muscleLoad(sessions, since = 0) {
  const load = {};
  for (const [id, { count }] of Object.entries(exerciseLog(sessions, since))) {
    const mg = EXERCISES[id].mg;
    if (mg) load[mg] = (load[mg] ?? 0) + count;
  }
  return load;
}
