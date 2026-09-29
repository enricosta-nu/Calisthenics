// Exercise glossary used by routines and the workout generator.
//   g:    muscle groups the exercise trains (push, pull, legs, core, handstand)
//   t:    "reps" (dynamic), "hold" (isometric), "warmup", "stretch" or "rest"
//   reps / secs: a typical amount per round, used when the generator prescribes it
//   area: for pushes, which part works most. Vertical pushes in an inverted V (pike, handstand
//         push-up) are "shoulders"; the rest load the chest more. Different areas don't clash.

const x = (name, g, t, amount, cue) => ({ name, g, t, ...amount, cue });
const reps = (n) => ({ reps: n });
const secs = (n) => ({ secs: n });

export const EXERCISES = {
  // pull
  'pull-up': x('Pull-up', ['pull'], 'reps', reps(6), 'Overhand grip, from dead hang to chin over bar.'),
  'chin-up': x('Chin-up', ['pull'], 'reps', reps(6), 'Palms facing you, chin over the bar, full extension at the bottom.'),
  'pull-up-iso': x('Pull-up hold', ['pull'], 'hold', secs(20), 'Hold with chin over the bar, shoulders down, elbows tight.'),
  'chin-up-iso': x('Chin-up hold', ['pull'], 'hold', secs(20), 'Palms facing you, hold the top position.'),
  'scapular-pull': x('Scapular pull', ['pull'], 'reps', reps(10), 'From a hang, pull shoulder blades down without bending arms.'),
  'dead-hang': x('Dead hang', ['pull'], 'hold', secs(30), 'Straight arms, relaxed but active shoulders.'),
  'one-arm-hang-rotation': x('One-arm hang rotation', ['pull', 'core'], 'reps', reps(4), 'Hang from the bar with one hand and rotate your body around the straight arm. Switch hands.'),
  'inverted-hang': x('Inverted hang', ['pull', 'core'], 'hold', secs(20), 'Hang upside down from the bar, body straight, controlled breathing.'),
  'skin-the-cat': x('Skin the cat', ['pull', 'core'], 'reps', reps(3), 'From a hang, bring legs through your arms and back, rotating around the shoulders. Use low bars to start.'),
  'australian': x('Australian row', ['pull'], 'reps', reps(10), 'Under a low bar, body straight, pull chest to the bar.'),
  'australian-iso': x('Australian row hold', ['pull'], 'hold', secs(20), 'Hold the top of the row, chest at the bar.'),

  // push
  'push-up': x('Push-up', ['push'], 'reps', reps(12), 'Rigid plank, chest to the floor, full lockout.'),
  'diamond-push-up': x('Diamond push-up', ['push'], 'reps', reps(10), 'Hands together under the chest, elbows tucked.'),
  'hindu-push-up': x('Hindu push-up', ['push'], 'reps', reps(8), 'From downward dog, swoop the chest low and forward into upward dog, then back.'),
  'pike-push-up': { ...x('Pike push-up', ['push', 'handstand'], 'reps', reps(8), 'Hips high in an inverted V, lower the head between the hands, press back up. Mostly shoulders.'), area: 'shoulders' },
  'pseudo-planche-push-up': x('Pseudo planche push-up', ['push'], 'reps', reps(6), 'Hands by the hips, lean forward over the hands, push up.'),
  'planche-lean': x('Planche lean', ['push'], 'hold', secs(20), 'Push-up position, straight arms, lean shoulders well past the hands.'),
  'dip': x('Dip', ['push'], 'reps', reps(10), 'Parallel bars, shoulders below elbows, press to lockout.'),
  'l-sit-dip': x('L-sit dip', ['push', 'core'], 'reps', reps(6), 'Dip while holding the legs in an L.'),
  'burpee': x('Burpee', ['legs', 'push'], 'reps', reps(8), 'Squat, jump feet back, chest to floor, jump feet in, jump up.'),

  // handstand
  'handstand': x('Handstand', ['handstand'], 'hold', secs(30), 'Stack wrists, shoulders and hips. Wall or freestanding.'),
  'wall-handstand': x('Wall handstand', ['handstand'], 'hold', secs(30), 'Chest facing the wall, hands close to it, body in one line.'),
  'box-pike-handstand': x('Box pike handstand', ['handstand', 'push'], 'hold', secs(30), 'Feet on a box by the wall, hips stacked over shoulders.'),
  'hspu': { ...x('Handstand push-up', ['handstand', 'push'], 'reps', reps(3), 'Against the wall, lower head to the floor and press to lockout.'), area: 'shoulders' },

  // core
  'plank': x('Plank', ['core'], 'hold', secs(30), 'On the forearms, squeeze glutes, ribs down.'),
  'side-plank': x('Side plank', ['core'], 'hold', secs(25), 'On one forearm, hips high, body in a straight line. Switch sides halfway.'),
  'hollow-hold': x('Hollow hold', ['core'], 'hold', secs(25), 'Lower back glued to the floor, arms and legs extended.'),
  'hollow-rock': x('Hollow rock', ['core'], 'reps', reps(15), 'Hollow position, rock back and forth without losing the shape.'),
  'leg-raise': x('Leg raise', ['core'], 'reps', reps(12), 'Lying down, straight legs up to vertical and lower slowly.'),
  'hanging-leg-raise': x('Hanging leg raise', ['core', 'pull'], 'reps', reps(8), 'From a hang, raise straight legs to 90° or higher. No swinging.'),
  'windshield-wiper': x('Hanging hip rotations', ['core'], 'reps', reps(6), 'Hanging with knees or legs up, rotate the hips side to side.'),
  'v-up': x('V-up', ['core'], 'reps', reps(10), 'Lying flat, lift legs and chest together, touch the toes.'),
  'mountain-climber': x('Mountain climber', ['core', 'legs'], 'reps', reps(20), 'Plank position, drive the knees to the chest quickly. Count each leg.'),
  'dragon-flag': x('Dragon flag', ['core'], 'reps', reps(4), 'Lying on a bench, body straight from the shoulders, lower slowly.'),
  'tuck-to-l-sit': x('Tuck to L-sit', ['core', 'push'], 'reps', reps(6), 'On parallettes, start tucked up pushing the bars down, then extend the legs straight out to an L-sit and back.'),
  'l-sit': x('L-sit', ['core'], 'hold', secs(15), 'Straight arms, legs straight and parallel to the floor.'),
  'side-leg-raise': x('Side leg raise', ['legs', 'core'], 'reps', reps(12), 'Lying on your side, raise the top leg with control.'),

  // legs
  'squat': x('Squat', ['legs'], 'reps', reps(20), 'Feet shoulder width, chest up, full depth.'),
  'squat-jump': x('Jump squat', ['legs'], 'reps', reps(10), 'Full squat, explode up, land soft.'),
  'lunge': x('Lunge', ['legs'], 'reps', reps(12), 'Step forward, back knee to the floor, alternate legs.'),
  'lateral-lunge': x('Lateral lunge', ['legs'], 'reps', reps(10), 'Step wide to the side, sit into that hip, other leg straight.'),
  'bulgarian-split-squat': x('Bulgarian split squat', ['legs'], 'reps', reps(8), 'Rear foot on a bench, reps per side.'),
  'pistol-squat': x('Pistol squat', ['legs'], 'reps', reps(5), 'Single leg, free leg straight in front. Alternate sides.'),
  'sissy-squat': x('Sissy squat', ['legs'], 'reps', reps(8), 'On the balls of the feet, knees forward, lean back, hips extended.'),
  'glute-bridge': x('Glute bridge', ['legs'], 'reps', reps(15), 'Lying on your back, drive the hips up, squeeze the glutes.'),
  'calf-raise': x('Calf raise', ['legs'], 'reps', reps(20), 'On a step, full range, pause at the top.'),
  'wall-sit': x('Wall sit', ['legs'], 'hold', secs(40), 'Back on the wall, thighs parallel to the floor.'),
  'horse-stance': x('Horse stance', ['legs'], 'hold', secs(30), 'Wide stance, deep squat, back upright.'),

  // warm-up
  'jumping-jacks': x('Jumping jacks', [], 'warmup', {}, 'Easy pace, get the heart rate up.'),
  'arm-circles': x('Arm circles', [], 'warmup', {}, 'Big circles forward then backward.'),
  'wrist-circles': x('Wrist warm-up', [], 'warmup', {}, 'Circles, then gentle stretches palms down and palms up.'),
  'cat-cow': x('Cat-cow', [], 'warmup', {}, 'On all fours, round then arch the spine slowly.'),
  'scapular-push-up': x('Scapular push-up', [], 'warmup', {}, 'Straight arms in a plank, move only the shoulder blades.'),
  'deep-squat-hold': x('Deep squat hold', [], 'warmup', {}, 'Sit at the bottom of a squat, heels down, chest up.'),
  'leg-swings': x('Leg swings', [], 'warmup', {}, 'Front-to-back and side-to-side, each leg.'),

  // cool-down
  'stretching': x('Stretching', [], 'stretch', {}, 'Full-body cool-down.'),
  'leg-stretch': x('Leg stretch', [], 'stretch', {}, 'Hamstrings and hips, breathe into it.'),
  'shoulder-stretch': x('Shoulder stretch', [], 'stretch', {}, 'Arm across the chest, then overhead triceps stretch. Both sides.'),
  'hip-flexor-stretch': x('Hip flexor stretch', [], 'stretch', {}, 'Half-kneeling, push the hips forward. Both sides.'),
  'pancake-stretch': x('Pancake stretch', [], 'stretch', {}, 'Seated, legs wide, fold forward with a long back.'),
  'childs-pose': x("Child's pose", [], 'stretch', {}, 'Knees wide, reach the arms long, relax the back.'),
  'dead-hang-stretch': x('Relaxed hang', [], 'stretch', {}, 'Hang loosely from the bar to decompress the spine.'),

  'rest': x('Rest', [], 'rest', {}, 'Breathe.'),
};
