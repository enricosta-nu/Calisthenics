// Skill tracks. Each track is an ordered ladder of exercises from easiest to hardest.
// type "reps": target is a rep range per set. type "hold": target is seconds per set.

export const TRACKS = [
  {
    id: 'push',
    name: 'Push',
    steps: [
      { name: 'Wall Push-up', type: 'reps', sets: 3, min: 10, max: 20, cue: 'Hands on wall at shoulder height, body straight, chest to wall.' },
      { name: 'Incline Push-up', type: 'reps', sets: 3, min: 8, max: 15, cue: 'Hands on a bench or table. Lower the surface as you get stronger.' },
      { name: 'Knee Push-up', type: 'reps', sets: 3, min: 8, max: 15, cue: 'Knees down, hips in line with shoulders. Elbows ~45° from body.' },
      { name: 'Push-up', type: 'reps', sets: 3, min: 8, max: 20, cue: 'Rigid plank, chest to the floor, full lockout at the top.' },
      { name: 'Diamond Push-up', type: 'reps', sets: 3, min: 8, max: 15, cue: 'Thumbs and index fingers touch under the chest. Elbows tucked.' },
      { name: 'Archer Push-up', type: 'reps', sets: 3, min: 5, max: 10, cue: 'Wide hands, shift onto one arm while the other stays straight. Reps per side.' },
      { name: 'Pseudo Planche Push-up', type: 'reps', sets: 3, min: 5, max: 12, cue: 'Hands by the hips, fingers back, lean forward over the hands.' },
      { name: 'One-arm Push-up', type: 'reps', sets: 3, min: 3, max: 8, cue: 'Feet wide, free hand behind back, keep hips square. Reps per side.' },
    ],
  },
  {
    id: 'pull',
    name: 'Pull',
    steps: [
      { name: 'Dead Hang', type: 'hold', sets: 3, min: 15, max: 45, cue: 'Hang from the bar with straight arms and active shoulders.' },
      { name: 'Scapular Pull', type: 'reps', sets: 3, min: 8, max: 15, cue: 'From a hang, pull the shoulder blades down without bending arms.' },
      { name: 'Australian Row', type: 'reps', sets: 3, min: 8, max: 15, cue: 'Under a low bar or table, body straight, pull chest to the bar.' },
      { name: 'Negative Pull-up', type: 'reps', sets: 3, min: 3, max: 6, cue: 'Jump to the top, lower yourself over 5 seconds.' },
      { name: 'Pull-up', type: 'reps', sets: 3, min: 5, max: 12, cue: 'Dead hang to chin over bar. No kipping.' },
      { name: 'Chest-to-bar Pull-up', type: 'reps', sets: 3, min: 5, max: 10, cue: 'Pull explosively until your chest touches the bar.' },
      { name: 'Archer Pull-up', type: 'reps', sets: 3, min: 3, max: 8, cue: 'Wide grip, pull toward one hand while the other arm straightens. Reps per side.' },
      { name: 'One-arm Negative', type: 'reps', sets: 3, min: 2, max: 5, cue: 'Start at the top, release one hand, lower as slowly as possible. Reps per side.' },
    ],
  },
  {
    id: 'legs',
    name: 'Legs',
    steps: [
      { name: 'Assisted Squat', type: 'reps', sets: 3, min: 10, max: 20, cue: 'Hold a door frame or pole for balance. Hips below knees.' },
      { name: 'Squat', type: 'reps', sets: 3, min: 15, max: 30, cue: 'Feet shoulder width, chest up, full depth.' },
      { name: 'Split Squat', type: 'reps', sets: 3, min: 8, max: 15, cue: 'Staggered stance, back knee to the floor. Reps per side.' },
      { name: 'Bulgarian Split Squat', type: 'reps', sets: 3, min: 8, max: 15, cue: 'Rear foot on a bench. Reps per side.' },
      { name: 'Assisted Pistol Squat', type: 'reps', sets: 3, min: 5, max: 10, cue: 'Single-leg squat holding a support. Reps per side.' },
      { name: 'Shrimp Squat', type: 'reps', sets: 3, min: 5, max: 10, cue: 'Hold the back foot, lower the back knee to the floor. Reps per side.' },
      { name: 'Pistol Squat', type: 'reps', sets: 3, min: 5, max: 10, cue: 'Free leg straight in front, full depth, no support. Reps per side.' },
    ],
  },
  {
    id: 'core',
    name: 'Core',
    steps: [
      { name: 'Plank', type: 'hold', sets: 3, min: 20, max: 60, cue: 'Forearms down, squeeze glutes, ribs down.' },
      { name: 'Hollow Body Hold', type: 'hold', sets: 3, min: 15, max: 45, cue: 'Lower back glued to floor, arms and legs extended.' },
      { name: 'Hanging Knee Raise', type: 'reps', sets: 3, min: 8, max: 15, cue: 'From a hang, bring knees to chest without swinging.' },
      { name: 'Hanging Leg Raise', type: 'reps', sets: 3, min: 6, max: 12, cue: 'Straight legs up to 90° or higher, controlled lowering.' },
      { name: 'L-sit', type: 'hold', sets: 3, min: 10, max: 30, cue: 'On parallettes or floor, legs straight and parallel to the ground.' },
      { name: 'Toes-to-bar', type: 'reps', sets: 3, min: 5, max: 12, cue: 'Hanging, bring toes all the way to the bar.' },
      { name: 'Dragon Flag', type: 'reps', sets: 3, min: 3, max: 8, cue: 'Lying on a bench, body straight from shoulders, lower slowly.' },
    ],
  },
  {
    id: 'dip',
    name: 'Dip',
    steps: [
      { name: 'Bench Dip', type: 'reps', sets: 3, min: 10, max: 20, cue: 'Hands on a bench behind you, elbows back, shoulders down.' },
      { name: 'Support Hold', type: 'hold', sets: 3, min: 15, max: 45, cue: 'Straight arms on parallel bars, shoulders depressed.' },
      { name: 'Negative Dip', type: 'reps', sets: 3, min: 4, max: 8, cue: 'Start at the top, lower over 5 seconds.' },
      { name: 'Parallel Bar Dip', type: 'reps', sets: 3, min: 6, max: 15, cue: 'Lower until shoulders are below elbows, press to lockout.' },
      { name: 'Straight Bar Dip', type: 'reps', sets: 3, min: 5, max: 12, cue: 'On a single bar, lean over it, elbows back.' },
      { name: 'Ring Dip', type: 'reps', sets: 3, min: 5, max: 12, cue: 'Rings turned out at the top, stay stable.' },
    ],
  },
  {
    id: 'handstand',
    name: 'Handstand',
    steps: [
      { name: 'Pike Hold', type: 'hold', sets: 3, min: 20, max: 45, cue: 'Hands down, hips high, push the floor away.' },
      { name: 'Elevated Pike Hold', type: 'hold', sets: 3, min: 20, max: 45, cue: 'Feet on a box, hips stacked over shoulders.' },
      { name: 'Back-to-wall Handstand', type: 'hold', sets: 3, min: 20, max: 60, cue: 'Kick up facing away from the wall, straight line.' },
      { name: 'Chest-to-wall Handstand', type: 'hold', sets: 3, min: 20, max: 60, cue: 'Walk up the wall, belly facing it, hands close to the wall.' },
      { name: 'Freestanding Handstand', type: 'hold', sets: 5, min: 5, max: 30, cue: 'Kick up and balance with your fingers. Total seconds per attempt.' },
      { name: 'Pike Push-up', type: 'reps', sets: 3, min: 6, max: 12, cue: 'In pike position, lower head toward floor between hands.' },
      { name: 'Wall Handstand Push-up', type: 'reps', sets: 3, min: 3, max: 10, cue: 'Chest-to-wall handstand, lower head to the floor and press.' },
    ],
  },
  {
    id: 'planche',
    name: 'Planche',
    steps: [
      { name: 'Planche Lean', type: 'hold', sets: 3, min: 15, max: 30, cue: 'Push-up position, straight arms, lean shoulders past the hands.' },
      { name: 'Frog Stand', type: 'hold', sets: 3, min: 10, max: 30, cue: 'Knees resting on the elbows, lean forward until the feet lift.' },
      { name: 'Pseudo Planche Push-up', type: 'reps', sets: 3, min: 5, max: 12, cue: 'Hands by the hips, lean forward over the hands, push up.' },
      { name: 'Tuck Planche', type: 'hold', sets: 3, min: 5, max: 15, cue: 'Straight arms, knees tucked to the chest, hips level with shoulders.' },
      { name: 'Advanced Tuck Planche', type: 'hold', sets: 3, min: 5, max: 15, cue: 'Tuck with a flat back, hips opened to 90°.' },
      { name: 'Straddle Planche', type: 'hold', sets: 3, min: 3, max: 10, cue: 'Legs straight and wide, body parallel to the floor.' },
    ],
  },
];

export const TEMPLATES = [
  { id: 'full', name: 'Full Body', tracks: ['push', 'pull', 'legs', 'core'], blurb: 'Balanced session. Great 3×/week.' },
  { id: 'upper', name: 'Upper Body', tracks: ['pull', 'push', 'dip', 'handstand'], blurb: 'Pulling, pushing and overhead strength.' },
  { id: 'lower', name: 'Legs & Core', tracks: ['legs', 'core'], blurb: 'Short session for legs and trunk.' },
  { id: 'skill', name: 'Skill Day', tracks: ['handstand', 'planche', 'core'], blurb: 'Balance, planche and body tension practice.' },
];

export const trackById = Object.fromEntries(TRACKS.map((t) => [t.id, t]));
