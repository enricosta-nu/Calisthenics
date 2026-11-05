import { ROUTINES, EXERCISES, routineById } from './routines.js';
import {
  generateWorkout, suggestPlan, createPlan, workoutDuration, rng, partOf, nextSwap, swapItem,
} from './generator.js';
import {
  MODULES, PARTS, FOCUS, SUGGEST_MINUTES, CREATE_MINUTES, SKILL_BLOCKS, MAX_FINISHERS, LEVELS, EQUIPMENT,
} from './options.js';
import {
  STORAGE_KEY, defaultState, normalizeState, stats, formatDuration, formatClock, clamp, exerciseLog, muscleLoad,
  blockPhases, blockDuration, blockTitle, blockName, phaseAt, startRoutine, routineElapsed, finishRoutine,
  routineOf, blockRounds, timingFields, adjustTiming, applyOverrides,
  INTENSITY_RANGE, intensityOf, applyIntensity, intensify, FEELINGS, feelingOf, intensityAdvice, rateSession,
  trainingHistory, dayKey, effectiveProfile,
  workoutTimeline, howToSteps,
  levelFor, GROUP_FEELINGS, trainedGroups, rateGroup, groupAdvice, answerGroupAdvice, BACKUP_EVERY, workoutsSinceBackup,
} from './logic.js';
import { figureSvg, animateFigures } from './figures.js';
import { COACHING } from './coaching.js';

// ---------- state ----------

let state = load();
const ui = {
  tab: 'suggest',
  returnTab: 'suggest', // where to go back to when a workout ends
  seeds: { suggest: newSeed(), create: newSeed() }, // Shuffle picks a new seed
  swaps: {}, // { suggest | create: { sig, map: { 'block:item': exerciseId } } } swapped exercises in previews
  openItem: null, // 'scope:block:item' whose details stay open after a swap
  summary: null, // { session } shown after finishing
  openSession: null,
  phaseKey: null, // "block:phase" of the routine timer, to detect phase changes
  lastCount: null, // last 3-2-1 countdown second that beeped
  info: null, // { ex, note } exercise whose full explanation is open
};

function newSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

function load() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return defaultState();
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    toast('Could not save — storage is unavailable.');
  }
}

function update(fn) {
  fn();
  save();
  render();
}

// ---------- helpers ----------

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2600);
}

let audio;
// Must run inside a tap handler once, or mobile browsers keep audio muted.
function unlockAudio() {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
  } catch {
    /* audio not available */
  }
}

// notes: [frequency, offset seconds, duration seconds]
const SOUNDS = {
  count: { notes: [[660, 0, 0.08]], vibrate: 40 },
  work: { notes: [[1320, 0, 0.15], [1320, 0.2, 0.3]], vibrate: [150, 80, 150] },
  rest: { notes: [[523, 0, 0.35]], vibrate: 300 },
  done: { notes: [[880, 0, 0.2], [880, 0.25, 0.2], [1320, 0.5, 0.4]], vibrate: [200, 100, 200, 100, 400] },
};

function play(name) {
  const { notes, vibrate } = SOUNDS[name];
  if (navigator.vibrate) navigator.vibrate(vibrate);
  if (!state.settings.sound) return;
  try {
    unlockAudio();
    for (const [freq, offset, dur] of notes) {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.25, audio.currentTime + offset);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + offset + dur);
      o.connect(g).connect(audio.destination);
      o.start(audio.currentTime + offset);
      o.stop(audio.currentTime + offset + dur);
    }
  } catch {
    /* audio not available */
  }
}

let wakeLock = null;
async function syncWakeLock() {
  try {
    const training = state.activeRoutine;
    if (training && !wakeLock && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => (wakeLock = null));
    } else if (!training && wakeLock) {
      await wakeLock.release();
    }
  } catch {
    /* wake lock is best-effort */
  }
}

// ---------- views ----------

function render() {
  if (!state.onboarded) {
    document.querySelector('nav').hidden = true;
    $('#view').innerHTML = renderWelcome();
    $('#overlay').hidden = true;
    return;
  }
  document.querySelector('nav').hidden = false;
  const training = state.activeRoutine;
  if (ui.tab === 'train' && !training) ui.tab = ui.returnTab;
  const navTab = ui.tab === 'train' ? ui.returnTab : ui.tab;
  document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('active', b.dataset.tab === navTab));
  const view = {
    train: renderRoutine, suggest: renderSuggest, create: renderCreate, progress: renderProgress, history: renderHistory, settings: renderSettings,
  }[ui.tab];
  const banner = training && ui.tab !== 'train'
    ? '<button class="banner" data-action="tab" data-tab="train"><span>▶ Workout in progress</span><b>Resume</b></button>'
    : '';
  $('#view').innerHTML = banner + view();
  // Slide the sheet in only when it opens, not on every redraw while it's open.
  const overlay = $('#overlay');
  const wasOpen = !overlay.hidden;
  overlay.innerHTML = renderOverlay();
  overlay.hidden = !overlay.innerHTML;
  overlay.toggleAttribute('data-enter', !overlay.hidden && !wasOpen);
  animateFigures();
  tick();
  syncWakeLock();
}

function statTiles() {
  const s = stats(state.sessions);
  return `
    <section class="tiles">
      <div class="tile"><b>${s.thisWeek}</b><span>this week</span></div>
      <div class="tile"><b>${s.weekStreak}</b><span>week streak</span></div>
      <div class="tile"><b>${s.total}</b><span>workouts</span></div>
    </section>`;
}

function chips(action, options, isOn, label) {
  return `<div class="chips" role="group" aria-label="${esc(label)}">${options.map((o) => `
    <button class="chip ${isOn(o.id) ? 'on' : ''}" aria-pressed="${isOn(o.id)}" data-action="${action}" data-id="${o.id}">${esc(o.name)}</button>`).join('')}</div>`;
}

const minutesOptions = (list) => list.map((m) => ({ id: m, name: `${m} min` }));

// Level and equipment: one line with a Change button, opening the chips in place.
// e.g. " (Back: Advanced, Legs: Beginner)" when some groups differ from the overall level.
function groupLevelsText(p) {
  const own = Object.entries(p.groupLevels ?? {});
  return own.length ? ` <span class="muted">(${esc(own.map(([mg, lv]) => `${groupName(mg)}: ${levelName(lv)}`).join(', '))})</span>` : '';
}

function profileCard() {
  const p = state.profile;
  const level = LEVELS.find((l) => l.id === p.level);
  const kit = EQUIPMENT.filter((e) => p.equipment.includes(e.id)).map((e) => e.name);
  if (!ui.profileOpen) {
    return `
      <div class="profile-line row between">
        <span><b>${esc(level.name)}</b>${groupLevelsText(p)} · ${esc(kit.length ? kit.join(', ') : 'No equipment')}</span>
        <button class="btn text" data-action="pf-toggle">Change</button>
      </div>
      ${todayLine()}`;
  }
  return `
    <article class="card profile">
      <div class="row between"><h3>Your level</h3><button class="btn text" data-action="pf-toggle">Done</button></div>
      ${chips('pf-level', LEVELS, (id) => id === p.level, 'Level')}
      <p class="muted small">${esc(level.blurb)}</p>
      <details class="group-levels" ${p.groupLevels ? 'open' : ''}>
        <summary>Level per muscle group</summary>
        ${FOCUS.filter((f) => f.id !== 'balanced').map((g) => {
          const lv = levelFor(p, g.id);
          return `
          <div class="field">
            <span>${esc(g.name)} <span class="muted small">${p.groupLevels?.[g.id] ? '' : '(same as overall)'}</span></span>
            <div class="stepper small">
              <button data-action="pf-group" data-mg="${g.id}" data-d="-1" aria-label="${esc(g.name)} level down" ${lv <= 1 ? 'disabled' : ''}>−</button>
              <output>${esc(levelName(lv))}</output>
              <button data-action="pf-group" data-mg="${g.id}" data-d="1" aria-label="${esc(g.name)} level up" ${lv >= 3 ? 'disabled' : ''}>+</button>
            </div>
          </div>`;
        }).join('')}
      </details>
      <h3>Your equipment</h3>
      ${chips('pf-equip', EQUIPMENT, (id) => p.equipment.includes(id), 'Equipment')}
      <p class="muted small">Floor, a wall and a chair are always assumed. Exercises that need something you don't have are left out.${p.level === 1 && p.equipment.includes('band') ? ' With a band, beginners also get band-assisted pull-ups, chin-ups and dips.' : ''}</p>
    </article>`;
}

