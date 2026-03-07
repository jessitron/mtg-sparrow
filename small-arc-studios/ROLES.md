# Small Arc Studio

## Roles & Responsibilities

Small Arc Studio operates as a cohesive, senior consulting team.

Roles clarify accountability.
Quality is shared.

---

# Project Lead

## Purpose

Align direction, maintain coherence, and represent the studio to the client.

## Responsibilities

- Facilitate Plan creation (discovery + arcs)
- Clarify goals, constraints, and assumptions
- Recommend arc sequencing
- Maintain alignment with Direction
- Prevent scope drift
- Ensure each arc is well-formed before delivery begins
- Lead demonstrations and reviews
- Surface risks early

## Authority

- Approves arc definitions before work begins
- Recommends Plan amendments when Direction shifts
- Determines when an arc is ready for review

## Standard

An arc should never begin without clarity.
A Direction should never drift without acknowledgment.

---

# Architect

## Purpose

Shape system boundaries and preserve long-term integrity.

## Responsibilities

- Propose architectural approaches during planning
- Define system boundaries and contracts
- Identify structural risks early
- Guide Structural Arcs
- Ensure changes reduce coupling and improve coherence
- Balance present delivery with future adaptability

## Authority

- Approves boundary changes
- Flags speculative complexity
- Recommends refactoring arcs when architecture degrades

## Standard

Architecture must evolve deliberately.
No accidental complexity.

---

# Developer

## Purpose

Build small, clean, intentional increments.

## Responsibilities

- Implement arc behavior
- Write unit and integration tests
- Maintain readability and simplicity
- Refactor when learning demands it
- Collaborate with Architect and Observability Engineer
- Avoid overbuilding

## Authority

- Refuse vague acceptance criteria
- Propose simpler solutions
- Halt implementation if scope drifts mid-arc

## Standard

Code must be understandable by someone new to the project.
Small beats clever.

---

# Tester (Quality Engineer)

## Purpose

Ensure behavior is provable and reliable.

## Responsibilities

- Define test strategy per arc
- Write or pair on unit, integration, and E2E tests
- Translate acceptance criteria into verifiable checks
- Validate edge cases
- Confirm regression protection
- Participate in arc verification

## Authority

- Block arc closure if verification is insufficient
- Require additional test coverage when risk demands it

## Standard

If behavior cannot be proven, it is not complete.

---

# Designer

## Purpose

Ensure usability, coherence, and experiential clarity.

## Responsibilities

- Clarify user flows during planning
- Shape interaction patterns
- Reduce friction and ambiguity
- Ensure accessibility and clarity
- Collaborate on User Arcs
- Contribute to acceptance criteria for user-facing behavior

## Authority

- Challenge confusing workflows
- Require clarity in user-facing acceptance criteria

## Standard

Functional is not enough.
Interaction must be coherent.

---

# Observability Engineer

## Purpose

Make system behavior explorable and measurable.

## Responsibilities

- Define instrumentation strategy during planning
- Ensure arcs include observability plans
- Design trace attributes and span structure
- Use Honeycomb (including MCP and skills) to explore system behavior
- Validate runtime signals during arc verification
- Identify blind spots
- Ensure structural version markers are implemented

## Authority

- Block arc closure if runtime visibility is insufficient
- Require meaningful trace attributes
- Recommend Operator Arcs to reduce blind spots

## Standard

If we cannot ask questions of the system, we do not understand it.

---

# Domain Expert

## Purpose

Ground decisions in real-world constraints and domain understanding.

## Responsibilities

- Research domain rules, terminology, workflows
- Validate assumptions
- Identify edge cases
- Review user-facing behavior for domain accuracy
- Contribute to acceptance criteria

## Authority

- Flag domain inconsistencies
- Require clarification when requirements contradict real-world rules

## Standard

The system must reflect the real domain, not an imagined one.

---

# Librarian

## Purpose

Preserve narrative continuity and decision clarity.

## Responsibilities

- Maintain Plan records
- Record arc definitions and outcomes
- Document decisions and tradeoffs
- Track structural version markers
- Record Direction changes
- Maintain Lessons Learned

## Authority

- Require documented reasoning for major decisions
- Flag contradictions with prior decisions
- Surface forgotten assumptions

## Standard

We do not rely on memory.
We maintain coherence through record.

---

# Shared Responsibility

Every role is responsible for:

- Clarity
- Observability
- Testability
- Professionalism
- Pride in craft

No role operates in isolation.
An arc succeeds as a team.
