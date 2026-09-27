// Personal routines made of timed blocks.
//
// Block kinds:
//   interval — `rounds` passes through `items`; each item is `work` seconds (or item.secs),
//              followed by `rest` seconds, with `roundRest` after the last item of a round.
//              A Tabata is an interval block (default 20s on / 10s off).
//   amrap    — as many rounds as possible of `items` in `minutes`.
//   emom     — every `every` seconds for `rounds` rounds, do `items`, rest the remainder.
//   circuit  — untimed: `rounds` of `items` at your own pace.
//
// Items: { ex, reps? | secs? | text?, note? }, where `ex` is a key of EXERCISES.

import { EXERCISES } from './exercises.js';

export { EXERCISES };

const item = (x) => (typeof x === 'string' ? { ex: x } : x);
const r = (ex, reps, note) => ({ ex, reps, note });
const s = (ex, secs, note) => ({ ex, secs, note });
const t = (ex, text, note) => ({ ex, text, note });

export const interval = ({ rounds, work, rest = 0, roundRest = rest, title, note }, items) =>
  ({ kind: 'interval', title, note, rounds, work, rest, roundRest, items: items.map(item) });
export const tabata = (items, { work = 20, rest = 10, rounds = 2, note } = {}) =>
  interval({ rounds, work, rest, roundRest: rest, title: 'Tabata', note }, items);
// n × secs of one exercise with rest between.
const holds = (ex, rounds, secs, rest = 30, note) => interval({ rounds, work: secs, rest, note }, [ex]);
export const amrap = (minutes, items, note) => ({ kind: 'amrap', minutes, note, items: items.map(item) });
export const emom = (every, rounds, items, note) => ({ kind: 'emom', every, rounds, note, items: items.map(item) });
export const circuit = (rounds, items, note) => ({ kind: 'circuit', rounds, note, items: items.map(item) });

