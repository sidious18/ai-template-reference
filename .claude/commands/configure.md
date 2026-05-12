---
description: Configure a new project — decisions, gitflow, hooks, CI, docs (run before /bootstrap)
argument-hint: "[core|full|custom]"
---

Read `ai-instructions/commands/configure.md` from the project root and follow
every step in order. Do not skip steps.

`/configure` is the **first** command on a new project. It runs before
`/bootstrap` and produces the decision record (`ai-instructions/configure.json`)
plus the real workflow artifacts (git config, hooks, CI workflows, onboarding
and gitflow docs, SECURITY / CONTRIBUTING, branch protection). `/bootstrap`
reads `configure.json` and skips its own discovery.

`/configure` is **discovery-driven, no defaults**: project kind, modules,
team roles, stack — all come from the requirements scan + dialogue with the
user. The template makes no assumption that a project is a web app with
backend + frontend; it could equally be a library, CLI, IaC tree, mobile
app, data pipeline, documentation site, monorepo, or something custom. The
Hard Requirements (MCP-only integration; lowercase-hyphen naming; modules
declared explicitly) and per-step instructions live in
`ai-instructions/commands/configure.md` — read them there.

If an argument is supplied, it selects the scope: `core`, `full`, or
`custom`. If empty, ask the user in Step 2.

Requested scope (may be empty): $ARGUMENTS
