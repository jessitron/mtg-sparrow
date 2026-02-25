# Ravnica Guilds — Domain Expert Notes

Research date: 2026-02-25
Source: https://mtg.fandom.com/wiki/Ravnican_guild and individual guild pages

## Overview

Ravnica is an MTG plane that is essentially one world-spanning city, governed by ten guilds. Each guild represents one of the ten possible two-color combinations in Magic: The Gathering. The guilds were originally established by the Guildpact, a magical contract maintaining balance between them.

There have been three major Ravnica block sets:
- **Ravnica: City of Guilds** (2005) — original Ravnica block
- **Return to Ravnica** (2012) / Gatecrash (2013) / Dragon's Maze (2013) — Return to Ravnica block
- **Guilds of Ravnica** (2018) / Ravnica Allegiance (2019) / War of the Spark (2019) — current era

## The Ten Guilds

| Guild | Colors | Full Name | Role/Identity |
|-------|--------|-----------|---------------|
| Azorius | WU (White/Blue) | Azorius Senate | Lawmakers, judges, police — the ruling legislative body |
| Dimir | UB (Blue/Black) | House Dimir | Espionage, secrets, assassins — long believed to not exist |
| Rakdos | BR (Black/Red) | Cult of Rakdos | Demonic circus performers, hedonists, entertainers |
| Gruul | RG (Red/Green) | Gruul Clans | Savage clans, nature spirits, outcasts pushed to the margins |
| Selesnya | GW (Green/White) | Selesnya Conclave | Nature cult, community, collective mind (the Worldsoul) |
| Orzhov | WB (White/Black) | Orzhov Syndicate | Church/crime family hybrid, ghosts accumulate debt and power |
| Izzet | UR (Blue/Red) | Izzet League | Mad scientists, inventors, experimenters led by dragon Niv-Mizzet |
| Golgari | BG (Black/Green) | Golgari Swarm | Life/death cycle, undead farming, underground food supply |
| Boros | RW (Red/White) | Boros Legion | Military/police force, angels and soldiers, justice through force |
| Simic | GU (Green/Blue) | Simic Combine | Biomancers, evolving life to adapt to city environments |

## Guild Crest Images

All 10 guild crest images have been downloaded to `src/assets/guild-crests/`. These are the "Return to Ravnica block" crest versions — the more modern, cleaner circular guild symbols as used in Return to Ravnica (2012) era.

Image source: MTG Salvation wiki via static.wikia.nocookie.net (mtgsalvation_gamepedia CDN)

| File | Source URL |
|------|-----------|
| `azorius.png` | https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/3/37/Azorius_Logo.png |
| `dimir.png` | https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/6/60/Dimir_Logo.png |
| `rakdos.png` | https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/f/f8/Rakdos_Logo.png |
| `gruul.png` | https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/e/e9/Gruul_Logo.png |
| `selesnya.png` | https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/0/08/Selesnya_Logo.png |
| `orzhov.png` | https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/3/38/Orzhov_Logo.png |
| `izzet.png` | https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/3/3a/Izzet_Logo.png |
| `golgari.png` | https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/7/76/Golgari_Logo.png |
| `boros.png` | https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/8/89/Boros_Logo.png |
| `simic.png` | https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/3/3e/Simic_Logo.png |

Image specifications: 400x400 pixels, RGBA PNG (converted from WebP as served by the CDN)

## Notes for Sparrow Deck

- Guild names used in sparrow-deck should match the short form (e.g., "Azorius" not "Azorius Senate")
- The color pair abbreviations used in-game (WU, UB, BR, etc.) follow standard MTG WUBRG ordering
- The Rakdos image source did not have a revision/cb parameter in the URL — it still resolved correctly to the current logo
- All crests are transparent-background circular symbols, suitable for overlay/badge use
- The Golgari and Simic images are slightly larger files (~125-130KB) suggesting more detail
