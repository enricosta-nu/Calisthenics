// The full explanation behind each exercise's pictogram: how to do it, how not to get hurt, and
// how to get the most out of it. General coaching guidance from the sources in docs/exercises/
// and common calisthenics practice; it is not medical advice.
//   how:  the movement, step by step
//   safe: the most important points to avoid injury
//   most: how to make it work better

const c = (how, safe, most) => ({ how, safe, most });

export const COACHING = {
  // ---------- back ----------
  'pull-up': c(
    ['Hang from the bar, hands a bit wider than the shoulders, palms facing away.', 'Pull the shoulder blades down and back, then pull until the chin is over the bar.', 'Lower under control all the way to straight arms.'],
    ['Don\'t drop into the bottom: a loose, jerky hang strains the shoulders and elbows.', 'Keep the shoulders away from the ears for the whole rep.', 'No kipping or swinging until strict reps are solid.'],
    ['Full range: straight arms at the bottom, chin over the bar at the top.', 'Lower in 2–3 seconds: the way down builds as much strength as the way up.', 'Squeeze the glutes and keep the legs together, so the body doesn\'t swing.'],
  ),
  'chin-up': c(
    ['Hang with the palms facing you, hands shoulder-width apart.', 'Pull the chest towards the bar until the chin is over it.', 'Lower slowly to straight arms.'],
    ['Warm up the elbows and wrists first: the underhand grip loads the biceps tendon.', 'Don\'t hyperextend the elbows at the bottom; keep them just straight.', 'Stop if you feel a sharp pain on the inside of the elbow.'],
    ['Think "elbows to the back pockets" to use the lats, not just the arms.', 'Pause one second with the chin over the bar.', 'Keep the ribs down: no arching to reach the bar.'],
  ),
  'pull-up-iso': c(
    ['Jump or pull to the top: chin over the bar.', 'Hold there, shoulders down, elbows tight to the body.', 'Lower slowly when the time is up.'],
    ['Breathe: don\'t hold your breath for the whole hold.', 'Step down or lower slowly, never drop from the top.', 'Keep the neck long; don\'t crane the chin forward.'],
    ['Squeeze the bar hard: a strong grip makes the hold easier.', 'Pull the chest to the bar rather than just hanging the chin over it.', 'When it gets easy, try holds at 90° and at the bottom too.'],
  ),
  'chin-up-iso': c(
    ['Palms facing you, get to the top with the chin over the bar.', 'Hold, chest close to the bar, elbows in.', 'Lower slowly at the end.'],
    ['Warm up the elbows first.', 'Don\'t let the shoulders shrug up to the ears.', 'Lower under control, don\'t drop.'],
    ['Keep the body still and the legs together.', 'Squeeze the biceps and the back together.', 'Add time a few seconds at a time.'],
  ),
  'scapular-pull': c(
    ['Hang with straight arms.', 'Without bending the elbows, pull the shoulder blades down: the body rises a few centimetres.', 'Relax back to the hang under control.'],
    ['Keep the arms straight: the movement is only in the shoulder blades.', 'Move slowly; no bouncing at the bottom.', 'Stop if you feel pinching at the front of the shoulder.'],
    ['Pause one second at the top of each rep.', 'This is the first part of every pull-up: practise it to make pull-ups stronger and safer.', 'Think "shoulders away from the ears".'],
  ),
  'dead-hang': c(
    ['Grab the bar, shoulder-width.', 'Hang with straight arms and the feet off the floor.', 'Breathe calmly and hold.'],
    ['Keep the shoulders slightly active, not fully slumped, if your shoulders are sensitive.', 'Get down by stepping, not by dropping.', 'Chalk or dry hands help prevent slipping.'],
    ['Use it to build grip: hold longer each week.', 'Relax the lower body and let the spine lengthen.', 'Progress to hanging from one arm with the other as support.'],
  ),
  'negative-pull-up': c(
    ['Jump or step up to the top: chin over the bar.', 'Lower yourself as slowly as you can, 3–5 seconds.', 'Reach straight arms, step down, repeat.'],
    ['Control the whole way down; don\'t let the last part become a drop.', 'Keep the shoulders down even at the bottom.', 'They are tiring: few reps, good quality.'],
    ['Count the seconds out loud to keep the pace slow.', 'Slow down most where you are weakest.', 'Great for building the first pull-up.'],
  ),
  'archer-pull-up': c(
    ['Hang with a wide grip.', 'Pull towards one hand while the other arm straightens along the bar.', 'Lower, then pull to the other side.'],
    ['Only when you can do 10+ strict pull-ups.', 'Keep the straight arm slightly soft, not locked hard.', 'Stop if the elbow of the straight arm hurts.'],
    ['Lower slowly on the working side.', 'Keep the hips square; don\'t twist.', 'It\'s the step towards the one-arm pull-up.'],
  ),
  australian: c(
    ['Lie under a low bar, hands a bit wider than the shoulders.', 'Body straight from heels to head, heels on the floor.', 'Pull the chest to the bar, then lower to straight arms.'],
    ['Keep the hips up: no sagging.', 'Don\'t poke the chin to reach the bar; bring the chest.', 'Check that the bar or rings are secure before you hang on them.'],
    ['Squeeze the shoulder blades together at the top.', 'The lower the body (more horizontal), the harder: bend the knees to make it easier.', 'Pause at the top for one second.'],
  ),
  'underhand-row': c(
    ['Lie under a low bar, palms facing you.', 'Body straight, heels on the floor.', 'Pull the chest to the bar, elbows close to the body.'],
    ['Warm up the elbows; the underhand grip loads the biceps.', 'Keep the hips up and the neck neutral.', 'Lower all the way, under control.'],
    ['Pause at the top and squeeze the biceps.', 'Walk the feet forward to make it easier, back to make it harder.', 'Keep the elbows tight to work the biceps more.'],
  ),
  'biceps-curl': c(
    ['Under a low bar, underhand grip, body straight.', 'Bend only the elbows, bringing the forehead towards the bar.', 'Straighten the arms slowly.'],
    ['Start with the body quite upright: this one is harder than it looks.', 'Keep the shoulders still; only the elbows move.', 'Stop if the elbow joint hurts (not the muscle).'],
    ['Go slow on the way back.', 'Keep the glutes tight so the body stays straight.', 'Lower the bar or walk the feet forward to make it harder.'],
  ),
  'australian-iso': c(
    ['Set up for an Australian row.', 'Pull up until the chest is at the bar.', 'Hold there with the body straight.'],
    ['Keep breathing.', 'Hips up, no sagging.', 'Lower slowly at the end.'],
    ['Squeeze the shoulder blades together the whole time.', 'Pull the bar towards you as if you wanted to bend it.', 'Lower the body angle to make it harder.'],
  ),
  'one-arm-hang-rotation': c(
    ['Hang from the bar with both hands, then let go with one.', 'Turn the body slowly around the hanging arm.', 'Hold the bar again, switch hands.'],
    ['Only once a two-arm dead hang of 30 seconds is easy.', 'Keep the hanging shoulder active: don\'t hang slumped.', 'Turn slowly, never swing.'],
    ['Use it to build grip and shoulder control.', 'Keep the body long and the legs together.', 'Keep the free hand near the bar in case you need it.'],
  ),
  'inverted-hang': c(
    ['Hang from the bar, tuck the knees and roll back until the hips are over the head.', 'Straighten the body upside down, arms straight.', 'Come back down the same way.'],
    ['Learn it on a low bar or rings first.', 'Don\'t let go: the head is near the floor.', 'Come down slowly; dizziness is normal at first, so stop if it gets strong.'],
    ['Keep the body straight and the toes pointed.', 'Breathe slowly while upside down.', 'Hold a little longer each session.'],
  ),
  'skin-the-cat': c(
    ['From a hang, tuck the knees and bring the legs through your arms.', 'Keep rotating until the feet point down behind you.', 'Come back the same way.'],
    ['Go only as far as your shoulders allow: never force the stretch.', 'Use a low bar or rings, so the feet can touch the floor.', 'Move slowly, without swinging.'],
    ['Good shoulder mobility work.', 'Keep the arms straight the whole time.', 'Pause in the stretched position for a breath.'],
  ),

  // ---------- chest ----------
  'push-up': c(
    ['Hands under the shoulders, body straight from heels to head.', 'Lower until the chest nearly touches the floor, elbows about 45° from the body.', 'Push back up to straight arms.'],
    ['Don\'t let the hips sag or stick up: squeeze the glutes and the belly.', 'Don\'t flare the elbows out to the sides.', 'If the wrists hurt, use fists, push-up handles or parallettes.'],
    ['Full range every rep: chest down, arms straight at the top.', 'Push the floor away at the top to work the serratus.', 'Lower in 2 seconds for more control.'],
  ),
  'incline-push-up': c(
    ['Hands on a bench, box or parallettes, a bit wider than the shoulders.', 'Body straight, lower the chest to the edge.', 'Push back to straight arms.'],
    ['Make sure the support doesn\'t slide.', 'Keep the body straight; no sagging hips.', 'Elbows at 45°, not flared.'],
    ['Lower the support as you get stronger, until you can do it on the floor.', 'Touch the chest to the edge every rep.', 'Slow on the way down.'],
  ),
  'wide-push-up': c(
    ['Hands wider than the shoulders.', 'Body straight, lower the chest to the floor.', 'Push back up.'],
    ['Don\'t go too wide: shoulders hurt if the hands are far out.', 'Keep the elbows bent towards the feet, not straight out.', 'Stop before the shoulders feel pinched at the bottom.'],
    ['Squeeze the chest as you push up.', 'Hands slightly turned out are more comfortable.', 'Pause at the bottom for one second.'],
  ),
  'decline-push-up': c(
    ['Feet on a box or bench, hands on the floor.', 'Body straight, lower the head and chest towards the floor.', 'Push back up.'],
    ['Start with a low box.', 'Keep the hips in line, not piked or sagging.', 'Lower under control: there is more weight on the arms.'],
    ['The higher the feet, the more the upper chest and shoulders work.', 'Keep the neck neutral; look slightly ahead of the hands.', 'Full range every rep.'],
  ),
  'push-up-hold': c(
    ['Get into the bottom of a push-up, chest 2 cm above the floor.', 'Elbows at 45°, body rigid.', 'Hold.'],
    ['Breathe.', 'If the shoulders hurt, hold a bit higher.', 'Don\'t let the hips drop.'],
    ['Squeeze everything: glutes, belly, legs.', 'Great for building strength at the weakest point.', 'Hold a few seconds longer every week.'],
  ),
  dip: c(
    ['Support yourself on parallel bars, arms straight.', 'Lean slightly forward and lower until the shoulders are just below the elbows.', 'Press back up to straight arms.'],
    ['Don\'t go too deep at first: it strains the front of the shoulders.', 'Keep the shoulders down, away from the ears.', 'Never bounce at the bottom.'],
    ['Lean forward for more chest, stay upright for more triceps.', 'Lock out at the top every rep.', 'A band under the knees helps beginners.'],
  ),
  'archer-push-up': c(
    ['Hands very wide.', 'Shift the body over one hand and lower, while the other arm stays straight.', 'Push back up, then the other side.'],
    ['Only when 20 good push-ups are easy.', 'Keep the straight arm soft, not locked hard.', 'Keep the hips level.'],
    ['Slow on the way down.', 'It\'s the step towards one-arm push-ups.', 'Put more weight on the working arm as you get stronger.'],
  ),
  'hindu-push-up': c(
    ['Start in downward dog: hips high, arms and legs straight.', 'Swoop the chest down and forward close to the floor, into upward dog.', 'Push the hips back to the start.'],
    ['Move smoothly, never force the back bend.', 'Keep the shoulders away from the ears in upward dog.', 'Skip it if your lower back hurts when arching.'],
    ['Breathe out as you swoop through.', 'Great for chest, shoulders and spine mobility together.', 'Make the movement as long and flowing as you can.'],
  ),
  'clap-push-up': c(
    ['Lower into a push-up.', 'Push explosively so the hands leave the floor; clap.', 'Land with soft elbows and go straight into the next rep.'],
    ['Only with a solid, fast push-up first.', 'Land with bent elbows, never straight.', 'Do them fresh, not at the end of a hard session.'],
    ['Quality over quantity: stop when they get slow.', 'Start without the clap: just let the hands leave the floor.', 'Keep the body rigid as it flies.'],
  ),
  'ring-push-up': c(
    ['Rings low to the floor, body straight.', 'Lower the chest between the rings, keeping them close to the body.', 'Push up and turn the hands out at the top.'],
    ['Start with the rings higher (an incline) if they wobble.', 'Don\'t let the rings drift out wide.', 'Keep the body straight.'],
    ['The turn-out at the top works the shoulder stabilisers.', 'Lower the rings to make it harder.', 'Move slowly: control is the point.'],
  ),
  'ring-dip': c(
    ['Support yourself on the rings, arms straight, rings close to the body.', 'Lower until the shoulders are below the elbows.', 'Press up and turn the hands out at the top.'],
    ['Advanced: first master the ring support hold and bar dips.', 'Keep the rings close to the body all the time.', 'Don\'t go deeper than your shoulders allow.'],
    ['Hold a solid support at the top before each rep.', 'Go slow on the way down.', 'Practise holds at the top and the bottom.'],
  ),

  // ---------- shoulders ----------
  'pike-push-up': c(
    ['Hips high in an inverted V, hands shoulder-width.', 'Bend the elbows and lower the head to the floor, between and in front of the hands.', 'Press back up.'],
    ['Lower the head gently, don\'t crash it into the floor.', 'Elbows go back, not out to the sides.', 'Warm up the wrists first.'],
    ['The more vertical the body, the more the shoulders work.', 'Keep the legs as straight as you can.', 'It prepares the handstand push-up.'],
  ),
  'elevated-pike-push-up': c(
    ['Feet on a box, hands on the floor, hips over the shoulders.', 'Lower the head between the hands.', 'Press back up.'],
    ['Start with a low box.', 'Lower slowly; the head carries a lot of weight.', 'Keep the elbows at about 45°, not flared.'],
    ['Raise the box to get closer to a handstand push-up.', 'Look between the hands.', 'Keep the hips stacked over the shoulders.'],
  ),
  'box-pike-handstand': c(
    ['Feet on a box behind you, hands on the floor.', 'Walk the hands close to the box until the hips are over the shoulders.', 'Hold, arms straight.'],
    ['Make sure the box is stable.', 'Warm up the wrists.', 'Come down by walking the hands out, slowly.'],
    ['Push the floor away: shoulders by the ears.', 'Keep the arms locked straight.', 'A great first step towards the handstand.'],
  ),
  'wall-handstand': c(
    ['Face the wall and walk the feet up it, hands about a hand-length from the wall.', 'Body straight, chest towards the wall.', 'Hold, then walk down.'],
    ['Learn to come down safely first: walk down or turn out (cartwheel).', 'Warm up the wrists well.', 'Stop if you get dizzy.'],
    ['Push the floor away and squeeze the glutes and legs.', 'Hands closer to the wall means a straighter line.', 'Look at the floor between the hands.'],
  ),
  hspu: c(
    ['Kick up to a handstand with the back to the wall.', 'Lower the head slowly to the floor.', 'Press back up to straight arms.'],
    ['Advanced: master pike and elevated pike push-ups first.', 'Lower slowly; the neck must never take the weight.', 'Put a folded mat under the head.'],
    ['Hands a bit wider than the shoulders.', 'Elbows forward at about 45°.', 'Partial reps on a raised surface are a good step.'],
  ),
  handstand: c(
    ['Hands shoulder-width, fingers spread.', 'Kick up or press up: wrists, shoulders, hips and feet in one line.', 'Balance using the fingers.'],
    ['Learn to bail out (turn to the side) before you try freestanding.', 'Warm up the wrists every time.', 'Practise on a soft surface, away from furniture.'],
    ['Push the floor away, shoulders by the ears.', 'Squeeze the glutes and point the toes.', 'Short, frequent tries beat long ones.'],
  ),
  'planche-lean': c(
    ['Push-up position, arms straight, hands turned out a little.', 'Lean the shoulders forward past the hands.', 'Hold, body straight.'],
    ['Warm up the wrists well: they carry a lot.', 'Lean a little at a time.', 'Keep the elbows straight but not hyperextended.'],
    ['Round the upper back slightly and push the floor away.', 'The further the lean, the harder.', 'It builds the strength for the planche.'],
  ),
  'pseudo-planche-push-up': c(
    ['Hands by the hips, fingers turned out.', 'Lean forward so the shoulders are past the hands.', 'Lower the chest and push back up, keeping the lean.'],
    ['Warm up the wrists.', 'Keep the lean small at first.', 'Stop if the elbows or wrists hurt.'],
    ['Keep the lean during the whole rep.', 'Body straight, glutes tight.', 'Go slowly.'],
  ),
  'frog-stand': c(
    ['Squat, hands on the floor shoulder-width.', 'Put the knees on the outside of the elbows.', 'Lean forward until the feet lift; balance.'],
    ['Place a pillow in front of the head the first times.', 'Warm up the wrists.', 'Lean slowly; small shifts.'],
    ['Look slightly ahead, not between the hands.', 'Use the fingers to control the balance.', 'It teaches the balance for arm balances and the handstand.'],
  ),
  'wall-walk': c(
    ['Lie face down with the feet at the wall.', 'Push up, walk the feet up the wall and the hands in towards it.', 'Walk back down the same way.'],
    ['Go up only as far as you can control.', 'Warm up the wrists.', 'Come down slowly, step by step.'],
    ['Keep the body tight like a plank.', 'Small hand steps.', 'Great for shoulder strength and confidence upside down.'],
  ),
  'tuck-planche': c(
    ['Hands on the floor or parallettes, arms straight.', 'Lean forward and lift the feet, knees tucked to the chest.', 'Hold, hips level with the shoulders.'],
    ['Advanced: build up with planche leans first.', 'Warm up the wrists and elbows well.', 'Parallettes are kinder on the wrists.'],
    ['Round the upper back and push the floor away.', 'Keep the arms locked.', 'Short holds, many sets.'],
  ),

  // ---------- arms ----------
  'triceps-dip': c(
    ['Support yourself on a dip station or parallettes.', 'Torso upright, elbows pointing back.', 'Lower to 90° at the elbows, press back up.'],
    ['Don\'t go deeper than 90° if the shoulders complain.', 'Keep the shoulders down.', 'No bouncing at the bottom.'],
    ['Stay upright to aim at the triceps.', 'Lock out at the top.', 'Slow on the way down.'],
  ),
  'bench-dip': c(
    ['Hands on a bench or chair behind you, fingers forward.', 'Legs out in front, bend the elbows to lower the hips.', 'Press back up.'],
    ['Lower only to about 90° at the elbows: deeper strains the shoulders.', 'Keep the hips close to the bench.', 'Make sure the bench can\'t slide.'],
    ['Bend the knees to make it easier, straighten the legs to make it harder.', 'Keep the elbows pointing back.', 'Pause at the bottom.'],
  ),
  'diamond-push-up': c(
    ['Hands together under the chest, thumbs and fingers forming a diamond.', 'Body straight, lower the chest to the hands.', 'Push back up.'],
    ['If the wrists hurt, spread the hands slightly.', 'Keep the elbows close to the body.', 'Don\'t let the hips sag.'],
    ['Squeeze the triceps at the top.', 'Do them on the knees or on a bench to start.', 'Slow on the way down.'],
  ),
  'triceps-extension': c(
    ['Hands on a bar or bench, body straight like an incline push-up.', 'Bend only the elbows, bringing the head under the hands.', 'Press back to straight arms.'],
    ['Start with a high bar or bench: it gets hard fast.', 'Go slowly; the elbows carry the load.', 'Stop if the elbow joint hurts.'],
    ['Keep the upper arms still.', 'Lower the support to make it harder.', 'Squeeze the glutes so the body stays straight.'],
  ),
  'l-sit-dip': c(
    ['Support yourself on bars or parallettes with the legs straight out in an L.', 'Dip, keeping the legs up.', 'Press back up.'],
    ['Only when both the L-sit and the dip are solid.', 'Don\'t go too deep.', 'Keep the shoulders down.'],
    ['Keep the legs as high as you can.', 'Tuck the knees to make it easier.', 'Go slowly.'],
  ),

  // ---------- core ----------
  plank: c(
    ['Forearms on the floor, elbows under the shoulders.', 'Body straight from heels to head.', 'Hold.'],
    ['Don\'t let the hips sag: it strains the lower back.', 'Keep the neck neutral; look at the floor.', 'Breathe normally.'],
    ['Squeeze the glutes and pull the ribs down.', 'Push the floor away with the forearms.', 'A hard 30 seconds beats a sloppy 2 minutes.'],
  ),
  'side-plank': c(
    ['Lie on your side, elbow under the shoulder.', 'Lift the hips so the body is straight.', 'Hold, then switch sides.'],
    ['Keep the hips high and stacked.', 'Shoulder right over the elbow.', 'Bend the knees to make it easier.'],
    ['Reach the top arm up to the ceiling.', 'Squeeze the glutes.', 'Lift the top leg to make it harder.'],
  ),
  'hollow-hold': c(
    ['Lie on your back.', 'Press the lower back into the floor, lift the shoulders and the legs.', 'Arms overhead, hold the banana shape.'],
    ['The lower back must stay on the floor: if it lifts, raise the legs or bend the knees.', 'Keep the neck relaxed, chin slightly tucked.', 'Breathe.'],
    ['The lower the arms and legs, the harder.', 'Point the toes and squeeze the legs.', 'This shape is the base of most calisthenics skills.'],
  ),
  'hollow-rock': c(
    ['Get into the hollow hold.', 'Rock back and forth, keeping the shape.', 'Keep going smoothly.'],
    ['Don\'t lose the shape; stop if the lower back arches.', 'Do it on a mat.', 'Keep the chin tucked.'],
    ['The rock comes from the shape, not from the legs kicking.', 'Arms by the ears all the time.', 'Make it smaller and slower to make it harder.'],
  ),
  'leg-raise': c(
    ['Lie on your back, hands by your sides or under the hips.', 'Raise the straight legs to vertical.', 'Lower them slowly, without touching the floor.'],
    ['Keep the lower back pressed down; bend the knees if it lifts.', 'Lower slowly: no dropping.', 'Stop if the lower back hurts.'],
    ['Lift the hips a little at the top for more abs.', 'Take 3 seconds to lower.', 'Keep the legs together.'],
  ),
  'hanging-leg-raise': c(
    ['Hang from the bar.', 'Raise the straight legs to 90° or higher.', 'Lower them slowly.'],
    ['No swinging: pause at the bottom.', 'Keep the shoulders active.', 'Bend the knees to start.'],
    ['Tilt the pelvis up at the top for the abs, not just the hip flexors.', 'Slow on the way down.', 'Progress to toes-to-bar.'],
  ),
  'l-sit': c(
    ['On parallettes or the floor, hands by the hips.', 'Push down, lift the body, legs straight out.', 'Hold, legs parallel to the floor.'],
    ['Warm up the wrists.', 'Keep the shoulders down, arms locked.', 'Tuck the knees if the legs drop.'],
    ['Push the floor away hard.', 'Point the toes and squeeze the legs.', 'One leg tucked, one straight, is a good middle step.'],
  ),
  'dragon-flag': c(
    ['Lie on a bench, hold it behind the head.', 'Lift the body straight up from the shoulders.', 'Lower slowly, body straight, without touching the bench.'],
    ['Advanced: start with the knees bent.', 'Weight on the upper back, never on the neck.', 'Make sure the bench is solid.'],
    ['Keep the hips straight, don\'t pike.', 'Lower as slowly as you can.', 'Negatives only at first.'],
  ),
  'mountain-climber': c(
    ['High plank, hands under the shoulders.', 'Drive one knee to the chest, then switch quickly.', 'Keep a steady rhythm.'],
    ['Keep the hips low, in line with the body.', 'Hands stay under the shoulders.', 'Land softly on the toes.'],
    ['Faster for cardio, slower for the abs.', 'Keep the shoulders still.', 'Count each leg.'],
  ),
  'v-up': c(
    ['Lie flat, arms overhead.', 'Lift the legs and the chest together, reach for the toes.', 'Lower under control.'],
    ['Lower slowly; don\'t crash down.', 'Bend the knees if the lower back hurts.', 'Do it on a mat.'],
    ['Reach with the hands, don\'t pull the neck.', 'Exhale on the way up.', 'Keep the legs straight to make it harder.'],
  ),
  'tuck-to-l-sit': c(
    ['On parallettes, push down and lift the body with the knees tucked.', 'Straighten the legs out into an L.', 'Bring them back to the tuck.'],
    ['Warm up the wrists.', 'Keep the arms locked and the shoulders down.', 'Sit down when you lose the position.'],
    ['Move slowly, no swinging.', 'Keep the legs high when they straighten.', 'It builds the L-sit.'],
  ),
  'toes-to-bar': c(
    ['Hang from the bar.', 'Lift the straight legs all the way up to touch the bar.', 'Lower slowly.'],
    ['Advanced: master hanging leg raises first.', 'No swinging; pause at the bottom.', 'Keep the shoulders active.'],
    ['Lean back slightly and press the bar down with straight arms.', 'Control the way down.', 'Bend the knees to make it easier.'],
  ),
  'windshield-wiper': c(
    ['Hang from the bar, lift the legs (bent or straight).', 'Rotate the hips to one side, then to the other.', 'Keep the upper body still.'],
    ['Advanced: start with bent knees and a small range.', 'Move slowly; don\'t let the legs swing you.', 'Keep the shoulders active.'],
    ['Straight legs make it harder.', 'Pause at each side.', 'Great for the obliques.'],
  ),
  'side-leg-raise': c(
    ['Lie on your side, legs straight.', 'Raise the top leg with control.', 'Lower slowly.'],
    ['Keep the hips stacked; don\'t roll back.', 'Move slowly.', 'Support the head with the bottom arm.'],
    ['Toes pointing forward, not up.', 'Pause at the top.', 'Hold the top for a few seconds to make it harder.'],
  ),

  // ---------- legs ----------
  squat: c(
    ['Feet shoulder-width, toes slightly out.', 'Sit down and back, chest up, until the hips are below the knees.', 'Stand up, pushing through the whole foot.'],
    ['Knees follow the toes: don\'t let them cave in.', 'Heels stay on the floor.', 'Keep the back neutral, not rounded.'],
    ['Full depth if your mobility allows.', 'Slow down, quick up.', 'Arms forward help the balance.'],
  ),
  'wall-sit': c(
    ['Back against the wall.', 'Slide down until the thighs are parallel to the floor.', 'Hold.'],
    ['Knees above the ankles, not past the toes.', 'Keep the back flat on the wall.', 'Come up slowly.'],
    ['Lower means harder.', 'Push the lower back into the wall.', 'Breathe.'],
  ),
  'squat-jump': c(
    ['Squat down.', 'Jump up as high as you can.', 'Land softly and go into the next squat.'],
    ['Land on the balls of the feet with bent knees.', 'Knees follow the toes on the landing.', 'Skip it if your knees hurt.'],
    ['Swing the arms to jump higher.', 'Quiet landings mean good control.', 'Quality first: stop when the jumps get low.'],
  ),
  'bulgarian-split-squat': c(
    ['Rear foot on a bench behind you.', 'Lower the back knee towards the floor.', 'Push up through the front foot.'],
    ['Front knee follows the toes.', 'Find a stable distance from the bench before starting.', 'Keep the torso upright.'],
    ['Slow on the way down.', 'Lean forward slightly for more glutes.', 'Hold onto something for balance at first.'],
  ),
  'pistol-squat': c(
    ['Stand on one leg, the other straight in front.', 'Squat all the way down on the standing leg.', 'Stand back up.'],
    ['Advanced: practise to a box first.', 'Keep the heel down and the knee over the toes.', 'Hold something for balance at first.'],
    ['Arms forward for balance.', 'Control the way down.', 'Stand up without bouncing.'],
  ),
  'glute-bridge': c(
    ['Lie on your back, knees bent, feet flat.', 'Drive the hips up until the body is straight from knees to shoulders.', 'Lower slowly.'],
    ['Don\'t arch the lower back at the top: squeeze the glutes instead.', 'Push through the heels.', 'Keep the knees in line with the feet.'],
    ['Pause and squeeze at the top.', 'Feet closer to the hips for more glutes.', 'Try one leg to make it harder.'],
  ),
  'lateral-lunge': c(
    ['Stand with the feet together.', 'Step wide to one side, sit into that hip; the other leg stays straight.', 'Push back to the start.'],
    ['Knee follows the toes.', 'Heels stay down.', 'Keep the chest up.'],
    ['Go deeper as the hips loosen.', 'Push the hips back.', 'Great for the inner thighs.'],
  ),
  'single-leg-bridge': c(
    ['Lie on your back, one foot on the floor, the other leg up.', 'Drive the hips up, keeping them level.', 'Lower slowly.'],
    ['Don\'t let the hips tilt.', 'Don\'t arch the lower back.', 'Push through the heel.'],
    ['Pause at the top.', 'Keep the lifted leg still.', 'Count reps per side.'],
  ),
  'single-leg-rdl': c(
    ['Stand on one leg.', 'Hinge at the hip, back flat, free leg going back.', 'Stand up by squeezing the glutes.'],
    ['Keep the back flat, never rounded.', 'Slight bend in the standing knee.', 'Hold onto something for balance at first.'],
    ['Hips square to the floor.', 'Go slowly.', 'Reach towards the floor to feel the hamstrings.'],
  ),
  'nordic-curl': c(
    ['Kneel with the heels hooked under something solid.', 'Body straight from knees to head, lean forward as slowly as you can.', 'Catch yourself with the hands, push back up.'],
    ['Very hard for the hamstrings: start with a small range.', 'Use a soft mat under the knees.', 'Always catch yourself with the hands.'],
    ['Keep the hips straight; don\'t bend at the waist.', 'The slower the lowering, the better.', 'A band from behind can help.'],
  ),
  lunge: c(
    ['Step forward.', 'Lower the back knee towards the floor.', 'Push back up, alternate legs.'],
    ['Front knee over the ankle, not caving in.', 'Keep the torso upright.', 'Step long enough so the front knee stays behind the toes.'],
    ['Slow on the way down.', 'Push through the front heel.', 'Walk them for a longer set.'],
  ),
  'calf-raise': c(
    ['Stand on a step, heels off the edge.', 'Rise up onto the toes.', 'Lower the heels below the step.'],
    ['Hold onto something for balance.', 'Move slowly at the bottom.', 'Don\'t bounce.'],
    ['Pause at the top.', 'Full range every rep.', 'Try one leg at a time.'],
  ),
  'horse-stance': c(
    ['Feet wide, toes forward or slightly out.', 'Sit down deep, back upright.', 'Hold.'],
    ['Knees push out over the toes.', 'Keep the back straight.', 'Come up slowly.'],
    ['Lower means harder.', 'Breathe deep.', 'Good for the legs and the hips.'],
  ),
  'sissy-squat': c(
    ['Stand on the balls of the feet, holding onto something.', 'Bend the knees forward and lean back, hips straight.', 'Come back up.'],
    ['Hard on the knees: small range first.', 'Hold onto something stable.', 'Skip it if your knees hurt.'],
    ['Keep the line from knees to head straight.', 'Go slowly.', 'Great for the quads.'],
  ),
  burpee: c(
    ['Squat and put the hands on the floor.', 'Jump the feet back, chest to the floor.', 'Push up, jump the feet in and jump up.'],
    ['Land softly.', 'Keep the back straight in the plank.', 'Step back instead of jumping if you need.'],
    ['Steady pace over a long set.', 'Full push-up at the bottom for more strength.', 'Clap overhead at the top.'],
  ),

  // ---------- warm-up ----------
  'jumping-jacks': c(['Jump the feet out while the arms go overhead.', 'Jump back in, arms down.', 'Easy rhythm.'], ['Land softly on the balls of the feet.', 'Step instead of jumping if you need.'], ['Use it to raise the heart rate before the workout.']),
  'arm-circles': c(['Arms out to the sides.', 'Make big circles forward, then backward.', 'Start small, get bigger.'], ['No pain: stay in a comfortable range.'], ['Warms up the shoulders before pushing and pulling.']),
  'wrist-circles': c(['Circle the wrists both ways.', 'Then stretch, palms down and palms up, on the floor.', 'Rock gently forward and back.'], ['Gentle: never force a stretch.'], ['Always do it before handstands, planche leans and push-ups.']),
  'cat-cow': c(['On all fours.', 'Round the back up (cat), then let it sag and look up (cow).', 'Move slowly with the breath.'], ['Stay in a comfortable range.'], ['Breathe out on the cat, in on the cow.']),
  'scapular-push-up': c(['High plank, straight arms.', 'Let the chest sink between the shoulders, then push it up.', 'Only the shoulder blades move.'], ['Keep the arms straight.'], ['Wakes up the serratus and the shoulder blades before pushing.']),
  'deep-squat-hold': c(['Sit at the bottom of a squat.', 'Heels down, chest up.', 'Relax and breathe.'], ['Hold onto something if the heels lift.'], ['Push the knees out with the elbows to open the hips.']),
  'leg-swings': c(['Hold a wall.', 'Swing one leg forward and back, then side to side.', 'Switch legs.'], ['Let the range grow; don\'t kick hard.'], ['Loosens the hips before squats and lunges.']),

  // ---------- cool-down ----------
  stretching: c(['Reach tall, then stretch each part you trained.', 'Hold each stretch 20–30 seconds.', 'Breathe slowly.'], ['Never bounce; stretch to mild tension, not pain.'], ['Breathe out to go a little deeper.']),
  'leg-stretch': c(['Sit with the legs straight.', 'Fold forward from the hips with a long back.', 'Hold.'], ['Don\'t bounce; bend the knees if needed.'], ['Lead with the chest, not the head.']),
  'shoulder-stretch': c(['Pull one arm across the chest.', 'Then reach it overhead and bend the elbow for the triceps.', 'Switch sides.'], ['Gentle pull only.'], ['Relax the shoulders down.']),
  'hip-flexor-stretch': c(['Half-kneel, one foot forward.', 'Push the hips forward, squeeze the back glute.', 'Switch sides.'], ['Pad under the knee; don\'t arch the back.'], ['Reach the arm up on the kneeling side.']),
  'pancake-stretch': c(['Sit with the legs wide.', 'Fold forward with a long back.', 'Hold.'], ['Stay where it feels like a stretch, not pain.'], ['Walk the hands forward a little more with each breath.']),
  'childs-pose': c(['Kneel, sit back on the heels.', 'Reach the arms forward, forehead to the floor.', 'Relax.'], ['Knees wide if the hips are tight.'], ['Breathe into the back.']),
  'dead-hang-stretch': c(['Hang loosely from the bar.', 'Let the body get long.', 'Breathe.'], ['Get down by stepping, not dropping.'], ['Lets the spine and shoulders relax after the workout.']),
  rest: c(['Walk around or stand.', 'Breathe slowly and deeply.', 'Drink some water.'], [], ['Use the rest to get ready for what comes next.']),
};
