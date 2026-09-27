# Calisthenics

A small, offline-first bodyweight training app. It runs in the browser and can be installed to your phone's home screen. There's no build step, no dependencies, and no account.

## Features

- **My workouts**: 12 personal routines (Allenamento 1–12) made of timed blocks: intervals, Tabata, AMRAP, EMOM and circuits you do at your own pace. A guided timer runs each block with a get-ready countdown, work and rest phases, a 3-2-1 beep, and pause/skip. AMRAP rounds are counted, and the next routine in the sequence is marked "Up next".
- **Skill ladders** for Push, Pull, Legs, Core, Dip, Handstand and Planche. Each ladder goes from beginner to advanced (for example, Wall Push-up up to One-arm Push-up).
- **Workouts** (Full Body, Upper Body, Legs & Core, Skill Day) are built from your current step on each ladder.
- **Set logging** with a rep stepper, or a stopwatch for hold exercises. Shows what you did last time.
- **Rest timer** that starts after each set. It beeps and vibrates when rest is over, and you can add or remove 15s.
- **Auto-progression.** Hit the top of the rep range on every set and you're offered the next step. If you miss the bottom of the range on every set, you're offered an easier one.
- **History and stats**: workouts per week, week streak, total reps, and a best-set chart per skill.
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
| `js/routines.js` | Personal routines and the exercise glossary. Edit this to add or change your workouts. |
| `js/logic.js` | Pure state logic (workout building, progression, block timers, stats) |
| `js/app.js` | UI rendering, timers and event handling |
| `styles.css` | Styles (light and dark mode) |
| `sw.js`, `manifest.webmanifest` | PWA offline support and install metadata |
