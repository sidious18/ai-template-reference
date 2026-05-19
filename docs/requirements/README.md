# Fleet operations — mockup bundle

## Contents

| File | What it is |
|---|---|
| `fleet_mockup.html` | Self-contained interactive mockup. Open in any modern browser. |
| `fleet_operations_spec.md` | Full product specification: screens, features, requirements, and design decisions. |

No build step, no dependencies — `fleet_mockup.html` is a single file with all CSS and JavaScript inline.

## How to use the mockup

Open `fleet_mockup.html` in Chrome, Edge, Firefox, or Safari. Three top-level views are accessible from the header:

**Signed-out view** — click "Signed out" in the top-right toggle to see the auth screen. Three modes are available: Sign in, Create account (with live password-strength meter), and SSO. Submitting any form returns you to the signed-in app.

**Signed-in dashboard** — the 8 × 8 grid composer. Three demo-state buttons in the toolbar let you flip between:
- *Empty* — bare grid, ready for selection.
- *Selecting* — pre-drawn 4 × 3 selection with the widget picker open.
- *Configured* — fully populated default layout with nine widgets.

You can also draw your own selection by clicking and dragging on empty cells, then choosing a widget from the picker. Click any configured widget to remove it.

**Research workspace** — switch via the Research tab. The left sidebar lists eleven tools across Explore, Analyse, and Deliver. Click any to switch the main pane.

## Spec quick map

The spec (`fleet_operations_spec.md`) is structured as:

1. Overview — purpose, users, data model
2. Top-level structure
3. Auth screen
4. Dashboard screen (states, selection mechanics, widget catalog)
5. Research screen (all eleven tools)
6. Cross-cutting requirements (performance, accessibility, security, roles)
7. Out of scope for v1
8. Design decisions (six committed answers with rationale)
9. Decision summary table
