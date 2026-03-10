# Arc 41: Feedback Modal & Telemetry

## Arc Details
- **Type**: User Arc
- **Date**: 2026-03-10
- **Status**: COMPLETE — 86/86 PASS — Shipped

## Intention
Let users submit freeform feedback from any page, captured as a Honeycomb event correlated with their session.

## Observable Outcome
A user can open the hamburger menu, click "Feedback", type a message (with optional email), and submit. The feedback appears in Honeycomb as a `feedback.submit` span with message content, session context, and page-specific state at the moment of submission.

## What Was Built

### Feedback Modal (`src/ui/feedback.ts`)
- Hamburger menu "Feedback" button placed between Share and Reset Progress
- Modal form: textarea (500 char limit + live character counter), optional email field ("so we can follow up"), Submit button
- On submit: `feedback.submit` span sent to Honeycomb with attributes from the context provider pattern
- Confirmation: "Thanks for your feedback!" shown in-modal, auto-closes after 2 seconds
- Rate limit: 3-second cooldown prevents rapid resubmission (Submit disabled during cooldown)
- Empty message cannot be submitted (Submit disabled when textarea is empty)
- Modal dismissable via close button, backdrop click, or Escape key

### Telemetry Attributes on `feedback.submit`
- `feedback.message` — the user's text (≤500 chars)
- `feedback.email` — optional, empty string if not provided
- `feedback.page` — which page they were on
- `feedback.session_id` — correlates with their session
- `feedback.message_length` — for quick aggregation
- `feedback.unlocked_levels` — all pages: number of unlocked subgroups
- Slides-specific: `feedback.slide.subgroup`, `feedback.slide.card_index`, `feedback.slide.card_count`, `feedback.slide.card_name`
- End-specific: `feedback.end.subgroup`, `feedback.end.cards`, `feedback.end.completed`, `feedback.end.assessment`, `feedback.end.current_section`, `feedback.end.selected_combo`
- Assessment-specific: `feedback.assessment.subgroup`, `feedback.assessment.cards`

### Slideshow Coordination
- Opening any dialog (settings menu or feedback modal) dispatches `dialog-open` custom event; closing dispatches `dialog-close`
- Slides page pauses on `dialog-open` and resumes on `dialog-close` using a counter (`dialogOpenCount`) to handle settings→feedback transitions
- `pausedByDialog` flag preserves the user's manual pause state

### Spacebar Fix
- Slides page spacebar handler checks `e.target.tagName` to skip TEXTAREA and INPUT elements, so typing a space in the feedback form does not advance slides

## Test Results
- `tests/arc41-feedback-modal.mjs` — 47/47 PASS
- `tests/arc41-dialog-pause.mjs` — 15/15 PASS
- `tests/arc41-feedback-context.mjs` — 24/24 PASS
- **Total: 86/86 PASS**

## Team
- **Developer**: Implemented feedback modal, context provider pattern, dialog pause coordination, spacebar fix.
- **Tester**: 86/86 PASS across all acceptance criteria.

## Acceptance Criteria — All Met

- [x] "Feedback" button appears in menu between Share and Reset Progress
- [x] Clicking it opens a modal with textarea (500 char limit + counter), optional email field, Submit button
- [x] Submit sends `feedback.submit` span to Honeycomb with message, email, page, session_id, message_length
- [x] After submit, modal shows "Thanks for your feedback!" confirmation, auto-closes after 2s
- [x] Submit disabled while sending and for 3 seconds after (rate limit)
- [x] Empty message cannot be submitted
- [x] Modal dismissable via close button, backdrop click, or Escape key
- [x] Per-page context enrichment (slides, end, assessment, welcome all register providers)
- [x] Dialog open pauses slideshow; dialog close resumes (preserves manual pause state)
- [x] Spacebar in textarea types space, does not advance slides

## Key Files
- `src/ui/feedback.ts` — feedback modal module, context provider pattern (new)
- `src/ui/settings.ts` — feedback button in menu, `wireFeedback()` call, dialog-open/close events
- `src/slides.ts` — `currentCardName` tracking, context provider, dialog pause/resume, Space key fix, `pause-btn` id
- `src/end.ts` — context provider registration
- `src/welcome.ts` — context provider registration
- `src/assessment.ts` — context provider registration
- `src/ui/guild-columns.ts` — `getEndPageContext()` export
- `src/progression.ts` — `getUnlockedSubgroups()` export
- `style.css` — feedback modal and button styles
- `tests/arc41-feedback-modal.mjs` — 47/47 PASS
- `tests/arc41-dialog-pause.mjs` — 15/15 PASS
- `tests/arc41-feedback-context.mjs` — 24/24 PASS

## Observability
- `feedback.submit` span is queryable in Honeycomb: "How many feedback submissions this week?", "What pages generate the most feedback?", "What are users saying?"
- Per-page context attributes allow filtering feedback by what the user was doing when they submitted

## Decisions
- DEC-143: Feedback goes to Honeycomb as telemetry, not external service — automatic session correlation, no backend needed
- DEC-144: Context provider pattern for per-page feedback enrichment — lazy evaluation captures state at submission time
- DEC-145: Dialog-open/close custom events for slideshow pause coordination — counter-based to handle overlapping dialogs
- DEC-146: Spacebar handler checks e.target.tagName to skip TEXTAREA/INPUT elements
