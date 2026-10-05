// Builds a full workout (warm-up, main blocks, cool-down) from a few choices.
// Pure and seeded, so the same options + seed always give the same workout.
import { EXERCISES } from './exercises.js';
import { interval, tabata, amrap, emom, circuit } from './routines.js';
import { blockDuration, clamp, exercisesClash } from './logic.js';
import { FOCUS, DEFAULT_PROFILE } from './options.js';

export { BLOCK_KINDS, FOCUS, SUGGEST_MINUTES, CREATE_MINUTES } from './options.js';

export const MAIN_GROUPS = ['pull', 'push', 'legs', 'core'];
// Which slot group (see slotGroups) a focus muscle group lives in. Arms alternate push / pull.
const FOCUS_SLOT = { back: 'pull', chest: 'push', shoulders: 'handstand', core: 'core', legs: 'legs' };
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

// Muscle groups for the k exercises of one block (see exercisesClash in logic.js). Rules:
//  - every group once before any group repeats (so an EMOM is e.g. pull + core, never core + core);
//  - repeats only happen when k is larger than the number of groups (a Tabata), and the focus
//    gets those extra slots first;
//  - never the same group twice in a row, counting the wrap from the last exercise back to
//    the first, and not starting on the group the previous block ended on.
function slotFocus(ctx) {
  if (ctx.focus === 'balanced') return null;
  if (ctx.focus === 'arms') {
    ctx.armsTurn = ctx.armsTurn === 'push' ? 'pull' : 'push';
    return ctx.armsTurn;
  }
  return FOCUS_SLOT[ctx.focus];
}

function slotGroups(k, ctx) {
  const { usage, rand } = ctx;
  const focus = slotFocus(ctx);
  const groups = !focus || MAIN_GROUPS.includes(focus) ? MAIN_GROUPS : [focus, ...MAIN_GROUPS];
  const hasFocus = focus != null;
  // Hand out slots: focus first, then the groups trained least so far today.
  const order = groups
    .map((g) => [g, (hasFocus && g === focus ? -1e6 : usage[g]) + rand() * 0.01])
    .sort((a, b) => a[1] - b[1])
    .map(([g]) => g);
  const counts = Object.fromEntries(groups.map((g) => [g, 0]));
  const firstPass = Math.min(k, groups.length);
  for (let i = 0; i < firstPass; i++) counts[order[i]] += 1;
  // Extra slots: half to the focus (if any), the rest round the other groups.
  const extra = k - firstPass;
  const focusExtra = hasFocus ? Math.ceil(extra / 2) : 0;
  if (hasFocus) counts[focus] += focusExtra;
  const others = order.filter((g) => !(hasFocus && g === focus));
  for (let i = 0; i < extra - focusExtra; i++) counts[others[i % others.length]] += 1;

  const slots = arrange(counts, k, ctx.lastGroup, rand) ?? arrange(counts, k, null, rand);
  for (const g of slots) usage[g] += 1;
  return slots;
}

// Order the slots so no group follows itself (cyclically). Greedy on the group with the most
// slots left, random among ties; retried a few times since greedy can paint itself in a corner.
function arrange(counts, k, before, rand) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const left = { ...counts };
    const out = [];
    for (let i = 0; i < k; i++) {
      const prev = i === 0 ? before : out[i - 1];
      const options = Object.keys(left).filter((g) => left[g] > 0 && g !== prev && !(i === k - 1 && k > 2 && g === out[0]));
      if (!options.length) break;
      const most = Math.max(...options.map((g) => left[g]));
      const best = options.filter((g) => left[g] === most);
      const g = best[Math.floor(rand() * best.length)];
      out.push(g);
      left[g] -= 1;
    }
    if (out.length === k) return out;
  }
  return null;
}

// `avoid` holds groups the neighbouring exercises train; exercises that also train one of
// them (like hanging leg raises, abs + grip, next to pull-ups) are only used as a fallback.
// Can this user do this exercise? It must be in the approved reference, the user needs one of
// its equipment options, and it must be at or below their level. A beginner with a band can
// also get the band-assisted version of a level-2 exercise that allows one (pull-up, dip…).
export function usable(e, profile) {
  if (!e.mg) return false;
  const has = (k) => profile.equipment.includes(k);
  if (e.needs.length && !e.needs.some(has)) return false;
  return e.level <= profile.level || (bandHelps(e, profile) && e.level === profile.level + 1);
}

const bandHelps = (e, profile) => e.band && profile.level === 1 && profile.equipment.includes('band');

// The level an exercise effectively has for this user (band-assisted counts as their level).
const effectiveLevel = (e, profile) => (e.level > profile.level ? profile.level : e.level);

