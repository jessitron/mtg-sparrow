# Small Arc Studio

## Arc Types & Requirements

Arcs are the unit of delivery at Small Arc Studio.

Every arc:

- Has a clear intention
- Produces observable change
- Is testable and verifiable
- Reduces risk or increases clarity
- Fits within the current Direction

The larger circle may evolve.  
An arc must deliver.

---

# 1. User Arc

## Purpose

Deliver new or improved user-visible behavior.

## Examples

- New feature
- Improved UX flow
- Validation logic
- Performance improvement users can perceive
- Bug fix affecting user workflows

## Observable Outcome

A user can:

- Do something new
- Complete a workflow differently
- Experience improved responsiveness
- Avoid a previously encountered failure

The change must be observable in runtime behavior.

## Required Verification

- Unit tests for core logic
- Integration tests for system boundaries
- End-to-end tests for critical workflows (when applicable)
- Acceptance criteria clearly defined and satisfied

## Observability Requirements

- Traces must reflect the new or changed behavior.
- Feature usage must be queryable in Honeycomb.
- Relevant attributes must allow filtering by feature or path.
- Production behavior must be explorable, not assumed.

An arc is incomplete if the behavior cannot be observed in runtime signals.

---

# 2. Operator Arc

## Purpose

Improve operability, reliability, performance, safety, or debuggability.

## Examples

- Introduce structured tracing
- Add or improve instrumentation
- Establish SLO tracking
- Improve deploy safety
- Add feature flags
- Reduce error rate or latency

## Observable Outcome

Operators can:

- Ask new questions of the system
- Detect issues earlier
- Measure behavior previously invisible
- Reduce operational risk

## Required Verification

- Tests for any behavior changes
- Validation of instrumentation correctness
- Demonstration of new or improved queries, dashboards, or signals
- Proof that runtime questions can now be answered

## Observability Requirements

Operator arcs are observability-forward.

They must:

- Introduce or improve meaningful runtime signals
- Provide query examples in Honeycomb
- Demonstrate that blind spots have been reduced

If no new insight is possible after the arc, it is not complete.

---

# 3. Structural Arc

## Purpose

Improve architecture, boundaries, maintainability, or internal clarity without changing intended user-visible behavior.

## Examples

- Extract a module boundary
- Replace a data access layer
- Reduce coupling
- Simplify state management
- Remove duplication
- Improve internal performance characteristics

Structural arcs are not cosmetic refactors.  
They must strengthen the system.

## Observable Outcome

Structural change must produce at least one of:

- Measurable complexity reduction
- Improved testability
- Performance improvement
- Clearer architectural boundaries
- Runtime visibility distinguishing structural versions

Structural arcs cannot be invisible work justified by assertion alone.

## Required Verification

- Tests proving intended behavior remains correct
- Before/after explanation of structural change
- Confirmation that runtime behavior is preserved or improved
- Decision log entry explaining rationale and tradeoffs

## Minimal Observability Requirement

Every Structural Arc must introduce a runtime marker distinguishing versions.

At minimum:

- A span attribute or event attribute indicating structural version
- Example: `component.version = "auth_v2"`
- The attribute must be queryable in Honeycomb
- The attribute must allow comparison across versions

Version attributes are treated as historical markers.

They remain:

- Until rendered irrelevant by later structural change
- Or until deliberately removed through a documented decision to reduce attribute surface area

Structural evolution must be visible in traces.

---

# Arc Completion Standard

An arc is complete when:

- Behavior works as intended.
- Tests pass.
- Acceptance criteria are satisfied.
- Observability confirms the change.
- The Librarian records the decision and reasoning.
- The next arc is visible.

No arc is complete without evidence.

---

# Observability Principle

If users cannot see the change, operators must.

If operators cannot see the change, the arc is incomplete.
