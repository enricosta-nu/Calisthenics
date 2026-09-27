// Pure state logic: no DOM access, so it can be unit-tested with `node --test`.
import { TRACKS, TEMPLATES, trackById } from './data.js';
import { routineById, EXERCISES } from './routines.js';

export const STORAGE_KEY = 'calisthenics.v1';

export function defaultState() {
  return {
    version: 1,
    levels: Object.fromEntries(TRACKS.map((t) => [t.id, 0])),
    sessions: [],
    active: null,
    activeRoutine: null,
    settings: { rest: 90, sound: true },
  };
}

// Merge anything loaded from storage or an import file onto a valid default shape.
export function normalizeState(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const levels = { ...base.levels };
  for (const t of TRACKS) {
    const v = raw.levels?.[t.id];
    if (Number.isInteger(v)) levels[t.id] = clamp(v, 0, t.steps.length - 1);
  }
  return {
    version: 1,
    levels,
    sessions: Array.isArray(raw.sessions) ? raw.sessions.filter(isSession) : [],
    active: raw.active && Array.isArray(raw.active.exercises) ? raw.active : null,
    activeRoutine: isActiveRoutine(raw.activeRoutine) ? raw.activeRoutine : null,
    settings: {
      rest: Number.isFinite(raw.settings?.rest) ? clamp(raw.settings.rest, 15, 600) : base.settings.rest,
      sound: typeof raw.settings?.sound === 'boolean' ? raw.settings.sound : base.settings.sound,
    },
  };
}

function isActiveRoutine(a) {
  const routine = a && routineById[a.id];
  return Boolean(routine && Array.isArray(a.results) && a.results.length === routine.blocks.length);
}

function isSession(s) {
  return s && typeof s.startedAt === 'number' && Array.isArray(s.exercises);
}

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

export function stepFor(trackId, level) {
  const track = trackById[trackId];
  return track.steps[clamp(level, 0, track.steps.length - 1)];
}

export function buildWorkout(templateId, levels, now = Date.now()) {
  const template = TEMPLATES.find((t) => t.id === templateId);
  if (!template) throw new Error(`Unknown template: ${templateId}`);
  return {
    template: template.id,
    name: template.name,
    startedAt: now,
    current: 0,
    exercises: template.tracks.map((trackId) => {
      const level = levels[trackId] ?? 0;
      const step = stepFor(trackId, level);
      return {
        track: trackId,
        level,
        name: step.name,
        type: step.type,
        sets: step.sets,
        min: step.min,
        max: step.max,
        done: [],
      };
    }),
  };
}

// "advance" when every prescribed set hit the top of the range,
// "regress" when no set reached the bottom of it, otherwise "stay".
export function evaluate(ex) {
  if (ex.done.length < ex.sets) return 'stay';
  const counted = ex.done.slice(0, ex.sets);
  if (counted.every((n) => n >= ex.max)) return 'advance';
  if (Math.max(...counted) < ex.min) return 'regress';
  return 'stay';
}

export function suggestions(workout, levels) {
  const out = [];
  for (const ex of workout.exercises) {
    const verdict = evaluate(ex);
    const track = trackById[ex.track];
    if (verdict === 'advance' && ex.level < track.steps.length - 1 && levels[ex.track] === ex.level) {
      out.push({ track: ex.track, kind: 'advance', from: ex.name, to: track.steps[ex.level + 1].name, level: ex.level + 1 });
    } else if (verdict === 'regress' && ex.level > 0 && levels[ex.track] === ex.level) {
      out.push({ track: ex.track, kind: 'regress', from: ex.name, to: track.steps[ex.level - 1].name, level: ex.level - 1 });
    }
  }
  return out;
}

export function finishWorkout(state, now = Date.now()) {
  const w = state.active;
  if (!w) return { state, session: null, suggestions: [] };
  const exercises = w.exercises.filter((e) => e.done.length > 0);
  const session = {
    template: w.template,
    name: w.name,
    startedAt: w.startedAt,
    endedAt: now,
    exercises: exercises.map(({ track, level, name, type, sets, min, max, done }) => ({ track, level, name, type, sets, min, max, done })),
  };
  const next = { ...state, active: null };
  if (exercises.length > 0) next.sessions = [...state.sessions, session];
  return { state: next, session: exercises.length ? session : null, suggestions: suggestions({ exercises }, state.levels) };
}

export function sessionTotals(session) {
  let reps = 0;
  let seconds = 0;
  let sets = 0;
  for (const ex of session.exercises) {
    const sum = ex.done.reduce((a, b) => a + b, 0);
    sets += ex.done.length;
    if (ex.type === 'hold') seconds += sum;
    else reps += sum;
  }
  return { reps, seconds, sets };
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
  let reps = 0;
  for (const s of sessions) reps += sessionTotals(s).reps;
  return {
    total: sessions.length,
    thisWeek: sessions.filter((s) => weekKey(s.startedAt) === thisWeek).length,
    weekStreak: streak,
    reps,
  };
}

// Best single set per session for one track, oldest first.
export function trackHistory(sessions, trackId, limit = 12) {
  const points = [];
  for (const s of sessions) {
    const ex = s.exercises.find((e) => e.track === trackId);
    if (ex && ex.done.length) points.push({ at: s.startedAt, name: ex.name, level: ex.level, best: Math.max(...ex.done), type: ex.type });
  }
  return points.slice(-limit);
}

export function lastPerformance(sessions, trackId, level) {
  for (let i = sessions.length - 1; i >= 0; i--) {
    const ex = sessions[i].exercises.find((e) => e.track === trackId && e.level === level);
    if (ex) return ex.done;
  }
  return null;
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
      return `${block.title ? `${block.title} · ` : ''}${block.rounds} × ${block.work}s${rest}`;
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

export function startRoutine(routine, now = Date.now()) {
  return {
    id: routine.id,
    name: routine.name,
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

export function finishRoutine(state, routine, now = Date.now()) {
  const a = state.activeRoutine;
  if (!a) return { state, session: null };
  const touched = a.results.some((res) => res.status !== 'todo' || res.rounds > 0);
  const session = {
    kind: 'routine',
    routine: a.id,
    name: a.name,
    startedAt: a.startedAt,
    endedAt: now,
    exercises: [],
    blocks: routine.blocks.map((b, i) => ({ name: blockName(b), title: blockTitle(b), result: resultText(b, a.results[i]) })),
  };
  const next = { ...state, activeRoutine: null };
  if (touched) next.sessions = [...state.sessions, session];
  return { state: next, session: touched ? session : null };
}
