# SEAMAP — MTG Sparrow (mtgcolors.quest)

## North Star
Help people integrate into the Magic community by learning the names of the colors, in a charming website.

## The Mountains
- **Internationalization** — the site speaks more than English (German first; audio in other voices, maybe Canadian via Jim).
- **Content completeness** — every level that should exist, exists: single-color tutorial, the wedges/shards, four-color & WUBRG, the easter eggs.
- **People get here** — the site is found: indexed, scraped, read by bots. The combo reference pages are the SEO surface that pulls people in.

(Charm is not a Mountain — it's a quality we steer for the whole voyage. Some landings move us toward a Mountain; others are just charm, and that's fine.)

## Safe Harbor
The change is live on mtgcolors.quest (built and deployed to GitHub Pages), and Honeycomb shows real traffic flowing through it — the new behavior is visible in production telemetry, with a version marker confirming the deployed build.

## Success looks like
**I am proud to tell people about the site.**

That pride rests on:
- **Charm** — delightful, a little playful; small surprises reward attention (the spinning logo, easter eggs, the warmth of the voice).
- **Calm learning** — no scores, no streaks, no pressure; people learn by saying names aloud, and it feels easy.
- **People arrive and belong** — newcomers find the site and leave feeling more at home in Magic's language.
- **Every change is observable** — we can see it working in production, not just hope it does.

## How will we know it's working?
- **Today:** it works, I can see it work, and I like it. 🙂 (Honeycomb shows sessions and cards flowing through, every deploy carries a version marker, new behavior is verifiable in production.)
- **The dream:** people use it often — steady, *repeat* sessions from players I didn't personally tell; unique players growing over time; traffic arriving from search and bots; combo reference pages getting hits; the occasional feedback/share/easter-egg trigger.

## Enabling Constraints
- **No framework** — vanilla TypeScript + esbuild. It's a card flipper; a framework adds overhead without solving a real problem.
- **No scoring** — no scores, streaks, or leaderboards. Evaluation anxiety undermines perceptual learning.
- **Telemetry stays wrapped** — only `src/telemetry/` touches Honeycomb; app code calls domain-meaningful helpers.
- **All commands via `scripts/`** — nothing runs as raw inline `npm`/`npx`.
- **Every arc is observable** — runtime visibility + a version-marker bump each arc; no invisible work.

## Non-goals
- **No teaching Magic strategy or rules** — this is about color *names* and belonging, not how to play.
- **No accounts or backend** — static site, localStorage only; no login, no server-side state.