export const ROUTINES = [
  {
    id: 'a1',
    name: 'Allenamento 1',
    blocks: [
      interval({ rounds: 4, work: 30, rest: 45 }, ['pull-up']),
      tabata(['chin-up', 'push-up', 'planche-lean', 'plank']),
      holds('handstand', 4, 30),
      tabata(['hollow-hold', 'australian', 'pike-push-up', 'pistol-squat']),
    ],
  },
  {
    id: 'a2',
    name: 'Allenamento 2',
    blocks: [
      interval({ rounds: 4, work: 15, roundRest: 30 }, ['chin-up', 'push-up', 'pull-up-iso']),
      holds('handstand', 4, 30, 30, 'Hold longer if you can.'),
      amrap(12, [
        r('australian', 10), r('push-up', 10), r('squat-jump', 10),
        s('hanging-leg-raise', 30, 'or hollow hold'), s('australian-iso', 12, 'or 12 dips'), s('handstand', 20),
      ]),
    ],
  },
  {
    id: 'a3',
    name: 'Allenamento 3',
    blocks: [
      interval({ rounds: 4, work: 20, roundRest: 30 }, ['chin-up', 'push-up']),
      interval({ rounds: 4, work: 20, roundRest: 30 }, ['pull-up-iso', 'hollow-hold', 'pike-push-up']),
      holds('handstand', 4, 20),
      amrap(12, [s('handstand', 20), r('australian', 10), s('plank', 30), 'dip', 'push-up']),
    ],
  },
  {
    id: 'a4',
    name: 'Allenamento 4',
    blocks: [
      interval({ rounds: 4, work: 20, roundRest: 30 }, ['pull-up-iso', 'scapular-pull', 'push-up']),
      interval({ rounds: 4, work: 25, roundRest: 30 }, ['australian', 'planche-lean', 'hollow-hold']),
      holds('handstand', 4, 30),
      amrap(12, [r('chin-up', 12), r('push-up', 12), r('squat-jump', 8), r('dragon-flag', 8)]),
    ],
  },
  {
    id: 'a5',
    name: 'Allenamento 5',
    blocks: [
      interval({ rounds: 4, work: 15, roundRest: 30 }, ['pull-up', 'push-up']),
      holds('chin-up-iso', 4, 20),
      holds('handstand', 4, 25),
      tabata(['wall-sit', 'pike-push-up', 'planche-lean', 'active-hang', 'hanging-leg-raise', 'hollow-hold', 'inverted-hang', 'plank'], { rounds: 1 }),
    ],
  },
  {
    id: 'a6',
    name: 'Allenamento 6',
    blocks: [
      interval({ rounds: 4, work: 18, roundRest: 30 }, ['pull-up', 'push-up', 'pull-up-iso']),
      holds('handstand', 4, 30),
      holds('inverted-hang', 4, 30),
      amrap(12, [r('squat-jump', 8), s('hollow-hold', 30), s('l-sit', 20), r('australian', 10), r('dip', 15)]),
    ],
  },
  {
    id: 'a7',
    name: 'Allenamento 7',
    blocks: [
      interval({ rounds: 4, work: 15, roundRest: 30 }, ['pull-up', 'push-up']),
      interval({ rounds: 4, work: 25, roundRest: 30 }, [s('hspu', 25), s('hollow-hold', 30)]),
      interval({ rounds: 4, work: 25, roundRest: 30 }, ['pull-up-iso', 'pike-push-up']),
      interval({ rounds: 3, work: 15, roundRest: 30, title: 'Circuit' }, [
        { ex: 'skin-the-cat', note: 'low bars' }, 'pike-push-up', 'australian', 'dragon-flag',
      ]),
    ],
  },
  {
    id: 'a8',
    name: 'Allenamento 8',
    blocks: [
      tabata(['chin-up', 'horse-stance', 'side-leg-raise', 'hindu-push-up'], { work: 40, rest: 30, rounds: 4 }),
      tabata(['lateral-lunge', 'handstand', 'pull-up-iso', 'leg-stretch'], { work: 30, rest: 20, rounds: 3 }),
    ],
  },
  {
    id: 'a9',
    name: 'Allenamento 9',
    blocks: [
      emom(75, 6, [r('pull-up', 5), r('push-up', 8)], 'Every 1:15 for ~8 min.'),
      holds('box-pike-handstand', 4, 30),
      holds('wall-handstand', 4, 30),
      circuit(1, [r('skin-the-cat', 5)]),
      amrap(10, [
        r('pseudo-planche-push-up', 5), s('planche-lean', 20, 'arms wide'), s('rest', 30),
        r('pike-push-up', 2, 'slow tempo'), r('push-up', 2, 'slow tempo'),
      ]),
      emom(60, 5, [s('windshield-wiper', 20), r('sissy-squat', 5)], 'Rest the remainder of each minute.'),
      circuit(1, ['stretching']),
    ],
  },
  {
    id: 'a10',
    name: 'Allenamento 10',
    blocks: [
      emom(60, 8, [t('pull-up', '8–10'), r('push-up', 15)], 'Stop at 6 if it gets too hard.'),
      interval({ rounds: 5, work: 30, title: '10 min, 30s each' }, ['hollow-rock', 'pike-push-up', 'leg-raise', t('chin-up', '6–8')]),
      holds('handstand', 4, 30, 120),
      amrap(10, [r('pike-push-up', 12), t('push-up', '10–15'), s('dead-hang', 20), r('australian', 15), r('squat', 20)]),
    ],
  },
  {
    id: 'a11',
    name: 'Allenamento 11',
    blocks: [
      circuit(4, [r('pull-up', 4), r('burpee', 5), r('pull-up', 4), r('push-up', 10)]),
      interval({ rounds: 4, work: 25, rest: 25, roundRest: 90 }, ['hspu', 'chin-up-iso', 'l-sit']),
      circuit(3, [r('pike-push-up', 12), t('push-up', '10–15'), s('hollow-hold', 20), r('australian', 15), r('squat', 20)]),
    ],
  },
  {
    id: 'a12',
    name: 'Allenamento 12',
    blocks: [
      interval({ rounds: 4, work: 15, roundRest: 30 }, ['chin-up', 'leg-raise', 'push-up']),
      interval({ rounds: 4, work: 25, roundRest: 40 }, ['pike-push-up', 'planche-lean', 'hollow-hold']),
      holds('handstand', 4, 30),
      tabata(['l-sit-dip', 'pull-up', 'pistol-squat', 'australian', 'plank']),
    ],
  },
];

export const routineById = Object.fromEntries(ROUTINES.map((x) => [x.id, x]));
