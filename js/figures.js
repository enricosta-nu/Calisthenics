// Animated exercise pictograms.
//
// A side-view figure drawn with thick round strokes (pictogram style) moves between key poses.
// The muscles an exercise works are drawn as coloured stripes on the body: main muscles strong,
// secondary ones light. Chest and abs show on the front of the torso, back muscles on the back,
// biceps on the front of the upper arm, triceps on the back, and so on.
//
// A pose places the hip, the torso angle and where the hands and feet are; elbows and knees are
// solved (two-bone IK), so hands stay on the bar and feet on the floor while the body moves.
//   hip:  [x, y] in a 100 × 100 box, floor at y = 92
//   t:    torso angle in degrees, hip → shoulder (0 = right, 90 = down, -90 = up)
//   hand, foot: targets for the near arm and leg; hand2 / foot2 for the far ones (default: same)
//   c:    torso curve, > 0 rounds the back, < 0 arches it
//   elbow: -1 bends the elbows forward instead of back (triceps extension)
// The figure faces right; lying on the back, the head is on the left.
// Keys may carry `move` (seconds to get there) and `wait` (seconds to stay).

import { EXERCISES } from './exercises.js';

const LEN = { torso: 24, upper: 13, fore: 12, thigh: 16, shin: 16, neck: 8 };
const W = { torso: 9, limb: 6.5, head: 5.4, stripe: 3 };
export const FLOOR = 92;

// ---------- poses ----------

const hangDown = { hip: [52, 57], t: -90, hand: [54, 8], foot: [47, 88] };
const hangTop = { hip: [48, 37], t: -95, hand: [54, 8], foot: [50, 67], move: 1 };
const lowHang = { hip: [60, 76], t: -112, hand: [50, 40], foot: [76, 60] }; // tucked under a bar at y 40
const rowDown = { hip: [56.3, 76], t: -150, hand: [37, 40], foot: [84, 92] };
const rowTop = { hip: [59.5, 71.4], t: -140, hand: [37, 40], foot: [84, 92] };
const puTop = { hip: [48.8, 78], t: -26, hand: [72, 92], foot: [20, 92] };
const puDown = { hip: [51.7, 88], t: -7, hand: [72, 92], foot: [20, 92] };
const stand = { hip: [48, 60], t: -90, hand: [49, 61], foot: [50, 92] };
const squatDown = { hip: [38, 78], t: -55, hand: [72, 56], foot: [50, 92] };
const squatHands = { hip: [46, 80], t: -35, hand: [66, 92], foot: [50, 92] };
const jumpUp = { hip: [48, 52], t: -90, hand: [49, 4], foot: [50, 84] };
const dipTop = { hip: [49.2, 61], t: -88, hand: [50, 62], foot: [38, 84] };
const dipDown = { hip: [41.8, 72.6], t: -70, hand: [50, 62], foot: [30, 86] };
const lieBack = { hip: [56, 88], t: 180, hand: [10, 87], foot: [88, 89] }; // flat on the back, arms overhead
const hollow = { hip: [56, 89], t: -168, c: -2, hand: [12, 79], foot: [86, 80] };
const lTuck = { hip: [50, 81], t: -88, hand: [50, 82], foot: [64, 84] };
const lSit = { hip: [50, 81], t: -88, hand: [50, 82], foot: [82, 80] };
const plankKnees = { hip: [44, 85], t: -14, hand: [80, 92], foot: [22, 84] };
const plank = { hip: [47, 83], t: -15, hand: [80, 92], foot: [16, 92] };
const allFours = { hip: [40, 74], t: -8, hand: [64, 92], foot: [22, 90] };
const seated = { hip: [36, 88], t: -95, hand: [44, 84], foot: [67, 90] };
const kneel = { hip: [36, 74], t: -90, hand: [40, 72], foot: [16, 90] };
const handstand = { hip: [64, 43], t: 90, hand: [64, 92], foot: [64, 11] };
const pike = { hip: [42, 61], t: 20, hand: [64, 92], foot: [32, 92] };

// Rotate a pose around a point, for rocking movements.
function turn(p, deg, [cx, cy]) {
  const r = (deg * Math.PI) / 180;
  const rot = ([x, y]) => [cx + (x - cx) * Math.cos(r) - (y - cy) * Math.sin(r), cy + (x - cx) * Math.sin(r) + (y - cy) * Math.cos(r)];
  const out = { ...p, t: p.t + deg, hip: rot(p.hip), hand: rot(p.hand), foot: rot(p.foot) };
  if (p.hand2) out.hand2 = rot(p.hand2);
  if (p.foot2) out.foot2 = rot(p.foot2);
  return out;
}
const hold = (p, wait = 2.2) => ({ ...p, wait });
const bar = (y = 8) => ['bar', 50, y, 64];

