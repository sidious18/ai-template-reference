# Project Summary

## Idea

Fleet operations is a web application that gives logistics and operations teams a single workspace to monitor day-to-day fleet activity, analyze trip / fuel / driver / incident data, and generate scheduled reports. The product centers on two screens: a configurable 8×8 grid dashboard with a widget composer, and a research workspace housing eleven analytics tools (query builder, pivot table, cohorts, SQL console, trend / forecast, anomaly detection, driver scoring, correlation matrix, report builder, scheduled exports, saved views).

## Target Users

| Role | Primary needs |
|---|---|
| Fleet manager | Daily situational awareness, issue triage, driver oversight |
| Operations director | Trends, KPIs, monthly board reports |
| Data analyst | Ad-hoc queries, cohort analysis, custom SQL, exports |
| HR / safety officer | Driver scoring, retention cohorts, incident review |

## Requirements Overview

The full specification lives in [`docs/requirements/fleet_operations_spec.md`](../../../docs/requirements/fleet_operations_spec.md). Key shape:

- **Auth screen** — sign in, create account (with live password-strength meter), SSO (SAML 2.0 + OIDC). Failed sign-ins rate-limit per IP (5 attempts / 5 min). Passwords are Argon2id or bcrypt cost ≥ 12. Sessions: 30 days with "Stay signed in", 8 hours otherwise.
- **Dashboard** — fixed 8×8 grid (64 cells) where users compose their own view by selecting rectangular regions and assigning a widget. Three states: empty, selecting, configured. Nine widget types in the v1 catalog (KPIs, trend line, bar comparison, leaderboard, issues feed, utilization heatmap). Layouts persist per-user-per-workspace; named layouts switchable.
- **Research workspace** — three categories (Explore / Analyse / Deliver) hosting 11 tools:
  - **Explore**: Query builder (no-code), Pivot table, Cohorts (retention), SQL console (read-only, sandbox by default for new workspaces).
  - **Analyse**: Trend & forecast (Holt-Winters / linear regression / Prophet), Anomaly detection (z-score / IQR / seasonal), Driver scoring (4 weighted sub-metrics), Correlation matrix (Pearson / Spearman).
  - **Deliver**: Report builder (drag-and-drop), Scheduled exports (daily / weekly / monthly / quarterly / event-triggered to email / Slack / webhook), Saved views library.
- **RBAC** — Admin, Analyst, Manager, Viewer. Workspace isolation; no cross-workspace queries. Audit log for all admin actions.
- **Core data model** — Vehicles, Drivers, Trips, Incidents, Schedules. Times stored UTC, displayed in workspace timezone. Currency / distance / volume units configurable per workspace.

## Stack

- **Backend:** Node.js + Express (TypeScript, strict types)
- **Frontend:** SvelteKit + Tailwind (TypeScript, strict types)
- **Database:** PostgreSQL (OLTP — auth, schedules, users, audit log) + ClickHouse (OLAP — trips, fuel, anomaly detection at scale)
- **Cache / queue:** Redis (widget data cache, session store, rate-limit counters, scheduled-exports queue)
- **Testing:** Vitest (unit) + Playwright (e2e)
- **Deployment:** Vercel (frontend) + Supabase (Postgres) + ClickHouse Cloud
- **CI:** deferred (core scope — `/tmpl-bootstrap` will not generate workflows; bump to full scope or run `/tmpl-reconfigure` to add)

## Architecture Shape

SPA → API → dual-store persistence. Widget data fetches are batched (one request returns all data for the loaded layout) to hit the <1.5s first-paint target with up to 12 widgets. SQL console queries route to a read-only ClickHouse replica with a 30s wall-time limit, 100k row truncation, and a cost estimator before scans > 10M rows.

## Key Constraints

- **Performance**: dashboard <1.5s with 12 widgets; auth <500ms FCP; research page switch <300ms (cached config); forecast / correlation jobs <5s for 90 days × 50 drivers; SQL console 30s timeout.
- **Accessibility**: WCAG 2.1 AA on all text. All interactive elements keyboard-navigable. Drag-to-select on the dashboard has a keyboard alternative (arrow keys + shift-arrows).
- **Security**: HTTPS everywhere. Workspace isolation enforced at the API layer. SQL console blocks `INSERT` / `UPDATE` / `DELETE` / `DROP` / `ALTER` at the API. PII export-restricted to Admin.
- **Browser support**: last two stable major versions of Chrome / Edge / Firefox / Safari. No IE11. Mobile: read-only view ≥ 375px; editing flows are desktop-only.
- **i18n**: en-US, en-GB, de, fr, es at launch. All UI strings externalized.

## Out of Scope (for v1)

- Real-time GPS tracking and live map view
- In-app messaging between drivers and dispatchers
- Vehicle service-scheduling / maintenance calendar
- Native mobile app (a responsive web view is enough for v1)
- Custom widget development by users (the catalog is fixed in v1)
- Multi-workspace switching from a single account (each workspace is a separate sign-in)

## Interactive prototype

A clickable mockup is preserved at [`docs/requirements/fleet_mockup.html`](../../../docs/requirements/fleet_mockup.html) — open in a browser to interact with the live HTML rendering. Inline screen previews are not yet rendered (Playwright + Chromium not installed); install with `npx playwright install chromium` and re-run `/tmpl-setup` to add the Screens table.

## Open Questions

- Driver-scoring sub-metric thresholds: spec says "configurable per workspace" — pending a default set from the product team.
- Saved-view → dashboard widget promotion: explicit promotion only (design decision 8.6). Need wireframes for the size-preview step.
- Scheduled-exports webhook auth: HMAC vs API token — pending security review.
