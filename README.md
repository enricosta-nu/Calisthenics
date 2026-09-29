# Calisthenics

A small, offline-first bodyweight training app. It runs in the browser and can be installed to your phone's home screen. There's no build step, no dependencies, and no account.

## Features

- **Suggest**: choose 45, 60 or 90 minutes and get a full-body workout: warm-up, strength intervals, handstand work, a 12-minute Tabata, a finisher (AMRAP, EMOM or circuit) and a cool-down. Shuffle gives a different one.
- **Create**: choose duration, number of blocks, kinds of blocks (Intervals, Tabata, EMOM, AMRAP, Circuit, Skill holds) and a focus (Balanced, Push, Pull, Legs, Core, Handstand). Every muscle group is always trained; the focus gets extra work. Within a block, neighbouring exercises never work the same muscle group in the same way: an EMOM is e.g. back + abs, never abs + abs. An iso and a dynamic move of the same group can sit together (pull-up hold → pull-up), and pushes and pulls can repeat as long as they alternate (pull-up / push-up / pull-up hold). Save the ones you like. Your 12 trainings (Allenamento 1–12) are listed here too, with the next one in the sequence marked "Up next".
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
| `js/generator.js` | Builds Suggest and Create workouts from your choices |
| `js/options.js` | The durations, block kinds and focus options offered |
| `js/logic.js` | Pure state logic (workout building, progression, block timers, stats) |
| `js/app.js` | UI rendering, timers and event handling |
| `styles.css` | Styles (light and dark mode) |
| `sw.js`, `manifest.webmanifest` | PWA offline support and install metadata |