// The finisher of the most recent generated workout, so the next suggestion uses a different one.
function lastFinisher() {
  for (let i = state.sessions.length - 1; i >= 0; i--) {
    const fin = state.sessions[i].blocks?.find((b) => MODULES.some((m) => m.id === b.module && m.part === 'finisher'));
    if (fin) return fin.module;
  }
  return null;
}

// Equipment for today only, e.g. when travelling. Shown under the profile on Surprise me! and Create.
function todayLine() {
  if (ui.tab === 'settings') return '';
  const set = state.today?.date === dayKey();
  const kit = effectiveProfile(state).equipment;
  const names = EQUIPMENT.filter((e) => kit.includes(e.id)).map((e) => e.name);
  if (ui.todayOpen) {
    return `
      <article class="card today">
        <div class="row between"><h3>Today I have…</h3><button class="btn text" data-action="today-toggle">Done</button></div>
        ${chips('today-equip', EQUIPMENT, (id) => kit.includes(id), 'Equipment today')}
        <p class="muted small">Only for today: tomorrow it goes back to your usual equipment.${set ? ' <button class="btn text" data-action="today-reset">Back to usual now</button>' : ''}</p>
      </article>`;
  }
  return set
    ? `<div class="today-line row between"><span><b>Today only:</b> ${esc(names.length ? names.join(', ') : 'no equipment')}</span><button class="btn text" data-action="today-toggle">Change</button></div>`
    : '<div class="today-line row between"><span class="muted">Somewhere else today?</span><button class="btn text" data-action="today-toggle">Today\'s equipment</button></div>';
}

function suggestedWorkout() {
  return applyIntensity(suggestedBase(), intensityStep('suggest'));
}

function suggestedBase() {
  const minutes = state.settings.suggestMinutes;
  const seed = ui.seeds.suggest;
  const opts = {
    minutes, plan: suggestPlan(minutes, rng(seed), lastFinisher()), seed, name: `Surprise · ${minutes} min`, profile: effectiveProfile(state),
    history: trainingHistory(state.sessions),
  };
  return withSwaps('suggest', generateWorkout(opts), opts);
}

// Swaps belong to one generated workout: if anything that shapes it changes (shuffle, duration,
// options, profile, a new workout in history), they no longer apply.
function withSwaps(scope, workout, opts) {
  const sig = JSON.stringify(opts);
  if (ui.swaps[scope]?.sig !== sig) ui.swaps[scope] = { sig, map: {} };
  let blocks = workout.blocks;
  for (const [pos, id] of Object.entries(ui.swaps[scope].map)) {
    const [b, i] = pos.split(':').map(Number);
    blocks = blocks.map((blk, j) => (j === b ? swapItem(blk, i, id, effectiveProfile(state)) : blk));
  }
  return { ...workout, blocks };
}

function createdWorkout() {
  return applyIntensity(createdBase(), intensityStep('create'));
}

// Saved as designed; intensity is a setting on top.
function createdBase() {
  const b = state.builder;
  const seed = ui.seeds.create;
  const opts = {
    minutes: b.minutes, plan: createPlan(b), focus: b.focus, warmup: b.warmup, seed,
    profile: effectiveProfile(state), history: trainingHistory(state.sessions),
  };
  return withSwaps('create', generateWorkout(opts), opts);
}

// Full block-by-block view of a workout, used for previews.
const PART_LABEL = { warmup: 'Warm-up', cooldown: 'Stretching', ...Object.fromEntries(PARTS.map((p) => [p.id, p.name])) };

function workoutBlocks(workout, scope) {
  return workout.blocks.map((b, i) => `
    <div class="block-preview">
      ${partOf(b) && partOf(b) !== 'warmup' && partOf(b) !== 'cooldown' ? `<p class="eyebrow">${esc(PART_LABEL[partOf(b)])}${b.module ? ` · ${esc(MODULES.find((m) => m.id === b.module)?.name ?? '')}` : ''}</p>` : ''}
      <p><b>${i + 1}. ${esc(blockName(b))}</b> <span class="muted small">${esc(blockTitle(b))}</span></p>
      ${b.note ? `<p class="muted small">${esc(b.note)}</p>` : ''}
      ${itemList(b, null, scope && !['warmup', 'cooldown'].includes(partOf(b)) ? { scope, b: i } : null)}
    </div>`).join('');
}

// Intensity for one workout (or for the Surprise / Create section): same exercises, more time or rounds.
const intensityStep = (key) => state.intensity[key] ?? 0;

function intensityControl(key) {
  const step = intensityStep(key);
  const info = intensityOf(step);
  return `
    <div class="intensity row between">
      <div>
        <span class="muted small">Intensity</span> <b>${esc(info.name)}</b>
        <p class="muted small">${esc(info.blurb)}</p>
        ${lastFeeling(key)}
      </div>
      <div class="stepper">
        <button data-action="intensity" data-key="${esc(key)}" data-d="-1" aria-label="easier" ${step <= INTENSITY_RANGE.min ? 'disabled' : ''}>−</button>
        <button data-action="intensity" data-key="${esc(key)}" data-d="1" aria-label="harder" ${step >= INTENSITY_RANGE.max ? 'disabled' : ''}>+</button>
      </div>
    </div>`;
}

function lastFeeling(key) {
  const f = state.feelings[key];
  if (!f) return '';
  return `<p class="small last-feel">Last time · ${fmtDate(f.at)}: <b>${f.feel}/5 ${esc(feelingOf(f.feel).name)}</b> at ${esc(intensityOf(f.intensity).name)}</p>`;
}

// A workout as it will be played: intensity first, then the user's own timing edits on top.
function prepared(base, key) {
  return applyOverrides(applyIntensity(base, intensityStep(key)), state.overrides[base.id]);
}

function workoutPreview(workout, buttons, key) {
  return `
    <article class="card workout-preview">
      <div class="row between">
        <div>
          <h3>${esc(workout.name)}</h3>
          <p class="muted small">~${Math.round(workoutDuration(workout) / 60)} min · ${workout.blocks.length} blocks</p>
        </div>
      </div>
      ${key ? intensityControl(key) : ''}
      <div class="tags">${workout.blocks.map((b) => `<span class="tag">${esc(blockName(b))}</span>`).join('')}</div>
      ${workoutBlocks(workout, key)}
      <div class="row gap sticky-actions">${buttons}</div>
    </article>`;
}

function renderSuggest() {
  const workout = suggestedWorkout();
  return `
    <header class="page-head"><h1>Surprise me!</h1></header>
    ${statTiles()}
    ${profileCard()}
    <h2>How long do you have?</h2>
    ${chips('sg-min', minutesOptions(SUGGEST_MINUTES), (m) => m === state.settings.suggestMinutes, 'Duration')}
    <p class="muted small">Built like your trainings: warm-up, an opener (pull + push), a skill section (shoulders, core, handstand), a finisher, then stretching. At 75 min the finisher is split around the handstand.</p>
    ${workoutPreview(workout, `
      <button class="btn secondary" data-action="shuffle" data-which="suggest">↻ Shuffle</button>
      <button class="btn primary grow" data-action="gen-start" data-which="suggest">Start workout</button>`, 'suggest')}`;
}

const modulesFor = (part) => MODULES.filter((m) => m.part === part);

