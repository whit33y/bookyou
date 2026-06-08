# BookYou

[![CI](https://github.com/whit33y/bookyou/actions/workflows/ci.yml/badge.svg)](https://github.com/whit33y/bookyou/actions/workflows/ci.yml)

BookYou is a platform for booking beauty, wellness, and health services, connecting
service providers (businesses) with clients. It is built as a full-stack TypeScript
monorepo.

## Tech Stack

- **Frontend:** Angular 21 (standalone components, signals, Tailwind CSS)
- **Backend:** NestJS 11 (modular, layered architecture)
- **Database:** PostgreSQL 17 with Prisma ORM
- **Infrastructure:** Docker & Docker Compose
- **Quality:** ESLint, Prettier, Husky, Commitlint (Conventional Commits)

## Project Structure

```text
bookyou/
├── apps/
│   ├── frontend/   # Angular application
│   └── backend/    # NestJS application (+ Prisma schema/migrations)
├── .github/workflows/  # CI pipeline (GitHub Actions)
├── docker-compose.yml  # Local PostgreSQL
└── package.json        # npm workspaces root
```

## Getting Started

```bash
# 1. Install all dependencies (workspaces)
npm install

# 2. Start the database
npm run db:up

# 3. Generate the Prisma client and run the initial migration
npm run prisma:generate
npm run prisma:migrate -- --name init

# 4. Start the apps (separate terminals)
npm run backend:start
npm run frontend:start
```

## Useful Scripts (root)

| Script                      | Description                                  |
| --------------------------- | -------------------------------------------- |
| `npm run frontend:start`    | Start the Angular dev server                 |
| `npm run backend:start`     | Start NestJS in watch mode                   |
| `npm run frontend:build`    | Build the frontend for production            |
| `npm run backend:build`     | Build the backend                            |
| `npm run frontend:test`     | Run frontend unit tests (Vitest)             |
| `npm run lint`              | Lint backend (ESLint) and frontend (ng lint) |
| `npm run format:check`      | Check formatting with Prettier               |
| `npm run db:up` / `db:down` | Start/stop the PostgreSQL container          |

## Continuous Integration

Every push to `master` and every pull request targeting `master` runs the
[CI pipeline](.github/workflows/ci.yml), which executes four parallel jobs:

1. **Lint** — ESLint (backend + frontend) and Prettier formatting check
2. **Backend tests** — Jest (Prisma is mocked, so no database is required)
3. **Frontend tests** — Vitest
4. **Build** — production builds of both apps

Dependencies are cached via `actions/setup-node` to keep the pipeline fast.

### Enabling required status checks (branch protection)

The workflow validates every PR, but merges are only blocked once the checks are
marked as **required**. A repository admin needs to enable this once for `master`:

- **GitHub UI:** Settings → Branches → Add branch ruleset/rule for `master` →
  require status checks: `Lint (ESLint + Prettier)`, `Backend tests (Jest)`,
  `Frontend tests (Vitest)`, `Build (frontend + backend)`.
- **GitHub CLI:**

  ```bash
  gh api -X PUT repos/whit33y/bookyou/branches/master/protection \
    -F 'required_status_checks.strict=true' \
    -f 'required_status_checks.contexts[]=Lint (ESLint + Prettier)' \
    -f 'required_status_checks.contexts[]=Backend tests (Jest)' \
    -f 'required_status_checks.contexts[]=Frontend tests (Vitest)' \
    -f 'required_status_checks.contexts[]=Build (frontend + backend)' \
    -F 'enforce_admins=true' \
    -F 'required_pull_request_reviews.required_approving_review_count=1' \
    -F 'restrictions='
  ```

## Contributing

Commits must follow the [Conventional Commits](https://www.conventionalcommits.org/)
standard. Husky hooks run `lint-staged` (Prettier) on commit and validate the commit
message format.
