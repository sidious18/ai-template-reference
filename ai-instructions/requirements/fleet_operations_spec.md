# Fleet operations — product specification

A web application for fleet managers to monitor vehicles, drivers, and trip data through a customizable tile-based dashboard and a suite of data-research tools.

---

## 1. Overview

### 1.1 Purpose

Fleet operations gives logistics and operations teams a single workspace to:

- monitor day-to-day fleet activity through configurable visual dashboards,
- analyze trip, fuel, driver, and incident data with research-grade tooling,
- generate, schedule, and distribute reports to stakeholders.

### 1.2 Target users

| Role | Primary needs |
|---|---|
| Fleet manager | Daily situational awareness, issue triage, driver oversight |
| Operations director | Trends, KPIs, monthly board reports |
| Data analyst | Ad-hoc queries, cohort analysis, custom SQL, exports |
| HR / safety officer | Driver scoring, retention cohorts, incident review |

### 1.3 Core data domain

The application works with five primary entities:

- **Vehicles** — plate, make/model, status (active, in service, parked, retired), assigned driver, service history
- **Drivers** — name, hire date, license info, assigned vehicle, score components
- **Trips** — date, driver, vehicle, miles driven, fuel consumed, average speed, idle time, route
- **Incidents / issues** — vehicle or driver, severity (low / medium / high), status (open / acknowledged / resolved), days open, description
- **Schedules / shifts** — driver assignments, time windows, regional coverage

---

## 2. Top-level structure

The application has three top-level screens, plus a global header.

