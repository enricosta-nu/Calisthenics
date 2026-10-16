import { TRACKS, TEMPLATES, trackById } from './data.js';
import { ROUTINES, EXERCISES, routineById } from './routines.js';
import { generateWorkout, suggestPlan, createPlan, workoutDuration, rng, partOf } from './generator.js';
import {
  MODULES, PARTS, FOCUS, SUGGEST_MINUTES, CREATE_MINUTES, SKILL_BLOCKS, MAX_FINISHERS, LEVELS, EQUIPMENT,
} from './options.js';
import {
  STORAGE_KEY, defaultState, normalizeState, buildWorkout, finishWorkout, evaluate,
  sessionTotals, stats, trackHistory, lastPerformance, stepFor, formatDuration, formatClock, clamp,
  blockPhases, blockDuration, blockTitle, blockName, phaseAt, startRoutine, routineElapsed, finishRoutine,
  routineOf, blockRounds, timingFields, adjustTiming, applyOverrides,
  INTENSITY_RANGE, intensityOf, applyIntensity, intensify,
} from './logic.js';

// ---------- state ----------

let state = load();
const ui = {
  tab: 'suggest',
  returnTab: 'suggest', // where to go back to when a workout ends
  seeds: { suggest: newSeed(), create: newSeed() }, // Shuffle picks a new seed
  pending: null, // value in the set stepper
  holdStartedAt: null, // stopwatch for hold exercises
  restEndsAt: null,
  summary: null, // { session, suggestions } shown after finishing
  openSession: null,
  phaseKey: null, // "block:phase" of the routine timer, to detect phase changes
  lastCount: null, // last 3-2-1 countdown second that beeped
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
const unit = (type) => (type === 'hold' ? 's' : '');
const range = (ex) => `${ex.sets} × ${ex.min}–${ex.max}${ex.type === 'hold' ? ' s' : ' reps'}`;
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

const beep = () => play('done');

let wakeLock = null;
async function syncWakeLock() {
  try {
    const training = state.active || state.activeRoutine;
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

function currentExercise() {
  const w = state.active;
  return w ? w.exercises[w.current] : null;
}

function defaultPending(ex) {
  if (!ex) return 0;
  if (ex.done.length) return ex.done[ex.done.length - 1];
  const last = lastPerformance(state.sessions, ex.track, ex.level);
  return last?.[0] ?? ex.min;
}

// ---------- views ----------

function render() {
  const training = state.active || state.activeRoutine;
  if (ui.tab === 'train' && !training) ui.tab = ui.returnTab;
  const navTab = ui.tab === 'train' ? ui.returnTab : ui.tab;
  document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('active', b.dataset.tab === navTab));
  const view = {
    train: renderTrain, suggest: renderSuggest, create: renderCreate, skills: renderSkills, history: renderHistory, settings: renderSettings,
  }[ui.tab];
  const banner = training && ui.tab !== 'train'
    ? '<button class="banner" data-action="tab" data-tab="train"><span>▶ Workout in progress</span><b>Resume</b></button>'
    : '';
  $('#view').innerHTML = banner + view();
  $('#overlay').innerHTML = renderOverlay();
  $('#overlay').hidden = !$('#overlay').innerHTML;
  tick();
  syncWakeLock();
}

function renderTrain() {
  return state.activeRoutine ? renderRoutine() : renderWorkout();
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
function profileCard() {
  const p = state.profile;
  const level = LEVELS.find((l) => l.id === p.level);
  const kit = EQUIPMENT.filter((e) => p.equipment.includes(e.id)).map((e) => e.name);
  if (!ui.profileOpen) {
    return `
      <div class="profile-line row between">
        <span><b>${esc(level.name)}</b> · ${esc(kit.length ? kit.join(', ') : 'No equipment')}</span>
        <button class="btn text" data-action="pf-toggle">Change</button>
      </div>`;
  }
  return `
    <article class="card profile">
      <div class="row between"><h3>Your level</h3><button class="btn text" data-action="pf-toggle">Done</button></div>
      ${chips('pf-level', LEVELS, (id) => id === p.level, 'Level')}
      <p class="muted small">${esc(level.blurb)}</p>
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

function suggestedWorkout() {
  return applyIntensity(suggestedBase(), intensityStep('suggest'));
}

function suggestedBase() {
  const minutes = state.settings.suggestMinutes;
  const seed = ui.seeds.suggest;
  return generateWorkout({
    minutes, plan: suggestPlan(minutes, rng(seed), lastFinisher()), seed, name: `Surprise · ${minutes} min`, profile: state.profile,
  });
}

function createdWorkout() {
  return applyIntensity(createdBase(), intensityStep('create'));
}

// Saved as designed; intensity is a setting on top.
function createdBase() {
  const b = state.builder;
  const seed = ui.seeds.create;
  return generateWorkout({
    minutes: b.minutes, plan: createPlan(b), focus: b.focus, warmup: b.warmup, seed,
    profile: state.profile,
  });
}

// Full block-by-block view of a workout, used for previews.
const PART_LABEL = { warmup: 'Warm-up', cooldown: 'Stretching', ...Object.fromEntries(PARTS.map((p) => [p.id, p.name])) };

function workoutBlocks(workout) {
  return workout.blocks.map((b, i) => `
    <div class="block-preview">
      ${partOf(b) && partOf(b) !== 'warmup' && partOf(b) !== 'cooldown' ? `<p class="eyebrow">${esc(PART_LABEL[partOf(b)])}${b.module ? ` · ${esc(MODULES.find((m) => m.id === b.module)?.name ?? '')}` : ''}</p>` : ''}
      <p><b>${i + 1}. ${esc(blockName(b))}</b> <span class="muted small">${esc(blockTitle(b))}</span></p>
      ${b.note ? `<p class="muted small">${esc(b.note)}</p>` : ''}
      ${itemList(b)}
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
      </div>
      <div class="stepper">
        <button data-action="intensity" data-key="${esc(key)}" data-d="-1" aria-label="easier" ${step <= INTENSITY_RANGE.min ? 'disabled' : ''}>−</button>
        <button data-action="intensity" data-key="${esc(key)}" data-d="1" aria-label="harder" ${step >= INTENSITY_RANGE.max ? 'disabled' : ''}>+</button>
      </div>
    </div>`;
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
      ${workoutBlocks(workout)}
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

function ladderCards() {
  return TEMPLATES.map((t) => `
    <article class="card">
      <div class="row between">
        <div>
          <h3>${esc(t.name)}</h3>
          <p class="muted">${esc(t.blurb)}</p>
        </div>
        <button class="btn primary" data-action="start" data-id="${t.id}">Start</button>
      </div>
      <ul class="plan">
        ${t.tracks.map((id) => {
          const step = stepFor(id, state.levels[id]);
          return `<li><span class="tag">${esc(trackById[id].name)}</span>${esc(step.name)} <span class="muted">${range(step)}</span></li>`;
        }).join('')}
      </ul>
    </article>`).join('');
}

function amountOf(it) {
  if (it.reps != null) return `${it.reps}×`;
  if (it.text) return `${it.text}×`;
  if (it.secs != null) return `${it.secs}s`;
  return '';
}

function itemList(block, current) {
  return `<ul class="items">${block.items.map((it) => {
    const ex = EXERCISES[it.ex];
    const amt = amountOf(it);
    return `
      <li class="${it === current ? 'current' : ''}">
        <details>
          <summary>${amt ? `<span class="amt">${esc(amt)}</span>` : ''}${esc(ex.name)}${it.note ? ` <span class="muted">· ${esc(it.note)}</span>` : ''}</summary>
          <p class="muted small">${esc(ex.cue)}</p>
          ${ex.main ? `<p class="muted small"><b>Works:</b> ${esc(ex.main)}${ex.secondary ? ` · <b>also:</b> ${esc(ex.secondary)}` : ''}</p>` : ''}
        </details>
      </li>`;
  }).join('')}</ul>`;
}

function renderRoutine() {
  const a = state.activeRoutine;
  const rt = routineOf(a);
  const block = rt.blocks[a.block];
  const isLast = a.block === rt.blocks.length - 1;
  const pills = rt.blocks.map((b, i) => `
    <button class="pill ${i === a.block ? 'active' : ''} ${a.results[i].status === 'done' ? 'done' : ''}" data-action="rt-goto" data-i="${i}">
      ${i + 1}. ${esc(blockName(b))}${a.results[i].status === 'done' ? ' <small>✓</small>' : ''}
    </button>`).join('');
  const phases = blockPhases(block);
  return `
    <header class="page-head row between">
      <div>
        <h1>${esc(a.name)}</h1>
        <p class="muted"><span data-tick="rt-elapsed">${formatDuration(Date.now() - a.startedAt)}</span> elapsed</p>
      </div>
      <button class="btn ghost" data-action="rt-finish">Finish</button>
    </header>
    <div class="pills">${pills}</div>
    ${phases ? renderTimer(a, block, phases) : renderCircuit(a, block)}
    <div class="row between">
      ${isLast ? '<button class="btn text" data-action="rt-finish">Finish workout</button>' : '<button class="btn text" data-action="rt-next">Skip to next block →</button>'}
      <button class="btn text danger" data-action="rt-discard">Discard workout</button>
    </div>`;
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

  if (elapsed == null) {
    return `
      <article class="card timer">
        ${blockHeader(a, block)}
        ${itemList(block)}
        <div class="clock">${formatClock(total - phases[0].secs)}</div>
        ${timingEditor(a, block)}
        <button class="btn primary big full" data-action="rt-start">Start block</button>
      </article>`;
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
  if (p.kind === 'ready') {
    label = 'Get ready';
    const first = block.items[0];
    if (block.kind === 'interval') sub = `First: ${EXERCISES[first.ex].name}`;
  } else if (p.kind === 'rest') {
    label = 'Rest';
    sub += ` · next: ${EXERCISES[p.next.ex].name}`;
  } else if (block.kind === 'interval') {
    label = EXERCISES[p.item.ex].name + (amountOf(p.item) && p.item.secs == null ? ` · ${amountOf(p.item)}` : '');
  } else {
    label = block.kind === 'amrap' ? 'Go!' : `Round ${p.round}`;
  }
  const paused = a.pausedAt != null;
  return `
    <article class="card timer phase-${p.kind}">
      ${blockHeader(a, block)}
      <div class="phase-label">${esc(label)}</div>
      <div class="clock" data-tick="rt-clock">${formatClock(pos.remaining)}</div>
      <div class="bar"><span data-tick="rt-bar" style="width:${(pos.into / p.secs) * 100}%"></span></div>
      <p class="muted center">${esc(sub)}</p>
      <div class="row gap center controls">
        <button class="btn secondary" data-action="rt-restart" aria-label="Restart block">↺</button>
        <button class="btn primary big grow" data-action="${paused ? 'rt-resume' : 'rt-pause'}">${paused ? 'Resume' : 'Pause'}</button>
        <button class="btn secondary" data-action="rt-skip" aria-label="Skip this phase">Skip ›</button>
      </div>
      ${block.kind === 'amrap' ? roundsCounter(a) : ''}
      ${itemList(block, p.item)}
    </article>`;
}

function renderCircuit(a, block) {
  const n = a.results[a.block].rounds;
  const target = block.rounds;
  const done = n >= target;
  return `
    <article class="card">
      ${blockHeader(a, block)}
      ${itemList(block)}
      ${n ? '' : timingEditor(a, block)}
      <div class="sets">${Array.from({ length: Math.max(target, n) }, (_, i) => `<span class="set ${i < n ? 'great' : 'empty'}">${i < n ? '✓' : i + 1}</span>`).join('')}</div>
      <div class="row gap">
        <button class="btn ${done ? 'secondary' : 'primary'} grow" data-action="rt-rounds" data-d="1">${target === 1 && !n ? 'Done ✓' : `Round ${n + 1} done ✓`}</button>
        ${n ? '<button class="btn ghost" data-action="rt-rounds" data-d="-1">Undo</button>' : ''}
      </div>
      ${done ? nextButton(a) : ''}
    </article>`;
}

function renderWorkout() {
  const w = state.active;
  const ex = currentExercise();
  const track = trackById[ex.track];
  const step = stepFor(ex.track, ex.level);
  const last = lastPerformance(state.sessions, ex.track, ex.level);
  const complete = ex.done.length >= ex.sets;
  const isLast = w.current === w.exercises.length - 1;
  if (ui.pending == null) ui.pending = defaultPending(ex);

  const pills = w.exercises.map((e, i) => `
    <button class="pill ${i === w.current ? 'active' : ''} ${e.done.length >= e.sets ? 'done' : ''}" data-action="goto" data-i="${i}">
      ${esc(trackById[e.track].name)} <small>${e.done.length}/${e.sets}</small>
    </button>`).join('');

  const setChips = Array.from({ length: Math.max(ex.sets, ex.done.length) }, (_, i) => {
    const v = ex.done[i];
    const cls = v == null ? 'empty' : v >= ex.max ? 'great' : v >= ex.min ? 'ok' : 'low';
    return `<span class="set ${cls}">${v == null ? i + 1 : v + unit(ex.type)}</span>`;
  }).join('');

  const input = ex.type === 'hold'
    ? `<div class="stopwatch">
         <button class="btn big ${ui.holdStartedAt ? 'danger' : 'primary'}" data-action="hold">
           ${ui.holdStartedAt ? 'Stop' : 'Start hold'}
         </button>
         <div class="stepper">
           <button data-action="adj" data-d="-5" aria-label="minus 5 seconds">−5</button>
           <output data-tick="hold">${ui.pending}s</output>
           <button data-action="adj" data-d="5" aria-label="plus 5 seconds">+5</button>
         </div>
       </div>`
    : `<div class="stepper">
         <button data-action="adj" data-d="-1" aria-label="one less rep">−</button>
         <output>${ui.pending}</output>
         <button data-action="adj" data-d="1" aria-label="one more rep">+</button>
       </div>`;

  const verdict = evaluate(ex);
  const note = complete
    ? verdict === 'advance'
      ? `<p class="note good">All sets at the top of the range — you'll be offered the next step when you finish.</p>`
      : verdict === 'regress'
        ? `<p class="note warn">Below the target range. Consider an easier step for now.</p>`
        : `<p class="note">Target done. Extra sets are optional.</p>`
    : '';

  return `
    <header class="page-head row between">
      <div>
        <h1>${esc(w.name)}</h1>
        <p class="muted"><span data-tick="elapsed">${formatDuration(Date.now() - w.startedAt)}</span> elapsed</p>
      </div>
      <button class="btn ghost" data-action="finish">Finish</button>
    </header>
    <div class="pills">${pills}</div>
    <article class="card exercise">
      <p class="eyebrow">${esc(track.name)} · step ${ex.level + 1} of ${track.steps.length}</p>
      <h2>${esc(ex.name)}</h2>
      <p class="muted">${esc(step.cue)}</p>
      <p class="target">Target <b>${range(ex)}</b>${last ? ` <span class="muted">· last time ${last.map((n) => n + unit(ex.type)).join(', ')}</span>` : ''}</p>
      <div class="sets">${setChips}</div>
      ${note}
      ${input}
      <div class="row gap">
        <button class="btn primary grow" data-action="log">Log set ${ex.done.length + 1}</button>
        ${ex.done.length ? '<button class="btn ghost" data-action="undo" aria-label="Undo last set">Undo</button>' : ''}
      </div>
      ${complete ? `<button class="btn ${isLast ? 'primary' : 'secondary'} full" data-action="${isLast ? 'finish' : 'next'}">${isLast ? 'Finish workout' : 'Next exercise →'}</button>` : ''}
    </article>
    <div class="row between">
      <button class="btn text" data-action="rest">Start rest timer</button>
      <button class="btn text danger" data-action="discard">Discard workout</button>
    </div>`;
}

function renderSkills() {
  const blocks = TRACKS.map((t) => {
    const level = state.levels[t.id];
    const hist = trackHistory(state.sessions, t.id);
    return `
      <article class="card">
        <div class="row between">
          <h3>${esc(t.name)}</h3>
          <span class="muted small">step ${level + 1}/${t.steps.length}</span>
        </div>
        <div class="progress"><span style="width:${((level + 1) / t.steps.length) * 100}%"></span></div>
        ${hist.length > 1 ? sparkline(hist) : ''}
        <ol class="ladder">
          ${t.steps.map((s, i) => `
            <li class="${i < level ? 'passed' : i === level ? 'current' : ''}">
              <button data-action="level" data-track="${t.id}" data-level="${i}">
                <span>${esc(s.name)}</span><small>${range(s)}</small>
              </button>
            </li>`).join('')}
        </ol>
      </article>`;
  }).join('');
  return `
    <header class="page-head"><h1>Skills</h1></header>
    <h2>Sets & reps workouts</h2>
    <p class="muted small">Built from your current step on each ladder. Hit the top of the range on every set and you'll be offered the next step.</p>
    ${ladderCards()}
    <h2>Skill ladders</h2>
    <p class="muted small">Tap any step to set it as your current level.</p>
    ${blocks}`;
}

function sparkline(points) {
  const w = 300;
  const h = 56;
  const pad = 6;
  const max = Math.max(...points.map((p) => p.best), 1);
  const x = (i) => pad + (i * (w - 2 * pad)) / (points.length - 1);
  const y = (v) => h - pad - (v / max) * (h - 2 * pad);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.best).toFixed(1)}`).join(' ');
  const lastP = points[points.length - 1];
  return `
    <figure class="spark">
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Best set over the last ${points.length} sessions">
        <path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
        ${points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.best)}" r="3" fill="var(--accent)"><title>${esc(p.name)}: ${p.best}${unit(p.type)}</title></circle>`).join('')}
      </svg>
      <figcaption class="muted small">Best set, last ${points.length} sessions · latest ${lastP.best}${unit(lastP.type)} (${esc(lastP.name)})</figcaption>
    </figure>`;
}

function renderHistory() {
  const s = stats(state.sessions);
  if (!state.sessions.length) {
    return `<header class="page-head"><h1>History</h1></header>
      <div class="empty-state"><p>No workouts yet.</p><button class="btn primary" data-action="tab" data-tab="train">Start your first one</button></div>`;
  }
  const items = state.sessions.map((sess, idx) => ({ sess, idx })).reverse().map(({ sess, idx }) => {
    const t = sessionTotals(sess);
    const open = ui.openSession === idx;
    const isRoutine = sess.kind === 'routine';
    const blocksDone = isRoutine ? sess.blocks.filter((b) => b.result !== 'skipped').length : 0;
    return `
      <article class="card session">
        <button class="row between plain" data-action="toggle" data-i="${idx}" aria-expanded="${open}">
          <div>
            <h3>${esc(sess.name)}</h3>
            <p class="muted small">${fmtDate(sess.startedAt)} · ${formatDuration(sess.endedAt - sess.startedAt)}</p>
          </div>
          <div class="right small">
            ${isRoutine
              ? `<b>${blocksDone}/${sess.blocks.length}</b> blocks`
              : `<b>${t.sets}</b> sets<br>${t.reps ? `${t.reps} reps` : ''}${t.reps && t.seconds ? ' · ' : ''}${t.seconds ? `${t.seconds}s held` : ''}`}
          </div>
        </button>
        ${open ? `
          <ul class="detail">
            ${isRoutine
              ? sess.blocks.map((b) => `<li><span>${esc(b.name ?? b.title)}${b.name ? ` <span class="muted small">${esc(b.title)}</span>` : ''}</span><span class="muted">${esc(b.result)}</span></li>`).join('')
              : sess.exercises.map((e) => `<li><span>${esc(e.name)}</span><span class="muted">${e.done.map((n) => n + unit(e.type)).join(' · ')}</span></li>`).join('')}
          </ul>
          <button class="btn text danger" data-action="delete-session" data-i="${idx}">Delete</button>` : ''}
      </article>`;
  }).join('');
  return `
    <header class="page-head"><h1>History</h1></header>
    <section class="tiles">
      <div class="tile"><b>${s.total}</b><span>workouts</span></div>
      <div class="tile"><b>${s.reps.toLocaleString()}</b><span>total reps</span></div>
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
      <label class="field">
        <span>Rest between sets</span>
        <div class="stepper">
          <button data-action="rest-adj" data-d="-15" aria-label="15 seconds less">−</button>
          <output>${formatClock(state.settings.rest)}</output>
          <button data-action="rest-adj" data-d="15" aria-label="15 seconds more">+</button>
        </div>
      </label>
      <label class="field toggle">
        <span>Sound when rest ends</span>
        <input type="checkbox" data-action="sound" ${state.settings.sound ? 'checked' : ''}>
      </label>
    </article>
    <article class="card">
      <h3>Your data</h3>
      <p class="muted small">Everything is stored on this device only. Export a backup to move it to another device.</p>
      <div class="row gap wrap">
        <button class="btn secondary" data-action="export">Export backup</button>
        <label class="btn secondary">Import backup<input type="file" accept="application/json,.json" data-action="import" hidden></label>
        <button class="btn text danger" data-action="reset">Reset everything</button>
      </div>
    </article>
    <p class="muted small center">Calisthenics · works offline · add to your home screen to install.</p>`;
}

function renderOverlay() {
  if (ui.summary) {
    const { session, suggestions } = ui.summary;
    const t = session ? sessionTotals(session) : null;
    return `
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sum-title">
        <h2 id="sum-title">${session ? 'Workout complete 💪' : 'Workout ended'}</h2>
        ${!session ? '<p class="muted">Nothing was logged, so nothing was saved.</p>'
          : session.kind === 'routine'
            ? `<p class="muted">${formatDuration(session.endedAt - session.startedAt)}</p>
               <ul class="detail">${session.blocks.map((b) => `<li><span>${esc(b.name ?? b.title)}${b.name ? ` <span class="muted small">${esc(b.title)}</span>` : ''}</span><span class="muted">${esc(b.result)}</span></li>`).join('')}</ul>`
            : `<p class="muted">${formatDuration(session.endedAt - session.startedAt)} · ${t.sets} sets${t.reps ? ` · ${t.reps} reps` : ''}${t.seconds ? ` · ${t.seconds}s held` : ''}</p>`}
        ${suggestions.map((s) => `
          <div class="suggest ${s.kind}">
            <p>${s.kind === 'advance' ? `<b>Level up!</b> You maxed out ${esc(s.from)}. Move on to <b>${esc(s.to)}</b>?` : `${esc(s.from)} was tough today. Step back to <b>${esc(s.to)}</b> for a while?`}</p>
            <button class="btn ${s.kind === 'advance' ? 'primary' : 'secondary'}" data-action="apply" data-track="${s.track}" data-level="${s.level}">${s.kind === 'advance' ? 'Level up' : 'Step back'}</button>
          </div>`).join('')}
        <button class="btn ghost full" data-action="close-summary">Done</button>
      </div>`;
  }
  if (ui.restEndsAt) {
    return `
      <div class="sheet rest" role="dialog" aria-modal="true" aria-label="Rest timer">
        <p class="eyebrow">Rest</p>
        <div class="clock" data-tick="rest">${formatClock((ui.restEndsAt - Date.now()) / 1000)}</div>
        <div class="row gap center">
          <button class="btn secondary" data-action="rest-add" data-d="-15">−15s</button>
          <button class="btn secondary" data-action="rest-add" data-d="15">+15s</button>
        </div>
        <button class="btn primary full" data-action="skip-rest">Skip rest</button>
      </div>`;
  }
  return '';
}

// ---------- timers ----------

function tickRoutine(now) {
  const a = state.activeRoutine;
  const elEl = document.querySelector('[data-tick="rt-elapsed"]');
  if (elEl) elEl.textContent = formatDuration(now - a.startedAt);
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
  if (state.active) {
    const el = document.querySelector('[data-tick="elapsed"]');
    if (el) el.textContent = formatDuration(now - state.active.startedAt);
  }
  if (ui.holdStartedAt) {
    ui.pending = Math.floor((now - ui.holdStartedAt) / 1000);
    const el = document.querySelector('[data-tick="hold"]');
    if (el) el.textContent = `${ui.pending}s`;
  }
  if (ui.restEndsAt) {
    const left = (ui.restEndsAt - now) / 1000;
    if (left <= 0) {
      ui.restEndsAt = null;
      beep();
      toast('Rest over — next set!');
      render();
      return;
    }
    const el = document.querySelector('[data-tick="rest"]');
    if (el) el.textContent = formatClock(left);
  }
}
setInterval(tick, 250);

// ---------- actions ----------

function beginRoutine(base, step = 0) {
  const routine = step ? { ...base, name: `${base.name} · ${intensityOf(step).name}` } : base;
  unlockAudio();
  ui.returnTab = ui.tab === 'train' ? ui.returnTab : ui.tab;
  ui.tab = 'train';
  update(() => (state.activeRoutine = startRoutine(routine, Date.now(), step)));
  window.scrollTo(0, 0);
}

function resetBlockTimer(a) {
  a.blockStartedAt = null;
  a.pausedAt = null;
  a.pausedMs = 0;
  ui.phaseKey = null;
}

const actions = {
  'rt-begin': (d) => {
    const base = state.custom.find((w) => w.id === d.id) ?? routineById[d.id];
    beginRoutine(prepared(base, base.id), intensityStep(base.id));
  },
  'gen-start': (d) => beginRoutine(d.which === 'suggest' ? suggestedWorkout() : createdWorkout(), intensityStep(d.which)),
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
  'pf-toggle': () => { ui.profileOpen = !ui.profileOpen; render(); },
  'pf-level': (d) => update(() => (state.profile.level = Number(d.id))),
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
    ui.summary = { session: result.session, suggestions: [] };
    update(() => (state = result.state));
  },
  'rt-discard': () => {
    if (!confirm('Discard this workout? Nothing will be saved.')) return;
    ui.phaseKey = null;
    update(() => (state.activeRoutine = null));
  },
  tab: (d) => { ui.tab = d.tab; render(); window.scrollTo(0, 0); },
  start: (d) => update(() => {
    ui.returnTab = ui.tab;
    ui.tab = 'train';
    state.active = buildWorkout(d.id, state.levels);
    ui.pending = null;
  }),
  goto: (d) => { state.active.current = Number(d.i); ui.pending = null; ui.holdStartedAt = null; save(); render(); },
  adj: (d) => {
    if (ui.holdStartedAt) return;
    ui.pending = clamp((ui.pending ?? 0) + Number(d.d), 0, 999);
    render();
  },
  hold: () => {
    if (ui.holdStartedAt) {
      ui.pending = Math.floor((Date.now() - ui.holdStartedAt) / 1000);
      ui.holdStartedAt = null;
    } else {
      ui.holdStartedAt = Date.now();
      ui.pending = 0;
    }
    render();
  },
  log: () => {
    if (ui.holdStartedAt) actions.hold();
    const ex = currentExercise();
    update(() => ex.done.push(ui.pending ?? 0));
    const w = state.active;
    const allDone = w.exercises.every((e) => e.done.length >= e.sets);
    if (ex.done.length === ex.sets && w.current < w.exercises.length - 1) toast(`${ex.name} done ✓`);
    if (!allDone) actions.rest();
  },
  undo: () => update(() => { currentExercise().done.pop(); ui.pending = null; }),
  next: () => {
    const w = state.active;
    const nextIdx = w.exercises.findIndex((e, i) => i > w.current && e.done.length < e.sets);
    actions.goto({ i: nextIdx === -1 ? Math.min(w.current + 1, w.exercises.length - 1) : nextIdx });
    window.scrollTo(0, 0);
  },
  rest: () => { ui.restEndsAt = Date.now() + state.settings.rest * 1000; render(); },
  'rest-add': (d) => { ui.restEndsAt = Math.max(Date.now() + 1000, ui.restEndsAt + Number(d.d) * 1000); tick(); },
  'skip-rest': () => { ui.restEndsAt = null; render(); },
  finish: () => {
    const w = state.active;
    const incomplete = w.exercises.some((e) => e.done.length < e.sets);
    if (incomplete && !confirm('Some sets are not logged yet. Finish anyway?')) return;
    const result = finishWorkout(state);
    ui.restEndsAt = null;
    ui.holdStartedAt = null;
    ui.pending = null;
    ui.summary = { session: result.session, suggestions: result.suggestions };
    update(() => (state = result.state));
  },
  discard: () => {
    if (!confirm('Discard this workout? Logged sets will be lost.')) return;
    ui.restEndsAt = null;
    ui.holdStartedAt = null;
    ui.pending = null;
    update(() => (state.active = null));
  },
  apply: (d, el) => {
    state.levels[d.track] = Number(d.level);
    save();
    el.closest('.suggest').innerHTML = `<p>✓ ${esc(trackById[d.track].name)} set to <b>${esc(stepFor(d.track, Number(d.level)).name)}</b>.</p>`;
  },
  'close-summary': () => { ui.summary = null; render(); },
  level: (d) => update(() => (state.levels[d.track] = Number(d.level))),
  toggle: (d) => { ui.openSession = ui.openSession === Number(d.i) ? null : Number(d.i); render(); },
  'delete-session': (d) => {
    if (!confirm('Delete this workout from history?')) return;
    ui.openSession = null;
    update(() => state.sessions.splice(Number(d.i), 1));
  },
  'rest-adj': (d) => update(() => (state.settings.rest = clamp(state.settings.rest + Number(d.d), 15, 600))),
  sound: (d, el) => update(() => (state.settings.sound = el.checked)),
  export: () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `calisthenics-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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
    if (!confirm('Delete all workouts, levels and settings? This cannot be undone.')) return;
    ui.summary = null;
    ui.restEndsAt = null;
    ui.phaseKey = null;
    update(() => (state = defaultState()));
  },
};

document.addEventListener('click', (e) => {
  if (e.target.id === 'overlay' && ui.restEndsAt && !ui.summary) return actions['skip-rest']();
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
