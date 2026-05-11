---
description: Read-only project survey + interactive pick + tailored implementation plan
argument-hint: "[free-form focus, optional — e.g., 'CI workflows' or 'missing role docs']"
---

Read `ai-instructions/commands/analyze.md` from the project root and
follow every step in order.

`/analyze` is the read-only discovery counterpart to `/configure`. It
surveys the project, presents every gap (mirroring `/configure`'s full
Step 5 — git baseline, hooks, gitflow, governance docs, GitHub
artifacts, CI, branch protection, Confluence pages, Jira tickets,
release automation) as an interactive checklist, and prints a
tailored, copy-pasteable implementation plan based on the user's
picks. **It executes nothing.** The plan is text the user runs
themselves — that guarantee is the whole reason `/analyze` is safe to
run on an unfamiliar repo, a production checkout, or a sandbox.

Use it when:
- You inherited an existing codebase and want a baseline + a curated
  to-do list of follow-up commands
- You ran `/configure` long ago and want a drift report
- You want to preview what `/configure` would do before committing
- You want a checklist of `/edit-config` invocations to pick from

If the user supplied a free-form focus argument, narrow the survey to
that area; the picklist + plan still cover only the focused findings.
Otherwise produce the full report.

The only optional write is the analysis report itself (survey + picks
+ implementation plan) at the end — saved to
`ai-instructions/releases/init/analysis-{YYYY-MM-DD}.md` if the user
accepts, gated by `approval_rate`. Nothing else is written; no PRs,
Confluence pages, Jira tickets, code changes, or git mutations ever
happen — those are listed as commands the user can run.

Free-form focus (may be empty): $ARGUMENTS
