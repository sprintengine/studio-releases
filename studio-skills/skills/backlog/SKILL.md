---
name: backlog
description: Work, create, or triage Multicode Backlog items and epics. Use when the user invokes this skill, drags a backlog/ file into an agent terminal, or asks to pick up, add, or triage backlog work.
---

# Backlog

Items are markdown files filed under the epic they belong to —
`backlog/<epic-slug>/<item>.md` — or `backlog/unfiled/` when they have no epic.
Epic definitions stay at `backlog/epics/<epic-slug>.md`. Each file's frontmatter
is the source of truth for its lifecycle; `.multi-code/` is app-owned, never
edited by hand. Use the `backlog.*` MCP tools for mutations so timestamps stay
app-owned; without them, edit frontmatter directly and drop the `updated:` line
rather than inventing a timestamp.

**The file.** Frontmatter is a flat block of `key: value` scalars — no nested
YAML, no lists, no quotes needed. Unknown keys are preserved, so nothing you add
by hand is lost.

```yaml
---
type: feature        # epic | feature | bug | mockup | spike
status: idea         # idea | ready | in_progress | needs_input | completed | archived
difficulty: m        # xs | s | m | l | xl              effort to build
criticality: high    # low | normal | high | critical   impact if it is missing
risk: normal         # low | normal | high              likelihood it breaks something
epic: auth-revamp    # optional; the epic file's name stem
dependsOn: token-rotation, session-expiry   # optional; comma-separated sibling slugs
mockups: backlog/mockups/2026-07-06-x.html  # optional; comma-separated project-relative paths
---

# Title as a single H1

What, why, user impact, and anything needed to understand the request.
```

`type` is the only field OKF requires; fill the rest only where you can do so
honestly — an unsized, untriaged capture is a calm state, not a defect, and a
guessed `criticality` is worse than none. `risk` is a separate axis from
`difficulty`: how likely the change is to break something, not how big it is.

Three fields are the app's to write, never yours. **`id:`** is a workspace-global
integer allocated once and never changed — omit it and the scan assigns one; the
`KEY-<id>` you see in the panel is composed from it at render time.
**`updated:`** is a precise UTC instant the app stamps on every real mutation.
And `sprints`, `pr`, `starred` and `highlight` are written by the app when a
sprint runs, a pull request opens, or somebody stars the row.

On an epic file, `dependenciesPlanned: true` is the one extra field — see below.

**Work.** The item is your brief — read it whole, and read any mockup it
attaches. Before implementing, check it against the current code: items drift,
and a stale one describes a design that no longer fits. Where it has drifted, fix
the item first and say what you changed, so the record stays true. Set it
`in_progress` when you start, `needs_input` with the actual question if you get
blocked, and `completed` only on verified work — if you stop early, leave it
`in_progress` and say where you stopped. After each chunk, re-read what you wrote
for contracts you did not honour, gaps you left, and tests you owed.

**Work an epic.** Same for every child, in the order their `dependsOn` implies,
each one aware of the others: they share files, and two correct changes can still
collide. Skip children that are `completed`, `archived`, or `idea`. Never write a
status onto the epic file — it derives from its children. Review each child as
you finish it, before starting the next: a subagent over that child's diff for
implementation gaps against its acceptance and bugs introduced. Fix what stands.
At the end, review the whole run again — the per-child passes cannot see across
children. Spawn subagents, concurrently, one lens each: implementation gaps
against every child's acceptance; bugs introduced; seams, where the contracts
between children must hold as written; and ripple, what each change affects
elsewhere in the epic. Seam and ripple reviewers get the whole diff, never a
slice. Brief each to assume the work is broken and prove otherwise. Dismiss no
finding without evidence that refutes it; fix or record every one that stands.
Without a subagent mechanism, review from a fresh session. Judge the result
against what the epic said it was for.

**Plan an epic's order.** Planning happens here, not in the sprint engine — the
engine executes tasks in the dependency order the epic declares. When authoring
or finishing an epic: add `dependsOn:` edges between children wherever order
matters (comma-separated sibling slugs), and when the ordering is deliberate and
complete — including "no edges, these run in parallel" — set
`dependenciesPlanned: true` on the epic's frontmatter as the last act, by hand or
with `backlog.update {path, dependenciesPlanned: true}`. That flag is what lets a
sprint start from the epic with no planning agent; without it, a sprint plans the
epic again before any work starts. Nothing recomputes it, so changing which items
belong to the epic is your cue to re-check the order and the flag.

**Create.** Write the file yourself — no tool needed. Put it in its epic's
folder, or `backlog/unfiled/` if it has none. Name it
`<YYYY-MM-DD>-<slug>.md`, and pick a slug unused anywhere in `backlog/`:
`dependsOn:` and `epic:` address an item by filename stem alone, so two items
sharing one collide on every pointer aimed at either. Then the frontmatter above,
a `# Title`, and the body.

**Triage.** Judge every non-archived item against the current codebase: still
worth doing, already built, overtaken, or simply mis-statused. Report them
grouped with a one-line reason and a proposed action each, change nothing yet,
and apply only what the user approves. If you cannot tell whether an item still
matters, say so rather than guessing it away.

Invoked with no argument, survey instead: list what is open, rank it, and ask
which to take — never pick silently.
