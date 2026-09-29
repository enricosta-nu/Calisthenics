// Choices offered in the Suggest and Create sections.

export const BLOCK_KINDS = [
  { id: 'intervals', name: 'Intervals', blurb: 'Timed rounds, e.g. 30s on / 15s off' },
  { id: 'tabata', name: 'Tabata', blurb: '20s on / 10s off for 12 min' },
  { id: 'emom', name: 'EMOM', blurb: 'Every minute on the minute' },
  { id: 'amrap', name: 'AMRAP', blurb: 'As many rounds as possible' },
  { id: 'circuit', name: 'Circuit', blurb: 'Rounds at your own pace' },
  { id: 'holds', name: 'Skill holds', blurb: 'Handstand, L-sit, isometrics' },
];

export const FOCUS = [
  { id: 'balanced', name: 'Balanced', blurb: 'Everything equally' },
  { id: 'push', name: 'Push', blurb: 'Chest, shoulders, triceps' },
  { id: 'pull', name: 'Pull', blurb: 'Back, biceps, grip' },
  { id: 'legs', name: 'Legs', blurb: 'Quads, glutes, hamstrings' },
  { id: 'core', name: 'Core', blurb: 'Abs and body tension' },
  { id: 'handstand', name: 'Handstand', blurb: 'Balance and overhead strength' },
];

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
