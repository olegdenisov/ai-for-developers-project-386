# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow for Every New Task

1. **Создай план** — перед началом работы составь план реализации. План и всё общение с пользователем вести на русском языке.
2. **Задавай вопросы по одному** — если есть неясности, уточняй их последовательно, по одному вопросу за раз.
3. **Зафикси план в markdown-файле** — сохрани согласованный план в файл `plan.md` в корне репозитория.
4. **Разбей на шаги и пронумеруй** — план должен содержать пронумерованные шаги.
5. **В конце каждого шага**:
   - Обнови/запусти тесты (`pnpm type-check`, unit и E2E при необходимости)
   - Проверь сборку (`pnpm build`)
   - Сделай коммит изменений с описанием выполненного шага

## Language

- **All code comments must be in Russian** (auto-generated code is exempt)
- **Git commit messages in Russian** with conventional commits style: `feat: добавлена функция`, `fix: исправлена ошибка`

## Development Commands

```bash
# Full stack (recommended for first run — starts PostgreSQL, runs migrations, seeds DB, API, Web)
pnpm start:dev

# Frontend-only with Prism mocks (no DB/backend needed)
pnpm start:mock        # Prism on :3100, Web on :5173

# Turbo dev mode (requires PostgreSQL already running)
pnpm dev

# Full Docker stack
pnpm docker:up / pnpm docker:down

# Build & type-check
pnpm build
pnpm type-check
pnpm lint
```

### Database
```bash
pnpm db:generate    # Generate Prisma client
pnpm db:migrate     # Run migrations
pnpm db:seed        # Seed with test data (creates owner + event types + 14-day slots)
pnpm db:studio      # Prisma Studio GUI
pnpm db:reset       # Hard reset
```

### Code Generation (TypeSpec → OpenAPI → TS types + API client)
```bash
pnpm generate:all       # Run everything
pnpm generate:openapi   # main.tsp → tsp-output/openapi.json
pnpm generate:types     # openapi.json → packages/shared-types/src/index.ts
pnpm generate:client    # openapi.json → packages/api-client/src/ (requires Java)
```

### Testing
```bash
# Frontend unit tests (Vitest)
cd apps/web && pnpm test
cd apps/web && pnpm vitest src/features/create-booking/model/model.test.ts  # single file

# E2E tests (Playwright — requires Web running on :5173)
cd apps/web && pnpm test:e2e
cd apps/web && pnpm test:e2e:ui     # debug UI
cd apps/web && pnpm test:e2e e2e/booking-flow.spec.ts  # single file
```

**Mock server guideline**: Start the Prism mock server only after receiving an error that it is not running.

## Architecture Overview

Turborepo monorepo: Fastify backend + React 19 frontend.

```
apps/api/     # Backend: Fastify 5 + Prisma + PostgreSQL 16 (port 3000)
apps/web/     # Frontend: React 19 + Vite + FSD + Reatom v1000 + Mantine v7 (port 5173)
packages/
  shared-types/  # Generated TS types from OpenAPI (do not edit manually)
  api-client/    # Generated fetch client from OpenAPI (do not edit manually)
main.tsp         # TypeSpec API spec — source of truth for API contracts
```

### Business Domain

Single-owner calendar booking system (Calendly-like):
- **Owner** — predefined single user (no auth/registration)
- **Event Types** — meeting templates with name, description, duration
- **Slots** — auto-generated 14-day time slots per event type
- **Bookings** — guests book slots without registration; **no double-booking** enforced via `Serializable` transactions

### Backend Module Pattern (`apps/api/src/modules/[name]/`)

```
[name].routes.ts      # Route definitions with Zod schemas (fastify-type-provider-zod)
[name].controller.ts  # Request handlers
[name].service.ts     # Business logic + Prisma transactions
```

Custom errors from `common/errors/customErrors.ts`:
- `NotFoundError` → 404 `NOT_FOUND`
- `ValidationError` → 400 `VALIDATION_ERROR`
- `SlotConflictError` → 409 `SLOT_ALREADY_BOOKED`
- `ConflictError` → 409 `CONFLICT`

Response shape: `{ code, message, errors? }`

For booking creation/cancellation use `Serializable` isolation:
```typescript
await prisma.$transaction(async (tx) => { ... }, { isolationLevel: 'Serializable' });
```

### Frontend FSD Structure (`apps/web/src/`)

```
app/        # Providers (Mantine, Reatom), router, global styles
pages/      # home/, event-type/, booking/
features/   # create-booking/, view-slots/, ...
entities/   # event-type/, slot/, booking/, owner/ — Reatom atoms
shared/     # api/, config/, lib/, ui/
```

Each entity follows this layout:
```
entities/[name]/
├── index.ts
└── model/
    ├── types.ts    # Domain interfaces
    └── model.ts    # Reatom atoms + actions (all in one file)
```

Path aliases (configured in `vite.config.ts` and `tsconfig.json`):
`@/` → `src/`, `@app/`, `@pages/`, `@features/`, `@entities/`, `@shared/`

### Reatom v1000 Patterns

Always name atoms/actions/computed (second argument is mandatory):
```typescript
atom<T>(value, 'atomName')
action(fn, 'actionName').extend(withAsync())
computed(() => ..., 'computedName')
```

Async action pattern using `wrap()` from `@reatom/core`:
```typescript
const fetchData = action(async () => {
  const response = await wrap(apiClient.method())
  if (!response.ok) throw new Error('...')
  const data = await wrap(response.json())
  atom.set(data)
  return data
}, 'fetchData').extend(withAsync())
```

Use `reatomComponent()` from `@reatom/react` for components that read atoms.

### Module System

- **ESM only** (`"type": "module"` everywhere)
- Import local files **without extension**: `import { foo } from './bar'` (not `'./bar.ts'`)

### Import Order

1. External packages (`react`, `fastify`, `@reatom/core`)
2. Workspace packages (`@calendar-booking/api-client`)
3. Path aliases (`@shared/config`, `@entities/booking`)
4. Relative imports (`./validation`, `../model/model`)

## Environment Variables

`apps/api/.env`:
```
DATABASE_URL=postgresql://calendar:calendar@localhost:5432/calendar_booking
PORT=3000
WEB_URL=http://localhost:5173
```

`apps/web/.env`:
```
VITE_API_URL=http://localhost:3000
```

`apps/web/.env.mock` (used automatically by `pnpm start:mock`):
```
VITE_API_URL=http://localhost:3100
```

## Known Issues

**PostgreSQL P1010 (Permission Denied)** — PostgreSQL 15+ changed public schema permissions. Workaround: use mock mode (`pnpm start:mock`). Full fix:
```sql
ALTER SCHEMA public OWNER TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
```

**`pnpm generate:client` requires Java** — only needed when regenerating the API client. Type generation (`generate:types`) works without Java.
