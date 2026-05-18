# Command: /tmpl-release-list

Lists all releases with their status and task progress.

---

## Step 1: Scan Releases

Read all subdirectories in `releases/`. For each release:

1. Read `requirements.md` if it exists — extract the goal
2. Read `tasks.md` if it exists — count checked/unchecked subtasks
3. Check for `summary.md` — its presence means the release is finished
4. Check for the **done marker** in `requirements.md`: a line
   matching `^status: done$` (the YAML-style marker block written
   by `/tmpl-release-finish` Step 5 — three lines at the bottom of the
   file: `---`, `status: done`, `completed: {date}`). Use a
   line-anchored grep so the marker only matches when it is on
   its own line.
5. Check file modification times for recency

---

## Step 2: Present

Display as a table sorted by creation order:

> ## All Releases
>
> | # | Release | Status | Progress | Goal |
> |---|---|---|---|---|
> | 1 | init | Done | 8/8 | Initial project setup |
> | 2 | v1.1-auth | Active | 7/12 | User authentication and sessions |
> | 3 | v1.2-payments | Active | 2/9 | Payment processing integration |
> | 4 | v2.0-redesign | Not started | 0/6 | Frontend redesign |

Status definitions:
- **Done** — has `summary.md` or a line matching `^status: done$` in
  `requirements.md`
- **Active** — has tasks with some checked subtasks
- **Not started** — has tasks but no subtasks checked
