# fleet-operations

Web application for fleet managers to monitor vehicles, drivers, and trip data through a customizable tile-based dashboard and a research workspace with eleven analytics tools.

## What it does

Fleet operations gives logistics and operations teams a single workspace to monitor day-to-day fleet activity through configurable visual dashboards, analyze trip / fuel / driver / incident data with research-grade tooling, and generate, schedule, and distribute reports to stakeholders. The product centers on two screens — a configurable 8×8 grid dashboard with a widget composer, and a research workspace housing eleven analytics tools.

## Who it's for

| Role | Primary needs |
|---|---|
| Fleet manager | Daily situational awareness, issue triage, driver oversight |
| Operations director | Trends, KPIs, monthly board reports |
| Data analyst | Ad-hoc queries, cohort analysis, custom SQL, exports |
| HR / safety officer | Driver scoring, retention cohorts, incident review |

## Technologies

- **Backend:** Node.js + Express (TypeScript, strict types)
- **Frontend:** SvelteKit + Tailwind (TypeScript, strict types)
- **Database:** PostgreSQL + ClickHouse
- **Cache:** Redis
- **Testing:** Vitest + Playwright
- **Deployment:** Vercel (frontend) + Supabase (Postgres) + ClickHouse Cloud

## Project structure

```
.
├── src/
│   ├── backend/         # Node.js + Express API (TypeScript)
│   └── frontend/        # SvelteKit + Tailwind app (TypeScript)
├── docs/
│   ├── project-summary.md
│   ├── onboarding.md
│   ├── gitflow.md
│   ├── conventions/     # Per-language conventions (TypeScript)
│   ├── roles/           # Per-role onboarding docs
│   ├── requirements/    # Preserved source spec + interactive mockup
│   └── confluence/      # Local mirror of Confluence pages (empty until used)
├── ai-instructions/
│   ├── configure.json   # Decision record produced by /tmpl-setup
│   └── releases/init/   # Initial release artifacts (project-summary.md)
├── .github/             # (added in Full scope)
└── README.md
```

## Setup

```bash
# After /tmpl-release-new runs for the first time:
./setup.sh
./run.sh
```

## Documentation

- **Project summary:** [docs/project-summary.md](docs/project-summary.md)
- **Onboarding:** [docs/onboarding.md](docs/onboarding.md)
- **Gitflow:** [docs/gitflow.md](docs/gitflow.md)
- **Conventions:** [docs/conventions/](docs/conventions/)
- **Per-role onboarding:** [docs/roles/](docs/roles/) — one file per team role
- **Source requirements:** [docs/requirements/](docs/requirements/) — preserved spec + interactive HTML mockup
- **Interactive prototype:** [docs/requirements/fleet_mockup.html](docs/requirements/fleet_mockup.html) — open in a browser
- **Project Overview:** [fleet-operations — Project Overview](https://maksymleb18.atlassian.net/wiki/spaces/SD/pages/6225922/fleet-operations+Project+Overview)
- **Requirements:** [fleet-operations — Requirements](https://maksymleb18.atlassian.net/wiki/spaces/SD/pages/6258689/fleet-operations+Requirements)
- **Technologies:** [fleet-operations — Technologies](https://maksymleb18.atlassian.net/wiki/spaces/SD/pages/6291458/fleet-operations+Technologies)
- **User Roles:** [fleet-operations — User Roles](https://maksymleb18.atlassian.net/wiki/spaces/SD/pages/6422529/fleet-operations+User+Roles)

## Tracker

**Jira:** [maksymleb18.atlassian.net / KAN](https://maksymleb18.atlassian.net/jira/software/projects/KAN) — project key `KAN`

<!-- /tmpl-bootstrap appends below this line -->
<!-- /tmpl-bootstrap appends above this line -->
