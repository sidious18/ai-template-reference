# Project Summary

## Idea

Fleet operations is a web application for fleet managers, operations directors, data analysts, and HR/safety officers to monitor vehicles, drivers, and trip data through a customizable tile-based dashboard and a suite of data-research tools. The product gives logistics teams a single workspace to track day-to-day activity, run research-grade analysis (cohorts, anomaly detection, forecasting, correlation, driver scoring), and generate reports for stakeholders.

## Target Users

- **Fleet manager** — daily situational awareness, issue triage, driver oversight
- **Operations director** — trends, KPIs, monthly board reports
- **Data analyst** — ad-hoc queries, cohort analysis, custom SQL, exports
- **HR / safety officer** — driver scoring, retention cohorts, incident review

## Requirements Overview

The full specification lives at [`docs/requirements/fleet_operations_spec.md`](requirements/fleet_operations_spec.md) (9 sections, ~25 KB) with an interactive HTML prototype at [`docs/requirements/fleet_mockup.html`](requirements/fleet_mockup.html). The product has three top-level screens:

- **Auth** — sign in, create account, SSO (Google, Microsoft, Okta, generic SAML). HTTPS, Argon2id/bcrypt cost ≥ 12, IP rate-limit 5 attempts / 5 min, sessions 30 days with "Stay signed in" else 8 hours.
- **Dashboard** — fixed 8 × 8 grid composer. Users select rectangular regions and assign widgets. Three lifecycle states (Empty, Selecting, Configured). Catalog of 9 widget types (4 KPIs + Trend line + Bar comparison + Driver leaderboard + Issues feed + Utilization heatmap). Per-user, per-workspace persisted layouts; multiple named layouts with a switcher.
- **Research workspace** — 11 tools across Explore (Query builder, Pivot table, Cohorts, SQL console), Analyse (Trend & forecast, Anomaly detection, Driver scoring, Correlation matrix), and Deliver (Report builder, Scheduled exports, Saved views).

Five locked v1 design decisions:

1. **Tile resizing** — delete-and-recreate (§8.1). No drag-resize in v1; resize handles deferred until usage data shows which sizes matter.
2. **Non-rectangular selections** — auto-snap to bounding box when all cells are empty, else picker stays disabled with status hint (§8.2).
3. **SQL console safety** — sandbox-by-default for new workspaces; admin must promote to production data; 30 s timeout, 100 k row truncation, 10 M row cost-estimate (§8.4).
4. **Forecast model** — Holt-Winters default, Prophet auto-suggested (not auto-selected) for metrics with weekly seasonality + holiday effects (§8.5).
5. **Saved-view → dashboard widget** — explicit promotion only; pinning is a navigation signal, not a layout signal (§8.6).

## Screens

Static renders of all 17 screens, captured from the interactive prototype at 2560×1600 (device-scale-factor 2). Source files in [docs/images/ui/screens/](images/ui/screens/).

| #   | Screen                 | Requirements                   | Preview                                                                  |
| --- | ---------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| 01  | Sign in                | §3.3, §3.6                     | ![Sign in](images/ui/screens/01-sign-in.png)                             |
| 02  | Create account         | §3.4, §3.6                     | ![Create account](images/ui/screens/02-create-account.png)               |
| 03  | Single sign-on         | §3.5, §3.6                     | ![Single sign-on](images/ui/screens/03-sso.png)                          |
| 04  | Dashboard — Empty      | §4.2.1, §4.6                   | ![Dashboard — Empty](images/ui/screens/04-dashboard-empty.png)           |
| 05  | Dashboard — Selecting  | §4.2.2, §4.3, §4.4, §4.6, §8.2 | ![Dashboard — Selecting](images/ui/screens/05-dashboard-selecting.png)   |
| 06  | Dashboard — Configured | §4.2.3, §4.4, §4.5, §4.6, §8.1 | ![Dashboard — Configured](images/ui/screens/06-dashboard-configured.png) |
| 07  | Query builder          | §5.1.1                         | ![Query builder](images/ui/screens/07-query-builder.png)                 |
| 08  | Pivot table            | §5.1.2                         | ![Pivot table](images/ui/screens/08-pivot-table.png)                     |
| 09  | Cohorts                | §5.1.3                         | ![Cohorts](images/ui/screens/09-cohorts.png)                             |
| 10  | SQL console            | §5.1.4, §6.5, §8.4             | ![SQL console](images/ui/screens/10-sql-console.png)                     |
| 11  | Trend & forecast       | §5.2.1, §8.5                   | ![Trend & forecast](images/ui/screens/11-trend-forecast.png)             |
| 12  | Anomaly detection      | §5.2.2                         | ![Anomaly detection](images/ui/screens/12-anomaly-detection.png)         |
| 13  | Driver scoring         | §5.2.3                         | ![Driver scoring](images/ui/screens/13-driver-scoring.png)               |
| 14  | Correlation matrix     | §5.2.4                         | ![Correlation matrix](images/ui/screens/14-correlation-matrix.png)       |
| 15  | Report builder         | §5.3.1                         | ![Report builder](images/ui/screens/15-report-builder.png)               |
| 16  | Scheduled exports      | §5.3.2                         | ![Scheduled exports](images/ui/screens/16-scheduled-exports.png)         |
| 17  | Saved views            | §5.3.3, §8.6                   | ![Saved views](images/ui/screens/17-saved-views.png)                     |