// Props: ['bar', x, y, width] · ['lowbar', x, y] · ['dip', x0, y, x1] · ['box', x0, y, x1] ·
// ['wall', x] · ['rings', x, y] · ['parallettes', x, y]
export const FIGURES = {
  // pull
  'pull-up': { props: [bar()], keys: [hangDown, hangTop] },
  'chin-up': { props: [bar()], keys: [hangDown, hangTop] },
  'pull-up-iso': { props: [bar()], keys: [hangDown, hold(hangTop)] },
  'chin-up-iso': { props: [bar()], keys: [hangDown, hold(hangTop)] },
  'scapular-pull': { props: [bar()], keys: [hangDown, { ...hangDown, hip: [52, 53], foot: [47, 84], move: 0.6 }] },
  'dead-hang': { props: [bar()], move: 1.6, keys: [hold(hangDown, 0.6), hold({ ...hangDown, hip: [53, 57], foot: [49, 88] }, 0.6)] },
  'one-arm-hang-rotation': {
    props: [bar()],
    keys: [{ ...hangDown, hand2: [58, 8] }, { hip: [50, 57], t: -84, hand: [54, 8], hand2: [62, 44], foot: [58, 87], foot2: [42, 87], move: 1.2 }],
  },
  'inverted-hang': { props: [bar(40)], keys: [lowHang, hold({ hip: [50, 42], t: 88, hand: [50, 40], foot: [52, 10], move: 1.2 })] },
  'skin-the-cat': { props: [bar(40)], move: 1.3, keys: [lowHang, { hip: [38, 46], t: 58, hand: [50, 40], foot: [26, 72] }] },
  australian: { props: [['lowbar', 37, 40]], keys: [rowDown, rowTop] },
  'underhand-row': { props: [['lowbar', 37, 40]], keys: [rowDown, rowTop] },
  'australian-iso': { props: [['lowbar', 37, 40]], keys: [rowDown, hold(rowTop)] },
  'biceps-curl': { props: [['lowbar', 37, 40]], keys: [rowDown, { hip: [58, 73], t: -146, hand: [37, 40], foot: [84, 92] }] },
  'negative-pull-up': { props: [bar()], keys: [{ ...hangTop, move: 0.6, wait: 0.4 }, { ...hangDown, move: 2.6 }] },
  'archer-pull-up': {
    props: [bar()],
    keys: [
      { hip: [58, 55], t: -90, hand: [48, 8], hand2: [68, 8], foot: [53, 86] },
      { hip: [49, 37], t: -95, hand: [48, 8], hand2: [68, 8], foot: [51, 67], move: 1.1 },
    ],
  },

  // push
  'push-up': { keys: [puTop, puDown] },
  'diamond-push-up': { keys: [puTop, puDown] },
  'wide-push-up': { keys: [puTop, puDown] },
  'incline-push-up': {
    props: [['box', 64, 74, 86]],
    keys: [{ hip: [46.6, 69.4], t: -45, hand: [72, 74], foot: [24, 92] }, { hip: [51.7, 76], t: -30, hand: [72, 74], foot: [24, 92] }],
  },
  'decline-push-up': {
    props: [['box', 6, 80, 30]],
    keys: [{ hip: [51, 72.5], t: -13, hand: [74, 92], foot: [20, 80] }, { hip: [52, 83], t: 5, hand: [74, 92], foot: [20, 80] }],
  },
  'push-up-hold': { keys: [puTop, hold({ ...puDown, hip: [51.5, 86], t: -9 })] },
  'archer-push-up': { keys: [{ ...puTop, hand2: [80, 92] }, { ...puDown, hip: [49, 88], t: -6, hand2: [96, 92] }] },
  'clap-push-up': {
    keys: [{ ...puDown, move: 0.35, wait: 0.35 }, { hip: [47, 75], t: -32, hand: [78, 72], foot: [20, 92], move: 0.35, wait: 0.1 }],
  },
  'ring-push-up': {
    props: [['rings', 72, 86]],
    keys: [{ hip: [50.7, 74.4], t: -33, hand: [72, 86], foot: [24, 92] }, { hip: [55, 84.8], t: -13, hand: [72, 86], foot: [24, 92] }],
  },
  'ring-dip': { props: [['rings', 50, 62]], keys: [dipTop, dipDown] },
  'triceps-dip': { props: [['dip', 30, 62, 70]], keys: [dipTop, { ...dipDown, hip: [47, 74], t: -84 }] },
  'bench-dip': {
    props: [['box', 12, 70, 32]],
    keys: [{ hip: [38, 70], t: -95, hand: [30, 70], foot: [62, 92] }, { hip: [38, 82], t: -95, hand: [30, 70], foot: [62, 92] }],
  },
  'triceps-extension': {
    props: [['box', 70, 72, 90]],
    keys: [
      { hip: [44.6, 69.4], t: -45, hand: [76, 72], foot: [22, 92], elbow: -1 },
      { hip: [48, 74], t: -36, hand: [76, 72], foot: [22, 92], elbow: -1 },
    ],
  },
  'hindu-push-up': {
    move: 1.1,
    keys: [{ hip: [46, 62], t: 30, hand: [80, 92], foot: [34, 92] }, { hip: [54, 84], t: -42, c: -3, hand: [80, 92], foot: [24, 92] }],
  },
  'pike-push-up': { keys: [{ hip: [50, 61], t: 40, hand: [76, 92], foot: [40, 92] }, { hip: [54, 64], t: 55, hand: [76, 92], foot: [40, 92] }] },
  'pseudo-planche-push-up': {
    keys: [{ hip: [48, 79], t: -24, hand: [63, 92], foot: [20, 92] }, { hip: [52, 88], t: -9.5, hand: [63, 92], foot: [20, 92] }],
  },
  'planche-lean': { keys: [{ hip: [41, 79], t: -24, hand: [63, 92], foot: [12, 92] }, hold({ hip: [48, 79], t: -24, hand: [63, 92], foot: [18, 92] })] },
  'tuck-planche': { keys: [{ hip: [46, 80], t: -25, hand: [60, 92], foot: [44, 92] }, hold({ hip: [40, 70], t: -5, hand: [60, 92], foot: [34, 76] })] },
  'elevated-pike-push-up': {
    props: [['box', 16, 66, 40]],
    keys: [{ hip: [52, 44], t: 75, hand: [62, 92], foot: [34, 66] }, { hip: [54, 52], t: 78, hand: [62, 92], foot: [34, 66] }],
  },
  dip: { props: [['dip', 30, 62, 70]], keys: [dipTop, dipDown] },
  'l-sit-dip': {
    props: [['dip', 30, 62, 70]],
    keys: [{ hip: [49, 61], t: -88, hand: [50, 62], foot: [80, 62] }, { hip: [47, 72], t: -82, hand: [50, 62], foot: [78, 73] }],
  },
  burpee: {
    move: 0.45,
    wait: 0.1,
    keys: [stand, squatHands, puTop, puDown, puTop, squatHands, jumpUp],
  },

  // handstand
  handstand: { keys: [pike, hold({ ...handstand, move: 1.4 }, 2.4)] },
  'wall-handstand': {
    props: [['wall', 56]],
    keys: [pike, hold({ hip: [62, 43], t: 95, hand: [64, 92], foot: [59, 11], move: 1.4 }, 2.4)],
  },
  'box-pike-handstand': {
    props: [['box', 22, 64, 44]],
    keys: [{ hip: [52, 52], t: 50, hand: [64, 92], foot: [36, 64] }, hold({ hip: [59.8, 43.4], t: 80, hand: [64, 92], foot: [36, 64] })],
  },
  'frog-stand': { keys: [{ hip: [48, 80], t: -30, hand: [66, 92], foot: [46, 92] }, hold({ hip: [50, 72], t: -10, hand: [66, 92], foot: [46, 80] })] },
  'wall-walk': {
    props: [['wall', 30]],
    scale: 0.85,
    move: 1.1,
    keys: [
      { hip: [60.8, 78], t: -26, hand: [84, 92], foot: [32, 92] },
      { hip: [46, 52], t: 60, hand: [62, 92], foot: [32, 46] },
      hold({ hip: [38, 43], t: 95, hand: [40, 92], foot: [34, 11] }, 1),
      { hip: [46, 52], t: 60, hand: [62, 92], foot: [32, 46] },
    ],
  },
  hspu: {
    props: [['wall', 72]],
    keys: [{ hip: [59, 43], t: 85, hand: [56, 92], foot: [62, 11] }, { hip: [66, 57], t: 85, hand: [56, 92], foot: [68, 25], move: 1.2 }],
  },

  // core
  plank: { keys: [plankKnees, hold(plank, 2.6)] },
  'side-plank': {
    keys: [
      { hip: [44, 88], t: -18, hand: [80, 92], hand2: [62, 86], foot: [16, 92] },
      hold({ hip: [46, 80], t: -20, hand: [80, 92], hand2: [72, 50], foot: [16, 92] }),
    ],
  },
  'hollow-hold': { keys: [lieBack, hold(hollow, 2.4)] },
  'hollow-rock': { move: 0.7, wait: 0.05, keys: [turn(hollow, 9, [56, 86]), turn(hollow, -9, [56, 86])] },
  'leg-raise': { keys: [{ hip: [56, 88], t: 180, hand: [56, 90], foot: [88, 89] }, { hip: [56, 88], t: 180, hand: [56, 90], foot: [60, 56], move: 1.1 }] },
  'hanging-leg-raise': { props: [bar()], keys: [hangDown, { hip: [52, 57], t: -95, hand: [54, 8], foot: [83, 55], move: 1 }] },
  'toes-to-bar': { props: [bar()], keys: [hangDown, { hip: [46, 50], t: -80, hand: [54, 8], foot: [58, 18], move: 1.1 }] },
  'windshield-wiper': {
    props: [bar()],
    move: 0.9,
    keys: [{ hip: [51, 54], t: -86, hand: [54, 8], foot: [80, 34] }, { hip: [53, 56], t: -94, hand: [54, 8], foot: [70, 64] }],
  },
  'v-up': { keys: [lieBack, { hip: [56, 88], t: -125, hand: [62, 52], foot: [72, 60] }] },
  'mountain-climber': {
    move: 0.3,
    wait: 0.05,
    keys: [{ ...puTop, foot2: [52, 84] }, { ...puTop, foot: [52, 84], foot2: [20, 92] }],
  },
  'dragon-flag': {
    props: [['box', 24, 82, 88]],
    move: 1.4,
    keys: [{ hip: [38, 55], t: 109, hand: [16, 80], foot: [48, 25] }, { hip: [53, 72], t: 165, hand: [16, 80], foot: [84, 64] }],
  },
  'tuck-to-l-sit': { props: [['parallettes', 50, 82]], keys: [lTuck, lSit] },
  'l-sit': { props: [['parallettes', 50, 82]], keys: [lTuck, hold(lSit)] },
  'side-leg-raise': {
    keys: [
      { hip: [54, 86], t: 180, hand: [24, 78], foot: [86, 88], foot2: [86, 89] },
      { hip: [54, 86], t: 180, hand: [24, 78], foot: [82, 68], foot2: [86, 89] },
    ],
  },

  // legs
  squat: { keys: [stand, squatDown] },
  'squat-jump': { move: 0.5, wait: 0.15, keys: [squatDown, jumpUp] },
  lunge: {
    keys: [
      { hip: [46, 61.5], t: -90, hand: [52, 63], foot: [56, 92], foot2: [36, 92] },
      { hip: [46, 72], t: -90, hand: [52, 72], foot: [66, 92], foot2: [24, 90] },
    ],
  },
  'lateral-lunge': {
    keys: [
      { hip: [48, 60], t: -90, hand: [62, 50], foot: [50, 92], foot2: [56, 92] },
      { hip: [44, 74], t: -70, hand: [66, 62], foot: [50, 92], foot2: [70, 92] },
    ],
  },
  'bulgarian-split-squat': {
    props: [['box', 6, 74, 26]],
    keys: [
      { hip: [48, 62], t: -90, hand: [50, 63], foot: [62, 92], foot2: [22, 74] },
      { hip: [44, 74], t: -84, hand: [48, 76], foot: [62, 92], foot2: [22, 74] },
    ],
  },
  'pistol-squat': {
    move: 1.2,
    keys: [
      { hip: [48, 60], t: -90, hand: [72, 40], foot: [50, 92], foot2: [78, 62] },
      { hip: [44, 84], t: -60, hand: [78, 62], foot: [50, 92], foot2: [76, 82] },
    ],
  },
  'sissy-squat': { keys: [stand, { hip: [44, 70], t: -100, hand: [56, 58], foot: [50, 92] }] },
  'glute-bridge': {
    keys: [{ hip: [48, 88], t: 180, hand: [52, 91], foot: [72, 92] }, { hip: [50, 72], t: 148, hand: [52, 91], foot: [72, 92] }],
  },
  'single-leg-bridge': {
    keys: [
      { hip: [48, 88], t: 180, hand: [52, 91], foot: [72, 92], foot2: [72, 68] },
      { hip: [50, 72], t: 148, hand: [52, 91], foot: [72, 92], foot2: [80, 60] },
    ],
  },
  'single-leg-rdl': {
    move: 1.2,
    keys: [
      { hip: [48, 60], t: -90, hand: [49, 61], foot: [50, 92], foot2: [46, 88] },
      { hip: [46, 60], t: -5, hand: [70, 83], foot: [50, 92], foot2: [15, 56] },
    ],
  },
  'nordic-curl': {
    keys: [
      { hip: [32, 72], t: -90, hand: [38, 70], foot: [14, 88], move: 0.8 },
      { hip: [42.3, 79.7], t: -40, hand: [80, 80], foot: [14, 88], move: 2.6 },
    ],
  },
  'calf-raise': { move: 0.6, keys: [stand, { ...stand, hip: [48, 56], hand: [49, 57], foot: [50, 88] }] },
  'wall-sit': {
    props: [['wall', 30]],
    keys: [{ hip: [36, 64], t: -90, hand: [37, 65], foot: [52, 92] }, hold({ hip: [36, 74], t: -90, hand: [50, 70], foot: [52, 92] })],
  },
  'horse-stance': { keys: [stand, hold({ hip: [44, 76], t: -90, hand: [64, 54], foot: [52, 92] })] },

  // warm-up
  'jumping-jacks': {
    move: 0.4,
    wait: 0.05,
    keys: [{ ...stand, foot2: [48, 92] }, { hip: [48, 60], t: -90, hand: [36, 14], hand2: [60, 14], foot: [58, 91], foot2: [38, 91] }],
  },
  'arm-circles': {
    move: 0.35,
    wait: 0,
    keys: [
      { ...stand, hand: [48, 11] },
      { ...stand, hand: [73, 36] },
      { ...stand, hand: [48, 61] },
      { ...stand, hand: [23, 36] },
    ],
  },
  'wrist-circles': { move: 0.5, wait: 0, keys: [{ ...stand, hand: [68, 40] }, { ...stand, hand: [70, 46] }, { ...stand, hand: [66, 48] }] },
  'cat-cow': { move: 1.3, keys: [{ ...allFours, c: 5 }, { ...allFours, c: -4 }] },
  'scapular-push-up': { move: 0.7, keys: [puTop, { ...puTop, hip: [48.8, 80], t: -24 }] },
  'deep-squat-hold': { keys: [stand, hold({ hip: [42, 84], t: -70, hand: [62, 66], foot: [50, 92] })] },
  'leg-swings': {
    props: [['wall', 26]],
    move: 0.6,
    wait: 0.05,
    keys: [{ ...stand, hip: [40, 60], hand: [27, 44], foot: [42, 92], foot2: [70, 70] }, { ...stand, hip: [40, 60], hand: [27, 44], foot: [42, 92], foot2: [14, 82] }],
  },

  // cool-down
  stretching: { move: 1.4, keys: [stand, hold({ hip: [48, 60], t: -84, hand: [56, 10], hand2: [52, 10], foot: [50, 92] })] },
  'leg-stretch': { move: 1.6, keys: [seated, hold({ hip: [36, 88], t: -25, c: 3, hand: [66, 86], foot: [67, 90] })] },
  'shoulder-stretch': { move: 1, keys: [stand, hold({ ...stand, hand: [64, 38], hand2: [62, 44] }, 2.4)] },
  'hip-flexor-stretch': {
    move: 1.4,
    keys: [
      { hip: [42, 72], t: -95, hand: [54, 70], foot: [62, 92], foot2: [20, 90] },
      hold({ hip: [48, 73], t: -99, hand: [58, 70], foot: [62, 92], foot2: [20, 90] }),
    ],
  },
  'pancake-stretch': { move: 1.6, keys: [seated, hold({ hip: [36, 88], t: -18, c: 2, hand: [70, 88], foot: [67, 90] })] },
  'childs-pose': { move: 1.5, keys: [kneel, hold({ hip: [30, 84], t: 10, c: 3, hand: [78, 90], foot: [16, 90] }, 2.6)] },
  'dead-hang-stretch': { props: [bar()], move: 1.6, keys: [hold(hangDown, 0.6), hold({ ...hangDown, hip: [53, 57], foot: [49, 88] }, 0.6)] },

  rest: { move: 1.6, wait: 0.4, keys: [stand, { ...stand, hip: [48, 59], hand: [49, 60] }] },
};

