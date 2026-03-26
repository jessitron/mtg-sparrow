# Small Arc Studio

## Process of Work

We practice Graceful Development.

We work in structured stages:

0. Plan (Discovery, Framing & Arc Definition)
1. Establish Direction
2. Deliver Arcs
3. Reflect and Adapt

The larger circle evolves.
Each arc delivers.

---

# Stage 0: Plan

The Plan stage combines discovery and structured planning into a single document.

We do not build production features during planning.
Our domain experts research the domain and work with the designer to come up with ideas.
The architect asks the user for constraints and outlines the technical effort.
We may conduct small exploration spikes or prototype screens if explicitly defined.

There is a lot of discussion with the client at this phase. The client wants to hear the ideas from our team, including domain experts and designer.

## Plan Output

The Plan produces a single document with two sections:

### Section 1: Discovery

- Problem Statement — why are we doing this
- Goals and Non-Goals
- Domain research and exploration
- Constraints, assumptions, and technical readiness
- Risks and unknowns
- Architectural approach (with alternatives considered and rejected)
- Observability strategy
- Testing strategy

This section is conversational and concise. It captures the creative and exploratory work of the team.

### Section 2: Arcs

- Planned arc sequence, grouped into phases
- Each arc includes:
  - Arc Name
  - Type (User / Operator / Structural). See ARC_TYPES.md
  - Intention
  - Observable Outcome
  - Acceptance criteria (high level)
  - Expected risk reduction or learning
- Communication cadence — when to pause for client review
- Change management — how we track decisions

These arcs are directional commitments, not rigid feature lock-ins.

We explicitly state:

- Arc sequencing may evolve.
- Direction may adjust based on learning.
- Completed arcs remain complete and valuable even if direction shifts.

The Plan defines structure without freezing discovery.

## What stays in the process docs (not repeated in each Plan)

- Roles and responsibilities (see ROLES.md)
- Definition of Done (see below)
- Payment milestones (if applicable, handled separately)

## Client Approval

The Plan requires client approval before delivery begins.

This is one approval gate, not two. Discovery and arc definition are reviewed together.

---

# Stage 1: Deliver Arcs

We define and execute one active arc at a time.

Each arc must:

- Fit the current Direction
- Produce observable change
- Be small enough for predictable completion
- Reduce risk or increase clarity

We may update future planned arcs based on learning.

---

## Arc Definition (Delivery-Level Detail)

Arc Name:

Type:

Intention:

Observable Outcome:

Acceptance Criteria:

Tests Included:

- Unit
- Integration
- E2E

Observability Plan:

- What span/event changes?
- What attributes are added?
- What question will this help us answer?
- How will we verify this in Honeycomb?

Risks Reduced:

Expected Learning:

---

# Stage 2: Verify and Demonstrate

An arc is complete when:

- All work is committed to git
- Behavior works.
- Tests pass.
- It has been run in a real browser by the tester. No really, in a browser. It's OK to start one up, either headless or headed.
- Tracing in Honeycomb confirms the change.
- We can answer at least one meaningful new question about the system.
- Acceptance criteria are satisfied.
- Decisions are recorded.
- `APP_VERSION` in `src/version.ts` is bumped — this is a structural marker visible in traces and the settings panel.

To demonstrate this to the user:

- link to a trace in Honeycomb that was triggered by the tester.
- Tell the user how to run the script.

## Demonstration Cadence

**First Arc**: We always demonstrate the completed first arc to the client and wait for approval before proceeding. This establishes alignment and confidence.

**Subsequent Arcs**: After the first arc is approved, we list the upcoming planned arcs and ask the client when they would like us to pause for demonstration. The client may request:

- Checkpoints at specific arcs
- Pauses after each phase
- Pauses only when direction changes
- Continuous delivery with periodic summaries

We continue delivery between checkpoints while maintaining full verification standards for each arc.

---

# Stage 3: Reflect and Adapt

After each arc:

- What did we learn?
- Did risk decrease?
- Should Direction shift?
- Should future arcs be reshaped?

The Plan may be amended if Direction meaningfully changes.

Amendments are explicit.

We do not drift silently.

---

# Narrative Continuity

The Librarian maintains:

- Plan records (discovery and arc history)
- Arc outcomes
- Decision log
- Direction changes
- Lessons learned

This preserves coherence across adaptation.

---

# Process Principles

- Discovery before commitment.
- One document, one approval gate.
- One active arc at a time.
- No invisible work.
- No speculative complexity.
- No delivery without verification.
- No silent scope drift.

We move in small arcs.

We plan responsibly.

We adapt deliberately.