## Interactive prototypes

- [Fleet operations — interactive mockup](requirements/fleet_mockup.html) — open in a browser to interact with the live HTML rendering. Self-contained (inline CSS + JS, no build step); demonstrates all 17 screens via header toggles, tabs, demo-state buttons, and sidebar navigation.

## Stack

- **Backend** — TypeScript / NestJS · strict types · runs on EC2 + Auto Scaling Group on AWS
- **Frontend** — React + Tailwind · strict types · SPA served behind CloudFront from S3
- **Primary database** — PostgreSQL (Aurora) — multi-tenant via workspace isolation; window functions for cohorts, JSONB for flexible widget configs, EXPLAIN for SQL-console cost estimates
- **Cache + queue** — Redis (ElastiCache) with BullMQ for job orchestration (scheduled exports, anomaly batch jobs, retry queues for failed deliveries)
- **Object storage** — S3 (exports, generated reports, static SPA assets)
- **Secrets** — AWS Secrets Manager (JWT signing keys, SAML certs, OIDC client secrets, DB credentials)
- **Testing** — Vitest (unit, both modules) + Playwright (end-to-end against running SPA)
- **CI / CD** — GitHub Actions (lint + typecheck + test + build, per-env deploy workflows, Dependabot, Release Please, AI PR review via Bedrock + Claude Sonnet 4.6)

## Architecture shape

SPA + API + DB · workspace-isolated multi-tenant · batched data fetches per layout · audit log for all admin actions · sandbox-by-default SQL console with promotion gate · scheduled-export pipeline on BullMQ with exponential-backoff retry · CloudFront → ALB → ASG → Aurora. Detailed diagrams ship in the Confluence Technologies + Project Overview pages.

## Non-functional requirements (highlights)

- **Performance** — Auth FCP < 500 ms; dashboard initial render < 1.5 s with 12 widgets; research page switch < 300 ms; query preview < 2 s for < 10 k rows; SQL console 30 s timeout; forecast/correlation < 5 s on 90 days × 50 drivers.
- **Accessibility** — WCAG 2.1 AA on all text and interactive elements. Keyboard nav for the drag-to-select grid. Color is never the only signal (severity dots, anomaly markers, correlation cells all carry text or shape redundancy).
- **Browser support** — Chrome, Edge, Firefox, Safari (last 2 stable). No IE11. Mobile read-only on viewports ≥ 375 px; editing flows are desktop-only.
- **Security** — Per-workspace data isolation (no cross-workspace queries). PII (driver names, license numbers) export-restricted to admin. Audit log for all admin actions. Argon2id / bcrypt ≥ 12. SAML 2.0 + OIDC.
- **i18n** — Initial locales en-US, en-GB, de, fr, es. UTC storage, per-workspace timezone display, configurable units (miles vs km, gallons vs liters, USD/EUR/GBP).

## Open Questions

- Aurora deployment shape — provisioned vs serverless v2 (cost vs cold-start tradeoff) — pending DB architect input.
- Workspace promotion from sandbox → production SQL data — does this require a 2-admin approval gate? Default is single-admin promotion; revisit if compliance review wants more.
- Forecast model availability for Prophet — Prophet's Python dependency vs the Node.js backend. Either run as a sidecar service or call a Lambda; decide before §5.2.1 ships.
- Per-workspace branding for the auth screen — none in v1 per current spec; confirm with PM before SSO mode ships.

## Out of Scope (for v1)

- Real-time GPS tracking and live map view
- In-app messaging between drivers and dispatchers
- Vehicle service-scheduling / maintenance calendar
- Native mobile app (responsive web view is enough for v1)
- Custom widget development by users (catalog is fixed in v1)
- Multi-workspace switching from a single account (each workspace is a separate sign-in)
