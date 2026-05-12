---
description: Create a new release — BA discovery, task list, implementation
argument-hint: "[name]"
---

Read `ai-instructions/commands/new-release.md` from the project root and follow
every step in order. The release name, if any, is below.

Placement and naming rules that apply to every release (the canonical
versions live in the detailed instruction file and `bootstrap.md` Hard
Rules R1–R3):

- New code lives **only inside paths declared in
  `ai-plugins.json.layout.modules[]`**. The module set was decided during
  `/configure`; do not invent backend/frontend or any other module the
  manifest doesn't list. If the project genuinely needs a new module,
  re-run `/configure` to declare it before writing files.
- Folder and file names use **lowercase letters, digits, and hyphens only**.
  No parentheses, brackets, spaces, ampersands, underscores in directory
  names, or other punctuation. This applies to the release folder itself
  (`releases/<name>/`), to any new source directories, and to every file
  you create.
- Independent modules (`independent: true`) stay independent — own manifest,
  own dependencies, own test command. Cross-module imports between
  independent modules are forbidden; communicate over an explicit boundary.

If the argument contains disallowed characters, normalize it to lowercase and
replace any punctuation/whitespace with single hyphens before creating the
folder.

Release name (may be empty): $ARGUMENTS
