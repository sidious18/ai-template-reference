---
description: Edit an existing release — update requirements and code
argument-hint: "[name]"
---

Read `ai-instructions/commands/tmpl-release-edit.md` from the project root and
follow every step in order.

Placement and naming rules that still apply when adding new code or files as
part of the edit:

- New or moved code stays inside paths declared in
  `ai-plugins.json.layout.modules[]`. Do not introduce modules not already
  in the manifest — re-run `/tmpl-setup` to add a module first.
- File and folder names use lowercase letters, digits, and hyphens only — no
  parentheses, brackets, spaces, or other punctuation.
- Independent modules (`independent: true`) keep their own manifests and do
  not cross-import.

Release name (may be empty): $ARGUMENTS