// `neighbours` are the exercises this one will sit next to; a clash with them (see
// exercisesClash) is only accepted when nothing else is left.
function pickExercise(group, types, ctx, exclude, avoid = new Set(), neighbours = []) {
  const { profile } = ctx;
  const clear = (e) => !e.g.some((g) => avoid.has(g));
  const noClash = (id) => !neighbours.some((n) => exercisesClash(n, id));
  const tiers = [
    (e) => e.g[0] === group && clear(e),
    (e) => e.g[0] === group,
    (e) => e.g.includes(group),
    (e) => e.g.length > 0,
  ];
  const candidates = (fits, strict) => Object.entries(EXERCISES).filter(([id, e]) =>
    types.includes(e.t) && !exclude.has(id) && usable(e, profile) && fits(e) && (!strict || noClash(id)));
  let pool = [];
  for (const strict of [true, false]) {
    for (const fits of tiers) {
      pool = candidates(fits, strict);
      if (pool.length) break;
    }
    if (pool.length) break;
  }
  // Favour exercises at the user's level, in the focus muscle group, and not used yet today.
  const weights = pool.map(([id, e]) => {
    const gap = profile.level - effectiveLevel(e, profile);
    // Band-assisted moves are a stopgap: used when needed, but not preferred over unassisted ones.
    const levelWeight = e.level > profile.level ? 1.5 : gap === 0 ? 3 : gap === 1 ? 1.5 : 0.6;
    const focusWeight = ctx.focus !== 'balanced' && e.mg === ctx.focus ? 6 : 1;
    return (levelWeight * focusWeight) / (1 + 3 * (ctx.used[id] ?? 0));
  });
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
  const groups = slotGroups(k, ctx);
  const ids = [];
  groups.forEach((group, i) => {
    const wraps = k > 2;
    const prevId = i === 0 ? ctx.lastEx : ids[i - 1];
    const nextGroup = i < k - 1 ? groups[i + 1] : wraps ? groups[0] : null;
    const avoid = new Set([
      ...(prevId ? EXERCISES[prevId].g : []),
      ...(i === k - 1 && wraps ? EXERCISES[ids[0]].g : []),
      ...(nextGroup ? [nextGroup] : []),
    ]);
    avoid.delete(group);
    // Neighbours: the previous exercise, and the first one when the last wraps round to it.
    const neighbours = [i > 0 ? ids[i - 1] : null, i === k - 1 && wraps ? ids[0] : null].filter(Boolean);
    ids.push(pickExercise(group, types, ctx, exclude, avoid, neighbours));
  });
  ctx.lastGroup = groups.at(-1);
  ctx.lastEx = ids.at(-1);
  return ids;
}

// A block item, with a band note for beginners where a band helps.
function asItem(id, ctx) {
  const e = EXERCISES[id];
  if (!bandHelps(e, ctx.profile)) return { ex: id };
  return { ex: id, note: e.level > ctx.profile.level ? 'with resistance band' : 'band if needed' };
}

// A prescribed amount for self-paced blocks: reps for dynamic moves, seconds for holds.
function dosed(id, ctx, scale = 1) {
  const e = EXERCISES[id];
  if (e.t === 'hold') return { ...asItem(id, ctx), secs: Math.max(10, Math.round((e.secs * scale) / 5) * 5) };
  return { ...asItem(id, ctx), reps: Math.max(2, Math.round(e.reps * scale)) };
}

// Is there at least one usable exercise of this main group and style?
function hasUsable(group, type, ctx) {
  return Object.values(EXERCISES).some((e) => e.g[0] === group && e.t === type && usable(e, ctx.profile));
}

// ---------- block builders: each aims at a target length in seconds ----------

// Pull, push, then the first group again as a hold: e.g. pull-up / push-up / pull-up hold.
// Pushes and pulls alternate, and the hold may sit next to the dynamic move of its group.
function pushPullSuperset(ctx) {
  const { rand, usage } = ctx;
  let [a, b] = rand() < 0.5 ? ['pull', 'push'] : ['push', 'pull'];
  if (FOCUS_SLOT[ctx.focus] === b || ctx.lastGroup === a) [a, b] = [b, a];
  const exclude = new Set();
  const first = pickExercise(a, ['reps'], ctx, exclude, new Set(['core', 'legs', 'handstand', b]));
  const second = pickExercise(b, ['reps'], ctx, exclude, new Set(['core', 'legs', 'handstand', a]));
  const third = pickExercise(a, ['hold'], ctx, exclude, new Set(['core', 'legs', 'handstand', b]));
  usage[a] += 2;
  usage[b] += 1;
  ctx.lastGroup = a;
  ctx.lastEx = third;
  return [first, second, third].map((id) => asItem(id, ctx));
}

