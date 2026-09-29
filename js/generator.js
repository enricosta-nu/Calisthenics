// Builds a full workout (warm-up, main blocks, cool-down) from a few choices.
// Pure and seeded, so the same options + seed always give the same workout.
import { EXERCISES } from './exercises.js';
import { interval, tabata, amrap, emom, circuit } from './routines.js';
import { blockDuration, clamp } from './logic.js';
import { FOCUS } from './options.js';

export { BLOCK_KINDS, FOCUS, SUGGEST_MINUTES, CREATE_MINUTES } from './options.js';

export const MAIN_GROUPS = ['pull', 'push', 'legs', 'core'];
// Time budgeted between blocks to set up and catch your breath.
export const TRANSITION_SECS = 60;

// Strength-heavy blocks first, conditioning finishers last.
const KIND_ORDER = ['emom', 'intervals', 'holds', 'tabata', 'circuit', 'amrap'];
// Share of the main time each kind gets, relative to the others.
const KIND_WEIGHT = { holds: 0.6 };
// Kinds with a set length (seconds) when the workout has room for it.
const FIXED_SECS = { tabata: 12 * 60 };
const MIN_BLOCK_SECS = 180;

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

function shuffle(rand, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- plans: which kinds of blocks, in which order ----------

export function suggestPlan(minutes, rand) {
  const finisher = pick(rand, ['amrap', 'amrap', 'emom', 'circuit']);
  if (minutes <= 45) return ['intervals', 'holds', 'tabata', finisher];
  if (minutes <= 60) return ['intervals', 'holds', 'intervals', 'tabata', finisher];
  return ['emom', 'intervals', 'holds', 'intervals', 'holds', 'tabata', finisher];
}

export function createPlan(kinds, count, rand) {
  const chosen = kinds.length ? kinds : ['intervals'];
  let plan;
  if (count <= chosen.length) {
    plan = shuffle(rand, chosen).slice(0, count);
  } else {
    plan = [...chosen];
    while (plan.length < count) plan.push(chosen[plan.length % chosen.length]);
  }
  return plan.sort((a, b) => KIND_ORDER.indexOf(a) - KIND_ORDER.indexOf(b));
}

// ---------- exercise selection ----------

// Muscle groups for the k exercises of one block. Balanced spreads work over the
// least-trained groups so far; a focus takes ~40% of the slots and the rest rotate.
function slotGroups(k, ctx) {
  const { focus, usage, rand } = ctx;
  const byUsage = (groups) => groups
    .map((g) => [g, usage[g] + rand() * 0.01])
    .sort((a, b) => a[1] - b[1])
    .map(([g]) => g);
  const fill = (groups, n) => {
    const out = [];
    while (out.length < n) out.push(...byUsage(groups));
    return out.slice(0, n);
  };
  let slots;
  if (focus === 'balanced') {
    slots = fill(MAIN_GROUPS, k);
  } else {
    const nFocus = Math.max(1, Math.round(k * 0.4));
    const others = fill(MAIN_GROUPS.filter((g) => g !== focus), k - nFocus);
    slots = [];
    for (let i = 0; i < k; i++) {
      // focus first, then alternate so focus exercises aren't back to back
      const takeFocus = slots.filter((g) => g === focus).length < nFocus && (i % 2 === 0 || !others.length);
      slots.push(takeFocus ? focus : others.shift());
    }
  }
  for (const g of slots) usage[g] += 1;
  return slots;
}

function pickExercise(group, types, ctx, exclude) {
  // Prefer exercises whose main group is `group`, then ones that also train it, then anything.
  const tiers = [(e) => e.g[0] === group, (e) => e.g.includes(group), (e) => e.g.length > 0];
  let pool = [];
  for (const fits of tiers) {
    pool = Object.entries(EXERCISES).filter(([id, e]) => types.includes(e.t) && !exclude.has(id) && fits(e));
    if (pool.length) break;
  }
  // Favour exercises not used yet today.
  const weights = pool.map(([id]) => 1 / (1 + 3 * (ctx.used[id] ?? 0)));
  let r = ctx.rand() * weights.reduce((a, b) => a + b, 0);
  let i = 0;
  while (i < pool.length - 1 && (r -= weights[i]) > 0) i++;
  const id = pool[i][0];
  ctx.used[id] = (ctx.used[id] ?? 0) + 1;
  exclude.add(id);
  return id;
}

function pickExercises(k, types, ctx) {
  const exclude = new Set();
  return slotGroups(k, ctx).map((g) => pickExercise(g, types, ctx, exclude));
}

// A prescribed amount for self-paced blocks: reps for dynamic moves, seconds for holds.
function dosed(id, scale = 1) {
  const e = EXERCISES[id];
  if (e.t === 'hold') return { ex: id, secs: Math.max(10, Math.round((e.secs * scale) / 5) * 5) };
  return { ex: id, reps: Math.max(2, Math.round(e.reps * scale)) };
}

// ---------- block builders: each aims at a target length in seconds ----------

const BUILDERS = {
  intervals(target, ctx) {
    const { rand } = ctx;
    const k = target >= 420 ? 3 : 2;
    const work = pick(rand, [20, 25, 30, 30, 40]);
    const rest = pick(rand, [0, 10, 15]);
    const roundRest = pick(rand, [30, 45, 60]);
    const round = k * work + (k - 1) * rest + roundRest;
    const rounds = clamp(Math.round((target + roundRest) / round), 2, 8);
    return interval({ rounds, work, rest, roundRest }, pickExercises(k, ['reps', 'hold'], ctx));
  },
  tabata(target, ctx) {
    // 8 exercises × 20s on / 10s off is a 4-minute circuit; 3 circuits (12 min) when there's room.
    const minutes = clamp(Math.round(target / 60), 4, 12);
    return tabata(pickExercises(8, ['reps', 'hold'], ctx), { minutes });
  },
  emom(target, ctx) {
    const rounds = clamp(Math.round(target / 60), 4, 20);
    const items = pickExercises(2, ['reps'], ctx).map((id) => dosed(id, 0.6));
    return emom(60, rounds, items, 'Rest the remainder of each minute.');
  },
  amrap(target, ctx) {
    const minutes = clamp(Math.round(target / 60), 5, 25);
    const items = pickExercises(minutes >= 10 ? 5 : 4, ['reps', 'hold'], ctx).map((id) => dosed(id));
    return amrap(minutes, items);
  },
  circuit(target, ctx) {
    const k = 5;
    const rounds = clamp(Math.round(target / (k * 30)), 2, 6);
    return circuit(rounds, pickExercises(k, ['reps', 'hold'], ctx).map((id) => dosed(id)));
  },
  holds(target, ctx) {
    const { rand, focus, usage } = ctx;
    let group = focus;
    if (focus === 'balanced') {
      // Handstand work first (it's in almost every session), then the least-trained group.
      group = usage.handstand === 0 ? 'handstand' : [...MAIN_GROUPS].sort((a, b) => usage[a] - usage[b])[0];
    }
    usage[group] = (usage[group] ?? 0) + 1;
    const id = pickExercise(group, ['hold'], ctx, new Set());
    const work = EXERCISES[id].secs;
    const rest = pick(rand, [30, 45, 60]);
    const rounds = clamp(Math.round((target + rest) / (work + rest)), 3, 8);
    return interval({ rounds, work, rest }, [id]);
  },
};

function easyBlock(type, title, secs, rand, first) {
  const ids = Object.keys(EXERCISES).filter((id) => EXERCISES[id].t === type && id !== first && id !== 'stretching');
  const k = clamp(Math.round(secs / 45), 3, ids.length + (first ? 1 : 0));
  const chosen = [...(first ? [first] : []), ...shuffle(rand, ids)].slice(0, k);
  const work = Math.round(secs / k / 5) * 5;
  return interval({ rounds: 1, work, title }, chosen);
}

export function workoutDuration(workout) {
  const main = workout.blocks.reduce((a, b) => a + blockDuration(b), 0);
  return main + TRANSITION_SECS * Math.max(0, workout.blocks.length - 1);
}

export function generateWorkout({ minutes, plan, focus = 'balanced', warmup = true, seed = 1, name }) {
  const rand = rng(seed);
  const total = minutes * 60;
  const warm = warmup ? clamp(Math.round((total * 0.1) / 60) * 60, 300, 480) : 0;
  const cool = warmup ? clamp(Math.round((total * 0.07) / 60) * 60, 180, 420) : 0;
  const transitions = TRANSITION_SECS * (plan.length + (warmup ? 2 : 0) - 1);
  const main = Math.max(plan.length * 180, total - warm - cool - transitions);
  const weightOf = (k) => KIND_WEIGHT[k] ?? 1;
  // Give fixed-length blocks their time first if what's left still fits the others.
  const fixed = plan.reduce((a, k) => a + (FIXED_SECS[k] ?? 0), 0);
  const flexible = plan.filter((k) => !FIXED_SECS[k]);
  const useFixed = fixed > 0 && main - fixed >= flexible.length * MIN_BLOCK_SECS;
  const shared = useFixed ? flexible : plan;
  const sharedWeight = shared.reduce((a, k) => a + weightOf(k), 0);
  const targetOf = (k) => (useFixed && FIXED_SECS[k]) || ((useFixed ? main - fixed : main) * weightOf(k)) / sharedWeight;

  const ctx = { rand, focus, used: {}, usage: { pull: 0, push: 0, core: 0.1, legs: 0.2, handstand: 0 } };
  const blocks = [];
  if (warmup) blocks.push(easyBlock('warmup', 'Warm-up', warm, rand, 'jumping-jacks'));
  for (const kind of plan) blocks.push(BUILDERS[kind](targetOf(kind), ctx));
  if (warmup) blocks.push(easyBlock('stretch', 'Cool-down', cool, rand));

  const focusName = FOCUS.find((f) => f.id === focus)?.name ?? 'Balanced';
  return {
    id: 'gen',
    name: name ?? `${minutes} min · ${focusName}`,
    minutes,
    focus,
    blocks,
  };
}
