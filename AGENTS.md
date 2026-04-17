# AGENTS.md — Calendar Booking System

Turborepo monorepo: Fastify backend + React 19 frontend with FSD architecture.

## Workflow for Every New Task

1. **Создай план** — перед началом работы составь план реализации. План и всё общение с пользователем вести на русском языке.
2. **Задавай вопросы по одному** — если есть неясности, уточняй их последовательно, по одному вопросу за раз.
3. **Зафикси план в markdown-файле** — сохрани согласованный план в директорию `docs/plans/` с именем вида `YYYY-MM-DD-<feature-slug>.md`.
4. **Разбей на шаги и пронумеруй** — план должен содержать пронумерованные шаги.
5. **В конце каждого шага**:
   - Обнови/создай/запусти тесты (`pnpm type-check`, unit и E2E при необходимости)
   - Проверь сборку (`pnpm build`)
   - Сделай коммит изменений с описанием выполненного шага

## Critical Rules

### Language (STRICT)
- **All code comments must be in Russian** (auto-generated code is exempt)
- **Git commit messages in Russian** with conventional commits style: `feat: добавлена функция`, `fix: исправлена ошибка`

### Module System
- **ESM only**: `"type": "module"` in all packages
- Import local files **without extension**: `import { foo } from './bar'` (not `'./bar.ts'`)

### Import Order
1. External packages (`react`, `fastify`, `@reatom/core`)
2. Workspace packages (`@calendar-booking/api-client`)
3. Path aliases (`@shared/config`, `@entities/booking`)
4. Relative imports (`./validation`, `../model/model`)

## Quick Commands

```bash
# Full stack (recommended — starts PostgreSQL, runs migrations, seeds DB, API, Web)
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
pnpm db:generate    # Generate Prisma client → apps/api/prisma/generated/client
pnpm db:migrate     # Run migrations
pnpm db:seed        # Seed with test data (creates owner + event types + 14-day slots)
pnpm db:studio      # Prisma Studio GUI
cd apps/api && pnpm db:reset  # Hard reset (only available in apps/api)
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

## Backend (Fastify + Prisma)

### Module Pattern (`apps/api/src/modules/[name]/`)

```
[name].routes.ts      # Route definitions with Zod schemas (fastify-type-provider-zod)
[name].controller.ts  # Request handlers
[name].service.ts     # Business logic + Prisma transactions
```

### Error Handling

Use custom errors from `common/errors/customErrors.ts`:
- `NotFoundError(message)` → 404, code: `NOT_FOUND`
- `ValidationError(message, errors[])` → 400, code: `VALIDATION_ERROR`
- `SlotConflictError()` → 409, code: `SLOT_ALREADY_BOOKED` (double booking prevention)
- `ConflictError(message)` → 409, code: `CONFLICT`

API response shape: `{ code, message, errors? }`

### Database Transactions

Use `isolationLevel: 'Serializable'` for critical operations (booking creation, cancellation, rescheduling):
```typescript
await prisma.$transaction(async (tx) => {
  // ... logic
}, { isolationLevel: 'Serializable' });
```

## Frontend (FSD + Reatom v1000 + Mantine v7)

### FSD Structure (`apps/web/src/`)

```
app/        # Providers (Mantine, Reatom), router, global styles
pages/      # home/, book-catalog/, event-type/, booking-confirmation/, booking-detail/, admin/
features/   # create-booking/, view-slots/, cancel-booking/, reschedule-booking/, create-event-type/, edit-event-type/, delete-event-type/, owner-bookings/
entities/   # event-type/, slot/, booking/, owner/ — Reatom atoms
shared/     # api/, config/, lib/, ui/, router/
```

### Entity Layout

```
entities/[name]/
├── index.ts
└── model/
    ├── types.ts    # Domain interfaces
    └── model.ts    # Reatom atoms + actions (all in one file)
```

Entity `types.ts` files re-export types directly from `@calendar-booking/shared-types` (`components['schemas']['TypeName']`) instead of defining interfaces manually. Do not duplicate interfaces that already exist in the generated package.

`entities/booking` exports `currentBookingAtom` (`atom<Booking | null>`) for reactive in-page updates. Route loaders set it on load; mutations (cancel, reschedule) call `currentBookingAtom.set(updatedBooking)` so `BookingDetailPage` reflects changes without re-running the loader.

**Booking status values are lowercase strings** (`'confirmed'`, `'cancelled'`, `'completed'`), normalised by the Zod route schema on the backend. Always compare with lowercase: `booking.status === 'confirmed'`. The Prisma enum uses uppercase (`CONFIRMED`), but the API and frontend types use lowercase.

### Page Layout

```
pages/[name]/
├── index.ts
├── [Name]Page.tsx
└── model/
    ├── index.ts
    ├── model.ts    # Page-level atoms (optional)
    └── route.ts    # Reatom route definition with loader and render
```

### Feature Layout

```
features/[name]/
├── index.ts
├── model/
│   ├── model.ts        # Feature atoms + actions
│   └── validation.ts   # Zod schemas (optional)
└── ui/                 # Feature-specific components (optional)
    └── [Name]Modal.tsx
```

### Admin Panel (`/admin`)

- `/admin/bookings` — owner's bookings list with cancel action
- `/admin/event-types` — event type CRUD (create, edit, delete)
- Routes: `adminRoute`, `adminBookingsRoute`, `adminEventTypesRoute` exported from `@pages/admin`

### Routing (`apps/web/src/shared/router/`)

Routes use Reatom `reatomRoute` with loaders and `render`. The app tree: `layoutRoute` → page routes. Navigation helpers in `apps/web/src/app/router/routes.ts` (`navigate.home()`, `navigate.admin()`, etc.).

### Path Aliases (vite.config.ts + tsconfig.json)
- `@/` → `src/`
- `@app/` → `src/app`
- `@pages/` → `src/pages`
- `@features/` → `src/features`
- `@entities/` → `src/entities`
- `@shared/` → `src/shared`

### Reatom v1000 Patterns

@docs/reatom-summary-doc.md
@docs/reatom-v1000.md

### Component Patterns
- Use `reatomComponent()` from `@reatom/react` for components with atoms
- Props interfaces at top with Russian comments
- UI: Mantine v7, Icons: `@tabler/icons-react`
- Forms: Zod + Mantine form validation

## Mock Development

Prism mock server serves from `tsp-output/openapi.json` on port 3100:
```bash
pnpm mock:up / pnpm mock:down
```
Vite mock mode uses `apps/web/.env.mock` → API at `:3100`.

## Environment Variables

`apps/api/.env`:
```
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/calendar_booking
PORT=3000
HOST=0.0.0.0
WEB_URL=http://localhost:5173
NODE_ENV=development
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

### PostgreSQL P1010 (Permission Denied)
In PostgreSQL 15+, schema public permissions changed. **Workaround**: use mock mode:
```bash
pnpm start:mock  # Frontend-only development
```

**Full fix**: Ensure postgres owns public schema:
```sql
ALTER SCHEMA public OWNER TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
```

### openapi-generator-cli Requires Java
The API client generator needs Java installed. Types are generated via `openapi-typescript` (no Java needed).

## Environment Requirements

- Node.js 24+, pnpm 9+
- TypeScript 6.x with strict mode
- No test framework configured for backend
