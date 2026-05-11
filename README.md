# ai-template-reference

A web application for fleet managers to monitor vehicles, drivers, and trip data through a customizable tile-based dashboard and a suite of data-research tools.

## What it does

Fleet operations gives logistics and operations teams a single workspace to: monitor day-to-day fleet activity through configurable visual dashboards, analyze trip / fuel / driver / incident data with research-grade tooling, and generate, schedule, and distribute reports to stakeholders. The product has three top-level screens — Auth, Dashboard (8 × 8 widget grid composer), and Research (11 analytics tools across Explore, Analyse, Deliver).

## Screenshots

![Dashboard — Configured](docs/images/ui/screens/06-dashboard-configured.png)

![Correlation matrix](docs/images/ui/screens/14-correlation-matrix.png)

![Driver scoring](docs/images/ui/screens/13-driver-scoring.png)

All 17 rendered screens are in [docs/images/ui/screens/](docs/images/ui/screens/); the interactive HTML mockup lives at [docs/requirements/fleet_mockup.html](docs/requirements/fleet_mockup.html). Per-screen requirement codes are in the Screens table on [docs/project-summary.md](docs/project-summary.md).

## Who it's for

Fleet managers, operations directors, data analysts, and HR / safety officers at logistics-heavy organizations.

## Technologies

- **Backend:** TypeScript / NestJS (strict types)
- **Frontend:** React / Tailwind (strict types)
- **Database:** PostgreSQL (Aurora)
- **Cache / queue:** Redis (ElastiCache) + BullMQ
- **Testing:** Vitest, Playwright
- **CI:** GitHub Actions (lint + typecheck + test + build)
- **AI PR review:** Claude (Sonnet 4.5 on AWS Bedrock) leaves a sticky review comment on every PR
- **Release automation:** Release Please
- **Deployment:** AWS (EC2 + Auto Scaling Group, Aurora Postgres, ElastiCache Redis, S3, CloudFront, Secrets Manager) — staging + production environments

## Project structure

```
src/
├── backend/        # NestJS API (kind=server, language=typescript)
└── frontend/       # React + Tailwind SPA (kind=client, language=typescript)
docs/               # Human-facing docs (onboarding, gitflow, conventions, role docs, requirements, images, Confluence local copies)
ai-instructions/    # AI instruction pack (commands, roles, guides, releases, decision record)
.github/            # CI workflows, issue forms, PR template, CODEOWNERS, Dependabot
```

`src/backend/` and `src/frontend/` will be scaffolded by the first `/new-release`.

## Setup

```sh
# After /new-release runs for the first time:
./setup.sh
./run.sh
```

## Documentation

- **Project summary:** [docs/project-summary.md](docs/project-summary.md)
- **Onboarding:** [docs/onboarding.md](docs/onboarding.md)
- **Gitflow:** [docs/gitflow.md](docs/gitflow.md)
- **Code review:** [docs/code-review.md](docs/code-review.md)
- **Conventions:** [docs/conventions/](docs/conventions/)
- **Per-role onboarding:** [docs/roles/](docs/roles/) — one file per team role
- **AI workflow:** [docs/ai-workflow.md](docs/ai-workflow.md) — written by `/bootstrap`
- **Source requirements:** [docs/requirements/](docs/requirements/) — preserved spec, README, and interactive HTML mockup
- **Screens:** [docs/images/ui/screens/](docs/images/ui/screens/) — 17 rendered screens from the prototype
- **Project Overview (Confluence):** [Project Overview — fleet operations](https://maksymleb18.atlassian.net/wiki/spaces/SD/pages/3440644/Project+Overview+fleet+operations)
- **Requirements (Confluence):** [Requirements — fleet operations](https://maksymleb18.atlassian.net/wiki/spaces/SD/pages/3309572/Requirements+fleet+operations)
- **Technologies (Confluence):** [Technologies — fleet operations](https://maksymleb18.atlassian.net/wiki/spaces/SD/pages/3473409/Technologies+fleet+operations)
- **User Roles (Confluence):** [User Roles — fleet operations](https://maksymleb18.atlassian.net/wiki/spaces/SD/pages/3440677/User+Roles+fleet+operations)
- **Gitflow (Confluence):** [Gitflow — fleet operations](https://maksymleb18.atlassian.net/wiki/spaces/SD/pages/3375109/Gitflow+fleet+operations)
- **Onboarding (Confluence):** [Onboarding — fleet operations](https://maksymleb18.atlassian.net/wiki/spaces/SD/pages/3440721/Onboarding+fleet+operations)

## Tracker

**Jira:** [https://maksymleb18.atlassian.net/browse/KAN](https://maksymleb18.atlassian.net/browse/KAN) — project key `KAN`. Every branch, commit, and PR title carries a `KAN-\d+` prefix.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).

<!-- /bootstrap appends below this line -->
<!-- /bootstrap appends above this line -->
