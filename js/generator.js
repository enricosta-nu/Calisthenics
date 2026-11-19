// Builds a full workout (warm-up, main blocks, cool-down) from a few choices.
// Pure and seeded, so the same options + seed always give the same workout.
import { EXERCISES } from './exercises.js';
import { interval, tabata, amrap, emom, circuit } from './routines.js';
import { blockDuration, clamp, exercisesClash, levelFor } from './logic.js';
import { FOCUS, DEFAULT_PROFILE, moduleById } from './options.js';

export { MODULES, PARTS, FOCUS, SUGGEST_MINUTES, CREATE_MINUTES } from './options.js';

export const MAIN_GROUPS = ['pull', 'push', 'legs', 'core'];
// Which slot group (see slotGroups) a focus muscle group lives in. Arms alternate push / pull.
const FOCUS_SLOT = { back: 'pull', chest: 'push', shoulders: 'handstand', core: 'core', legs: 'legs' };
// Time budgeted between blocks to set up and catch your breath.
export const TRANSITION_SECS = 60;

// Time each module aims for (seconds): min / max, and its share of the free time.
// Tabata is fixed at 12 minutes when there's room for it.
const SIZE = {
  'opener-strength': { min: 300, max: 600, weight: 1 },
  'opener-emom': { min: 360, max: 600, weight: 1 },
  'opener-circuit': { min: 360, max: 600, weight: 1 },
  'skill-intervals': { min: 300, max: 600, weight: 1 },
  'skill-holds': { min: 180, max: 420, weight: 0.6 },
  tabata: { min: 480, max: 720, weight: 1.6, fixed: 720 },
  amrap: { min: 480, max: 900, weight: 1.6 },
  circuit: { min: 360, max: 720, weight: 1.4 },
};

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

// ---------- plans: the skeleton, filled with modules ----------
//   opener → skill section → finisher; with two finishers the last skill block (the handstand
//   holds) goes between them, as in Allenamento 1.

// How often each module appears in the 12 trainings, used to pick one.
const OPENER_ODDS = { 'opener-strength': 8, 'opener-emom': 2, 'opener-circuit': 1 };
const FINISHER_ODDS = { amrap: 6, tabata: 4, circuit: 2 };

function weightedPick(rand, odds, skip = []) {
  const entries = Object.entries(odds).filter(([k]) => !skip.includes(k));
  let r = rand() * entries.reduce((a, [, w]) => a + w, 0);
  for (const [k, w] of entries) if ((r -= w) <= 0) return k;
  return entries.at(-1)[0];
}

// Two finishers: the last skill block sits between them.
function assemble(opener, skill, finishers) {
  if (finishers.length < 2 || !skill.length) return [opener, ...skill, ...finishers];
  return [opener, ...skill.slice(0, -1), finishers[0], skill.at(-1), finishers[1]];
}

// `lastFinisher` (from history) is avoided so sessions don't repeat the same finisher.
export function suggestPlan(minutes, rand, lastFinisher = null) {
  const opener = weightedPick(rand, OPENER_ODDS);
  const first = weightedPick(rand, FINISHER_ODDS, [lastFinisher]);
  if (minutes >= 75) {
    const second = weightedPick(rand, FINISHER_ODDS, [first]);
    return assemble(opener, ['skill-intervals', 'skill-intervals', 'skill-holds'], [first, second]);
  }
  // 60 min: a longer skill section, as in Allenamento 3, 4, 7 and 12 plus one more block.
  if (minutes >= 60) return assemble(opener, ['skill-intervals', 'skill-intervals', 'skill-holds'], [first]);
  return assemble(opener, ['skill-intervals', 'skill-holds'], [first]);
}

// Skill blocks for Create: with both kinds chosen, intervals first and the holds last
// (handstand before the finisher, as in the trainings).
export function skillSection(count, kinds) {
  if (!count || !kinds.length) return [];
  if (kinds.length === 1) return Array(count).fill(kinds[0]);
  if (count === 1) return ['skill-holds'];
  return [...Array(count - 1).fill('skill-intervals'), 'skill-holds'];
}