```
┌─ Header (logo, title, view toggle, user pill) ───────────────────────┐
│                                                                       │
├─ Tabs row (Dashboard / Research) + user menu (signed-in only) ──────┤
│                                                                       │
│  Active screen:                                                       │
│   ├─ Auth (signed out only)                                           │
│   ├─ Dashboard                                                        │
│   └─ Research                                                         │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

The user pill (top-right of the tabs row) shows the current user's initials, name, and organization, with a dropdown chevron for account actions.

---

## 3. Auth screen

### 3.1 When it appears

Shown when the user is not authenticated. Replaces both Dashboard and Research; the tabs row is also hidden.

### 3.2 Layout

A single centered card (max 480px wide), with three mode tabs at the top:

- **Sign in** — default
- **Create account**
- **SSO**

Tab switching is instant and preserves no field state between modes.

### 3.3 Sign-in mode

**Fields**
- Work email (required, format-validated)
- Password (required, masked)

**Controls**
- "Stay signed in" checkbox (default: checked)
- "Forgot password?" link
- Primary submit button: "Sign in"

**Alternative providers**
A row of four SSO shortcut buttons: Google, Microsoft, Okta, generic SAML SSO.

**Footer** — link to switch to Create account mode.

### 3.4 Create account mode

**Fields**
- Full name (required)
- Work email (required, format-validated, must be unique across the system)
- Company name (required) — becomes the workspace name
- Password (required, minimum 12 characters) with a four-segment live strength meter:
  - 1 segment (coral): length ≥ 8
  - 2 segments (amber): length ≥ 12
  - 3 segments (blue): mixed case
  - 4 segments (teal): includes digits and symbols

**Controls**
- Terms-of-service / privacy-policy acceptance checkbox (required to submit)
- Primary submit: "Create workspace"

**Alternative providers** — Google and Microsoft only (Okta and SAML are workspace-level, not used for new account creation).

**Post-submit** — sends a verification email; on click, lands the user signed-in on an empty Dashboard.

### 3.5 SSO mode

**Fields**
- Workspace URL (slug only — the `[workspace]` portion of `[workspace].fleetops.app`)

**Controls**
- Primary submit: "Continue with SSO" — redirects to the configured identity provider for that workspace.

**Recent organizations**
Below the form, a list of previously-used workspaces (up to three), each row showing:
- Workspace initials in a colored circle
- Workspace name
- Identity provider + last-used relative time (e.g., "Okta · last used today")

Clicking a row jumps directly to that workspace's IdP, skipping the slug entry.

### 3.6 Requirements

- All form submissions must use HTTPS.
- Passwords must be hashed with a modern algorithm (Argon2id or bcrypt with cost ≥ 12).
- Failed sign-in attempts must rate-limit per IP after 5 attempts in 5 minutes.
- SSO flows must support SAML 2.0 and OpenID Connect.
- Workspace slugs must be unique, 3–32 chars, lowercase ASCII + hyphens.
- Session tokens must expire after 30 days of inactivity (with "Stay signed in"), 8 hours otherwise.

---

## 4. Dashboard screen

### 4.1 Concept

The Dashboard is a fixed 8 × 8 grid (64 cells) where the user composes their own view by selecting rectangular regions and assigning a widget to each region. Each widget fills its region as a single visualization — *not* a tile-by-tile repetition.

### 4.2 Three states the user moves through

The toolbar at the top of the Dashboard has three demo-state buttons that surface each phase:

#### 4.2.1 Empty state

All 64 cells are blank. The status text reads: *"Click and drag across empty cells to select a region for a new widget."*

This is the state a brand-new user lands on after signing up. Should also offer starter templates (see §4.6).

#### 4.2.2 Selecting state

The user has clicked one cell and dragged across others to draw a selection rectangle. Selected cells highlight in the info-blue background and dashed outline. The status text updates to: *"Region: 4 × 3 cells. Choose a widget below."*

A widget-picker menu opens directly below the canvas, offering the catalog of widget types. Each option shows:
- Widget label
- One-line description
- Minimum required region size (e.g., "needs 3 × 3")
- Disabled state if the current selection is too small

#### 4.2.3 Configured state

The selection is committed, the picker closes, and the chosen widget renders inside the previously-selected region. Cells covered by the widget become invisible (the widget visually takes their place).

The user can now start a new selection on any remaining empty cells, and existing widgets become deletable on click.

### 4.3 Selection mechanics

- **Click on an empty cell** → starts a new selection (clears any prior).
- **Click + drag** → lasso-style selection (RTS-game pattern). Any empty cell whose bounding box intersects the drag rectangle becomes selected.
- **Shift + click** or **Shift + drag** → adds to the existing selection.
- **Cells already covered by a widget** are not selectable.
- **Selection must be a clean rectangle** to be valid for widget placement. Non-rectangular selections (e.g., L-shapes) disable all picker options until corrected.

### 4.4 Widget catalog

| Widget | Min size | What it shows |
|---|---|---|
| Miles KPI | 2 × 2 | Total miles + delta vs previous period |
| Fuel KPI | 2 × 2 | Average L/100km + delta |
| Issues KPI | 2 × 2 | Open issue count |
| Drivers KPI | 2 × 2 | Active drivers / total |
| Trend line | 3 × 2 | Time-series for any chosen metric |
| Bar comparison | 3 × 3 | Compare cars, drivers, weeks, etc. |
| Driver leaderboard | 3 × 3 | Ranked drivers with score, miles, issues |
| Issues feed | 3 × 3 | Vehicle problems by severity, with plate and days-open |
| Utilization heatmap | 3 × 3 | Hour-of-day × day-of-week activity |

### 4.5 Widget interactions (configured state)

- **Click a widget** → confirmation dialog to remove it. On confirm, the widget is removed and its cells return to the empty state.
- *(v2)* drag the widget header to move it to another region of the same dimensions.
- *(v2)* drag widget edges to resize — see §8.1 for the v1 rationale and §8.3 for the resize rule when it ships.

### 4.6 Requirements

- Layouts must be persisted per-user, per-workspace.
- The dashboard must support multiple named layouts ("Fleet overview", "Driver focus", "Cost analysis") with a switcher.
- Loading a populated dashboard must hit < 1.5 s to first paint with up to 12 widgets.
- All KPIs must reflect data refreshed within the last 5 minutes.
- The grid must fit on screens ≥ 1024 px wide; below that, fall back to a stacked single-column rendering of the same widgets.
- Widget data fetches must be batched (one request returns all data for the loaded layout).

---

## 5. Research screen

A two-pane layout: left sidebar of tools grouped into three categories, right pane shows the active tool's workspace.

```
┌─────────────┬─────────────────────────────────────────┐
│ Sidebar     │  Active research page                   │
│ (220px)     │                                         │
│             │  Breadcrumb · Title · Page actions      │
│ Explore     │  Metric strip                           │
│ Analyse     │  Configuration / results panels         │
│ Deliver     │                                         │
└─────────────┴─────────────────────────────────────────┘
```

### 5.1 Explore tools

#### 5.1.1 Query builder

A no-code interface for ad-hoc analysis.

- **Data source picker** — dataset (trips / drivers / vehicles / incidents), date range, group-by dimension, aggregate function.
- **Filters** — stack of `where` clauses, each with field / operator / value, joinable by AND. Add and remove filters with × buttons.
- **Preview** — paginated result table (default limit 5 rows, expandable).

Saving a query produces a Saved view (see §5.3.3).

#### 5.1.2 Pivot table

A spreadsheet-style cross-tabulation.

- Row dimension picker
- Column dimension picker
- Value aggregator
- Optional filter

Cells are shaded by value intensity (heatmap-style background) to make outliers visible. Row totals on the right, column totals at the bottom, grand total in the corner.

#### 5.1.3 Cohorts

Driver retention by hire month (or any selectable cohort dimension).

- Triangular grid: each row = a cohort, each column = months-since-hire (M0, M1, M2…).
- Cells show retention percentage with intensity-shaded backgrounds.
- Future-period cells render as dashes (data not yet available).

Configuration: cohort dimension, metric (% active / avg miles / issue rate), and period granularity (weekly or monthly).

#### 5.1.4 SQL console

Direct SQL access for power users.

- Dark editor with syntax highlighting (keywords, functions, strings, numbers, comments).
- Connection bar showing data source, row count, query duration.
- Result table below the editor.
- Save query → becomes a Saved view.

**Requirements**
- Read-only access; `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER` must be blocked at the API layer.
- Per-user query rate limiting and cost ceilings.
- Query history per user.

### 5.2 Analyse tools

#### 5.2.1 Trend & forecast

Project a metric forward in time.

- Metric, history window, and forecast horizon are user-controlled.
- Model selectable: Holt-Winters (default), linear regression, Prophet.
- Chart shows actuals as a line with markers, forecast as a continued line in a tinted region, with a 90% confidence band.
- Summary panel: trend direction, daily growth rate, R², confidence interval, projected total.

#### 5.2.2 Anomaly detection

Surface unusual events in fleet data.

- Detection method: z-score (default), IQR, or seasonal decomposition.
- Sensitivity: low / medium / high (maps to z thresholds 2 / 3 / 4).
- Lookback window: 7 / 14 / 30 / 90 days.
- Output: the same line chart with anomalies circled in coral; below, a feed listing each anomaly with severity dot, vehicle/driver, plain-English description, z-score, and "Investigate" action.

#### 5.2.3 Driver scoring

Composite scoring of every active driver across four sub-metrics:

- Safety
- Efficiency
- Punctuality
- Vehicle care

The four sub-metrics are weighted (default 40% / 25% / 20% / 15%), adjustable with sliders. Each driver renders as a card with their composite score in a colored circle (green ≥ 90, amber 70–89, red < 70), the four sub-metrics as small bars, and a meta line showing miles driven and open issues.

**Requirements**
- Adjusting weights must recompute scores live across all drivers.
- The scoring formula and current weights must be exportable for audit.
- Sub-metric thresholds must be configurable per workspace.

#### 5.2.4 Correlation matrix

A 7 × 7 (or larger) Pearson / Spearman correlation matrix across fleet metrics.

- Cells are tinted blue for positive correlations, coral for negative, with intensity scaled by `|r|`.
- A "Strongest relationships" panel surfaces the top correlations in plain English.
- Configurable: dataset, method (Pearson / Spearman), period, minimum `|r|` threshold to show.

### 5.3 Deliver tools

#### 5.3.1 Report builder

Drag-and-drop report composer.

- **Block palette** (left) — Title, KPI row, Line chart, Bar chart, Table, Issues list, Text block, Page break.
- **Canvas** (right) — the in-progress report. Each block is labeled and editable in place.
- **Page actions** — Preview, Save draft, Publish.

Published reports are exportable as PDF, HTML email, or Slack message.

#### 5.3.2 Scheduled exports

Recurring report delivery.

Each schedule row shows:
- Name
- Cadence + format + recipient summary
- Status badge: Active / Paused / Conditional (event-triggered)
- Next-run timestamp
- Edit / Run-now actions

Top of page: KPI strip with active schedule count, sends in last 7 days, failures, and next-run countdown.

**Requirements**
- Cadences supported: daily, weekly, monthly, quarterly, on-trigger (e.g., "when fuel > 8.5 L/100km").
- Delivery channels: email, Slack, webhook.
- Failed deliveries must retry with exponential backoff (3 attempts) and surface in the failures KPI.
- Each schedule can have up to 50 recipients.

#### 5.3.3 Saved views

A library of reusable analyses.

Card grid where each card shows:
- View title (with optional "pinned" badge)
- One-line description
- Source tool (Query builder / Pivot table / Anomaly detection / etc.)
- Last-used relative timestamp

Top of page KPI strip: total saved views, shared with team, pinned, used in last 7 days.

**Requirements**
- Views must be sharable per-team or org-wide with view/edit permissions.
- Pinning a view surfaces it in the dashboard widget picker as a custom widget option.
- Views must be searchable and sortable by name, last-used, source tool.

---

## 6. Cross-cutting requirements

### 6.1 Performance

| Surface | Target |
|---|---|
| Auth screen | < 500 ms first contentful paint |
| Dashboard initial render | < 1.5 s with up to 12 widgets |
| Research page switch | < 300 ms (cached configuration) |
| Query builder preview | < 2 s for queries returning < 10k rows |
| SQL console | < 30 s timeout, with progress indicator |
| Forecast / correlation jobs | < 5 s for 90 days × 50 drivers |

### 6.2 Accessibility

- All interactive elements keyboard-navigable (tab order, focus rings).
- Color must never be the only signal — anomaly markers, severity dots, and correlation cells all carry text or shape redundancy.
- Color contrast must meet WCAG 2.1 AA on all text.
- Dashboard drag-to-select must have a keyboard alternative (arrow keys to move a focus cell, shift+arrows to extend selection).

### 6.3 Browser support

- Chrome, Edge, Firefox, Safari — last two stable major versions each.
- No IE11 support.
- Mobile: read-only view of the dashboard and key research pages on viewports ≥ 375 px. Editing flows (configuring tiles, building reports, writing SQL) are desktop-only.

### 6.4 Data model

- All times stored as UTC; display in user's workspace timezone.
- Currency, distance, and volume units configurable per workspace (miles vs km, gallons vs liters, USD vs EUR vs GBP).
- All entities soft-deletable with a 30-day retention before hard delete.

### 6.5 Security

- All API access requires authenticated session or scoped API token.
- Workspace data is fully isolated; no cross-workspace queries possible.
- Audit log for all admin actions (user invites, role changes, deletions, schedule edits).
- PII (driver names, license numbers) export-restricted to admin role.

### 6.6 Roles and permissions

| Role | Dashboard | Research | Reports | Schedules | User mgmt |
|---|---|---|---|---|---|
| Admin | Full | Full | Full | Full | Full |
| Analyst | Full | Full | Create / edit | Create / edit | View only |
| Manager | Configure own | View + saved views | View + edit own | View own | None |
| Viewer | View only | View only | View only | None | None |

### 6.7 Internationalization

- All UI strings must be externalized for translation.
- Initial languages: English (en-US, en-GB), German, French, Spanish.
- Number formatting respects the user's locale.

---

## 7. Out of scope (for v1)

The following are deliberately deferred and not part of the initial release:

- Real-time GPS tracking and live map view
- In-app messaging between drivers and dispatchers
- Vehicle service-scheduling / maintenance calendar
- Mobile app (a responsive web view is enough for v1)
- Custom widget development by users (the catalog is fixed in v1)
- Multi-workspace switching from a single account (each workspace is a separate sign-in)

---

## 8. Design decisions

For each open question, this section records the decision, the reasoning, and the implementation implication. These are committed for v1; revisit at the v2 planning gate.

### 8.1 Tile resizing — *delete-and-recreate for v1*

**Decision.** Configured widgets are not drag-resizable in v1. To change a widget's size, the user deletes it and re-selects a new region.

**Why.** Drag-resize handles introduce three follow-on problems we'd have to solve before shipping: collision rules with neighbors, how to reflow other widgets, and how to handle widgets that drop below their minimum size. None of those are interesting product work — they're the kind of edge cases that consume weeks. Delete-and-recreate is one extra click and zero ambiguity. We can add resize in v2 once we know which sizes users actually want most.

**Implication.** Track widget-creation events with `(type, w, h)` so we can mine the data and decide if resize is needed. If 80% of users create most widgets at one or two sizes, resize is low priority.

### 8.2 Non-rectangular selections — *auto-snap to bounding box, with a confirmation hint*

**Decision.** When the lasso produces an L-shape or other non-rectangular set (typically because a configured widget blocks part of the drag), the system auto-snaps the selection to its bounding rectangle, *but only if every cell in that rectangle is empty*. If the bounding rectangle would overlap an existing widget, the selection stays as-drawn and all picker options remain disabled with a status message: *"Selection must be rectangular and on empty cells."*

**Why.** Disabling the picker entirely on any non-rectangular drag (the current behavior) is technically correct but feels broken — most users never figure out what they did wrong. Auto-snap is forgiving in the common case (drawing slightly outside the empty area is usually accidental) without being silently destructive (it never absorbs cells the user didn't touch). The existing-widget check prevents the snap from quietly stealing cells from a configured widget.

**Implication.** The status text needs an additional state: *"Snapped to N × M region"* shown briefly when auto-snap fires, so the user understands what happened.

### 8.3 Widget overlap on resize — *not applicable in v1*

**Decision.** Since v1 has no resize (§8.1), this question is moot. When resize ships in v2, the rule will be: **dragging a widget edge stops at the first occupied cell**. The widget cannot grow into a region that contains another widget — the user must delete the blocker first.

**Why.** Two alternatives — auto-pushing neighbors out of the way, or auto-deleting them — both create destructive surprises. A hard stop at occupied cells is unambiguous and matches how every desktop window manager behaves.

**Implication.** Resize handles must visually indicate when they hit a blocker (cursor change + outline color change on the obstructed edge).

### 8.4 SQL console safety — *yes, sandbox mode is the default for new workspaces*

**Decision.** New workspaces start in a "sandbox" mode where the SQL console runs against a synthetic dataset (50 vehicles, 60 days of trips, realistic distributions). An admin must explicitly promote a workspace to production data via a setting. Once promoted, sandbox mode cannot be re-enabled (to avoid analysts thinking they're in sandbox when they're not).

In production mode, additional guardrails apply on top of the existing read-only restriction:
- Queries are killed at 30 s wall time.
- Result sets above 100k rows are truncated with a banner.
- A "cost estimate" appears before runs that scan more than 10M rows.

**Why.** Two failure modes to prevent: an analyst learning SQL accidentally taking down the warehouse, and an analyst running an exploratory query that returns 5M rows and freezing their browser. Sandbox covers learning; cost estimates and result truncation cover exploration. Making sandbox the default for new workspaces means analysts can practice without anyone needing to explicitly enable it.

**Implication.** The synthetic dataset needs maintenance — when we add new fields or entities, the sandbox needs corresponding fixtures. Budget ~1 day per quarter for this.

### 8.5 Forecast model defaults — *Holt-Winters as the default, with auto-suggest for Prophet on seasonal metrics*

**Decision.** Holt-Winters is the default forecast model for all metrics. When a metric has detected weekly seasonality with strong holiday effects (e.g., daily miles, fuel cost), the model picker shows a "Suggested: Prophet" badge next to the Prophet option, with a tooltip explaining why. The user still chooses; we never silently switch.

**Why.** Holt-Winters is the right default because (1) it's faster to fit, (2) it explains its parameters more clearly (level, trend, seasonal components are all interpretable), and (3) for fleet metrics with stable patterns, it's accurate enough. Prophet shines on metrics with multiple overlapping seasonalities and known holiday effects, but it's overkill for "average fuel consumption per vehicle." Auto-suggesting rather than auto-selecting respects analyst judgment and keeps results reproducible.

**Implication.** The seasonality detector runs as part of the metric metadata pipeline (not at forecast time, which would slow the page). Each metric carries a `seasonality_profile` field that the UI reads.

### 8.6 Saved-view → dashboard widget — *explicit promotion only*

**Decision.** Pinning a saved view in the Saved views library does *not* automatically add it to the dashboard widget picker. To use a saved view as a dashboard widget, the user must explicitly promote it via a "Use as dashboard widget" action on the view card. Promoted views appear in the picker under a separate "Custom" section, with a small badge marking them as user-created.

**Why.** Pinning means "I refer to this often" — that's a navigation signal, not a layout signal. Mixing pin-state with dashboard-widget-state would conflate two different concepts. Explicit promotion also forces the user to confirm the view's region size requirements (saved views from Pivot table or SQL console may not fit cleanly in small regions), which is a useful checkpoint.

**Implication.** Promoted views need their own minimum-size metadata, computed from their content (a 5-row table needs at least 3 × 3, a single-number aggregate fits in 2 × 2). The promotion flow should let the user preview the view at different sizes before committing.

---

## 9. Decision summary table

| # | Question | Decision |
|---|---|---|
| 8.1 | Tile resizing | Delete-and-recreate for v1; revisit in v2 with usage data |
| 8.2 | Non-rectangular selections | Auto-snap to bounding box if all cells empty, else disabled |
| 8.3 | Widget overlap on resize | N/A in v1; v2 will hard-stop at occupied cells |
| 8.4 | SQL console safety | Sandbox by default for new workspaces; production needs admin promotion |
| 8.5 | Forecast model | Holt-Winters default; Prophet auto-suggested for seasonal metrics |
| 8.6 | Saved view → widget | Explicit promotion only, separate "Custom" picker section |

