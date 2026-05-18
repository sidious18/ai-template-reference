# Command: /tmpl-release-list-active

Lists only releases that are in progress (not finished).

---

## Step 1: Scan Releases

Read all subdirectories in `releases/`. Filter to only those that:

- Do NOT have `summary.md`
- Do NOT have a line matching `^status: done$` in
  `requirements.md` (the YAML-style marker block written by
  `/tmpl-release-finish` Step 5 — three lines at the bottom of the
  file: `---`, `status: done`, `completed: {date}`).

---

## Step 2: Present

Display active releases sorted by most recently modified, with task progress:

> ## Active Releases
>
> | Release | Progress | Goal | Last modified |
> |---|---|---|---|
> | v1.2-payments | 2/9 subtasks | Payment processing | 2 hours ago |
> | v1.1-auth | 7/12 subtasks | User authentication | 3 days ago |

If no active releases exist:

> No active releases. Run `/tmpl-release-new` to start one.