export function createPlan({ opener, skillBlocks, skillKinds, finishers }) {
  return assemble(opener, skillSection(skillBlocks, skillKinds), finishers.length ? finishers : ['amrap']);
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
// Variety and recovery from the user's history (see trainingHistory in logic.js): exercises done
// in the last workouts are less likely (the more recent, the less), and muscle groups worked hard
// in the last 36 hours are lighter. Nothing is ever excluded, only made less likely.
function freshness(id, e, ctx) {
  const recency = ctx.history.recent[id] ?? 0; // 3 = last workout, 2, 1, 0 = not lately
  const tired = ctx.history.tired.includes(e.mg) ? 0.35 : 1;
  return tired / (1 + 2 * recency);
}

// Can this user do this exercise? It must be in the approved reference, the user needs one of
// its equipment options, and it must be at or below their level. A beginner with a band can
// also get the band-assisted version of a level-2 exercise that allows one (pull-up, dip…).
export function usable(e, profile, stretch = false) {
  if (!e.mg) return false;
  const has = (k) => profile.equipment.includes(k);
  if (e.needs.length && !e.needs.some(has)) return false;
  const level = levelFor(profile, e.mg);
  return e.level <= level || (bandHelps(e, profile) && e.level === level + 1) || (stretch && e.level === level + 1 && stretchable(e));
}

// One level up is allowed only to avoid repeating an exercise in a workout, and never for moves
// at the high bar or upside-down holds, which need the strength or skill first.
const stretchable = (e) => !e.needs.includes('bar') && !(e.g[0] === 'handstand' && e.t === 'hold');

// Levels are per muscle group (levelFor): a beginner at back but not at chest gets band help only for back.
const bandHelps = (e, profile) => e.band && levelFor(profile, e.mg) === 1 && profile.equipment.includes('band');

// The level an exercise effectively has for this user (band-assisted counts as their level).
const effectiveLevel = (e, profile) => Math.min(e.level, levelFor(profile, e.mg));
const aboveLevel = (e, profile) => e.level > levelFor(profile, e.mg);

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
  const candidates = (fits, strict, fresh, stretch) => Object.entries(EXERCISES).filter(([id, e]) =>
    types.includes(e.t) && !exclude.has(id) && usable(e, profile, stretch) && fits(e) && (!strict || noClash(id))
    && (!fresh || !ctx.used[id]));
  // Not yet in this workout first (one level up if needed), then repeats, then any group.
  const passes = [[true, false, tiers.slice(0, 3)], [true, true, tiers.slice(0, 3)], [false, false, tiers]];
  let pool = [];
  search: for (const strict of [true, false]) {
    for (const [fresh, stretch, fitsList] of passes) {
      for (const fits of fitsList) {
        pool = candidates(fits, strict, fresh, stretch);
        if (pool.length) break search;
      }
    }
  }
  // Favour exercises at the user's level, in the focus muscle group, and not used yet today.
  const weights = pool.map(([id, e]) => {
    const gap = levelFor(profile, e.mg) - effectiveLevel(e, profile);
    // Band-assisted moves are a stopgap: used when needed, but not preferred over unassisted ones.
    const levelWeight = aboveLevel(e, profile) ? 1.5 : gap === 0 ? 3 : gap === 1 ? 1.5 : 0.6;
    const focusWeight = ctx.focus !== 'balanced' && e.mg === ctx.focus ? 6 : 1;
    return (levelWeight * focusWeight * freshness(id, e, ctx)) / (1 + 3 * (ctx.used[id] ?? 0));
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
  return { ex: id, note: aboveLevel(e, ctx.profile) ? 'with resistance band' : 'band if needed' };
}

// A prescribed amount for self-paced blocks: reps for dynamic moves, seconds for holds.
function dosed(id, ctx, scale = 1) {
  const e = EXERCISES[id];
  if (e.t === 'hold') return { ...asItem(id, ctx), secs: Math.max(10, Math.round((e.secs * scale) / 5) * 5) };
  return { ...asItem(id, ctx), reps: Math.max(2, Math.round(e.reps * scale)) };
}

// Pick an exercise of one muscle group (the reference's mg), falling back to the slot group.
const MG_SLOT = { back: 'pull', chest: 'push', shoulders: 'handstand', arms: 'push', core: 'core', legs: 'legs' };

function pickMuscle(mg, types, ctx, exclude, neighbours = [], extra = () => true) {
  const noClash = (id) => !neighbours.some((n) => exercisesClash(n, id));
  const poolOf = (fresh, stretch) => Object.entries(EXERCISES).filter(([id, e]) =>
    e.mg === mg && types.includes(e.t) && !exclude.has(id) && usable(e, ctx.profile, stretch) && noClash(id) && extra(e, id)
    && (!fresh || !ctx.used[id]));
  const pool = [[true, false], [true, true], [false, false]].map(([f, st]) => poolOf(f, st)).find((x) => x.length) ?? [];
  let id;
  if (pool.length) {
    const weights = pool.map(([pid, e]) => {
      const gap = levelFor(ctx.profile, e.mg) - effectiveLevel(e, ctx.profile);
      const levelWeight = aboveLevel(e, ctx.profile) ? 1.5 : gap === 0 ? 3 : gap === 1 ? 1.5 : 0.6;
      return (levelWeight * freshness(pid, e, ctx)) / (1 + 3 * (ctx.used[pid] ?? 0));
    });
    let r = ctx.rand() * weights.reduce((x, y) => x + y, 0);
    let i = 0;
    while (i < pool.length - 1 && (r -= weights[i]) > 0) i++;
    id = pool[i][0];
    ctx.used[id] = (ctx.used[id] ?? 0) + 1;
    exclude.add(id);
  } else if (mg === 'back') {
    // Nothing to pull on (no bar, no low bar): core instead, so legs stay in the finisher.
    return pickMuscle('core', types, ctx, exclude, neighbours, extra);
  } else {
    id = pickExercise(MG_SLOT[mg], types, ctx, exclude, new Set(), neighbours);
  }
  const g = EXERCISES[id].g[0];
  if (g) ctx.usage[g] = (ctx.usage[g] ?? 0) + 1;
  return id;
}

const HANDSTAND_HOLDS = ['handstand', 'wall-handstand', 'box-pike-handstand'];
// Prep moves that don't make a strength opener on their own.
const NOT_OPENER = ['scapular-pull', 'dead-hang', 'negative-pull-up'];
const openerMove = (e, id) => !NOT_OPENER.includes(id);

function endBlock(ctx, ids) {
  ctx.lastEx = ids.at(-1);
  ctx.lastGroup = EXERCISES[ctx.lastEx].g[0];
}

// The hold that ends a round of 3: a hold of the focus group when there is one (so a Legs or
// Core focus shows up outside the finisher too), otherwise `fallback`.
function roundHold(ctx, fallback) {
  return ['chest', 'arms', 'legs', 'core'].includes(ctx.focus) ? ctx.focus : fallback;
}

// Whether a hold of this muscle group fits the user's level and equipment (no bar: no back hold).
const canHold = (mg, ctx) => Object.values(EXERCISES).some((e) => e.mg === mg && e.t === 'hold' && usable(e, ctx.profile));

// Opener muscles: pull + push; a Chest or Shoulders focus starts with the push.
function openerPair(ctx) {
  return ['chest', 'shoulders'].includes(ctx.focus) ? ['chest', 'back'] : ['back', 'chest'];
}

const BUILDERS = {
  // M1 · pull + push back to back (+ a hold of the first group), 15–20s, no rest, ~30s between rounds.
  'opener-strength'(target, ctx) {
    const { rand } = ctx;
    const k = target >= 420 ? 3 : 2;
    const work = pick(rand, [15, 20, 20]);
    const roundRest = 30;
    const rounds = clamp(Math.round((target + roundRest) / (k * work + roundRest)), 4, 6);
    const [a, b] = openerPair(ctx);
    const ex = new Set();
    const ids = [pickMuscle(a, ['reps'], ctx, ex, [ctx.lastEx].filter(Boolean), openerMove)];
    ids.push(pickMuscle(b, ['reps'], ctx, ex, [ids[0]], openerMove));
    if (k === 3) ids.push(pickMuscle(roundHold(ctx, a), ['hold'], ctx, ex, [ids[1], ids[0]]));
    endBlock(ctx, ids);
    return interval({ rounds, work, rest: 0, roundRest }, ids.map((id) => asItem(id, ctx)));
  },
  // M2 · pull + push reps every minute (or 1:15).
  'opener-emom'(target, ctx) {
    const every = pick(ctx.rand, [60, 60, 75]);
    const rounds = clamp(Math.round(target / every), 5, 10);
    const [a, b] = openerPair(ctx);
    const ex = new Set();
    const ids = [pickMuscle(a, ['reps'], ctx, ex, [], openerMove)];
    ids.push(pickMuscle(b, ['reps'], ctx, ex, [ids[0]], openerMove));
    endBlock(ctx, ids);
    return emom(every, rounds, ids.map((id) => dosed(id, ctx, 0.6)), 'Rest the remainder of each minute.');
  },
  // M7 as opener · pull, push and core reps, at your own pace.
  'opener-circuit'(target, ctx) {
    const rounds = clamp(Math.round(target / 120), 3, 5);
    const [a, b] = openerPair(ctx);
    const ex = new Set();
    const ids = [pickMuscle(a, ['reps'], ctx, ex, [], openerMove)];
    ids.push(pickMuscle(b, ['reps'], ctx, ex, [ids[0]], openerMove));
    // Without a bar the pull slot is already core: shoulders instead.
    const third = EXERCISES[ids[0]].mg === 'core' ? 'shoulders' : 'core';
    ids.push(pickMuscle(third, ['reps'], ctx, ex, [ids[1], ids[0]]));
    endBlock(ctx, ids);
    return circuit(rounds, ids.map((id) => dosed(id, ctx)));
  },
  // M3 · shoulders + core (+ a pull hold), 20–30s each, ×4.
  'skill-intervals'(target, ctx) {
    const { rand } = ctx;
    let k = target >= 420 ? 3 : 2;
    const third = roundHold(ctx, 'back');
    if (!canHold(third, ctx)) k = 2; // without a bar the round is shoulders + core
    const work = pick(rand, [20, 25, 30]);
    const roundRest = pick(rand, [30, 40]);
    const rounds = clamp(Math.round((target + roundRest) / (k * work + roundRest)), 3, 5);
    const ex = new Set();
    // Not the handstand-type holds (frog stand included): they're kept for the holds block.
    const notHandstand = (e) => !(e.g[0] === 'handstand' && e.t === 'hold');
    const ids = [pickMuscle('shoulders', ['reps', 'hold'], ctx, ex, [ctx.lastEx].filter(Boolean), notHandstand)];
    ids.push(pickMuscle('core', ['reps', 'hold'], ctx, ex, [ids[0]]));
    if (k === 3) {
      ids.push(pickMuscle(third, ['hold'], ctx, ex, [ids[1], ids[0]]));
    }
    endBlock(ctx, ids);
    return interval({ rounds, work, rest: 0, roundRest }, ids.map((id) => asItem(id, ctx)));
  },
  // M4 · one hold ×4. The first is handstand work; a second one is another hold (pull, core, planche).
  'skill-holds'(target, ctx) {
    const { rand } = ctx;
    ctx.holdsBlocks = (ctx.holdsBlocks ?? 0) + 1;
    const handstandFirst = ctx.holdsBlocks === 1;
    const ex = new Set();
    const id = handstandFirst
      ? pickMuscle('shoulders', ['hold'], ctx, ex, [ctx.lastEx].filter(Boolean), (e) => e.g[0] === 'handstand')
      : pickMuscle(pick(rand, ['back', 'core', 'shoulders']), ['hold'], ctx, ex, [ctx.lastEx].filter(Boolean));
    endBlock(ctx, [id]);
    const work = EXERCISES[id].secs;
    const rest = 30;
    const rounds = clamp(Math.round((target + rest) / (work + rest)), 3, 6);
    return interval({ rounds, work, rest }, [asItem(id, ctx)]);
  },
  // M5 · 8 exercises × 20s on / 10s off, every muscle group; 12 min when there's room.
  tabata(target, ctx) {
    const minutes = clamp(Math.round(target / 60), 4, 12);
    return tabata(pickExercises(8, ['reps', 'hold'], ctx).map((id) => asItem(id, ctx)), { minutes });
  },
  // M6 · as many rounds as possible, every muscle group.
  amrap(target, ctx) {
    const minutes = clamp(Math.round(target / 60), 5, 15);
    const items = pickExercises(minutes >= 10 ? 5 : 4, ['reps', 'hold'], ctx).map((id) => dosed(id, ctx));
    return amrap(minutes, items);
  },
  // M7 · rounds at your own pace, every muscle group.
  circuit(target, ctx) {
    const k = 5;
    const rounds = clamp(Math.round(target / (k * 30)), 2, 5);
    return circuit(rounds, pickExercises(k, ['reps', 'hold'], ctx).map((id) => dosed(id, ctx)));
  },
};

// Seconds each module gets: Tabata its fixed 12 minutes when everything else still fits,
// the rest shared by weight, each kept within its min / max.
export function moduleTargets(plan, main) {
  const fixed = plan.filter((m) => SIZE[m].fixed);
  const flexible = plan.filter((m) => !SIZE[m].fixed);
  const fixedTotal = fixed.reduce((a, m) => a + SIZE[m].fixed, 0);
  const useFixed = fixed.length > 0 && main - fixedTotal >= flexible.reduce((a, m) => a + SIZE[m].min, 0);
  const shared = useFixed ? flexible : plan;
  const free = useFixed ? main - fixedTotal : main;
  const weight = shared.reduce((a, m) => a + SIZE[m].weight, 0);
  return plan.map((m) => {
    if (useFixed && SIZE[m].fixed) return SIZE[m].fixed;
    return clamp((free * SIZE[m].weight) / weight, SIZE[m].min, SIZE[m].max);
  });
}

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

const NO_HISTORY = { recent: {}, tired: [] };

export function generateWorkout({
  minutes, plan, focus = 'balanced', warmup = true, seed = 1, name, profile = DEFAULT_PROFILE, history = NO_HISTORY,
}) {
  const rand = rng(seed);
  const total = minutes * 60;
  const warm = warmup ? clamp(Math.round((total * 0.1) / 60) * 60, 300, 480) : 0;
  const cool = warmup ? clamp(Math.round((total * 0.07) / 60) * 60, 180, 420) : 0;
  const transitions = TRANSITION_SECS * (plan.length + (warmup ? 2 : 0) - 1);
  const main = total - warm - cool - transitions;
  const targets = moduleTargets(plan, main);

  // Tired groups start "already used", so finishers give them fewer of the extra slots.
  const usage = { pull: 0, push: 0, core: 0.1, legs: 0.2, handstand: 0 };
  for (const mg of history.tired) if (MG_SLOT[mg]) usage[MG_SLOT[mg]] += 1.5;
  const ctx = { rand, focus, profile, history, used: {}, usage };
  const blocks = [];
  if (warmup) blocks.push({ ...easyBlock('warmup', 'Warm-up', warm, rand, 'jumping-jacks', profile), module: 'warmup' });
  plan.forEach((m, i) => blocks.push({ ...BUILDERS[m](targets[i], ctx), module: m }));
  if (warmup) blocks.push({ ...easyBlock('stretch', 'Cool-down', cool, rand, null, profile), module: 'cooldown' });

  const focusName = FOCUS.find((f) => f.id === focus)?.name ?? 'Balanced';
  return {
    id: 'gen',
    name: name ?? `${minutes} min · ${focusName}`,
    minutes,
    focus,
    blocks,
  };
}

// The part of the skeleton a block belongs to, for labels.
export function partOf(block) {
  if (block.module === 'warmup' || block.module === 'cooldown') return block.module;
  return moduleById[block.module]?.part ?? null;
}

// ---------- swapping one exercise ----------

// Alternatives for item `index` of a block: same muscle group (or slot group for exercises outside
// the reference), usable with this profile, not already elsewhere in the block, and not clashing
// with its neighbours. Reps or holds alike (EMOMs: reps only). The list doesn't depend on which
// alternative is currently in place, so repeated swaps cycle through all of them and back.
export function swapCandidates(block, index, profile) {
  const current = block.items[index].ex;
  const cur = EXERCISES[current];
  const k = block.items.length;
  const loops = block.kind !== 'circuit' || block.rounds > 1;
  const neighbours = [index > 0 ? index - 1 : loops && k > 2 ? k - 1 : null, index < k - 1 ? index + 1 : loops && k > 2 ? 0 : null]
    .filter((j) => j != null && j !== index).map((j) => block.items[j].ex);
  const elsewhere = new Set(block.items.filter((_, j) => j !== index).map((it) => it.ex));
  const styles = block.kind === 'emom' ? ['reps'] : ['reps', 'hold'];
  const same = (e) => (cur.mg ? e.mg === cur.mg : e.g[0] === cur.g[0]);
  const ids = Object.entries(EXERCISES)
    .filter(([id, e]) => !elsewhere.has(id) && same(e) && styles.includes(e.t) && usable(e, profile)
      && !neighbours.some((n) => exercisesClash(n, id)))
    .map(([id]) => id);
  if (!ids.includes(current)) ids.push(current);
  const gap = (id) => Math.abs(levelFor(profile, EXERCISES[id].mg) - effectiveLevel(EXERCISES[id], profile));
  return ids.sort((x, y) => gap(x) - gap(y) || EXERCISES[x].name.localeCompare(EXERCISES[y].name));
}

// The next alternative after the current one (wrapping round), or null if there's none.
export function nextSwap(block, index, profile) {
  const ids = swapCandidates(block, index, profile);
  if (ids.length < 2) return null;
  return ids[(ids.indexOf(block.items[index].ex) + 1) % ids.length];
}

// A block with item `index` replaced by exercise `id`, keeping the kind of amount it had
// (reps scaled to the new exercise's usual reps, or seconds) and the band note rules.
export function swapItem(block, index, id, profile) {
  const old = block.items[index];
  const before = EXERCISES[old.ex];
  const e = EXERCISES[id];
  const item = { ex: id };
  if (bandHelps(e, profile)) item.note = aboveLevel(e, profile) ? 'with resistance band' : 'band if needed';
  if (old.reps != null || old.secs != null || old.text) {
    if (e.t === 'hold') item.secs = old.secs ?? e.secs;
    else item.reps = old.reps != null && before.reps ? Math.max(2, Math.round((old.reps / before.reps) * e.reps)) : e.reps;
  }
  return { ...block, items: block.items.map((it, i) => (i === index ? item : it)) };
}
