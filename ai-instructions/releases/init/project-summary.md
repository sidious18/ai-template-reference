# Project Summary

## Idea

Fleet operations is a multi-tenant SaaS web app that gives logistics and operations teams a single workspace to monitor vehicles, drivers, trips, and incidents through a customizable 8×8 tile dashboard and a suite of research-grade analytical tools. Each customer organization signs in to its own workspace at `{workspace}.fleetops.app`.

## Target Users

| Role | Primary needs |
|---|---|
| Fleet manager | Daily situational awareness, issue triage, driver oversight |
| Operations director | Trends, KPIs, monthly board reports |
| Data analyst | Ad-hoc queries, cohort analysis, custom SQL, exports |
| HR / safety officer | Driver scoring, retention cohorts, incident review |

In-app permission roles: **Admin**, **Analyst**, **Manager**, **Viewer** — see `docs/requirements/fleet_operations_spec.md` §6.6 for the matrix.

## Requirements Overview

Three top-level screens behind a single auth gate:

1. **Auth** — Sign in, Create account (with live password-strength meter), SSO (SAML 2.0 + OpenID Connect, four shortcut providers: Google, Microsoft, Okta, generic SAML).
2. **Dashboard** — Fixed 8×8 grid. Users compose layouts by lasso-selecting empty regions and assigning one of nine widgets (Miles KPI, Fuel KPI, Issues KPI, Drivers KPI, Trend line, Bar comparison, Driver leaderboard, Issues feed, Utilization heatmap). Multiple named layouts ("Fleet overview", "Driver focus", "Cost analysis") with a switcher.
3. **Research workspace** — Sidebar of 11 tools across three categories:
   - **Explore**: Query builder, Pivot table, Cohorts, SQL console
   - **Analyse**: Trend & forecast (Holt-Winters / linear / Prophet), Anomaly detection (z-score / IQR / seasonal), Driver scoring (composite of safety / efficiency / punctuality / vehicle care), Correlation matrix (Pearson / Spearman)
   - **Deliver**: Report builder, Scheduled exports (email / Slack / webhook), Saved views

Core data domain: **Vehicles**, **Drivers**, **Trips**, **Incidents/issues**, **Schedules/shifts**.

Six committed design decisions are recorded in spec §8 (tile resize via delete-and-recreate for v1, lasso auto-snap to bounding rectangle, SQL sandbox-mode default for new workspaces, Holt-Winters as forecast default, explicit saved-view → dashboard-widget promotion).

## Interactive prototypes

- [Fleet operations interactive prototype](../../../docs/requirements/fleet_mockup.html) — open in a browser to interact with the live HTML rendering. 3 top-level screens (Auth / Dashboard / Research), 9 widgets, 11 research tools, 3 dashboard demo-states.

## Stack

- **Backend**: Node 22 + Express + TypeScript (strict). Persistence via PostgreSQL (transactional store: workspaces, layouts, schedules, users, audit log) + ClickHouse (analytics store: trips, telemetry, derived metrics).
- **Frontend**: React + TypeScript (strict) + CSS Modules. Aligns with the design-token system already in the mockup (`--bg-*`, `--text-*`, `--info`, `--teal`, `--coral`, etc.).
- **Cache + queue**: Managed Redis (Upstash / Render Redis / Fly Redis) + BullMQ for scheduled exports, anomaly job runs, and per-IP rate-limit counters.
- **Testing**: vitest + supertest for the backend; vitest + React Testing Library for the frontend; Playwright for end-to-end browser tests across the auth → dashboard → research flow.
- **CI**: GitHub Actions — lint, typecheck, test, build, gitleaks, pr-title-check.
- **Deployment**: hybrid — Vercel for the frontend, Render for the backend, ClickHouse Cloud, managed Redis. Two environments: staging (auto-deploy on `main`) and production (manual + Release Please tag).

## Out of Scope (for v1)

- Real-time GPS tracking and live map view
- In-app messaging between drivers and dispatchers
- Vehicle service-scheduling / maintenance calendar
- Native mobile app (responsive web view is sufficient for v1)
- Custom user-developed widgets (catalog is fixed in v1)
- Multi-workspace switching from a single sign-in
