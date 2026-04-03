# Golgari Example Deck Arc — Tester Verification

**Date:** 2026-04-03  
**Test file:** `tests/golgari-example-deck.mjs`

## What was tested

- Golgari combo page (`/combo/golgari.html`)
- Esper combo page spot-check (`/combo/esper.html`)

## Results: 10/10 PASSED

### Golgari page

| Check | Result |
|---|---|
| Page loads | PASS |
| No `.combo-flavor` paragraph | PASS |
| `.combo-decks` section exists | PASS |
| Commander "Ygra, Eater of All" shown | PASS |
| Deck link points to `archidekt.com` | PASS |
| Deck link slug contains `ygra_especially_likes_to_eat_squirrels` | PASS |
| Set name "Duskmourn: House of Horror" present | PASS |
| Description mentions "squirrel" | PASS |

### Esper spot-check

| Check | Result |
|---|---|
| At least one `.combo-deck` element | PASS |
| Deck link is a valid URL | PASS |

## Notes

- The `edhrecUrl` → `deckUrl` rename is internal only; the rendered HTML is identical.
- `combo-flavor` class does not appear anywhere in Golgari's HTML (it does appear in Dimir — that's expected).
- Esper deck still links to `edhrec.com/precon/scions-spellcraft` (Final Fantasy Y'shtola deck).
