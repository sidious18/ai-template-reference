---
description: Verify ai-plugins.json — the project's AI instruction pack manifest
---

Verify that the project's AI instruction pack manifest is healthy. This is
the template's equivalent of `npm ci` / `npm install --dry-run`: it checks
that every declared plugin, command, and layout directory actually exists on
disk, and reports drift so the user can fix it before running a release
command.

## Steps

1. **Locate the manifest.** Read `ai-plugins.json` at the project root.
   - If the file is missing, stop and tell the user to run `/tmpl-bootstrap`.
   - If the file is present but does not parse as JSON, report the parse
     error with line/column and stop.

2. **Validate shape.** Check it conforms to
   `ai-instructions/ai-plugins.schema.json`. Report any schema violations
   (missing required keys, wrong types, names that do not match the
   lowercase-hyphen pattern, missing `layout.kind`, missing
   `layout.modules[]`, etc.).

3. **Check every declared path exists on disk.** For each:
   - `plugins.roles[].path`
   - `plugins.guides[].path`
   - `plugins.guidelines[].path`
   - `plugins.refactoring[].path`
   - `commands[].path`
   Report any path that does not resolve. Note whether the offending entry is
   `enabled: true` (blocker) or `enabled: false` (warning — user may want to
   remove the stale entry).

4. **Check the layout on disk.**
   - For each entry in `layout.modules[]`: the `path` should exist OR the
     project is greenfield (the path is planned for the first release) — in
     which case flag as "pending first release", not an error. When `manifest`
     is declared, check it exists too (greenfield exempt). When `tests` is
     declared, check it exists.
   - Any source file outside every declared module `path` AND not listed in
     `layout.exceptions` is a violation. Walk the project tree (excluding
     `.git/`, `node_modules/`, instruction-pack files, and other standard
     ignores) and report stragglers.
   - Any file or folder name within a declared module that is not
     lowercase-hyphen (contains spaces, parentheses, brackets, ampersands,
     underscores in directory names, etc.) is a naming violation.

5. **Cross-check against `ai-settings.md` and `AGENTS.md`.**
   - Every plugin referenced in `AGENTS.md` or `AI_INSTRUCTIONS.md` should
     have a matching entry in `ai-plugins.json`.
   - Every `[x]`-checked item in `ai-settings.md` should map to an
     `enabled: true` plugin in the manifest. Report drift either way.

6. **Present the report**:

   > **Plugin manifest verification**
   >
   > | Section      | Enabled | Disabled | Missing | Naming violations |
   > |---           |---      |---       |---      |---                |
   > | roles        |  {n}    |  {n}     |  {n}    |  {n}              |
   > | guides       |  {n}    |  {n}     |  {n}    |  {n}              |
   > | guidelines   |  {n}    |  {n}     |  {n}    |  {n}              |
   > | refactoring  |  {n}    |  {n}     |  {n}    |  {n}              |
   > | commands     |  {n}    |          |  {n}    |  {n}              |
   >
   > **Layout**: {ok / needs migration}
   > **Settings drift**: {none / list}
   >
   > {If any issues found:}
   > Offer three options:
   >   1. **Auto-fix** — remove stale `enabled: false` entries whose file is
   >      missing, migrate misplaced top-level `backend/`/`frontend/` into
   >      `src/`, rename disallowed characters. Requires user confirmation
   >      before any file moves.
   >   2. **Re-bootstrap** — run `/tmpl-bootstrap` to regenerate the manifest from
   >      scratch.
   >   3. **Report only** — print the issues and exit without changing files.

7. **Exit status.** If every check passes, say so clearly in one line so the
   user knows the manifest is clean.

## Notes

- Never delete a plugin file on disk to "fix" a drift. Only update manifest
  entries, or move/rename files when the user has confirmed a migration.
- Never silently rewrite `ai-plugins.json` — every fix must be presented to
  the user first.
