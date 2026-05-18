---
description: Bootstrap the AI instruction pack for this project
argument-hint: ""
---

Read `ai-instructions/bootstrap/bootstrap.md` from the project root and follow
every step in order. Do not skip steps.

Bootstrap configures the instruction pack for this project's stack. It does NOT
implement any code — code implementation happens through `/tmpl-release-new`.

Bootstrap is **faithful, not opinionated** — it consumes
`ai-instructions/configure.json` verbatim and produces output that mirrors
exactly what the user declared during `/tmpl-setup`. It does not add modules,
roles, or technologies that aren't in the decision record. The Hard Rules
(R1–R3) and the per-step instructions live in
`ai-instructions/bootstrap/bootstrap.md` — read them there; do not assume a
particular project shape (web app, library, IaC, mobile, docs, etc.) from
this wrapper.

$ARGUMENTS