// Muscles for exercises outside the approved reference (warm-ups, stretches, extras).
const EXTRA_MUSCLES = {
  'one-arm-hang-rotation': ['Grip, lats', 'Obliques, shoulder stabilisers'],
  'inverted-hang': ['Rectus abdominis, lats', 'Grip, front deltoid'],
  'skin-the-cat': ['Lats, front deltoid', 'Biceps, abs, grip'],
  'australian-iso': ['Lats, middle trapezius, rhomboids', 'Biceps, grip, core'],
  burpee: ['Quadriceps, gluteus maximus, pectoralis major', 'Triceps, abs, calves'],
  'side-leg-raise': ['Gluteus medius', 'Obliques'],
  lunge: ['Quadriceps, gluteus maximus', 'Hamstrings, calves'],
  'calf-raise': ['Calves', ''],
  'horse-stance': ['Quadriceps, gluteus maximus', 'Adductors, lower back'],
  'sissy-squat': ['Quadriceps', 'Hip flexors, abs'],
  'jumping-jacks': ['', 'Calves, deltoid'],
  'arm-circles': ['', 'Deltoid'],
  'wrist-circles': ['', 'Forearm'],
  'cat-cow': ['', 'Lower back, abs'],
  'scapular-push-up': ['', 'Serratus anterior, deltoid'],
  'deep-squat-hold': ['', 'Adductors, glutes'],
  'leg-swings': ['', 'Hip flexors, hamstrings'],
  stretching: ['', 'Lats, abs'],
  'leg-stretch': ['', 'Hamstrings, lower back'],
  'shoulder-stretch': ['', 'Deltoid, triceps'],
  'hip-flexor-stretch': ['', 'Hip flexors, quadriceps'],
  'pancake-stretch': ['', 'Adductors, hamstrings'],
  'childs-pose': ['', 'Lower back, lats'],
  'dead-hang-stretch': ['', 'Lats, grip'],
};

