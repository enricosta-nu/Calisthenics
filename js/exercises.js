// Exercise glossary used by routines and the workout generator.
//   g:    muscle groups the exercise trains (push, pull, legs, core, handstand)
//   t:    "reps" (dynamic), "hold" (isometric), "warmup", "stretch" or "rest"
//   reps / secs: a typical amount per round, used when the generator prescribes it
//   area: for pushes, which part works most. Pushes with the shoulders over or in front of the
//         hands (pike, handstand push-up, planche) are "shoulders"; the rest load the chest more.
//         Different areas don't clash.
//
// Exercises approved in docs/exercises/ also carry (see REFERENCE below):
//   mg:    main muscle group: back, chest, shoulders, arms, core, legs
//   level: 1 beginner, 2 intermediate, 3 advanced (anything at the high bar is at least 2)
//   needs: equipment alternatives, any one is enough; [] means floor / wall / chair only
//   band:  a resistance band can assist beginners
//   main / secondary: muscles worked, for display
// Only exercises with a REFERENCE entry are picked by the workout generator.

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
  'negative-pull-up': x('Negative pull-up', ['pull'], 'reps', reps(3), 'Start at the top (jump or step up), lower yourself over 3–5 seconds to a dead hang.'),
  'archer-pull-up': x('Archer pull-up', ['pull'], 'reps', reps(3), 'Wide grip, pull towards one hand while the other arm straightens. Reps per side.'),
  'underhand-row': x('Underhand Australian row', ['pull'], 'reps', reps(10), 'Under a low bar, palms facing you, body straight, pull the chest to the bar.'),
  'biceps-curl': x('Bodyweight biceps curl', ['pull'], 'reps', reps(10), 'Under a low bar, underhand grip, body straight; bend only the elbows to bring the forehead to the bar.'),
  'australian-iso': x('Australian row hold', ['pull'], 'hold', secs(20), 'Hold the top of the row, chest at the bar.'),

  // push
  'push-up': x('Push-up', ['push'], 'reps', reps(12), 'Rigid plank, chest to the floor, full lockout.'),
  'diamond-push-up': x('Diamond push-up', ['push'], 'reps', reps(10), 'Hands together under the chest, elbows tucked.'),
  'incline-push-up': x('Incline push-up', ['push'], 'reps', reps(12), 'Hands on a bench, box or parallettes, body straight. Lower the hands to make it harder.'),
  'wide-push-up': x('Wide push-up', ['push'], 'reps', reps(10), 'Hands wider than the shoulders, chest to the floor.'),
  'decline-push-up': x('Decline push-up', ['push'], 'reps', reps(10), 'Feet on a box or bench, hands on the floor, body straight.'),
  'push-up-hold': x('Push-up bottom hold', ['push'], 'hold', secs(20), 'Hold the push-up 2 cm above the floor, body rigid, elbows at 45°.'),
  'archer-push-up': x('Archer push-up', ['push'], 'reps', reps(5), 'Wide hands, shift onto one arm while the other stays straight. Reps per side.'),
  'clap-push-up': x('Clap push-up', ['push'], 'reps', reps(6), 'Push explosively, clap, land with soft elbows straight into the next rep.'),
  'ring-push-up': x('Ring push-up', ['push'], 'reps', reps(10), 'Rings low to the floor, turn the hands out at the top, keep the rings close to the body.'),
  'ring-dip': x('Ring dip', ['push'], 'reps', reps(6), 'Rings close to the body, lower until shoulders are below elbows, turn out at the top.'),
  'triceps-dip': x('Dip, upright torso', ['push'], 'reps', reps(10), 'On a dip station or parallettes, torso upright, elbows tucked back: triceps focus.'),
  'bench-dip': x('Bench dip', ['push'], 'reps', reps(12), 'Hands on a bench or chair behind you, elbows back, shoulders down.'),
  'triceps-extension': x('Bodyweight triceps extension', ['push'], 'reps', reps(8), 'Hands on a bar or bench, body straight; bend only the elbows to bring the head under the hands, then press back. Go slow.'),
  'hindu-push-up': x('Hindu push-up', ['push'], 'reps', reps(8), 'From downward dog, swoop the chest low and forward into upward dog, then back.'),
  'pike-push-up': { ...x('Pike push-up', ['push', 'handstand'], 'reps', reps(8), 'Hips high in an inverted V, lower the head between the hands, press back up. Mostly shoulders.'), area: 'shoulders' },
  'pseudo-planche-push-up': { ...x('Pseudo planche push-up', ['push'], 'reps', reps(6), 'Hands by the hips, lean forward over the hands, push up.'), area: 'shoulders' },
  'planche-lean': { ...x('Planche lean', ['push'], 'hold', secs(20), 'Push-up position, straight arms, lean shoulders well past the hands.'), area: 'shoulders' },
  'tuck-planche': { ...x('Tuck planche', ['push'], 'hold', secs(10), 'Straight arms, knees tucked to the chest, hips level with the shoulders.'), area: 'shoulders' },
  'elevated-pike-push-up': { ...x('Elevated pike push-up', ['push', 'handstand'], 'reps', reps(6), 'Feet on a box, hips over the shoulders, lower the head between the hands.'), area: 'shoulders' },
  'dip': x('Dip', ['push'], 'reps', reps(10), 'Parallel bars, shoulders below elbows, press to lockout.'),
  'l-sit-dip': x('L-sit dip', ['push', 'core'], 'reps', reps(6), 'Dip while holding the legs in an L.'),
  'burpee': x('Burpee', ['legs', 'push'], 'reps', reps(8), 'Squat, jump feet back, chest to floor, jump feet in, jump up.'),

  // handstand
  'handstand': x('Handstand', ['handstand'], 'hold', secs(30), 'Stack wrists, shoulders and hips. Wall or freestanding.'),
  'wall-handstand': x('Wall handstand', ['handstand'], 'hold', secs(30), 'Chest facing the wall, hands close to it, body in one line.'),
  'box-pike-handstand': x('Box pike handstand', ['handstand', 'push'], 'hold', secs(30), 'Feet on a box by the wall, hips stacked over shoulders.'),
  'frog-stand': x('Frog stand', ['handstand'], 'hold', secs(20), 'Knees on the elbows, lean forward until the feet lift. Look slightly ahead.'),
  'wall-walk': { ...x('Wall walk', ['handstand', 'push'], 'reps', reps(3), 'From lying face down with feet at the wall, walk the feet up and the hands in to a handstand, then back down.'), area: 'shoulders' },
  'hspu': { ...x('Handstand push-up', ['handstand', 'push'], 'reps', reps(3), 'Against the wall, lower head to the floor and press to lockout.'), area: 'shoulders' },

  // core
  'plank': x('Plank', ['core'], 'hold', secs(30), 'On the forearms, squeeze glutes, ribs down.'),
  'side-plank': x('Side plank', ['core'], 'hold', secs(25), 'On one forearm, hips high, body in a straight line. Switch sides halfway.'),
  'hollow-hold': x('Hollow hold', ['core'], 'hold', secs(25), 'Lower back glued to the floor, arms and legs extended.'),
  'hollow-rock': x('Hollow rock', ['core'], 'reps', reps(15), 'Hollow position, rock back and forth without losing the shape.'),
  'leg-raise': x('Leg raise', ['core'], 'reps', reps(12), 'Lying down, straight legs up to vertical and lower slowly.'),
  'hanging-leg-raise': x('Hanging leg raise', ['core', 'pull'], 'reps', reps(8), 'From a hang, raise straight legs to 90° or higher. No swinging.'),
  'toes-to-bar': x('Toes-to-bar', ['core', 'pull'], 'reps', reps(6), 'From a hang, lift the toes all the way to the bar with straight legs, no swing.'),
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
  'single-leg-bridge': x('Single-leg glute bridge', ['legs'], 'reps', reps(10), 'One foot on the floor, the other leg up; drive the hips up, keep them level. Reps per side.'),
  'single-leg-rdl': x('Single-leg Romanian deadlift', ['legs'], 'reps', reps(8), 'Stand on one leg, hinge at the hip with a flat back, free leg back, then stand up. Reps per side.'),
  'nordic-curl': x('Nordic hamstring curl', ['legs'], 'reps', reps(3), 'Kneel with heels hooked, body straight from knees to head, lower as slowly as possible; catch yourself with the hands.'),
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