const canSuperset = (ctx) => ['balanced', 'back', 'chest', 'arms'].includes(ctx.focus)
  && ['pull', 'push'].every((g) => hasUsable(g, 'reps', ctx) && hasUsable(g, 'hold', ctx));

const BUILDERS = {
  intervals(target, ctx) {
    const { rand } = ctx;
    const k = target >= 420 ? 3 : 2;
    const superset = k === 3 && canSuperset(ctx) && rand() < 0.4;
    const work = pick(rand, [20, 25, 30, 30, 40]);
    const rest = pick(rand, [0, 10, 15]);
    const roundRest = pick(rand, [30, 45, 60]);
    const round = k * work + (k - 1) * rest + roundRest;
    const rounds = clamp(Math.round((target + roundRest) / round), 2, 8);
    return interval({ rounds, work, rest, roundRest }, superset ? pushPullSuperset(ctx) : pickExercises(k, ['reps', 'hold'], ctx).map((id) => asItem(id, ctx)));
  },
  tabata(target, ctx) {
    // 8 exercises × 20s on / 10s off is a 4-minute circuit; 3 circuits (12 min) when there's room.
    const minutes = clamp(Math.round(target / 60), 4, 12);
    return tabata(pickExercises(8, ['reps', 'hold'], ctx).map((id) => asItem(id, ctx)), { minutes });
  },
  emom(target, ctx) {
    const rounds = clamp(Math.round(target / 60), 4, 20);
    const items = pickExercises(2, ['reps'], ctx).map((id) => dosed(id, ctx, 0.6));
    return emom(60, rounds, items, 'Rest the remainder of each minute.');
  },
  amrap(target, ctx) {
    const minutes = clamp(Math.round(target / 60), 5, 25);
    const items = pickExercises(minutes >= 10 ? 5 : 4, ['reps', 'hold'], ctx).map((id) => dosed(id, ctx));
    return amrap(minutes, items);
  },
  circuit(target, ctx) {
    const k = 5;
    const rounds = clamp(Math.round(target / (k * 30)), 2, 6);
    return circuit(rounds, pickExercises(k, ['reps', 'hold'], ctx).map((id) => dosed(id, ctx)));
  },
  holds(target, ctx) {
    const { rand, usage } = ctx;
    let group = slotFocus(ctx);
    if (!group) {
      // Handstand work first (it's in almost every session), then the least-trained group.
      const fresh = MAIN_GROUPS.filter((g) => g !== ctx.lastGroup);
      group = usage.handstand === 0 ? 'handstand' : fresh.sort((a, b) => usage[a] - usage[b])[0];
    }
    usage[group] = (usage[group] ?? 0) + 1;
    const id = pickExercise(group, ['hold'], ctx, new Set());
    ctx.lastGroup = EXERCISES[id].g[0];
    ctx.lastEx = id;
    const work = EXERCISES[id].secs;
    const rest = pick(rand, [30, 45, 60]);
    const rounds = clamp(Math.round((target + rest) / (work + rest)), 3, 8);
    return interval({ rounds, work, rest }, [asItem(id, ctx)]);
  },
};

function easyBlock(type, title, secs, rand, first, profile) {
  const needsBar = (id) => id === 'dead-hang-stretch' && !profile.equipment.includes('bar');
  const ids = Object.keys(EXERCISES).filter((id) => EXERCISES[id].t === type && id !== first && id !== 'stretching' && !needsBar(id));
  const k = clamp(Math.round(secs / 45), 3, ids.length + (first ? 1 : 0));
  const chosen = [...(first ? [first] : []), ...shuffle(rand, ids)].slice(0, k);
  const work = Math.round(secs / k / 5) * 5;
  return interval({ rounds: 1, work, title }, chosen);
}

export function workoutDuration(workout) {
  const main = workout.blocks.reduce((a, b) => a + blockDuration(b), 0);
  return main + TRANSITION_SECS * Math.max(0, workout.blocks.length - 1);
}

export function generateWorkout({ minutes, plan, focus = 'balanced', warmup = true, seed = 1, name, profile = DEFAULT_PROFILE }) {
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

  const ctx = { rand, focus, profile, used: {}, usage: { pull: 0, push: 0, core: 0.1, legs: 0.2, handstand: 0 } };
  const blocks = [];
  if (warmup) blocks.push(easyBlock('warmup', 'Warm-up', warm, rand, 'jumping-jacks', profile));
  for (const kind of plan) blocks.push(BUILDERS[kind](targetOf(kind), ctx));
  if (warmup) blocks.push(easyBlock('stretch', 'Cool-down', cool, rand, null, profile));

  const focusName = FOCUS.find((f) => f.id === focus)?.name ?? 'Balanced';
  return {
    id: 'gen',
    name: name ?? `${minutes} min · ${focusName}`,
    minutes,
    focus,
    blocks,
  };
}