// Muscle names (as written in the reference) → where they show on the figure.
const MUSCLE_REGIONS = [
  [/lats|latissimus|teres/i, 'upperback'],
  [/trapezius|rhomboid|infraspinatus/i, 'upperback'],
  [/pector|chest/i, 'chest'],
  [/deltoid|shoulder/i, 'delt'],
  [/biceps|brachialis\b|elbow flexors/i, 'biceps'],
  [/triceps/i, 'triceps'],
  [/forearm|grip|wrist|brachioradialis/i, 'forearm'],
  [/abdominis|\babs\b|obliques|core/i, 'abs'],
  [/hip flexors/i, 'hipflex'],
  [/lower back|quadratus|erector/i, 'lowback'],
  [/glute/i, 'glutes'],
  [/quadriceps/i, 'quads'],
  [/hamstring/i, 'hams'],
  [/calves|calf/i, 'calves'],
  [/adductor/i, 'adductors'],
];

function regionsOf(text) {
  const out = new Set();
  for (const part of String(text ?? '').split(/[,;&]| and /)) {
    for (const [re, region] of MUSCLE_REGIONS) if (re.test(part)) out.add(region);
  }
  return out;
}

// { region: 1 (main) | 2 (secondary) } for an exercise.
export function musclesOf(id) {
  const ex = EXERCISES[id];
  const [main, secondary] = ex?.main != null ? [ex.main, ex.secondary] : EXTRA_MUSCLES[id] ?? ['', ''];
  const out = {};
  for (const r of regionsOf(secondary)) out[r] = 2;
  for (const r of regionsOf(main)) out[r] = 1;
  return out;
}

