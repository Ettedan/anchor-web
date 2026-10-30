# Anchor

A private, always-available tracker and journal for **weather- and body-sensitive anxiety**.

Built for one person. Works on a phone, installs to the home screen, runs offline, and
stores everything on the device. No account, no server, no analytics.

**Live:** https://ettedan.github.io/anchor-web/

---

## Why this exists

Most anxiety apps assume situational fear — you fear a place, you avoid it, exposure fixes it.
This one is built for a different pattern: anxiety driven by **barometric pressure, temperature,
vestibular sensitivity, sleep phase, and gut state**. Episodes are not triggered by a thought
or a place; they are the sum of stacked physiological loads crossing a threshold.

So the app does not try to talk you down. It does three things:

1. **Records the conditions** — weather, pressure trend, sleep, caffeine, dizziness, gut — at
   the moment you log something, so you can find the pattern in your own data.
2. **Gives you a notebook** — thoughts, wins, and full episode records, all timestamped.
3. **Shows trends** — mood, episodes and habits over the last two weeks, without streaks,
   scores, or shaming.

## What it tracks

| Item | What is recorded |
|---|---|
| Mood | 0–10, one number |
| Body | dizziness 0–10 + gut comfort 0–10 |
| Exercise | type, minutes, intensity |
| Meditation | type, minutes |
| Sleep | bedtime, wake time, computed hours, rested 0–10 |
| Coffee | cups, mg, time — flagged if after your cutoff |
| Episodes | free text + anxiety/dizziness/gut + triggers + weather snapshot |
| Thoughts / wins | free text, timestamped |

Every entry optionally captures a **weather snapshot**: temperature, surface pressure, humidity,
and the pressure change over the last 3 hours (free Open-Meteo API, no key, no account).
Location is requested once and only used to fetch weather.

## Design rules

- **No streaks, no scores, no red.** A missed day is not a failure state.
- **No thought-challenging.** Episodes often have no thought to test — just a body signal.
- **No exposure prompts.** The owner has tried exposure for years; it is not the spine here.
- **No reassurance.** The app records, it does not tell you that you are fine.
- **It gets out of the way.** Big touch targets, dark, quiet, one thing per screen.

## Privacy

All data lives in `localStorage` on your device. Nothing is uploaded, ever. There is no backend
to upload it to. Export a JSON backup from Settings now and then — clearing browser data
deletes everything.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the production build
```

## Deploy

Pushing to `main` builds and publishes via GitHub Actions to GitHub Pages
(`.github/workflows/deploy.yml`). The Vite `base` is `./`, so it works from a sub-path.

## Install on a phone

Open the Pages URL in Safari (iOS) or Chrome (Android) → **Share → Add to Home Screen**.
It then opens full-screen, without a browser chrome, and works with no signal.

## Scope

Anchor is a self-management tracker and journal. It does not diagnose or treat any condition,
and it is not a substitute for a doctor or therapist. Crisis numbers are one tap away in
Settings.

## A note on the research

The evidence base behind the design decisions is in
[`../knowledge/projects/anchor/research/`](../../knowledge/projects/anchor/research) —
including which interventions have real support, and which are popular but unsupported.
