import { TRACKS, TEMPLATES, trackById } from './data.js';
import {
  STORAGE_KEY, defaultState, normalizeState, buildWorkout, finishWorkout, evaluate,
  sessionTotals, stats, trackHistory, lastPerformance, stepFor, formatDuration, formatClock, clamp,
} from './logic.js';

// ---------- state ----------

let state = load();
const ui = {
  tab: 'train',
  pending: null, // value in the set stepper
  holdStartedAt: null, // stopwatch for hold exercises
  restEndsAt: null,
  summary: null, // { session, suggestions } shown after finishing
  openSession: null,
};

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
function beep() {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  if (!state.settings.sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((offset, i) => {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.frequency.value = i === 2 ? 1320 : 880;
      g.gain.setValueAtTime(0.25, audio.currentTime + offset);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + offset + 0.2);
      o.connect(g).connect(audio.destination);
      o.start(audio.currentTime + offset);
      o.stop(audio.currentTime + offset + 0.2);
    });
  } catch {
    /* audio not available */
  }
}

let wakeLock = null;
async function syncWakeLock() {
  try {
    if (state.active && !wakeLock && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => (wakeLock = null));
    } else if (!state.active && wakeLock) {
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
  document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('active', b.dataset.tab === ui.tab));
  const view = { train: renderTrain, skills: renderSkills, history: renderHistory, settings: renderSettings }[ui.tab];
  $('#view').innerHTML = view();
  $('#overlay').innerHTML = renderOverlay();
  $('#overlay').hidden = !$('#overlay').innerHTML;
  tick();
  syncWakeLock();
}

function renderTrain() {
  return state.active ? renderWorkout() : renderPicker();
}

function renderPicker() {
  const s = stats(state.sessions);
  const cards = TEMPLATES.map((t) => `
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
  return `
    <header class="page-head"><h1>Train</h1></header>
    <section class="tiles">
      <div class="tile"><b>${s.thisWeek}</b><span>this week</span></div>
      <div class="tile"><b>${s.weekStreak}</b><span>week streak</span></div>
      <div class="tile"><b>${s.total}</b><span>workouts</span></div>
    </section>
    <h2>Choose a workout</h2>
    ${cards}
    <p class="muted small">Exercises come from your current step on each skill ladder. Hit the top of the range on every set and you'll be offered the next step.</p>`;
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
    return `
      <article class="card session">
        <button class="row between plain" data-action="toggle" data-i="${idx}" aria-expanded="${open}">
          <div>
            <h3>${esc(sess.name)}</h3>
            <p class="muted small">${fmtDate(sess.startedAt)} · ${formatDuration(sess.endedAt - sess.startedAt)}</p>
          </div>
          <div class="right small">
            <b>${t.sets}</b> sets<br>${t.reps ? `${t.reps} reps` : ''}${t.reps && t.seconds ? ' · ' : ''}${t.seconds ? `${t.seconds}s held` : ''}
          </div>
        </button>
        ${open ? `
          <ul class="detail">
            ${sess.exercises.map((e) => `<li><span>${esc(e.name)}</span><span class="muted">${e.done.map((n) => n + unit(e.type)).join(' · ')}</span></li>`).join('')}
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
        ${session ? `<p class="muted">${formatDuration(session.endedAt - session.startedAt)} · ${t.sets} sets${t.reps ? ` · ${t.reps} reps` : ''}${t.seconds ? ` · ${t.seconds}s held` : ''}</p>` : '<p class="muted">No sets were logged, so nothing was saved.</p>'}
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

function tick() {
  const now = Date.now();
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

const actions = {
  tab: (d) => { ui.tab = d.tab; render(); window.scrollTo(0, 0); },
  start: (d) => update(() => {
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