function renderCreate() {
  const b = state.builder;
  const workout = createdWorkout();
  return `
    <header class="page-head"><h1>Create a workout</h1></header>
    ${profileCard()}
    <article class="card builder">
      <h3>Duration</h3>
      ${chips('cr-min', minutesOptions(CREATE_MINUTES), (m) => m === b.minutes, 'Duration')}
      <h3>1 · Opener</h3>
      ${chips('cr-opener', modulesFor('opener'), (id) => id === b.opener, 'Opener')}
      <div class="field">
        <h3>2 · Skill section</h3>
        <div class="stepper">
          <button data-action="cr-skill" data-d="-1" aria-label="one skill block less">−</button>
          <output>${b.skillBlocks}</output>
          <button data-action="cr-skill" data-d="1" aria-label="one skill block more">+</button>
        </div>
      </div>
      ${b.skillBlocks ? chips('cr-skillkind', modulesFor('skill'), (id) => b.skillKinds.includes(id), 'Skill blocks') : '<p class="muted small">No skill section.</p>'}
      <h3>3 · Finisher</h3>
      ${chips('cr-finisher', modulesFor('finisher'), (id) => b.finishers.includes(id), 'Finisher')}
      <p class="muted small">${b.finishers.length > 1 ? 'Two finishers: the handstand block goes between them.' : 'Pick two to split the finisher around the handstand block.'}</p>
      <h3>Focus</h3>
      ${chips('cr-focus', FOCUS, (f) => f === b.focus, 'Focus')}
      <p class="muted small">${b.focus === 'balanced' ? 'Every muscle group gets the same attention.' : `Every group is still trained; ${esc(FOCUS.find((f) => f.id === b.focus).blurb.toLowerCase())} get extra work.`}</p>
      <label class="field toggle">
        <span>Warm-up and cool-down</span>
        <input type="checkbox" data-action="cr-warmup" ${b.warmup ? 'checked' : ''}>
      </label>
    </article>
    ${workoutPreview(workout, `
      <button class="btn secondary" data-action="shuffle" data-which="create">↻ Shuffle</button>
      <button class="btn secondary" data-action="cr-save">Save</button>
      <button class="btn primary grow" data-action="gen-start" data-which="create">Start</button>`, 'create')}
    ${state.custom.length ? `<h2>Saved workouts</h2>${routineCards(state.custom, { deletable: true })}` : ''}
    <h2>Your trainings</h2>
    <p class="muted small">Tap a block's timings when you start it to change work, rest and rounds.</p>
    ${routineCards(ROUTINES, { upNext: true })}`;
}

function routineCards(list, { upNext = false, deletable = false } = {}) {
  const lastDone = {};
  let lastId = null;
  for (const sess of state.sessions) {
    if (sess.kind !== 'routine') continue;
    lastDone[sess.routine] = sess.startedAt;
    lastId = sess.routine;
  }
  const lastIdx = list.findIndex((rt) => rt.id === lastId);
  const next = upNext ? list[(lastIdx + 1) % list.length].id : null;
  return list.map((base) => {
    const rt = prepared(base, base.id);
    const mins = Math.round(workoutDuration(rt) / 60);
    return `
      <article class="card ${rt.id === next ? 'up-next' : ''}">
        <div class="row between">
          <div>
            ${rt.id === next ? '<p class="eyebrow">Up next</p>' : ''}
            <h3>${esc(rt.name)}</h3>
            <p class="muted small">~${mins} min · ${rt.blocks.length} blocks${lastDone[rt.id] ? ` · last ${fmtDate(lastDone[rt.id])}` : ''}</p>
          </div>
          <button class="btn primary" data-action="rt-begin" data-id="${esc(rt.id)}">Start</button>
        </div>
        ${intensityControl(base.id)}
        <details class="preview">
          <summary>${rt.blocks.map((b) => `<span class="tag">${esc(blockName(b))}</span>`).join('')}</summary>
          ${workoutBlocks(rt)}
          ${deletable ? `<button class="btn text danger" data-action="custom-delete" data-id="${esc(rt.id)}">Delete this workout</button>` : ''}
        </details>
      </article>`;
  }).join('');
}

function amountOf(it) {
  if (it.reps != null) return `${it.reps}×`;
  if (it.text) return `${it.text}×`;
  if (it.secs != null) return `${it.secs}s`;
  return '';
}

// `swap` ({ scope, b }) adds a Swap button to each exercise: scope is 'suggest' / 'create' for
// previews, or 'active' for the block about to start in the player.
function itemList(block, current, swap) {
  return `<ul class="items">${block.items.map((it, i) => {
    const ex = EXERCISES[it.ex];
    const amt = amountOf(it);
    const canSwap = swap && ex.g.length;
    const open = canSwap && ui.openItem === `${swap.scope}:${swap.b}:${i}`;
    return `
      <li class="${it === current ? 'current' : ''}">
        <details ${open ? 'open' : ''}>
          <summary>${amt ? `<span class="amt">${esc(amt)}</span>` : ''}${esc(ex.name)}${it.note ? ` <span class="muted">· ${esc(it.note)}</span>` : ''}</summary>
          ${howToCard(it, null, true)}
          ${canSwap ? `<button class="btn text swap" data-action="swap" data-scope="${swap.scope}" data-b="${swap.b}" data-i="${i}">↻ Swap exercise</button>` : ''}
        </details>
      </li>`;
  }).join('')}</ul>`;
}

