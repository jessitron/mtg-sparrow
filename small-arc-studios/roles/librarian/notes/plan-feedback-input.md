# Plan: Feedback Input

## Section 1: Discovery

### Problem Statement

Users of MTG Colors have no way to send feedback from within the app. Before wider publishing, we need a lightweight channel for users to tell us what's working, what's confusing, or what they want. This should be frictionless — no account required, no external service.

### Goals

- Let users submit freeform feedback from any page
- Capture feedback as a Honeycomb event in the `sparrow-deck` dataset, correlated with the user's session
- Keep the UI minimal and consistent with the existing menu

### Non-Goals

- Building a feedback dashboard or response system
- Requiring authentication or email verification
- Supporting file/image attachments
- Storing feedback anywhere other than Honeycomb

### Domain Research

The hamburger menu currently has: About, Share, Reset Progress, Current trace. Adding "Feedback" between Share and Reset Progress gives it a natural home — it's a positive action (like Share), not a destructive one (like Reset).

A modal form is the right pattern here: it needs text input space that doesn't fit in the menu panel, and it's a focused task (write feedback, submit, done).

### Constraints & Technical Readiness

- No backend — feedback goes directly to Honeycomb as a telemetry event
- The existing telemetry module (`startSpan`/`endSpan`) handles event emission
- Modal pattern doesn't exist yet in the app — we'll need to build one, but it's straightforward DOM + CSS
- Rate limiting: client-side only (disable submit briefly after sending). Acceptable for current scale.

### Risks & Unknowns

- **Low risk**: Honeycomb event size limits. Freeform text capped at 500 chars keeps us well within bounds.
- **Low risk**: Spam. Pre-publish audience is tiny. Client-side rate limit is sufficient for now.
- **Unknown**: Will users actually use it? That's what observability will tell us.

### Architectural Approach

- Add a "Feedback" button to `injectMenuDOM()` in `src/ui/settings.ts`
- Create `src/ui/feedback.ts` — modal DOM creation, form handling, submission logic
- Feedback submission emits a span: `feedback.submit` with attributes for the message text, optional email, session ID, and current page
- Modal follows existing app patterns: backdrop dismissal, Escape key, accessible markup

**Alternative considered**: Inline form in the menu panel. Rejected — the menu panel is narrow and the text area needs room. A modal is more focused.

**Alternative considered**: External form (Google Forms, Typeform). Rejected — breaks the in-app experience and loses session correlation.

### Observability Strategy

- `feedback.submit` span with attributes:
  - `feedback.message` — the user's text (≤500 chars)
  - `feedback.email` — optional, empty string if not provided
  - `feedback.page` — which page they were on
  - `feedback.session_id` — correlates with their session
  - `feedback.message_length` — for quick aggregation
- Queryable questions:
  - "How many feedback submissions this week?"
  - "What pages generate the most feedback?"
  - "What are users saying?" (string column search)

### Testing Strategy

- E2E: Open menu → click Feedback → fill form → submit → verify "Thanks" confirmation appears
- E2E: Verify Honeycomb receives the `feedback.submit` event with expected attributes
- E2E: Verify modal dismissal (Escape key, backdrop click, close button)
- E2E: Verify empty message cannot be submitted

---

## Section 2: Arcs

### Arc 41: Feedback Modal & Telemetry — COMPLETE (86/86 PASS)

**Type**: User

**Intention**: Let users submit freeform feedback from the hamburger menu, captured as a Honeycomb event.

**Observable Outcome**: A user can open the menu, click "Feedback", type a message, optionally provide an email, and submit. The feedback appears in Honeycomb as a `feedback.submit` span with message content and session context.

**Acceptance Criteria**:
- "Feedback" button appears in menu between Share and Reset Progress
- Clicking it opens a modal with: text area (500 char limit with counter), optional email field, Submit button
- Submit sends a `feedback.submit` span to Honeycomb with message, email, page, session_id, message_length
- After submit, modal shows "Thanks for your feedback!" confirmation
- Submit button disabled while sending and for 3 seconds after (rate limit)
- Empty message cannot be submitted (Submit disabled when textarea empty)
- Modal dismissable via close button, backdrop click, or Escape key
- Modal is accessible (focus trap, aria attributes, keyboard navigation)

**Observability Plan**:
- New span: `feedback.submit`
- Attributes: `feedback.message`, `feedback.email`, `feedback.page`, `feedback.session_id`, `feedback.message_length`
- Verify in Honeycomb: query for `feedback.submit` spans, confirm attributes present
- Question answered: "Are users submitting feedback, and what are they saying?"

**Risks Reduced**: Removes the gap between users experiencing issues and the team knowing about them.

**Expected Learning**: Whether the modal pattern works well in this app, and whether users engage with in-app feedback.

### Communication Cadence

Single arc — demonstrate after completion, then assess whether follow-up is needed (e.g., feedback notification, dashboard).

---

## Completion Notes (2026-03-10)

Arc 41 delivered with additional scope beyond the original plan:
- **Context provider pattern**: Per-page feedback enrichment (slides card name, end section, assessment subgroup) added during implementation for richer signal.
- **Dialog pause coordination**: Slideshow pause/resume on dialog open/close (counter-based, preserves manual pause state).
- **Spacebar fix**: Input field interception bug fixed as part of modal integration.
- **Decisions recorded**: DEC-143 through DEC-146.
- **Test coverage**: 86/86 PASS across three test files.
