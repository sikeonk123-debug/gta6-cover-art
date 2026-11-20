# Neon Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/sikeonk123-debug/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/sikeonk123-debug/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline browser web app that turns a photo and a caption into multi-panel sunset-neon cover art, exported as a PNG to share. Six layouts (four panels, hero + three, full bleed, nine grid, tilted snaps, split duo), per-panel photos with drag-to-pan and zoom crop, five gradient-map grades (Sunset, Neon, Vice, Heat, Mono), Anton title lettering with a Pacifico script subtitle, grain and vignette, and one-click PNG export in 1080 × 1080, 1080 × 1350, 1920 × 1080 and 1080 × 1920 — with undo and redo. Everything is its own: no Rockstar logo, artwork or font; the fonts are Anton and Pacifico under the SIL Open Font License, vendored under `app/fonts/`.

## Try it

```sh
node serve.ts
```

Then open http://localhost:8080. No network request is made: every script, font and sample photo is a file under `app/`, and your photos never leave your machine.

## Hand it in

```sh
node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `buildDossier`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=rnmxxsbb&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
