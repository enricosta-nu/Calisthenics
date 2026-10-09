// Choices offered in the Suggest and Create sections.

// The modules a training is built from (docs/training-schemes.md), grouped by the part of the
// skeleton they belong to:  warm-up → opener → skill section → finisher → stretching.
export const PARTS = [
  { id: 'opener', name: 'Opener', blurb: 'Pull + push to start' },
  { id: 'skill', name: 'Skill section', blurb: 'Shoulders, core and handstand' },
  { id: 'finisher', name: 'Finisher', blurb: 'Everything, high intensity' },
];

export const MODULES = [
  { id: 'opener-strength', part: 'opener', name: 'Strength intervals', blurb: 'Pull + push back to back, 15–20s, ×4' },
  { id: 'opener-emom', part: 'opener', name: 'EMOM', blurb: 'Pull + push reps every minute' },
  { id: 'opener-circuit', part: 'opener', name: 'Circuit', blurb: 'Pull, push and core reps, 4 rounds' },
  { id: 'skill-intervals', part: 'skill', name: 'Skill intervals', blurb: 'Shoulders + core, 20–30s, ×4' },
  { id: 'skill-holds', part: 'skill', name: 'Skill holds', blurb: 'Handstand and other holds, 4 × 20–30s' },
  { id: 'tabata', part: 'finisher', name: 'Tabata', blurb: '20s on / 10s off for 12 min' },
  { id: 'amrap', part: 'finisher', name: 'AMRAP', blurb: 'As many rounds as possible, 10–15 min' },
  { id: 'circuit', part: 'finisher', name: 'Circuit', blurb: 'Rounds at your own pace' },
];

export const moduleById = Object.fromEntries(MODULES.map((m) => [m.id, m]));

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

// 90 minutes is too much at this intensity.
export const SUGGEST_MINUTES = [45, 60, 75];
export const CREATE_MINUTES = [30, 45, 60, 75];
export const SKILL_BLOCKS = { min: 0, max: 3 };
export const MAX_FINISHERS = 2;

export const DEFAULT_BUILDER = {
  minutes: 60,
  opener: 'opener-strength',
  skillBlocks: 2,
  skillKinds: ['skill-intervals', 'skill-holds'],
  finishers: ['amrap'],
  focus: 'balanced',
  warmup: true,
};