// Where each region sits: segment, from–to along it (0 = hip / shoulder / knee end), and side
// (+1 front, -1 back, 0 middle).
const REGION_SHAPES = {
  chest: ['torso', 0.5, 0.92, 1],
  abs: ['torso', 0.08, 0.5, 1],
  upperback: ['torso', 0.45, 0.95, -1],
  lowback: ['torso', 0.05, 0.45, -1],
  biceps: ['upper', 0.15, 0.85, 1],
  triceps: ['upper', 0.15, 0.85, -1],
  forearm: ['fore', 0.1, 0.75, 0],
  quads: ['thigh', 0.15, 0.9, 1],
  hams: ['thigh', 0.25, 0.9, -1],
  glutes: ['thigh', 0, 0.3, -1],
  hipflex: ['thigh', 0, 0.3, 1],
  adductors: ['thigh', 0.2, 0.8, 0],
  calves: ['shin', 0.1, 0.6, -1],
};

// ---------- geometry ----------

const rad = (a) => (a * Math.PI) / 180;
const dir = (a) => [Math.cos(rad(a)), Math.sin(rad(a))];
const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

// Two-bone IK from `root` towards `target`. side +1 puts the joint on the clockwise side of the
// root → target line (elbows back), -1 the other (knees forward). Out of reach: the limb points
// straight at the target.
function limb(root, target, l1, l2, side) {
  const d = Math.max(dist(root, target), 1e-6);
  const u = [(target[0] - root[0]) / d, (target[1] - root[1]) / d];
  if (d >= l1 + l2) return { joint: add(root, u, l1), end: add(root, u, l1 + l2) };
  const dd = Math.max(d, Math.abs(l1 - l2) + 0.01);
  const x = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd);
  const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const n = [-u[1], u[0]];
  return { joint: [root[0] + u[0] * x + n[0] * h * side, root[1] + u[1] * x + n[1] * h * side], end: target };
}

