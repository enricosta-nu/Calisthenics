# Calisthenics

A small, offline-first bodyweight training app. It runs in the browser and can be installed to your phone's home screen. There's no build step, no dependencies, and no account.

## Features

- **Built like your trainings:** every workout follows the same skeleton: warm-up → **opener** (pull + push: strength intervals, EMOM or circuit) → **skill section** (shoulders + core intervals, handstand holds) → **finisher** (AMRAP, 12-minute Tabata or circuit) → stretching. See `docs/training-schemes.md`.
- **Surprise me!**: choose 45, 60 or 75 minutes and the app fills the skeleton by itself. At 75 minutes the finisher is split around the handstand block. It avoids repeating your last finisher, and Shuffle gives a different workout.
- **Create**: choose the duration, the opener, the skill blocks (0–3, intervals and/or holds), one or two finishers, and a focus (Balanced, Back, Chest, Shoulders, Arms, Core, Legs). Every muscle group is always trained; the focus gets extra work. Save the ones you like. Your 12 trainings (Allenamento 1–12) are listed here too, with the next one in the sequence marked "Up next".
- **Intensity**: every workout has an Easier / Standard / Harder / Harder + / Hardest control. It keeps the same exercises and only changes time and rounds: +5s per set (20 → 25s), extra rounds, longer AMRAPs, more EMOM rounds. It's remembered per workout, so you can keep the one you like and make it harder over time. Warm-up and stretching don't change, and your own timing edits win over it.
- **How it felt**: at the end of each workout you rate it from 1 (very easy) to 5 (very hard). The app remembers it per workout, and the next time you start that workout, even months later, it reminds you ("last time you rated it 3/5 at Standard") and offers a change: harder after a 1–3, easier after a 5. You decide; the app only asks.
- **Levels per muscle group**: after a workout you can also rate each muscle group you trained (easy / OK / hard). If a group feels easy twice in a row, the app asks whether to include the next level of exercises for it; hard twice in a row, whether to step back. You decide. Each group's level is also adjustable in the profile.
- **Backup**: Settings → Back up opens the phone's share menu to save one small file wherever you like (iCloud Drive, Google Drive, Dropbox, a message to yourself); Restore reads it back on a new phone. After 5 workouts without a backup, the end-of-workout summary reminds you.
- **Training profile**: your level (Beginner, Intermediate, Advanced) and equipment (pull-up bar, low bar, dip station, parallettes, rings, resistance band). Surprise me! and Create only pick exercises that fit both, from the approved exercise reference in `docs/exercises/`. Beginners with a band get band-assisted pull-ups, chin-ups and dips.
- **Exercise details and swap**: tap any exercise for a form tip and the muscles it works. In Surprise me! and Create previews, and in any workout before a block starts, "↻ Swap exercise" cycles through alternatives for the same muscle group that fit your level and equipment, keeping the rotation rules.
- **Variety and recovery**: new workouts favour exercises you haven't done in your last three workouts, and go lighter on muscle groups you worked hard in the last 36 hours.
- **Guided timer** for every block: get-ready countdown, work and rest phases, beeps and a 3-2-1 countdown, pause, skip and restart. It picks up where you left off after a reload.
- **Workout screen**: a timeline down the left shows the whole workout, coloured by part, with a marker for where you are (tap a block to jump to it). A big clock you tap to stop and restart. Below it, how to do the current exercise (or the next one, during rest), step by step, with the muscles it works. It greets you by name if you set one.
- **Adjustable timings**: before a block starts, change its rounds, work, rest or total time. Changes to saved workouts are remembered.
- **Tabata** means 20s on / 10s off: a circuit is 8 intervals (4 min), and a Tabata is 3 circuits (12 min), cycling through the exercises. Shorter lists repeat within a circuit. Workouts can set other timings.
- **Progress**: workouts, this week and week streak; how your training spread across muscle groups in the last 4 weeks (with a hint when one falls behind); every exercise in the app by muscle group, with how often and when you last did it; and how your workouts felt.
- **Today's equipment**: somewhere else today (travelling, a different park)? Set what you have for today only; workouts and swaps use it, and it goes back to your usual equipment the next day.
- **First launch**: a short welcome asks your level and equipment before anything else.
- **History and stats**: workouts per week, week streak, and what you did in each block.
- **Your data stays on your device** (localStorage). See Backup above.
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
| `js/routines.js` | Your 12 trainings. Edit this to add or change them. |
| `js/exercises.js` | Exercise list with muscle groups and cues. Edit this to add exercises. |
| `js/generator.js` | Builds Surprise me! and Create workouts from your choices |
| `js/options.js` | The durations, block kinds and focus options offered |
| `js/logic.js` | Pure state logic: block timers, rotation rules, intensity, ratings, history and stats |
| `js/app.js` | UI rendering, timers and event handling |
| `styles.css` | Styles (light and dark mode) |
| `sw.js`, `manifest.webmanifest` | PWA offline support and install metadata |
