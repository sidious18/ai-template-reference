# Fleet operations

A multi-tenant SaaS web app for fleet managers to monitor vehicles, drivers, trips, and incidents through a customizable 8×8 tile dashboard and a suite of 11 research tools.

## What it does

Fleet operations gives logistics and operations teams a single workspace to monitor day-to-day fleet activity through configurable visual dashboards, analyze trip / fuel / driver / incident data with research-grade tooling, and generate, schedule, and distribute reports to stakeholders. Each customer organization signs in to its own workspace at `{workspace}.fleetops.app`.

## Who it's for

Fleet managers (daily situational awareness), operations directors (trends and KPIs), data analysts (ad-hoc SQL and cohort analysis), and HR / safety officers (driver scoring, incident review).

## Interactive prototypes

- [Fleet operations interactive prototype](docs/requirements/fleet_mockup.html) — open in a browser to interact with the live HTML rendering.

## Technologies

- **Backend:** TypeScript / Express on Node 22 (strict types)
- **Frontend:** React / CSS Modules (strict types)
- **Database:** PostgreSQL (transactional) + ClickHouse (analytics)
- **Cache + queue:** Managed Redis + BullMQ
- **Testing:** vitest, supertest, Playwright
- **CI:** GitHub Actions (lint + typecheck + test + build)
- **Release automation:** Release Please
- **Deployment:** Vercel (frontend) + Render (backend), staging + production

## Project structure

```
ai-template-reference/
├─ src/
│  ├─ backend/        ← Node + Express API
│  └─ frontend/       ← React app
├─ docs/              ← project-summary, onboarding, gitflow, roles, conventions, requirements
├─ ai-instructions/   ← AI pack (configure.json, requirements, bootstrap templates)
└─ .github/           ← CI workflows, issue + PR templates, dependabot, CODEOWNERS
```

`src/backend/` and `src/frontend/` are independent subtrees; each ships with its own `package.json`, tests, and Dockerfile. They are added in the first `/new-release` after `/configure` merges.

## Setup

```sh
# After /new-release runs for the first time:
./setup.sh
./run.sh
```

`setup.sh` installs dependencies for both modules; `run.sh` boots Postgres + ClickHouse + Redis locally, then starts the backend on `http://localhost:4000` and the frontend on `http://localhost:5173`. The scripts don't exist yet — `/new-release` writes them.

## Documentation

- **Project summary:** [docs/project-summary.md](docs/project-summary.md)
- **Onboarding:** [docs/onboarding.md](docs/onboarding.md)
- **Gitflow:** [docs/gitflow.md](docs/gitflow.md)
- **Code review:** [docs/code-review.md](docs/code-review.md)
- **Conventions:** [docs/conventions/](docs/conventions/)
- **Per-role onboarding:** [docs/roles/](docs/roles/) — one file per role in `configure.json.team_roles[]`
- **AI workflow:** `docs/ai-workflow.md` — written by `/bootstrap` Step 8b
- **Source requirements:** [docs/requirements/](docs/requirements/) — preserved spec markdown + interactive HTML prototype from the original requirements bundle
- **Project Overview:** [fleet-operations · Project Overview](https://maksymleb18.atlassian.net/wiki/spaces/SD/pages/3866626/fleet-operations+Project+Overview) (Confluence space `SD`)
- **Requirements:** [fleet-operations · Requirements](https://maksymleb18.atlassian.net/wiki/spaces/SD/pages/3899393/fleet-operations+Requirements)
- **Technologies:** [fleet-operations · Technologies](https://maksymleb18.atlassian.net/wiki/spaces/SD/pages/3932161/fleet-operations+Technologies)
- **User Roles:** [fleet-operations · User Roles](https://maksymleb18.atlassian.net/wiki/spaces/SD/pages/3964929/fleet-operations+User+Roles)

## Tracker

**Jira:** [maksymleb18.atlassian.net](https://maksymleb18.atlassian.net/jira/software/projects/KAN/boards) — project key `KAN`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).

<!-- /bootstrap appends below this line -->
<!-- /bootstrap appends above this line -->
