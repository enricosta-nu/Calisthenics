# Calisthenics

A small, offline-first bodyweight training app. It runs in the browser and can be installed to your phone's home screen. There's no build step, no dependencies, and no account.

## Features

- **Built like your trainings:** every workout follows the same skeleton: warm-up → **opener** (pull + push: strength intervals, EMOM or circuit) → **skill section** (shoulders + core intervals, handstand holds) → **finisher** (AMRAP, 12-minute Tabata or circuit) → stretching. See `docs/training-schemes.md`.
- **Surprise me!**: choose 45, 60 or 75 minutes and the app fills the skeleton by itself. At 75 minutes the finisher is split around the handstand block. It avoids repeating your last finisher, and Shuffle gives a different workout.
- **Create**: choose the duration, the opener, the skill blocks (0–3, intervals and/or holds), one or two finishers, and a focus (Balanced, Back, Chest, Shoulders, Arms, Core, Legs). Every muscle group is always trained; the focus gets extra work. Save the ones you like. Your 12 trainings (Allenamento 1–12) are listed here too, with the next one in the sequence marked "Up next".
- **Intensity**: every workout has an Easier / Standard / Harder / Harder + / Hardest control. It keeps the same exercises and only changes time and rounds: +5s per set (20 → 25s), extra rounds, longer AMRAPs, more EMOM rounds. It's remembered per workout, so you can keep the one you like and make it harder over time. Warm-up and stretching don't change, and your own timing edits win over it.
- **Training profile**: your level (Beginner, Intermediate, Advanced) and equipment (pull-up bar, low bar, dip station, parallettes, rings, resistance band). Surprise me! and Create only pick exercises that fit both, from the approved exercise reference in `docs/exercises/`. Beginners with a band get band-assisted pull-ups, chin-ups and dips.
- **Exercise details**: tap any exercise for a form tip and the muscles it works.
- **Guided timer** for every block: get-ready countdown, work and rest phases, beeps and a 3-2-1 countdown, pause, skip and restart. It picks up where you left off after a reload.
- **Adjustable timings**: before a block starts, change its rounds, work, rest or total time. Changes to saved workouts are remembered.
- **Tabata** means 20s on / 10s off: a circuit is 8 intervals (4 min), and a Tabata is 3 circuits (12 min), cycling through the exercises. Shorter lists repeat within a circuit. Workouts can set other timings.
- **Skills**: sets-and-reps workouts built from ladders for Push, Pull, Legs, Core, Dip, Handstand and Planche, with automatic level-up suggestions.
- **History and stats**: workouts per week, week streak, and what you did in each block.
- **Your data stays on your device** (localStorage). You can export or import a JSON backup.
- Works offline (service worker) and keeps the screen awake during a workout.

## Run it

```sh
npm start          # serves on http://localhost:8080 (uses python3)
```

Any static file server works. To use it on your phone, host the folder on GitHub Pages, Netlify or similar. Then open it and choose **Add to Home Screen**.

## Test

```sh
npm test           # node --test, covers the pure logic in js/logic.js
```

## Layout

| File | Purpose |
| --- | --- |
| `js/data.js` | Exercise ladders and workout templates. Edit this to add exercises. |
| `js/routines.js` | Your 12 trainings. Edit this to add or change them. |
| `js/exercises.js` | Exercise list with muscle groups and cues. Edit this to add exercises. |
| `js/generator.js` | Builds Surprise me! and Create workouts from your choices |
| `js/options.js` | The durations, block kinds and focus options offered |
| `js/logic.js` | Pure state logic (workout building, progression, block timers, stats) |
| `js/app.js` | UI rendering, timers and event handling |
| `styles.css` | Styles (light and dark mode) |
| `sw.js`, `manifest.webmanifest` | PWA offline support and install metadata |
