// Choices offered in the Suggest and Create sections.

export const BLOCK_KINDS = [
  { id: 'intervals', name: 'Intervals', blurb: 'Timed rounds, e.g. 30s on / 15s off' },
  { id: 'tabata', name: 'Tabata', blurb: '20s on / 10s off for 12 min' },
  { id: 'emom', name: 'EMOM', blurb: 'Every minute on the minute' },
  { id: 'amrap', name: 'AMRAP', blurb: 'As many rounds as possible' },
  { id: 'circuit', name: 'Circuit', blurb: 'Rounds at your own pace' },
  { id: 'holds', name: 'Skill holds', blurb: 'Handstand, L-sit, isometrics' },
];

// The muscle groups of the approved exercise reference (docs/exercises/).
export const FOCUS = [
  { id: 'balanced', name: 'Balanced', blurb: 'Everything equally' },
  { id: 'back', name: 'Back', blurb: 'Lats, trapezius, rhomboids' },
  { id: 'chest', name: 'Chest', blurb: 'Pectorals and triceps' },
  { id: 'shoulders', name: 'Shoulders', blurb: 'Deltoids, handstand and planche work' },
  { id: 'arms', name: 'Arms', blurb: 'Triceps and biceps' },
  { id: 'core', name: 'Core', blurb: 'Abs, obliques and hip flexors' },
  { id: 'legs', name: 'Legs', blurb: 'Quads, glutes and hamstrings' },
];

export const LEVELS = [
  { id: 1, name: 'Beginner', blurb: 'Building the basics: push-ups, rows, squats' },
  { id: 2, name: 'Intermediate', blurb: 'Pull-ups, dips, pike push-ups' },
  { id: 3, name: 'Advanced', blurb: 'Archer moves, handstand push-ups, planche, Nordic curls' },
];

// Floor, wall and a chair or box are assumed; these are the extras.
export const EQUIPMENT = [
  { id: 'bar', name: 'Pull-up bar' },
  { id: 'lowbar', name: 'Low bar or table' },
  { id: 'dip', name: 'Dip station' },
  { id: 'parallettes', name: 'Parallettes' },
  { id: 'rings', name: 'Rings' },
  { id: 'band', name: 'Resistance band' },
];

export const DEFAULT_PROFILE = { level: 2, equipment: ['bar', 'lowbar', 'dip', 'parallettes'] };

export const SUGGEST_MINUTES = [45, 60, 90];
export const CREATE_MINUTES = [30, 45, 60, 75, 90];
export const BLOCK_COUNT = { min: 1, max: 8 };

export const DEFAULT_BUILDER = {
  minutes: 60,
  blocks: 4,
  kinds: ['intervals', 'holds', 'tabata', 'amrap'],
  focus: 'balanced',
  warmup: true,
};
