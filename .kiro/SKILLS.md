You are an expert in TypeScript, Angular, NestJS, Prisma, and scalable full-stack development. You write functional, maintainable, performant, and accessible code following modern best practices.

# Architecture & General Principles

The project is a full-stack application organized as a monorepo (e.g., `apps/frontend` and `apps/backend`).

## Core Principles

- **Monorepo Structure:** All system components (frontend, backend, infrastructure) reside in a single repository.
- **Conventional Commits:** All commits must follow the Conventional Commits standard (e.g., `feat:`, `fix:`, `chore:`, `docs:`).
- **Automation:** Use Git Hooks (Husky + lint-staged) to enforce linting, formatting, and tests before commit/push.

## TypeScript Best Practices

- **Strict Mode:** Always use strict type checking.
- **Inference:** Prefer type inference when the type is obvious.
- **Types:** Avoid the `any` type; use `unknown` when the type is uncertain.

# Frontend (Angular)

## Angular Best Practices

- **Standalone:** Always use standalone components over NgModules.
- **State Management:** Use Signals for state management and `computed()` for derived state.
- **Lazy Loading:** Implement lazy loading for feature routes.
- **Host Bindings:** Use the `host` object in the `@Component` or `@Directive` decorator instead of `@HostBinding` and `@HostListener`.
- **Images:** Use `NgOptimizedImage` for all static images (excluding base64 images).

## Components

- **Responsibility:** Keep components small and focused on a single responsibility.
- **Reactivity:** Use `input()` and `output()` functions instead of decorators.
- **Performance:** Set `changeDetection: ChangeDetectionStrategy.OnPush` in the `@Component` decorator.
- **Templates:** Prefer inline templates for small components.
- **Forms:** Prefer Reactive Forms over Template-driven ones.
- **Styles:** Do not use `ngClass` or `ngStyle`; use `class` and `style` bindings instead.
- **Paths:** When using external templates/styles, use paths relative to the component TS file.

## Templates & Logic

- **Simplicity:** Keep templates simple and avoid complex logic.
- **Control Flow:** Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`.
- **Async:** Use the `async` pipe to handle Observables.
- **Constraints:** Do not assume globals (e.g., `new Date()`) are available in templates; do not use arrow functions in templates.

## Services

- **Responsibility:** Design services around a single responsibility.
- **Singletons:** Use `providedIn: 'root'` for singleton services.
- **Injection:** Use the `inject()` function instead of constructor injection.

# Backend (NestJS)

- **Architecture:** Use a layered architecture (Controller -> Service -> Repository/Prisma).
- **Injection:** Use the `inject()` function or constructor injection.
- **DTOs & Validation:**
  - Every endpoint accepting data must have a defined `class-validator` DTO.
  - Use a global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`.
- **Exception Handling:** Use built-in `HttpException` and implement a global `ExceptionFilter`.
- **Documentation:** Public controllers and methods must have Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`).

# Database (Prisma & PostgreSQL)

- **Modeling:** Use `@map` and `@@map` to maintain `snake_case` in the database and `camelCase` in Prisma code.
- **Migrations:** Every schema change must have a descriptive migration name. Never edit the database manually.
- **Integrity:** Apply constraints at the database level. For critical data, consider "Soft Delete" (`deleted_at`).
- **Seeding:** Maintain a `prisma/seed.ts` script for base and test data.

# Infrastructure & Code Quality

## Containerization

- **Docker:** Use `node:alpine` images and Multi-stage builds.
- **Docker Compose:** Use it for local orchestration of services (API, DB).
- **Environment:** Document all environment variables in `.env.example`.

## Code Quality (Linting & Formatting)

- **ESLint:** The project must pass ESLint checks without warnings. Rules are consistent across the monorepo.
- **Prettier:** All files must be formatted before commit.
- **Git Hooks (Husky):**
  - `pre-commit`: Runs `lint-staged`.
  - `commit-msg`: Verifies Conventional Commits.
  - `pre-push`: Runs unit tests.

# Accessibility Requirements (A11y)

- The application MUST pass AXE checks.
- It MUST follow WCAG AA minimums, including focus management, color contrast, and ARIA attributes.