export function solve(p) {
  const shoulder = add(p.hip, dir(p.t), LEN.torso);
  const elbow = p.elbow ?? 1;
  return {
    hip: p.hip,
    shoulder,
    head: add(shoulder, dir(p.t), LEN.neck),
    c: p.c ?? 0,
    arm: limb(shoulder, p.hand, LEN.upper, LEN.fore, elbow),
    arm2: limb(shoulder, p.hand2 ?? p.hand, LEN.upper, LEN.fore, elbow),
    leg: limb(p.hip, p.foot, LEN.thigh, LEN.shin, -1),
    leg2: limb(p.hip, p.foot2 ?? p.foot, LEN.thigh, LEN.shin, -1),
  };
}

// How far a hand or foot falls short of its target, for checking poses.
export function reachGaps(p) {
  const s = solve(p);
  return {
    hand: dist(s.arm.end, p.hand),
    hand2: dist(s.arm2.end, p.hand2 ?? p.hand),
    foot: dist(s.leg.end, p.foot),
    foot2: dist(s.leg2.end, p.foot2 ?? p.foot),
  };
}

const lerp = (a, b, k) => a + (b - a) * k;
const lerpPt = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const lerpAngle = (a, b, k) => a + ((((b - a) % 360) + 540) % 360 - 180) * k;

