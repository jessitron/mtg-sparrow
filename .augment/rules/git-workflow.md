---
type: always_apply
description: "Commit to git frequently"
---

# Git Workflow

Commit early and often. After every meaningful change — a completed arc, a
passing test reconciliation, a bug fix, a doc/notes update — stage and commit
right away with a clear, concise message. Do not batch many unrelated changes
into one commit, and do not leave finished work uncommitted.

- Prefer many small, focused commits over one large one.
- Write real commit messages that describe what changed and why (for arcs,
  reference the arc number and version).
- Use `git status` / `git diff` to confirm the change set before committing;
  avoid sweeping stray or scratch files into `git add -A`.
- `git add`, `git commit`, `git status`, `git diff`, and `git log` may run
  without asking.
- Do NOT `git push` without explicit permission from the client.