// The workout screen: the timeline of the whole workout on the left; on the right the block,
// a big timer (tap to stop / restart), what's next, and how to do the exercise.
function renderRoutine() {
  const a = state.activeRoutine;
  const rt = routineOf(a);
  const block = rt.blocks[a.block];
  const isLast = a.block === rt.blocks.length - 1;
  const phases = blockPhases(block);
  const name = state.settings.name;
  return `
    <div class="player">
      ${timelineBar(a)}
      <div class="stage">
        <header class="stage-head row between">
          <div>
            <p class="eyebrow">${name ? `Let's go, ${esc(name)}` : 'Workout'} · <span data-tick="rt-elapsed">${formatDuration(Date.now() - a.startedAt)}</span></p>
            <h1>${esc(a.name)}</h1>
          </div>
          <button class="btn ghost" data-action="rt-finish">Finish</button>
        </header>
        <p class="tl-legend" aria-hidden="true"><span><i></i>Work</span><span><i class="rest"></i>Recovery</span></p>
        ${phases ? renderTimer(a, block, phases) : renderCircuit(a, block)}
        <div class="row between">
          ${isLast ? '<button class="btn text" data-action="rt-finish">Finish workout</button>' : '<button class="btn text" data-action="rt-next">Skip to next block →</button>'}
          <button class="btn text danger" data-action="rt-discard">Discard</button>
        </div>
      </div>
    </div>`;
}

// One segment per block, its height by the block's length, coloured by its part of the skeleton;
// the marker shows where you are. Tap a segment to go to that block.
function timelineBar(a) {
  const t = workoutTimeline(a);
  const blocks = routineOf(a).blocks;
  return `
    <aside class="timeline" aria-label="Workout timeline">
      <div class="tl-track">
        ${t.segments.map((seg) => `
          <button class="tl-seg part-${partOf(blocks[seg.index]) ?? 'none'} ${seg.index === a.block ? 'current' : ''} ${seg.status === 'done' ? 'done' : ''}"
            style="flex-grow:${seg.secs}" data-action="rt-goto" data-i="${seg.index}"
            aria-label="Block ${seg.index + 1}: ${esc(blockName(blocks[seg.index]))}${seg.status === 'done' ? ', done' : ''}">
            ${phaseStripes(blocks[seg.index])}
            <span>${seg.status === 'done' ? '✓' : seg.index + 1}</span>
          </button>`).join('')}
        <span class="tl-marker" data-tick="tl-marker" style="top:${(t.position / t.total) * 100}%"></span>
      </div>
    </aside>`;
}

// Work and recovery inside a block, as stripes: lighter = recovery. Merges neighbours of the same kind.
function phaseStripes(block) {
  const phases = blockPhases(block)?.filter((p) => p.kind !== 'ready');
  if (!phases?.some((p) => p.kind === 'rest')) return '';
  const runs = [];
  for (const p of phases) {
    const lastRun = runs[runs.length - 1];
    if (lastRun?.kind === p.kind) lastRun.secs += p.secs;
    else runs.push({ kind: p.kind, secs: p.secs });
  }
  return `<span class="tl-ph" aria-hidden="true">${runs.map((r) => `<i class="${r.kind}" style="flex-grow:${r.secs}"></i>`).join('')}</span>`;
}

const mainMuscles = (ex) => (ex.main ?? '').split(',').slice(0, 2).join(',').trim();

// The exercise as a button: the animated figure, what it works; tap for the full explanation.
function howToCard(item, label, small = false) {
  const ex = EXERCISES[item.ex];
  if (!ex || ex.t === 'rest') return '';
  return `
    <button class="howto-card ${small ? 'small' : ''}" data-action="ex-info" data-ex="${item.ex}" data-note="${esc(item.note ?? '')}">
      <span class="fig-box">${figureSvg(item.ex)}</span>
      <span>
        ${label ? `<span class="eyebrow">${esc(label)}</span>` : ''}
        ${small ? '' : `<h3>${esc(ex.name)}</h3>`}
        ${ex.main ? `<span class="small muscle-key">${esc(mainMuscles(ex))}</span>` : `<span class="small muted">${esc(ex.cue)}</span>`}
        <span class="more">Technique &amp; tips ›</span>
      </span>
    </button>`;
}

// The full explanation of one exercise, in a sheet.
function infoSheet({ ex: id, note }) {
  const ex = EXERCISES[id];
  const co = COACHING[id];
  const needs = (ex.needs ?? []).map((k) => EQUIPMENT.find((e) => e.id === k)?.name).filter(Boolean);
  const list = (cls, items) => `<ul class="${cls}">${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const level = ex.level ? LEVELS.find((l) => l.id === ex.level)?.name : null;
  return `
    <div class="sheet info-sheet" role="dialog" aria-modal="true" aria-labelledby="info-title">
      <h2 id="info-title">${esc(ex.name)}</h2>
      <div class="fig-box">${figureSvg(id)}</div>
      <p class="meta">
        ${level ? `<span>${esc(level)}</span>` : ''}
        <span>${ex.t === 'hold' ? 'Hold' : ex.t === 'reps' ? 'Reps' : ex.t === 'warmup' ? 'Warm-up' : ex.t === 'stretch' ? 'Stretch' : ''}</span>
        <span>${needs.length ? `Needs ${esc(needs.join(' or '))}` : 'No equipment'}</span>
      </p>
      ${ex.main ? `<p class="small"><span class="muscle-key"><b>Works</b></span> ${esc(ex.main)}</p>` : ''}
      ${ex.secondary ? `<p class="small"><span class="muscle-key light"><b>Also</b></span> ${esc(ex.secondary)}</p>` : ''}
      ${note ? `<p class="small band-note">${esc(note)}</p>` : ''}
      <h3>How to do it</h3>
      <ol>${(co?.how ?? howToSteps(ex.cue)).map((step) => `<li>${esc(step)}</li>`).join('')}</ol>
      ${co?.safe.length ? `<h3>Stay safe</h3>${list('safe', co.safe)}` : ''}
      ${co?.most.length ? `<h3>Get the most out of it</h3>${list('most', co.most)}` : ''}
      ${ex.band ? '<p class="small muted">Beginners: a resistance band can help until you can do it on your own.</p>' : ''}
      <p class="small muted">General guidance, not medical advice. Stop if you feel sharp pain.</p>
      <button class="btn primary full" data-action="info-close">Got it</button>
    </div>`;
}

// What comes after the current phase, e.g. "Rest 10s → Push-up".
function upNext(phases, index) {
  const next = phases.slice(index + 1, index + 3);
  if (!next.length) return 'Last one!';
  return next.map((p) => (p.kind === 'rest' ? `Rest ${p.secs}s` : p.item ? EXERCISES[p.item.ex].name : `Round ${p.round}`)).join(' → ');
}

function blockHeader(a, block) {
  return `
    <p class="eyebrow">Block ${a.block + 1} of ${routineOf(a).blocks.length}</p>
    <h2>${esc(blockTitle(block))}</h2>
    ${block.note ? `<p class="muted">${esc(block.note)}</p>` : ''}`;
}

function nextButton(a) {
  const isLast = a.block === routineOf(a).blocks.length - 1;
  return `<button class="btn primary full" data-action="${isLast ? 'rt-finish' : 'rt-next'}">${isLast ? 'Finish workout' : 'Next block →'}</button>`;
}

function roundsCounter(a) {
  const n = a.results[a.block].rounds;
  return `
    <div class="field">
      <span>Rounds completed</span>
      <div class="stepper">
        <button data-action="rt-rounds" data-d="-1" aria-label="one round less">−</button>
        <output>${n}</output>
        <button data-action="rt-rounds" data-d="1" aria-label="one round more">+</button>
      </div>
    </div>`;
}

const TIMING_LABELS = {
  rounds: 'Rounds', minutes: 'Total time', work: 'Work', every: 'Every', roundRest: 'Rest between rounds',
};

function timingValue(field, v) {
  if (field === 'rounds') return String(v);
  if (field === 'minutes') return `${v} min`;
  if (field === 'every') return formatClock(v);
  return `${v}s`;
}

// Steppers for a block's timings, shown before the block starts.
function timingEditor(a, block) {
  const fields = timingFields(block);
  const edited = state.overrides[a.id]?.[a.block];
  const label = (f) => (f === 'rest' ? (block.items.length > 1 ? 'Rest between exercises' : 'Rest') : TIMING_LABELS[f]);
  return `
    <details class="timings" ${ui.timingsOpen ? 'open' : ''}>
      <summary data-action="timings-toggle">Adjust timings</summary>
      ${fields.map((f) => `
        <div class="field">
          <span>${label(f)}</span>
          <div class="stepper">
            <button data-action="rt-time" data-field="${f}" data-d="-1" aria-label="less ${label(f)}">−</button>
            <output>${timingValue(f, block[f] ?? 0)}</output>
            <button data-action="rt-time" data-field="${f}" data-d="1" aria-label="more ${label(f)}">+</button>
          </div>
        </div>`).join('')}
      ${a.id !== 'gen' ? `<p class="muted small">Changes are remembered for ${esc(a.name)}.</p>` : ''}
      ${edited ? '<button class="btn text" data-action="rt-time-reset">Reset to original timings</button>' : ''}
    </details>`;
}

function renderTimer(a, block, phases) {
  const elapsed = routineElapsed(a);
  const total = phases.reduce((sum, p) => sum + p.secs, 0);
  const rounds = blockRounds(block);
  const whole = block.kind === 'amrap' || block.kind === 'emom'; // the whole list is one round

  if (elapsed == null) {
    return `
      <article class="card timer">
        ${blockHeader(a, block)}
        <button class="big-clock" data-action="rt-start" aria-label="Start block">
          <span class="clock">${formatClock(total - phases[0].secs)}</span>
          <span class="hint">Tap to start</span>
        </button>
        ${itemList(block, null, { scope: 'active', b: a.block })}
        ${timingEditor(a, block)}
      </article>
      ${howToCard(block.items[0], whole ? 'First' : 'First up')}`;
  }

  const pos = phaseAt(phases, elapsed);
  if (!pos.phase) {
    return `
      <article class="card timer">
        ${blockHeader(a, block)}
        <p class="done-banner">Block complete ✓</p>
        ${block.kind === 'amrap' ? roundsCounter(a) : ''}
        ${nextButton(a)}
        <button class="btn text full" data-action="rt-restart">Do it again</button>
      </article>`;
  }

  const p = pos.phase;
  let label;
  let sub = rounds ? `Round ${p.round} of ${rounds}` : '';
  if (p.kind === 'ready') label = 'Get ready';
  else if (p.kind === 'rest') label = 'Rest';
  else if (block.kind === 'interval') label = EXERCISES[p.item.ex].name + (amountOf(p.item) && p.item.secs == null ? ` · ${amountOf(p.item)}` : '');
  else label = block.kind === 'amrap' ? 'As many rounds as you can' : `Round ${p.round}: do the list`;
  if (block.kind === 'amrap') sub = `${a.results[a.block].rounds} rounds so far`;
  // During work: this exercise; during rest or get-ready: the next one, to prepare.
  const focus = p.kind === 'work' ? p.item : p.kind === 'rest' ? p.next : block.items[0];
  const paused = a.pausedAt != null;
  return `
    <article class="card timer phase-${p.kind}">
      ${blockHeader(a, block)}
      <div class="phase-label">${esc(label)}</div>
      <button class="big-clock ${paused ? 'paused' : ''}" data-action="${paused ? 'rt-resume' : 'rt-pause'}" aria-label="${paused ? 'Resume' : 'Stop'}">
        <span class="clock" data-tick="rt-clock">${formatClock(pos.remaining)}</span>
        <span class="hint">${paused ? 'Stopped · tap to restart' : 'Tap to stop'}</span>
      </button>
      <div class="bar"><span data-tick="rt-bar" style="width:${(pos.into / p.secs) * 100}%"></span></div>
      <p class="muted center">${esc(sub)}</p>
      <p class="up-next"><span class="muted">Next:</span> ${esc(whole ? (p.kind === 'ready' ? 'Go!' : `${formatClock(Math.max(0, total - elapsed))} left in the block`) : upNext(phases, pos.index))}</p>
      <div class="row gap center controls">
        <button class="btn secondary" data-action="rt-restart" aria-label="Restart block">↺ Restart</button>
        <button class="btn secondary" data-action="rt-skip" aria-label="Skip this phase">Skip ›</button>
      </div>
      ${block.kind === 'amrap' ? roundsCounter(a) : ''}
      ${whole ? itemList(block) : ''}
    </article>
    ${whole ? '' : howToCard(focus, p.kind === 'work' ? 'Now' : 'Next')}`;
}

function renderCircuit(a, block) {
  const n = a.results[a.block].rounds;
  const target = block.rounds;
  const done = n >= target;
  return `
    <article class="card">
      ${blockHeader(a, block)}
      ${itemList(block, null, n ? null : { scope: 'active', b: a.block })}
      ${n ? '' : timingEditor(a, block)}
      <div class="sets">${Array.from({ length: Math.max(target, n) }, (_, i) => `<span class="set ${i < n ? 'great' : 'empty'}">${i < n ? '✓' : i + 1}</span>`).join('')}</div>
      <div class="row gap">
        <button class="btn ${done ? 'secondary' : 'primary'} grow" data-action="rt-rounds" data-d="1">${target === 1 && !n ? 'Done ✓' : `Round ${n + 1} done ✓`}</button>
        ${n ? '<button class="btn ghost" data-action="rt-rounds" data-d="-1">Undo</button>' : ''}
      </div>
      ${done ? nextButton(a) : ''}
    </article>
    ${block.items.length === 1 ? howToCard(block.items[0], 'How to') : ''}`;
}

// ---------- progress ----------

const MUSCLE_GROUPS = FOCUS.filter((f) => f.id !== 'balanced');
const DAY = 86400000;

function renderProgress() {
  const s = stats(state.sessions);
  const since = Date.now() - 28 * DAY;
  const load = muscleLoad(state.sessions, since);
  const most = Math.max(1, ...Object.values(load));
  const log = exerciseLog(state.sessions);
  const basket = Object.entries(EXERCISES).filter(([, e]) => e.mg);
  const tried = basket.filter(([id]) => log[id]).length;
  const trained = MUSCLE_GROUPS.filter((g) => load[g.id]);
  const least = trained.length ? MUSCLE_GROUPS.reduce((a, g) => ((load[g.id] ?? 0) < (load[a.id] ?? 0) ? g : a)) : null;
  const feelings = Object.entries(state.feelings).sort(([, a], [, b]) => b.at - a.at);
  const nameOf = (key) => (key === 'suggest' ? 'Surprise me!' : key === 'create' ? 'Create'
    : (state.custom.find((w) => w.id === key) ?? routineById[key])?.name ?? key);

  return `
    <header class="page-head"><h1>Progress</h1></header>
    <section class="tiles">
      <div class="tile"><b>${s.total}</b><span>workouts</span></div>
      <div class="tile"><b>${s.thisWeek}</b><span>this week</span></div>
      <div class="tile"><b>${s.weekStreak}</b><span>week streak</span></div>
    </section>

    <h2>Muscle groups · last 4 weeks</h2>
    <article class="card">
      ${trained.length ? `
        <ul class="bars">${MUSCLE_GROUPS.map((g) => `
          <li><span>${esc(g.name)}</span><span class="bar"><span style="width:${((load[g.id] ?? 0) / most) * 100}%"></span></span><b>${load[g.id] ?? 0}</b></li>`).join('')}
        </ul>
        <p class="muted small">Exercises done per group. ${least && (load[least.id] ?? 0) < most / 2 ? `${esc(least.name)} has had the least work: try a ${esc(least.name)} focus in Create.` : 'Nicely balanced.'}</p>`
      : '<p class="muted">Finish a workout to see how your training spreads across muscle groups.</p>'}
    </article>

    <h2>Your exercises</h2>
    <p class="muted small">${tried} of ${basket.length} exercises in the app tried so far.</p>
    ${MUSCLE_GROUPS.map((g) => {
      const ids = basket.filter(([, e]) => e.mg === g.id).map(([id]) => id)
        .sort((a, b) => (log[b]?.count ?? 0) - (log[a]?.count ?? 0) || EXERCISES[a].level - EXERCISES[b].level);
      const done = ids.filter((id) => log[id]).length;
      return `
        <details class="card exercise-group">
          <summary class="row between"><b>${esc(g.name)}</b><span class="muted small">${done}/${ids.length} tried</span></summary>
          <ul class="detail">${ids.map((id) => `
            <li><span>${esc(EXERCISES[id].name)} <span class="muted small">L${EXERCISES[id].level}</span></span>
              <span class="muted small">${log[id] ? `×${log[id].count} · ${fmtDate(log[id].last)}` : 'not yet'}</span></li>`).join('')}
          </ul>
        </details>`;
    }).join('')}

    <h2>How workouts felt</h2>
    <article class="card">
      ${feelings.length ? `<ul class="detail">${feelings.map(([key, f]) => `
        <li><span>${esc(nameOf(key))} <span class="muted small">${esc(intensityOf(f.intensity).name)}</span></span>
          <span><b>${f.feel}/5</b> <span class="muted small">${esc(feelingOf(f.feel).name)} · ${fmtDate(f.at)}</span></span></li>`).join('')}
      </ul>` : '<p class="muted">Rate a workout when you finish it, and your ratings show up here.</p>'}
    </article>`;
}

// ---------- first launch ----------

function renderWelcome() {
  const p = state.profile;
  return `
    <header class="page-head welcome">
      <p class="eyebrow">Welcome</p>
      <h1>Let's set up your training</h1>
      <p class="muted">Two quick questions, so every workout fits you. You can change them any time in Settings.</p>
    </header>
    <article class="card">
      <label class="field name-field">
        <span>Your name <span class="muted small">(optional)</span></span>
        <input type="text" maxlength="30" autocomplete="given-name" value="${esc(state.settings.name)}" data-action="set-name" placeholder="e.g. Alex">
      </label>
    </article>
    <article class="card">
      <h3>1 · Your level</h3>
      ${chips('pf-level', LEVELS, (id) => id === p.level, 'Level')}
      <p class="muted small">${esc(LEVELS.find((l) => l.id === p.level).blurb)}</p>
    </article>
    <article class="card">
      <h3>2 · Your equipment</h3>
      ${chips('pf-equip', EQUIPMENT, (id) => p.equipment.includes(id), 'Equipment')}
      <p class="muted small">Floor, a wall and a chair are always assumed. Pick everything you can use.</p>
    </article>
    <button class="btn primary big full" data-action="welcome-done">Let's go</button>`;
}

function renderHistory() {
  const s = stats(state.sessions);
  if (!state.sessions.length) {
    return `<header class="page-head"><h1>History</h1></header>
      <div class="empty-state"><p>No workouts yet.</p><button class="btn primary" data-action="tab" data-tab="suggest">Start your first one</button></div>`;
  }
  const items = state.sessions.map((sess, idx) => ({ sess, idx })).reverse().map(({ sess, idx }) => {
    const open = ui.openSession === idx;
    const isRoutine = sess.kind === 'routine';
    const blocksDone = isRoutine ? sess.blocks.filter((b) => b.result !== 'skipped').length : 0;
    return `
      <article class="card session">
        <button class="row between plain" data-action="toggle" data-i="${idx}" aria-expanded="${open}">
          <div>
            <h3>${esc(sess.name)}</h3>
            <p class="muted small">${fmtDate(sess.startedAt)} · ${formatDuration(sess.endedAt - sess.startedAt)}${sess.feel ? ` · felt ${sess.feel}/5` : ''}</p>
          </div>
          <div class="right small">
            ${isRoutine
              ? `<b>${blocksDone}/${sess.blocks.length}</b> blocks`
              : `<b>${sess.exercises.length}</b> exercise${sess.exercises.length === 1 ? '' : 's'}`}
          </div>
        </button>
        ${open ? `
          <ul class="detail">
            ${isRoutine
              ? sess.blocks.map((b) => `<li><span>${esc(b.name ?? b.title)}${b.name ? ` <span class="muted small">${esc(b.title)}</span>` : ''}</span><span class="muted">${esc(b.result)}</span></li>`).join('')
              : sess.exercises.map((e) => `<li><span>${esc(e.name)}</span><span class="muted">${esc(e.done.join(' · '))}</span></li>`).join('')}
          </ul>
          <button class="btn text danger" data-action="delete-session" data-i="${idx}">Delete</button>` : ''}
      </article>`;
  }).join('');
  return `
    <header class="page-head"><h1>History</h1></header>
    <section class="tiles">
      <div class="tile"><b>${s.total}</b><span>workouts</span></div>
      <div class="tile"><b>${s.minutes.toLocaleString()}</b><span>minutes</span></div>
      <div class="tile"><b>${s.weekStreak}</b><span>week streak</span></div>
    </section>
    ${items}`;
}

function renderSettings() {
  return `
    <header class="page-head"><h1>Settings</h1></header>
    <h2>Training profile</h2>
    ${profileCard()}
    <article class="card">
      <label class="field name-field">
        <span>Your name</span>
        <input type="text" maxlength="30" autocomplete="given-name" value="${esc(state.settings.name)}" data-action="set-name" placeholder="Optional">
      </label>
      <label class="field toggle">
        <span>Beeps during workouts</span>
        <input type="checkbox" data-action="sound" ${state.settings.sound ? 'checked' : ''}>
      </label>
    </article>
    <article class="card">
      <h3>Your data</h3>
      <p class="muted small">Everything is stored on this device only. A backup is one small file: save it to iCloud Drive, Google Drive, Dropbox, or send it to yourself. On a new phone, restore it from that file.</p>
      <p class="small">${state.lastBackup
        ? `Last backup: <b>${fmtDate(state.lastBackup.at)}</b>${workoutsSinceBackup(state) ? ` · ${workoutsSinceBackup(state)} workout${workoutsSinceBackup(state) === 1 ? '' : 's'} since` : ' · up to date'}`
        : '<b>Not backed up yet.</b>'}</p>
      <div class="row gap wrap">
        <button class="btn primary" data-action="backup">Back up</button>
        <label class="btn secondary">Restore<input type="file" accept="application/json,.json" data-action="import" hidden></label>
        <button class="btn text danger" data-action="reset">Reset everything</button>
      </div>
    </article>
    <p class="muted small center">Calisthenics · works offline · add to your home screen to install.</p>`;
}

const groupName = (mg) => FOCUS.find((f) => f.id === mg)?.name ?? mg;
const levelName = (lv) => LEVELS.find((l) => l.id === lv).name;

function ratingPanel(session) {
  const overall = session.feel
    ? `<p class="rated">You rated it <b>${session.feel}/5 · ${esc(feelingOf(session.feel).name)}</b>. Next time you start it, you'll be asked whether to change the intensity.</p>`
    : `
      <div class="rate">
        <p><b>How did it feel?</b></p>
        <div class="rate-buttons">
          ${FEELINGS.map((f) => `<button class="btn secondary" data-action="rate" data-v="${f.value}"><b>${f.value}</b><small>${esc(f.name)}</small></button>`).join('')}
        </div>
      </div>`;
  const groups = trainedGroups(session);
  if (!groups.length) return overall;
  return `${overall}
    <div class="rate-groups">
      <p><b>And each muscle group?</b> <span class="muted small">optional</span></p>
      ${groups.map((mg) => groupRow(session, mg)).join('')}
    </div>`;
}

function groupRow(session, mg) {
  const chosen = session.groupFeel?.[mg];
  const advice = chosen ? groupAdvice(state, mg) : null;
  const answered = ui.groupAnswers?.[mg];
  const lv = levelFor(state.profile, mg);
  return `
    <div class="group-row">
      <span>${esc(groupName(mg))}</span>
      <div class="group-buttons">
        ${GROUP_FEELINGS.map((f) => `<button class="chip ${chosen === f.v ? 'on' : ''}" aria-pressed="${chosen === f.v}" data-action="rate-group" data-mg="${mg}" data-v="${f.v}">${f.icon} ${esc(f.name)}</button>`).join('')}
      </div>
    </div>
    ${answered ? `<p class="group-note">${esc(answered)}</p>` : ''}
    ${advice ? `
      <div class="suggest ${advice.to > lv ? 'advance' : ''}">
        <p>${esc(groupName(mg))} felt ${advice.to > lv ? 'easy' : 'hard'} twice in a row. ${advice.to > lv
          ? `Include <b>${esc(levelName(advice.to))}</b> ${esc(groupName(mg).toLowerCase())} exercises from now on?`
          : `Go back to <b>${esc(levelName(advice.to))}</b> ${esc(groupName(mg).toLowerCase())} exercises for a while?`}</p>
        <div class="row gap">
          <button class="btn primary" data-action="group-advice" data-mg="${mg}" data-accept="1">Yes</button>
          <button class="btn secondary" data-action="group-advice" data-mg="${mg}" data-accept="0">Not yet</button>
        </div>
      </div>` : ''}`;
}

function backupReminder() {
  const n = workoutsSinceBackup(state);
  if (n < BACKUP_EVERY) return '';
  return `<div class="suggest"><p>${n} workouts aren't backed up yet.</p><button class="btn secondary" data-action="backup">Back up now</button></div>`;
}

function renderOverlay() {
  if (ui.info) return infoSheet(ui.info);
  if (ui.summary) {
    const { session } = ui.summary;
    return `
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sum-title">
        <h2 id="sum-title">${session ? 'Workout complete 💪' : 'Workout ended'}</h2>
        ${!session ? '<p class="muted">Nothing was logged, so nothing was saved.</p>'
          : session.kind === 'routine'
            ? `<p class="muted">${formatDuration(session.endedAt - session.startedAt)}</p>
               <ul class="detail">${session.blocks.map((b) => `<li><span>${esc(b.name ?? b.title)}${b.name ? ` <span class="muted small">${esc(b.title)}</span>` : ''}</span><span class="muted">${esc(b.result)}</span></li>`).join('')}</ul>`
            : `<p class="muted">${formatDuration(session.endedAt - session.startedAt)}</p>`}
        ${session?.kind === 'routine' ? ratingPanel(session) : ''}
        ${session ? backupReminder() : ''}
        <button class="btn ghost full" data-action="close-summary">${session?.kind === 'routine' && !session.feel ? 'Skip' : 'Done'}</button>
      </div>`;
  }
  if (ui.pendingStart) {
    const { target, advice } = ui.pendingStart;
    const key = keyOf(target);
    const f = state.feelings[key];
    const name = target.type === 'rt'
      ? (state.custom.find((w) => w.id === target.id) ?? routineById[target.id]).name
      : (target.which === 'suggest' ? 'your last Surprise me! workout' : 'your last created workout');
    const now = intensityOf(intensityStep(key)).name;
    const to = intensityOf(advice.to).name;
    return `
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="adv-title">
        <h2 id="adv-title">${advice.to > intensityStep(key) ? 'Ready for more?' : 'Take it easier?'}</h2>
        <p>Last time (${fmtDate(f.at)}) you rated ${esc(name)} <b>${f.feel}/5 · ${esc(feelingOf(f.feel).name)}</b> at ${esc(now)}.</p>
        <p class="muted small">${esc(intensityOf(advice.to).blurb)}</p>
        <div class="row gap">
          <button class="btn primary grow" data-action="start-advice" data-accept="1">Try ${esc(to)}</button>
          <button class="btn secondary grow" data-action="start-advice" data-accept="0">Keep ${esc(now)}</button>
        </div>
      </div>`;
  }
  return '';
}

// ---------- timers ----------

function tickRoutine(now) {
  const a = state.activeRoutine;
  const elEl = document.querySelector('[data-tick="rt-elapsed"]');
  if (elEl) elEl.textContent = formatDuration(now - a.startedAt);
  const marker = document.querySelector('[data-tick="tl-marker"]');
  if (marker) {
    const t = workoutTimeline(a, now);
    marker.style.top = `${(t.position / t.total) * 100}%`;
  }
  const block = routineOf(a).blocks[a.block];
  const phases = blockPhases(block);
  const elapsed = routineElapsed(a, now);
  if (!phases || elapsed == null) return;
  const pos = phaseAt(phases, elapsed);
  const key = `${a.block}:${pos.index}`;
  if (ui.phaseKey !== key) {
    // Stay quiet when a block is (re)opened; sound only on transitions while it runs.
    const silent = ui.phaseKey == null;
    ui.phaseKey = key;
    ui.lastCount = null;
    if (!pos.phase && a.results[a.block].status !== 'done') {
      a.results[a.block].status = 'done';
      save();
    }
    if (!silent) {
      if (!pos.phase) play('done');
      else if (pos.phase.kind !== 'ready') play(pos.phase.kind);
    }
    render();
    return;
  }
  if (!pos.phase) return;
  const secLeft = Math.ceil(pos.remaining);
  if (secLeft <= 3 && secLeft !== ui.lastCount && a.pausedAt == null) {
    ui.lastCount = secLeft;
    play('count');
  }
  const clock = document.querySelector('[data-tick="rt-clock"]');
  if (clock) clock.textContent = formatClock(pos.remaining);
  const bar = document.querySelector('[data-tick="rt-bar"]');
  if (bar) bar.style.width = `${(pos.into / pos.phase.secs) * 100}%`;
}

function tick() {
  const now = Date.now();
  if (state.activeRoutine) tickRoutine(now);
}
setInterval(tick, 250);

// ---------- actions ----------

const keyOf = (target) => (target.type === 'rt' ? target.id : target.which);

function startTarget(target) {
  const key = keyOf(target);
  if (target.type === 'rt') {
    const base = state.custom.find((w) => w.id === target.id) ?? routineById[target.id];
    beginRoutine(prepared(base, key), intensityStep(key), key);
  } else {
    beginRoutine(target.which === 'suggest' ? suggestedWorkout() : createdWorkout(), intensityStep(key), key);
  }
}

// If the last rating suggests a change of intensity, ask first; the user decides.
function askThenStart(target) {
  const key = keyOf(target);
  const advice = intensityAdvice(state.feelings[key], intensityStep(key));
  if (!advice) return startTarget(target);
  ui.pendingStart = { target, advice };
  render();
}

function beginRoutine(base, step = 0, key = base.id) {
  const routine = step ? { ...base, name: `${base.name} · ${intensityOf(step).name}` } : base;
  unlockAudio();
  ui.returnTab = ui.tab === 'train' ? ui.returnTab : ui.tab;
  ui.tab = 'train';
  update(() => (state.activeRoutine = startRoutine(routine, Date.now(), step, key)));
  window.scrollTo(0, 0);
}

function resetBlockTimer(a) {
  a.blockStartedAt = null;
  a.pausedAt = null;
  a.pausedMs = 0;
  ui.phaseKey = null;
}

const actions = {
  'rt-begin': (d) => askThenStart({ type: 'rt', id: d.id }),
  'gen-start': (d) => askThenStart({ type: 'gen', which: d.which }),
  swap: (d) => {
    const b = Number(d.b);
    const i = Number(d.i);
    const block = d.scope === 'active'
      ? routineOf(state.activeRoutine).blocks[b]
      : (d.scope === 'suggest' ? suggestedBase() : createdBase()).blocks[b];
    const next = nextSwap(block, i, effectiveProfile(state));
    if (!next) return toast('No other exercise fits here with your level and equipment.');
    ui.openItem = `${d.scope}:${b}:${i}`;
    if (d.scope === 'active') {
      update(() => (routineOf(state.activeRoutine).blocks[b] = swapItem(block, i, next, effectiveProfile(state))));
    } else {
      ui.swaps[d.scope].map[`${b}:${i}`] = next;
      render();
    }
  },
  'start-advice': (d) => {
    const { target, advice } = ui.pendingStart;
    ui.pendingStart = null;
    if (d.accept === '1') state.intensity[keyOf(target)] = advice.to;
    startTarget(target);
  },
  'rate-group': (d) => {
    rateGroup(state, ui.summary.session.startedAt, d.mg, Number(d.v));
    if (ui.groupAnswers) delete ui.groupAnswers[d.mg];
    save();
    render();
  },
  'group-advice': (d) => {
    const advice = groupAdvice(state, d.mg);
    answerGroupAdvice(state, d.mg, d.accept === '1');
    ui.groupAnswers = { ...ui.groupAnswers, [d.mg]: d.accept === '1' && advice
      ? `✓ ${groupName(d.mg)} is now ${levelName(advice.to)}. You can change it in your profile.`
      : `OK, ${groupName(d.mg)} stays ${levelName(levelFor(state.profile, d.mg))}.` };
    save();
    render();
  },
  rate: (d) => {
    rateSession(state, ui.summary.session.startedAt, Number(d.v));
    save();
    render();
  },
  intensity: (d) => update(() => {
    state.intensity[d.key] = clamp(intensityStep(d.key) + Number(d.d), INTENSITY_RANGE.min, INTENSITY_RANGE.max);
  }),
  shuffle: (d) => { ui.seeds[d.which] = newSeed(); render(); },
  'sg-min': (d) => update(() => (state.settings.suggestMinutes = Number(d.id))),
  'cr-min': (d) => update(() => (state.builder.minutes = Number(d.id))),
  'cr-opener': (d) => update(() => (state.builder.opener = d.id)),
  'cr-skill': (d) => update(() => (state.builder.skillBlocks = clamp(state.builder.skillBlocks + Number(d.d), SKILL_BLOCKS.min, SKILL_BLOCKS.max))),
  'cr-skillkind': (d) => {
    const kinds = state.builder.skillKinds;
    if (kinds.includes(d.id) && kinds.length === 1) return toast('Pick at least one kind of skill block.');
    update(() => (state.builder.skillKinds = kinds.includes(d.id) ? kinds.filter((k) => k !== d.id) : [...kinds, d.id]));
  },
  'cr-finisher': (d) => {
    const fins = state.builder.finishers;
    if (fins.includes(d.id)) {
      if (fins.length === 1) return toast('Pick at least one finisher.');
      return update(() => (state.builder.finishers = fins.filter((f) => f !== d.id)));
    }
    // Up to two; a third choice replaces the oldest.
    update(() => (state.builder.finishers = [...fins, d.id].slice(-MAX_FINISHERS)));
  },
  'welcome-done': () => update(() => (state.onboarded = true)),
  'set-name': (d, el) => update(() => (state.settings.name = el.value.trim().slice(0, 30))),
  'pf-toggle': () => { ui.profileOpen = !ui.profileOpen; render(); },
  'today-toggle': () => { ui.todayOpen = !ui.todayOpen; render(); },
  'today-equip': (d) => update(() => {
    const kit = effectiveProfile(state).equipment;
    state.today = { date: dayKey(), equipment: kit.includes(d.id) ? kit.filter((k) => k !== d.id) : [...kit, d.id] };
  }),
  'today-reset': () => { ui.todayOpen = false; update(() => (state.today = null)); },
  'pf-level': (d) => update(() => (state.profile.level = Number(d.id))),
  'pf-group': (d) => update(() => {
    const lv = clamp(levelFor(state.profile, d.mg) + Number(d.d), 1, 3);
    const groupLevels = { ...state.profile.groupLevels, [d.mg]: lv };
    if (lv === state.profile.level) delete groupLevels[d.mg];
    state.profile = { ...state.profile, groupLevels };
    if (!Object.keys(groupLevels).length) delete state.profile.groupLevels;
  }),
  'pf-equip': (d) => update(() => {
    const kit = state.profile.equipment;
    state.profile.equipment = kit.includes(d.id) ? kit.filter((k) => k !== d.id) : [...kit, d.id];
  }),
  'cr-focus': (d) => update(() => (state.builder.focus = d.id)),
  'cr-warmup': (d, el) => update(() => (state.builder.warmup = el.checked)),
  'cr-save': () => {
    const workout = createdBase();
    const name = prompt('Name this workout', workout.name)?.trim();
    if (!name) return;
    update(() => state.custom.unshift({ id: `c${Date.now()}`, name, blocks: workout.blocks }));
    toast('Saved. It is under Saved workouts.');
  },
  'custom-delete': (d) => {
    if (!confirm('Delete this saved workout?')) return;
    update(() => {
      state.custom = state.custom.filter((w) => w.id !== d.id);
      delete state.overrides[d.id];
    });
  },
  'timings-toggle': (d, el) => {
    // Remember it so re-renders keep the editor open; let the browser toggle it.
    ui.timingsOpen = !el.parentElement.open;
    return true;
  },
  'rt-time': (d) => update(() => {
    const a = state.activeRoutine;
    const block = routineOf(a).blocks[a.block];
    const patch = adjustTiming(block, d.field, Number(d.d));
    Object.assign(block, patch);
    if (a.id !== 'gen') {
      state.overrides[a.id] ??= {};
      state.overrides[a.id][a.block] = { ...state.overrides[a.id][a.block], ...patch };
    }
  }),
  'rt-time-reset': () => update(() => {
    const a = state.activeRoutine;
    const base = state.custom.find((w) => w.id === a.id) ?? routineById[a.id];
    delete state.overrides[a.id]?.[a.block];
    routineOf(a).blocks[a.block] = intensify(JSON.parse(JSON.stringify(base.blocks[a.block])), a.intensity ?? 0);
  }),
  'rt-start': () => {
    unlockAudio();
    const a = state.activeRoutine;
    resetBlockTimer(a);
    a.blockStartedAt = Date.now();
    if (a.results[a.block].status === 'todo') a.results[a.block].status = 'partial';
    save();
    render();
  },
  'rt-pause': () => update(() => (state.activeRoutine.pausedAt = Date.now())),
  'rt-resume': () => {
    unlockAudio();
    update(() => {
      const a = state.activeRoutine;
      a.pausedMs += Date.now() - a.pausedAt;
      a.pausedAt = null;
    });
  },
  'rt-skip': () => {
    const a = state.activeRoutine;
    const pos = phaseAt(blockPhases(routineOf(a).blocks[a.block]), routineElapsed(a));
    a.pausedMs -= Math.ceil(pos.remaining * 1000);
    save();
    tick();
  },
  'rt-restart': () => update(() => resetBlockTimer(state.activeRoutine)),
  'rt-goto': (d) => {
    const a = state.activeRoutine;
    if (Number(d.i) === a.block) return;
    a.block = Number(d.i);
    resetBlockTimer(a);
    save();
    render();
  },
  'rt-next': () => {
    const a = state.activeRoutine;
    actions['rt-goto']({ i: Math.min(a.block + 1, a.results.length - 1) });
    window.scrollTo(0, 0);
  },
  'rt-rounds': (d) => update(() => {
    const a = state.activeRoutine;
    const res = a.results[a.block];
    const block = routineOf(a).blocks[a.block];
    res.rounds = Math.max(0, res.rounds + Number(d.d));
    if (block.kind === 'circuit') res.status = res.rounds >= block.rounds ? 'done' : res.rounds ? 'partial' : 'todo';
  }),
  'rt-finish': () => {
    const a = state.activeRoutine;
    if (a.results.some((r) => r.status !== 'done') && !confirm('Some blocks are not done yet. Finish anyway?')) return;
    const result = finishRoutine(state);
    ui.phaseKey = null;
    ui.summary = { session: result.session };
    update(() => (state = result.state));
  },
  'rt-discard': () => {
    if (!confirm('Discard this workout? Nothing will be saved.')) return;
    ui.phaseKey = null;
    update(() => (state.activeRoutine = null));
  },
  tab: (d) => { ui.tab = d.tab; render(); window.scrollTo(0, 0); },
  'ex-info': (d) => { ui.info = { ex: d.ex, note: d.note }; render(); },
  'info-close': () => { ui.info = null; render(); },
  'close-summary': () => { ui.summary = null; ui.groupAnswers = null; render(); },
  toggle: (d) => { ui.openSession = ui.openSession === Number(d.i) ? null : Number(d.i); render(); },
  'delete-session': (d) => {
    if (!confirm('Delete this workout from history?')) return;
    ui.openSession = null;
    update(() => state.sessions.splice(Number(d.i), 1));
  },
  sound: (d, el) => update(() => (state.settings.sound = el.checked)),
  // Share sheet where available (save to Files / iCloud Drive / Drive / Dropbox / a message);
  // otherwise a download. Only counted as backed up when the user didn't cancel.
  backup: async () => {
    const name = `calisthenics-backup-${dayKey()}.json`;
    const text = JSON.stringify({ ...state, lastBackup: { at: Date.now(), sessions: state.sessions.length } }, null, 2);
    const file = new File([text], name, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Calisthenics backup' });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }
    } catch (err) {
      if (err?.name === 'AbortError') return; // cancelled in the share sheet
      return toast('The backup could not be saved.');
    }
    update(() => (state.lastBackup = { at: Date.now(), sessions: state.sessions.length }));
    toast('Backup saved.');
  },
  import: async (d, el) => {
    const file = el.files?.[0];
    if (!file) return;
    try {
      const data = normalizeState(JSON.parse(await file.text()));
      if (!confirm(`Replace your data with this backup (${data.sessions.length} workouts)?`)) return;
      update(() => (state = data));
      toast('Backup imported.');
    } catch {
      toast('That file is not a valid backup.');
    } finally {
      el.value = '';
    }
  },
  reset: () => {
    if (!confirm('Delete all workouts, ratings and settings? This cannot be undone.')) return;
    ui.summary = null;
    ui.phaseKey = null;
    update(() => (state = defaultState()));
  },
};

document.addEventListener('click', (e) => {
  if (e.target.id === 'overlay' && ui.info) { actions['info-close'](); return; } // tap outside the sheet
  const el = e.target.closest('[data-action]');
  if (!el || el.tagName === 'INPUT') return;
  actions[el.dataset.action]?.(el.dataset, el);
});
document.addEventListener('change', (e) => {
  const el = e.target.closest('input[data-action]');
  if (el) actions[el.dataset.action]?.(el.dataset, el);
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { tick(); syncWakeLock(); }
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

render();