function blend(A, B, k) {
  return {
    hip: lerpPt(A.hip, B.hip, k),
    t: lerpAngle(A.t, B.t, k),
    c: lerp(A.c ?? 0, B.c ?? 0, k),
    hand: lerpPt(A.hand, B.hand, k),
    hand2: lerpPt(A.hand2 ?? A.hand, B.hand2 ?? B.hand, k),
    foot: lerpPt(A.foot, B.foot, k),
    foot2: lerpPt(A.foot2 ?? A.foot, B.foot2 ?? B.foot, k),
    elbow: k < 0.5 ? A.elbow : B.elbow,
  };
}

const ease = (k) => k * k * (3 - 2 * k);

// The pose `time` seconds into the loop: key 0 → 1 → … → last → 0, each move then wait.
export function poseAt(spec, time) {
  const { keys } = spec;
  if (keys.length === 1) return keys[0];
  const steps = keys.map((_, i) => {
    const to = keys[(i + 1) % keys.length];
    return { from: keys[i], to, move: to.move ?? spec.move ?? 0.9, wait: to.wait ?? spec.wait ?? 0.25 };
  });
  const total = steps.reduce((s, x) => s + x.move + x.wait, 0);
  let t = ((time % total) + total) % total;
  for (const s of steps) {
    if (t < s.move) return blend(s.from, s.to, ease(t / s.move));
    t -= s.move;
    if (t < s.wait) return s.to;
    t -= s.wait;
  }
  return keys[0];
}

// ---------- drawing ----------

const f1 = (n) => Math.round(n * 10) / 10;
const pt = (p) => `${f1(p[0])} ${f1(p[1])}`;

// A quadratic from p0 to p1 bulging `bulge` units towards `side` (a unit normal).
function curve(p0, p1, bulge, side) {
  const mid = lerpPt(p0, p1, 0.5);
  return { p0, p1, ctrl: add(mid, side, bulge * 2) };
}
const qAt = (q, s) => [
  (1 - s) * (1 - s) * q.p0[0] + 2 * (1 - s) * s * q.ctrl[0] + s * s * q.p1[0],
  (1 - s) * (1 - s) * q.p0[1] + 2 * (1 - s) * s * q.ctrl[1] + s * s * q.p1[1],
];
const qTangent = (q, s) => {
  const v = [
    2 * (1 - s) * (q.ctrl[0] - q.p0[0]) + 2 * s * (q.p1[0] - q.ctrl[0]),
    2 * (1 - s) * (q.ctrl[1] - q.p0[1]) + 2 * s * (q.p1[1] - q.ctrl[1]),
  ];
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};
const qPath = (q) => `M${pt(q.p0)}Q${pt(q.ctrl)} ${pt(q.p1)}`;

// A stripe along part of a curve, offset to one side. `front(tangent)` gives the front normal.
function stripe(q, s0, s1, side, width, front, cls) {
  const off = side * (width / 2 - W.stripe / 2);
  const pts = [];
  for (let i = 0; i <= 5; i++) {
    const s = lerp(s0, s1, i / 5);
    const p = qAt(q, s);
    const n = front(qTangent(q, s));
    pts.push(add(p, n, off));
  }
  return `<polyline class="${cls}" points="${pts.map(pt).join(' ')}"/>`;
}

// Front of the torso: clockwise from hip → shoulder. Front of a limb: anticlockwise from its
// root → end (so the front of the thigh and the biceps face forward when standing).
const torsoFront = (t) => [-t[1], t[0]];
const limbFront = (t) => [t[1], -t[0]];

function drawLimb(root, lb, upperName, lowerName, muscles, cls) {
  const up = curve(root, lb.joint, 0, [0, 0]);
  const low = curve(lb.joint, lb.end, 0, [0, 0]);
  let out = `<path class="${cls}" d="M${pt(root)}L${pt(lb.joint)}L${pt(lb.end)}"/>`;
  for (const [region, level] of Object.entries(muscles)) {
    const shape = REGION_SHAPES[region];
    if (!shape || (shape[0] !== upperName && shape[0] !== lowerName)) continue;
    const q = shape[0] === upperName ? up : low;
    out += stripe(q, shape[1], shape[2], shape[3], W.limb, limbFront, `m${level}`);
  }
  return out;
}

