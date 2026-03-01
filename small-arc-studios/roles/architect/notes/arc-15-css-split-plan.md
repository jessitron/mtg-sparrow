# Arc 15: CSS Split Plan

**Architect analysis — complete rule-by-rule mapping**

---

## Source file

`style.css` — 948 lines, single monolithic file.
`card-back.css` — standalone demo file for `card-back-demo.html`. NOT linked from `index.html`. Not part of this split.

---

## Target files after split

| File | Purpose |
|------|---------|
| `style.css` | Shared: reset, variables, fonts, body, #app, #gas, footer, settings panel, gas buttons |
| `welcome.css` | Welcome screen rules |
| `slides.css` | Card/quiz/done-zone rules, card image layout, `#app.app--quiz-active` overrides |
| `assessment.css` | Self-assessment form rules |
| `end.css` | Guild columns, color wheels, session-end, combo-summary live classes, session-next |

---

## Dead CSS identified

The following rules exist in `style.css` but are **never used** in any JS or HTML:

| Rule | Lines | Notes |
|------|-------|-------|
| `.combo-summary` | 289–296 | Container class never instantiated in JS. Only children `.combo-summary-pips` and `.combo-summary-name` are used (inside `buildGuildList()` → `.guild-column-item`). |
| `.combo-summary-heading` | 298–302 | Dead — never set |
| `.combo-summary-list` | 304–310 | Dead — guild list uses `.guild-column-list` |
| `.combo-summary-item` | 312–318 | Dead — list items use `.guild-column-item` |
| `.session-next-divider` | 336–342 | Dead — never set |
| `.session-next` | 344–353 | Dead — never set |
| `.session-next-label` | 355–359 | Dead — never set |
| `.session-next-buttons` | 361–365 | Dead — never set |

**Recommendation:** Delete all dead rules in Arc 15. They're cleanup from earlier design iterations. The classes `.combo-summary-pips` and `.combo-summary-name` are ALIVE and move to `end.css`.

---

## Duplicate selector note

`#app.app--quiz-active` appears **three separate times** in style.css (lines 80–83, 859–861, 917–919). These should be consolidated into a single rule block in `slides.css`.

Similarly `.guild-column-item` appears twice (lines 446–452 and 542–547) — both are live end-screen rules, consolidate in `end.css`.

---

## @keyframes ownership

| Keyframe | Used by | Decision |
|----------|---------|----------|
| `@keyframes cardEnter` (85–94) | `.card` (slides), `.combo-summary` (dead→end), `.guild-columns` (end), `.session-next` (dead→end), `.welcome` (welcome) | **SHARED → stays in `style.css`** |
| `@keyframes buttonFadeIn` (96–105) | `.done-button` only (slides) | **→ `slides.css`** |
| `@keyframes gas-spin` (817) | `#gas-fan-btn.spinning svg` | **SHARED → stays in `style.css`** |

---

## Rule-by-rule mapping

### `style.css` (shared — keep these rules)

| Lines | Rule |
|-------|------|
| 1–11 | `@font-face` (GoudyMediaeval, both weights) |
| 13–23 | `:root` (CSS custom properties) |
| 25–31 | `*, *::before, *::after` (box-sizing reset) |
| 33–35 | `button, input, select, textarea` (font inherit) |
| 37–42 | `html` |
| 44–55 | `body` |
| 57–64 | `#gas` |
| 66–77 | `#app` |
| 85–94 | `@keyframes cardEnter` ← SHARED |
| 619–626 | `footer` |
| 629–650 | `.settings-gear-btn`, `:hover`, `:active` |
| 653–659 | `.settings-backdrop` |
| 662–679 | `.settings-panel` |
| 681–683 | `.settings-panel[hidden]` |
| 685–687 | `.settings-backdrop[hidden]` |
| 689–695 | `.settings-title` |
| 697–714 | `.settings-close-btn`, `:hover` |
| 716–719 | `.settings-version` |
| 721–727 | `.settings-trace-container`, `[hidden]` |
| 729–731 | `.settings-trace-link` |
| 733–755 | `.settings-github-link`, `:hover`, `.settings-github-icon`, `hover icon` |
| 757–761 | `.settings-divider` |
| 763–780 | `.settings-reset-btn`, `:hover` |
| 782–791 | `.trace-link`, `:hover` |
| 795–817 | `.gas-btn`, `:hover`, `:active`, `#gas-fan-btn`, `#gas-stop-btn`, `#gas-stop-btn.stopped`, `#gas-fan-btn.spinning svg`, `@keyframes gas-spin` |

