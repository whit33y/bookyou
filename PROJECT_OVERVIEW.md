# BookYou - Full-Stack Monorepo Overview

## Architecture

The project is organized as a **monorepo** using **npm workspaces**. This structure allows us to manage both the frontend and backend in a single repository while keeping their dependencies and configurations separate but integrated.

## Technology Stack

- **Frontend:** Angular v21+ (Standalone components, Signals, Tailwind CSS)
- **Backend:** NestJS (Modular architecture, TypeScript)
- **Database:** PostgreSQL (v17)
- **ORM:** Prisma
- **Infrastructure:** Docker & Docker Compose
- **Quality Assurance:** Husky, Commitlint (Conventional Commits), Lint-staged, Prettier, ESLint

## Project Structure

```text
bookyou/
├── apps/
│   ├── frontend/         # Angular Application
│   │   ├── src/          # Source code
│   │   ├── package.json  # Frontend-specific dependencies
│   │   └── tsconfig.json # Frontend TS configuration
│   └── backend/          # NestJS Application
│       ├── src/          # Source code
│       ├── prisma/       # Database schema and migrations
│       └── package.json  # Backend-specific dependencies
├── .husky/               # Git Hooks (pre-commit, commit-msg)
├── .gemini/              # Project-specific AI instructions (GEMINI.md)
├── docker-compose.yml    # Infrastructure orchestration (PostgreSQL)
├── package.json          # Root configuration and npm workspaces
└── .gitignore            # Root-level ignore rules
```

## Available Scripts (Root)

Run these commands from the root directory:

### Development

- `npm run frontend:start`: Start the Angular development server.
- `npm run backend:start`: Start the NestJS development server in watch mode.

### Database & Infrastructure

- `npm run db:up`: Start the PostgreSQL container in the background.
- `npm run db:down`: Stop the database container.
- `npm run prisma:migrate`: Apply database migrations (Prisma).
- `npm run prisma:generate`: Generate Prisma Client.

### Build & Test

- `npm run frontend:build`: Build the frontend for production.
- `npm run frontend:test`: Run frontend unit tests (Vitest).

## Quality & Automation Rules

- **Conventional Commits:** All commit messages must follow the format: `<type>(<scope>): <subject>`. Examples: `feat: add user login`, `fix(api): handle timeout`.
- **Pre-commit Hook:** Before every commit, `lint-staged` automatically formats your changed files using **Prettier**.
- **Commit-msg Hook:** Validates your commit message format before allowing the commit.

## Getting Started

1. Install all dependencies: `npm install`
2. Start the database: `npm run db:up`
3. Run initial migration: `npm run prisma:migrate -- --name init`
4. Start both applications in separate terminals.