function drawProp(p) {
  const [kind, a, b, c] = p;
  switch (kind) {
    case 'bar': {
      const x0 = a - c / 2;
      const x1 = a + c / 2;
      return `<path class="prop-thin" d="M${x0} ${b}V${FLOOR}M${x1} ${b}V${FLOOR}"/><path class="prop" d="M${x0 - 2} ${b}H${x1 + 2}"/>`;
    }
    case 'lowbar':
      return `<path class="prop" d="M${a} ${b}V${FLOOR}"/><circle class="prop-fill" cx="${a}" cy="${b}" r="3.4"/>`;
    case 'dip':
      return `<path class="prop-thin" d="M${a + 3} ${b}V${FLOOR}M${c - 3} ${b}V${FLOOR}"/><path class="prop" d="M${a} ${b}H${c}"/>`;
    case 'box':
      return `<rect class="prop-box" x="${a}" y="${b}" width="${c - a}" height="${FLOOR - b}" rx="1.5"/>`;
    case 'wall':
      return `<path class="prop-wall" d="M${a} 4V${FLOOR}"/>`;
    case 'rings':
      return `<path class="prop-thin" d="M${a} 0V${b - 3}"/><circle class="prop-ring" cx="${a}" cy="${b}" r="3"/>`;
    case 'parallettes':
      return `<path class="prop-thin" d="M${a - 6} ${FLOOR}L${a - 4} ${b}M${a + 6} ${FLOOR}L${a + 4} ${b}"/><path class="prop" d="M${a - 6} ${b}H${a + 6}"/>`;
    default:
      return '';
  }
}

function drawFigure(s, muscles) {
  const differs = (a, b) => dist(a.end, b.end) > 0.5 || dist(a.joint, b.joint) > 0.5;
  let out = '';
  if (differs(s.arm2, s.arm)) out += drawLimb(s.shoulder, s.arm2, 'upper', 'fore', {}, 'far');
  if (differs(s.leg2, s.leg)) out += drawLimb(s.hip, s.leg2, 'thigh', 'shin', {}, 'far');
  out += drawLimb(s.hip, s.leg, 'thigh', 'shin', muscles, 'body');
  // Torso: bulges to the back when c > 0.
  const t = [(s.shoulder[0] - s.hip[0]) / LEN.torso, (s.shoulder[1] - s.hip[1]) / LEN.torso];
  const back = torsoFront(t).map((v) => -v);
  const torso = curve(s.hip, s.shoulder, s.c, back);
  out += `<path class="body torso" d="${qPath(torso)}"/>`;
  for (const [region, level] of Object.entries(muscles)) {
    const shape = REGION_SHAPES[region];
    if (shape?.[0] === 'torso') out += stripe(torso, shape[1], shape[2], shape[3], W.torso, torsoFront, `m${level}`);
  }
  out += `<circle class="head" cx="${f1(s.head[0])}" cy="${f1(s.head[1])}" r="${W.head}"/>`;
  out += drawLimb(s.shoulder, s.arm, 'upper', 'fore', muscles, 'body');
  if (muscles.delt) out += `<circle class="m${muscles.delt} dot" cx="${f1(s.shoulder[0])}" cy="${f1(s.shoulder[1])}" r="3.4"/>`;
  return out;
}

const specOf = (id) => FIGURES[id] ?? FIGURES.rest;

// The inside of the SVG at `time` seconds (null: the key pose, for still pictures).
export function figureFrame(id, time = null) {
  const spec = specOf(id);
  const pose = time == null ? spec.keys[spec.still ?? Math.min(1, spec.keys.length - 1)] : poseAt(spec, time);
  const muscles = musclesOf(id);
  const inner = `${(spec.props ?? []).map(drawProp).join('')}<path class="floor" d="M2 ${FLOOR}H98"/>${drawFigure(solve(pose), muscles)}`;
  if (!spec.scale) return inner;
  return `<g transform="translate(50 ${FLOOR}) scale(${spec.scale}) translate(-50 -${FLOOR})">${inner}</g>`;
}

export function figureSvg(id, cls = '') {
  return `<svg class="fig ${cls}" data-fig="${id}" viewBox="0 0 100 100" aria-hidden="true">${figureFrame(id)}</svg>`;
}

// ---------- animation ----------

let running = false;
let last = 0;
const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function loop(now) {
  const figs = [...document.querySelectorAll('svg[data-fig]')];
  if (!figs.length) { running = false; return; }
  if (now - last > 33) { // ~30 fps is plenty
    last = now;
    for (const svg of figs) if (svg.getClientRects().length) svg.innerHTML = figureFrame(svg.dataset.fig, now / 1000);
  }
  requestAnimationFrame(loop);
}

// Call after each render: animates every figure on the page until none is left.
export function animateFigures() {
  if (running || reduceMotion() || typeof requestAnimationFrame !== 'function') return;
  running = true;
  requestAnimationFrame(loop);
}
