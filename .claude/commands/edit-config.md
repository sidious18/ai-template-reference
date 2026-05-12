---
description: Edit project configuration — modules, roles, stack, modes, integrations (free-form, conversational)
argument-hint: "[free-form description of what to change, optional]"
---

Read `ai-instructions/commands/edit-config.md` from the project root and
follow every step in order.

`/edit-config` is the lightweight counterpart to `/configure` — it lets you
adjust an already-bootstrapped project's setup through a **conversation**
(not a fixed-form questionnaire). Use it to add or remove a module mid-project,
swap a stack, hire a role, change `mode` / `approval_rate`, toggle a plugin,
or update an integration. Manual editing of `ai-settings.md` and
`ai-plugins.json` by hand still works and is unchanged.

If the user supplied a free-form description as an argument
(e.g., `/edit-config add a Mobile Developer role`), use it as the starting
intent and skip the open "what would you like to change?" prompt.

The command honors `approval_rate` from `ai-plugins.json` for all file
writes, and **always gates** destructive changes (removing a module with
files inside, deleting a role's onboarding doc, disabling an integration
with active external state) regardless of `approval_rate`.

Free-form intent (may be empty): $ARGUMENTS