**Remove from style.css:** all rules not in the above list (they move to page-specific files).

---

### `welcome.css` (new file)

| Lines | Rule |
|-------|------|
| 560–571 | `.welcome` |
| 573–578 | `.welcome-heading` |
| 580–584 | `.welcome-instructions` |
| 586–595 | `.welcome-instructions-list` |
| 597–608 | `.welcome-button` |
| 610–613 | `.welcome-button:hover` |
| 615–617 | `.welcome-button:active` |

---

### `slides.css` (new file)

All rules scoped to the quiz/card session. The three scattered `#app.app--quiz-active` rules should be consolidated.

| Lines | Rule |
|-------|------|
| 80–83 | `#app.app--quiz-active` (max-width override) ← **consolidate** |
| 96–105 | `@keyframes buttonFadeIn` |
| 107–119 | `.card` |
| 121–127 | `.card-pips` |
| 129–138 | `.card-name` |
| 140–142 | `.card-name-hidden` |
| 144–147 | `.progress-counter` |
| 149–164 | `.control-button`, `:hover` |
| 167–179 | `.done-zone` |
| 182–189 | `.done-zone-left` |
| 191–205 | `.done-button` |
| 207–210 | `.done-button.button-visible` |
| 212–220 | `.done-button:hover`, `:active` |
| 820–826 | `.card--with-image` |
| 828–832 | `.card-image-column` |
| 834–839 | `.mtg-card-img` |
| 841–846 | `.card-quiz-column` |
| 848–856 | `@media (max-width: 500px)` `.card--with-image`, `.mtg-card-img` |
| 859–861 | `#app.app--quiz-active` (gap: 0) ← **consolidate with 80–83** |
| 863–867 | `#app.app--quiz-active .card` |
| 870–875 | `#app.app--quiz-active .card--with-image` |
| 877–880 | `#app.app--quiz-active .card-image-column` |
| 882–887 | `#app.app--quiz-active .mtg-card-img` |
| 889–891 | `#app.app--quiz-active .card-quiz-column` |
| 893–895 | `#app.app--quiz-active .card-name` |
| 897–900 | `#app.app--quiz-active .card-pips .mana-pip` |
| 903–905 | `#app.app--quiz-active .card:not(.card--with-image)` |
| 907–909 | `#app.app--quiz-active .card:not(.card--with-image) .card-name` |
| 911–913 | `#app.app--quiz-active .card:not(.card--with-image) .card-pips .mana-pip` |
| 917–919 | `#app.app--quiz-active` (padding-bottom: 80px) ← **consolidate with 80–83** |
| 922–947 | `@media (max-width: 600px)` all `#app.app--quiz-active` responsive overrides |

**Consolidation note:** Merge lines 80–83, 859–861, and 917–919 into a single `#app.app--quiz-active { }` block at the top of `slides.css`:
```css
#app.app--quiz-active {
  max-width: 100%;
  padding: 1rem;
  gap: 0;
  padding-bottom: 80px;
}
```

---

### `assessment.css` (new file)

| Lines | Rule |
|-------|------|
| 245–251 | `.self-assessment` |
| 253–257 | `.self-assessment-prompt` |
| 259–265 | `.self-assessment-buttons` |
| 267–278 | `.self-assessment-button` |
| 280–283 | `.self-assessment-button:hover` |
| 285–287 | `.self-assessment-button:active` |

---

### `end.css` (new file)

Dead rules are **deleted** (not moved). Live rules are moved here.

