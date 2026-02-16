mmo# Small Arc Studio

## Process of Work

We practice Graceful Development.

We work in structured stages:

0. RFP (Discovery & Framing)
1. SOW (Structured Plan of Arcs)
2. Establish Direction
3. Deliver Arcs
4. Reflect and Adapt

The larger circle evolves.  
Each arc delivers.

---

# Stage 0: RFP (Discovery & Framing)

The RFP stage is planning-only.

We do not build production features.  
Our domain experts ('hire' one for each domain) do research on the domain, and work with the designer to come up with ideas.
The architect asks the user for constraints and outlines the technical effort.
We may conduct small exploration spikes or prototype screens if explicitly defined.

There is a lot of discussion with the client at this phase. The client wants to hear the ideas from our team, including domain experts and designer.

## Goals of the RFP

- Clarify the problem space
- Identify stakeholders and users
- Surface constraints and assumptions
- Identify risks and unknowns
- Explore architectural approaches
- Assess feasibility

## RFP Output

The RFP produces a Proposal document including:

- Executive Summary
- Problem Statement
- Goals and Non-Goals
- Constraints and Assumptions
- Risks and Unknowns
- Architectural Options (with tradeoffs)
- Recommended Approach
- Observability Plan
- Testing Strategy
- Initial Arc Candidates
- Rough sizing guidance

The RFP does not commit to a delivery sequence. Review this with the client.

---

# Stage 1: SOW (Statement of Work)

The SOW translates the proposal into a structured arc plan.

This is a professional planning artifact suitable for contract approval.

The SOW does not have to encompass the entire project, only the arcs we know enough to tentatively plan.

## The SOW Includes:

- Engagement scope
- Objectives
- Success criteria
- Assumptions and exclusions
- Roles and responsibilities
- Communication cadence
- Deliverables defined as planned arcs
- Estimated arc groupings (phases)
- Payment milestones (if applicable)
- Change management approach - how tasks are tracked

---

## Arc Planning in the SOW

The SOW defines a **tentative sequence of arcs**, grouped into phases.

Each planned arc includes:

- Arc Name
- Type (User / Operator / Structural). See ARC_TYPES.md
- Intention
- Observable Outcome
- Acceptance criteria (high level)
- Expected risk reduction or learning

These arcs are directional commitments, not rigid feature lock-ins.

We explicitly state:

- Arc sequencing may evolve.
- Direction may adjust based on learning.
- Completed arcs remain complete and valuable even if direction shifts.

The SOW defines structure without freezing discovery.

---

# Stage 2: Deliver Arcs

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

# Stage 4: Verify and Demonstrate

An arc is complete when:

- All work is committed to git
- Behavior works.
- Tests pass.
- It has been run in a real browser by the tester. No really, in a browser. It's OK to start one up, either headless or headed.
- Tracing in Honeycomb confirms the change.
- We can answer at least one meaningful new question about the system.
- Acceptance criteria are satisfied.
- Decisions are recorded.

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

# Stage 5: Reflect and Adapt

After each arc:

- What did we learn?
- Did risk decrease?
- Should Direction shift?
- Should future arcs be reshaped?

The SOW may be amended if Direction meaningfully changes.

Amendments are explicit.

We do not drift silently.

---

# Narrative Continuity

The Librarian maintains:

- RFP record
- Approved SOW
- Arc history
- Decision log
- Direction changes
- Lessons learned

This preserves coherence across adaptation.

---

# Process Principles

- Discovery before commitment.
- Structured planning before execution.
- One active arc at a time.
- No invisible work.
- No speculative complexity.
- No delivery without verification.
- No silent scope drift.

We move in small arcs.

We plan responsibly.

We adapt deliberately.
