# Roadmap and open notes

Notes kept between sessions: ideas still to define, and decisions already taken.

## Next idea: a statistics section (to define together)

**The idea (from you):** a section with statistics: how many sessions, which muscle groups the
user trains the least and the most.

**What already exists** (Progress tab): workouts total, this week, week streak; exercises per
muscle group over the last 4 weeks as bars, with a hint for the group falling behind; every
exercise with how often and when it was last done; the latest rating per workout. The data to go
much further is already saved with every workout: date, length, each block with its exercises,
done or skipped, intensity, overall rating, and the per-muscle-group rating.

**First reasoning: what statistics could show**

1. **Volume over time:** sessions and minutes per week / month, as a small chart; the week streak
   and the longest streak.
2. **Muscle-group balance:** least and most trained groups over a chosen period (4 weeks,
   3 months, all time), shown as a share of the total, for example "Back 28% · Legs 6%". It could
   be compared with the balance the app aims for: calisthenics is upper-body heavy, so "balanced"
   shouldn't mean 1/6 each.
3. **Trends per group:** is a group getting more or less work than last month?
4. **How it felt over time:** average rating per week; per-group easy / OK / hard over time; level
   changes per group, as a timeline ("Back: Intermediate → Advanced on 3 Nov").
5. **Exercises:** most done, never tried, recently added to your rotation.
6. **Block types:** how often each opener and finisher (AMRAP, Tabata, EMOM…) came up.
7. **Your 12 trainings:** how often each was done, at which intensity, and how it felt.

**Questions to decide**

- A separate **Statistics** tab, or the Progress tab grown into it? Merging is my first instinct,
  with Progress for "what to do next" and statistics for "what I did".
- Which **periods** matter: last 4 weeks, 3 months, a year, all time?
- How to **count work per muscle group**: by number of exercises (as now), by minutes, or by sets.
  Minutes is closer to real work for timed blocks.
- Should statistics **suggest** anything ("Legs only 6% this month → try a Legs focus?"), or just
  show the numbers?
- Charts are part of the graphics phase; for now, define **what** to show.

## Other notes for later

- **Automatic backup (option B):** save the backup to Google Drive or Dropbox by itself after
  every workout. Needs the app published at a fixed address (e.g. GitHub Pages) and the app
  registered with the provider (free). iCloud can't be used directly by a web app.
- **Graphics phase:** after the logic is complete: explore 2–3 visual directions on the key
  screens, then restyle (`styles.css` holds almost all of the look).
- **Publishing:** GitHub Pages, so the app can be opened and installed on a phone from a link.
- **Check on a real phone:** the backup share menu ("Save to Files → iCloud Drive") only exists on
  phones; on computers it downloads.
- **Growing the exercise basket:** new exercises follow the review format in `docs/exercises/`,
  then go into `js/exercises.js`.

## Done (for reference)

- Skeleton-based workouts (opener → skill section → finisher), 7 modules, 45/60/75 min
- Exercise basket with muscles, levels, equipment and sources (`docs/exercises/`)
- Training profile (level, equipment), levels per muscle group, today's equipment
- Intensity, overall and per-group ratings with suggestions the user decides on
- Variety across sessions, recovery after hard days, swap an exercise
- Progress tab, first-launch welcome, backup and restore through the share menu