| Lines | Rule | Status |
|-------|------|--------|
| 222–232 | `.session-end` | LIVE |
| 234–238 | `.session-end-count` | LIVE |
| 240–243 | `.session-end-label` | LIVE |
| 289–296 | `.combo-summary` | **DELETE (dead)** |
| 298–302 | `.combo-summary-heading` | **DELETE (dead)** |
| 304–310 | `.combo-summary-list` | **DELETE (dead)** |
| 312–318 | `.combo-summary-item` | **DELETE (dead)** |
| 320–325 | `.combo-summary-pips` | LIVE |
| 327–330 | `.combo-summary-pips .mana-pip` | LIVE |
| 332–334 | `.combo-summary-name` | LIVE |
| 336–342 | `.session-next-divider` | **DELETE (dead)** |
| 344–353 | `.session-next` | **DELETE (dead)** |
| 355–359 | `.session-next-label` | **DELETE (dead)** |
| 361–365 | `.session-next-buttons` | **DELETE (dead)** |
| 368–379 | `.next-session-button` | LIVE |
| 381–383 | `.next-session-button:hover` | LIVE |
| 385–387 | `.next-session-button:active` | LIVE |
| 390–393 | `.next-session-button--primary` | LIVE |
| 395–398 | `.next-session-button--primary:hover` | LIVE |
| 401–408 | `.guild-columns` | LIVE |
| 410–414 | `@media (max-width: 480px) .guild-columns` | LIVE |
| 416–420 | `.guild-column` | LIVE |
| 422–428 | `.guild-column-header` | LIVE |
| 430–434 | `.guild-column-explanation` | LIVE |
| 436–438 | `.guild-column--locked .guild-column-explanation` | LIVE |
| 440–444 | `.guild-column-list` | LIVE |
| 446–452 | `.guild-column-item` (display/padding rule) | LIVE — **consolidate** |
| 454–459 | `.guild-column-item .combo-summary-pips` | LIVE |
| 461–464 | `.guild-column-item .combo-summary-pips .mana-pip` | LIVE |
| 466–468 | `.guild-column-item .combo-summary-name` | LIVE |
| 470–472 | `.guild-column-button` | LIVE |
| 474–476 | `.guild-column--locked .guild-column-button` | LIVE |
| 478–482 | `.guild-column--locked` | LIVE |
| 484–490 | `.allied-color-wheel, .enemy-color-wheel` | LIVE |
| 492–495 | `.allied-color-wheel .ally-line, .enemy-color-wheel .enemy-line` (cursor) | LIVE |
| 498–501 | `.ally-line-vis` | LIVE |
| 503–506 | `.enemy-line-vis` | LIVE |
| 508–513 | `.allied-color-wheel .color-node, .enemy-color-wheel .color-node` | LIVE |
| 516–519 | `.guild-column--has-highlight .ally-line:not(.highlight) .ally-line-vis` etc. | LIVE |
| 521–524 | `.guild-column--has-highlight .allied-color-wheel .color-node:not(.highlight)` etc. | LIVE |
| 526–528 | `.guild-column--has-highlight .guild-column-item:not(.highlight)` | LIVE |
| 531–535 | `.ally-line.highlight .ally-line-vis, .enemy-line.highlight .enemy-line-vis` | LIVE |
| 537–540 | `.color-node.highlight` | LIVE |
| 542–547 | `.guild-column-item` (transition/border-radius rule) | LIVE — **consolidate with 446–452** |
| 549–552 | `.guild-column-item.highlight` | LIVE |
| 555–558 | `#crest-image, #crest-image-enemy` | LIVE |

**Consolidation note:** Merge `.guild-column-item` at lines 446–452 and 542–547 into a single block:
```css
.guild-column-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0;
  font-size: 1rem;
  transition: background 0.2s ease, opacity 0.2s ease;
  border-radius: 6px;
  padding-left: 0.35rem;
  padding-right: 0.35rem;
}
```

---

## Summary: dead CSS count

**8 rules deleted** (none moved):
- `.combo-summary`, `.combo-summary-heading`, `.combo-summary-list`, `.combo-summary-item`
- `.session-next-divider`, `.session-next`, `.session-next-label`, `.session-next-buttons`

---

## Implementation checklist for Developer

1. Create `welcome.css` — move the 7 welcome rules
2. Create `slides.css` — move slides rules, consolidate 3× `#app.app--quiz-active`
3. Create `assessment.css` — move the 6 self-assessment rules
4. Create `end.css` — move live end rules, consolidate 2× `.guild-column-item`, delete 8 dead rules
5. Trim `style.css` — remove all moved/deleted rules
6. Update `index.html` — add `<link>` tags for all 4 new CSS files (welcome.css, slides.css, assessment.css, end.css). Keep `style.css` first.
7. Verify no rules remain in `style.css` that belong to a page file

---

## card-back.css verdict

`card-back.css` is linked only from `card-back-demo.html`, which is a standalone demo unrelated to the app. It is **not part of this split**. Leave it as-is.