// Approved reference (docs/exercises/). [mg, level, needs, band, main, secondary]
const R = (mg, level, needs, band, main, secondary) => ({ mg, level, needs, band, main, secondary });
const BAR = ['bar'];
const LOW = ['lowbar', 'rings'];
const DIP = ['dip'];
const DIP_OR_P = ['dip', 'parallettes'];
const NONE = [];

export const REFERENCE = {
  // 1 · back
  'pull-up': R('back', 2, BAR, true, 'Lats', 'Biceps, brachialis, lower & middle trapezius, rhomboids, rear deltoid'),
  'chin-up': R('back', 2, BAR, true, 'Lats, biceps', 'Pectoralis major, brachialis, lower trapezius'),
  'pull-up-iso': R('back', 2, BAR, false, 'Elbow flexors, lats', 'Grip, lower trapezius, core'),
  'chin-up-iso': R('back', 2, BAR, false, 'Elbow flexors, lats', 'Grip, lower trapezius, core'),
  'scapular-pull': R('back', 2, BAR, false, 'Lower trapezius, lats', 'Rhomboids, serratus anterior, teres major, grip'),
  'negative-pull-up': R('back', 2, BAR, false, 'Lats, biceps', 'Rear deltoid, trapezius, forearms, abs'),
  'archer-pull-up': R('back', 3, BAR, false, 'Lats and biceps of the pulling arm', 'Trapezius, rhomboids, grip, obliques'),
  'dead-hang': R('back', 2, BAR, false, 'Grip / forearm flexors', 'Lats (stretched), shoulder stabilisers, trapezius'),
  'australian': R('back', 1, LOW, true, 'Lats, middle trapezius, rhomboids, rear deltoid', 'Biceps, brachialis, grip, core'),
  // 2 · chest
  'incline-push-up': R('chest', 1, NONE, false, 'Pectoralis major, triceps', 'Front deltoid, serratus anterior, abs'),
  'push-up': R('chest', 1, NONE, false, 'Pectoralis major, triceps', 'Front deltoid, serratus anterior, abs'),
  'wide-push-up': R('chest', 2, NONE, false, 'Pectoralis major', 'Front deltoid, triceps'),
  'decline-push-up': R('chest', 2, NONE, false, 'Pectoralis major (upper), front deltoid', 'Triceps, serratus anterior, abs'),
  'push-up-hold': R('chest', 2, NONE, false, 'Pectoralis major, triceps', 'Front deltoid, abs'),
  'dip': R('chest', 2, DIP, true, 'Pectoralis major, triceps', 'Front deltoid, lats, trapezius, serratus anterior'),
  'archer-push-up': R('chest', 3, NONE, false, 'Pectoralis major and triceps of the working arm', 'Front deltoid, serratus anterior, abs, obliques'),
  'hindu-push-up': R('chest', 2, NONE, false, 'Pectoralis major, front deltoid, triceps', 'Abs, lower back, lats'),
  'clap-push-up': R('chest', 3, NONE, false, 'Pectoralis major, triceps, front deltoid', 'Abs, obliques'),
  'ring-push-up': R('chest', 2, ['rings'], false, 'Pectoralis major, triceps', 'Trapezius, rear deltoid, abs'),
  'ring-dip': R('chest', 3, ['rings'], false, 'Pectoralis major, triceps, front deltoid', 'Lats, serratus anterior, trapezius, biceps'),
  // 3 · shoulders
  'pike-push-up': R('shoulders', 2, NONE, false, 'Front deltoid, triceps', 'Upper chest, trapezius, serratus anterior, core'),
  'elevated-pike-push-up': R('shoulders', 2, NONE, false, 'Front deltoid, triceps', 'Upper chest, trapezius, serratus anterior'),
  'box-pike-handstand': R('shoulders', 2, NONE, false, 'Front deltoid, trapezius, serratus anterior', 'Triceps, wrist flexors, core'),
  'wall-handstand': R('shoulders', 2, NONE, false, 'Front deltoid, trapezius, serratus anterior', 'Triceps, wrist flexors, core'),
  'hspu': R('shoulders', 3, NONE, false, 'Front deltoid, triceps', 'Trapezius, serratus anterior, upper chest'),
  'handstand': R('shoulders', 3, NONE, false, 'Front deltoid, trapezius, serratus anterior, wrist flexors', 'Lats, pectoralis major, biceps, core'),
  'planche-lean': R('shoulders', 2, NONE, false, 'Front deltoid, serratus anterior', 'Biceps, pectoralis major, wrist flexors, core'),
  'pseudo-planche-push-up': R('shoulders', 2, NONE, false, 'Front deltoid, pectoralis major, triceps', 'Serratus anterior, biceps, wrist flexors'),
  'frog-stand': R('shoulders', 1, NONE, false, 'Front deltoid, wrist flexors', 'Serratus anterior, triceps, abs'),
  'wall-walk': R('shoulders', 2, NONE, false, 'Front deltoid, triceps', 'Serratus anterior, abs, trapezius'),
  'tuck-planche': R('shoulders', 3, NONE, false, 'Front deltoid', 'Pectoralis major, triceps, serratus anterior, abs, wrist flexors'),
  // 4 · arms
  'triceps-dip': R('arms', 2, DIP_OR_P, true, 'Triceps', 'Pectoralis major, front deltoid'),
  'bench-dip': R('arms', 1, NONE, false, 'Triceps', 'Front deltoid, pectoralis major'),
  'diamond-push-up': R('arms', 2, NONE, false, 'Triceps, pectoralis major', 'Front deltoid, core'),
  'triceps-extension': R('arms', 2, NONE, false, 'Triceps', 'Core'),
  'l-sit-dip': R('arms', 3, DIP_OR_P, false, 'Triceps, pectoralis major', 'Hip flexors, abs, front deltoid'),
  'underhand-row': R('arms', 1, LOW, true, 'Biceps, lats', 'Rear deltoid, middle trapezius, brachialis'),
  'biceps-curl': R('arms', 2, LOW, false, 'Biceps, brachialis, brachioradialis', 'Core, glutes'),
  // 5 · core
  'plank': R('core', 1, NONE, false, 'Rectus abdominis, transversus abdominis', 'Obliques, glutes, front deltoid'),
  'side-plank': R('core', 1, NONE, false, 'Obliques', 'Gluteus medius, quadratus lumborum'),
  'hollow-hold': R('core', 1, NONE, false, 'Rectus abdominis, transversus abdominis', 'Obliques, hip flexors'),
  'leg-raise': R('core', 1, NONE, false, 'Hip flexors', 'Rectus abdominis'),
  'hanging-leg-raise': R('core', 2, BAR, false, 'Rectus abdominis, obliques, hip flexors', 'Lats, grip'),
  'l-sit': R('core', 2, NONE, false, 'Hip flexors, rectus abdominis', 'Triceps, front deltoid, lats, quadriceps'),
  'dragon-flag': R('core', 3, NONE, false, 'Rectus abdominis, obliques, transversus abdominis', 'Hip flexors, shoulders, triceps, lats'),
  'hollow-rock': R('core', 1, NONE, false, 'Rectus abdominis, transversus abdominis', 'Obliques, hip flexors'),
  'mountain-climber': R('core', 1, NONE, false, 'Rectus abdominis, hip flexors', 'Obliques, front deltoid, triceps, quadriceps'),
  'v-up': R('core', 2, NONE, false, 'Rectus abdominis, hip flexors', 'Obliques'),
  'tuck-to-l-sit': R('core', 2, ['parallettes', 'dip'], false, 'Hip flexors, rectus abdominis', 'Triceps, front deltoid, lats'),
  'toes-to-bar': R('core', 3, BAR, false, 'Rectus abdominis, hip flexors', 'Lats, grip, obliques'),
  'windshield-wiper': R('core', 3, BAR, false, 'Obliques, lower rectus abdominis', 'Hip flexors, lats, serratus anterior, grip'),
  // 6 · legs
  'squat': R('legs', 1, NONE, false, 'Quadriceps, gluteus maximus', 'Hamstrings, adductors, calves, core'),
  'wall-sit': R('legs', 1, NONE, false, 'Quadriceps', 'Gluteus maximus'),
  'squat-jump': R('legs', 2, NONE, false, 'Quadriceps, gluteus maximus', 'Calves, hamstrings'),
  'bulgarian-split-squat': R('legs', 2, NONE, false, 'Quadriceps, gluteus maximus', 'Gluteus medius, hamstrings'),
  'pistol-squat': R('legs', 3, NONE, false, 'Quadriceps, gluteus maximus, gluteus medius', 'Hamstrings, calves, core'),
  'glute-bridge': R('legs', 1, NONE, false, 'Gluteus maximus', 'Hamstrings, core'),
  'lateral-lunge': R('legs', 1, NONE, false, 'Gluteus maximus, adductors, quadriceps', 'Gluteus medius, hamstrings'),
  'single-leg-bridge': R('legs', 2, NONE, false, 'Gluteus maximus, gluteus medius', 'Hamstrings, core'),
  'single-leg-rdl': R('legs', 2, NONE, false, 'Hamstrings, gluteus maximus', 'Gluteus medius, lower back, adductors'),
  'nordic-curl': R('legs', 3, NONE, false, 'Hamstrings', 'Gluteus maximus, calves'),
};

for (const [id, ref] of Object.entries(REFERENCE)) {
  if (!EXERCISES[id]) throw new Error(`REFERENCE entry without an exercise: ${id}`);
  Object.assign(EXERCISES[id], ref);
}
