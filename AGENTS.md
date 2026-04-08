# AGENTS.md - Calendar Booking System

Turborepo monorepo: Fastify backend + React 19 frontend with FSD architecture.

## Quick Commands

```bash
# Full development (RECOMMENDED) - PostgreSQL + tables + data + API + Web
pnpm start:dev

# Frontend-only with mocks (Prism on :3100, Web on :5173)
pnpm start:mock         # Note: in README this is `dev:mock`, but package.json has `start:mock`

# Turbo mode (PostgreSQL must be running)
pnpm dev

# Docker full stack
pnpm docker:up
```

## Code Generation (TypeSpec → OpenAPI → Types + Client)

```bash
pnpm generate:all       # Run all generators
# Or step by step:
pnpm generate:openapi   # main.tsp → tsp-output/openapi.json
pnpm generate:types     # openapi.json → packages/shared-types/src/index.ts
pnpm generate:client    # openapi.json → packages/api-client/src/ (requires Java)
```

## Database

```bash
pnpm db:generate        # Prisma client → apps/api/prisma/generated/client
pnpm db:migrate         # Run migrations
pnpm db:seed            # Seed with test data
pnpm db:studio          # Prisma Studio GUI
```

## Critical Rules

### Language (STRICT)
- **All code comments must be in Russian** (auto-generated code exempted)
- **Git commit messages in Russian** with conventional style: `feat: добавлена функция`

### Module System
- **ESM only**: `"type": "module"` in all packages
- Import local files **without extension**: `import { foo } from './bar'`

### Import Order
1. External deps (`react`, `fastify`, `@reatom/core`)
2. Workspace packages (`@calendar-booking/api-client`)
3. Path aliases (`@shared/config`, `@entities/booking`)
4. Relative imports (`./validation`, `../model/model`)

## Backend (Fastify + Prisma)

### Module Pattern
```
modules/[name]/
├── [name].routes.ts      # Routes with Zod schemas (fastify-type-provider-zod)
├── [name].controller.ts  # Request handlers
└── [name].service.ts     # Business logic + Prisma transactions
```

### Error Handling
Use custom errors from `common/errors/customErrors.ts`:
- `NotFoundError(message)` → 404, code: `NOT_FOUND`
- `ValidationError(message, errors[])` → 400, code: `VALIDATION_ERROR`
- `SlotConflictError()` → 409, code: `SLOT_ALREADY_BOOKED` (double booking prevention)
- `ConflictError(message)` → 409, code: `CONFLICT`

API returns: `{ code, message, errors? }`

### Database Transactions
Use `isolationLevel: 'Serializable'` for critical operations (booking creation/cancellation):
```typescript
await prisma.$transaction(async (tx) => {
  // ... logic
}, { isolationLevel: 'Serializable' });
```

## Frontend (FSD + Reatom v1000 + Mantine v7)

### Path Aliases (vite.config.ts)
- `@/` → `src/`
- `@app/`, `@pages/`, `@features/`, `@entities/`, `@shared/`

### Reatom v1000 Patterns
```typescript
// ALWAYS name atoms/actions/computed (second argument)
atom<T>(value, 'name')
action(fn, 'name').extend(withAsync())
computed(() => ..., 'name')

// Async pattern with wrap() from @reatom/core
const fetchData = action(async () => {
  const response = await wrap(apiClient.method())
  if (!response.ok) throw new Error('...')
  const data = await wrap(response.json())
  atom.set(data)
  return data
}, 'fetchData').extend(withAsync())
```

### Component Patterns
- Use `reatomComponent()` from `@reatom/react` for components with atoms
- Props interfaces at top with Russian comments
- UI: Mantine v7, Icons: `@tabler/icons-react`
- Forms: Zod + Mantine form validation

### File Structure
```
entities/[name]/
├── index.ts
└── model/
    ├── types.ts        # Domain types (interfaces)
    └── model.ts        # Reatom atoms + actions (single file!)

features/[name]/
├── index.ts
└── model/
    ├── model.ts        # Feature atoms + actions
    └── validation.ts   # Zod schemas
```

## Mock Development

Prism mock server serves from `tsp-output/openapi.json` on port 3100:
- `pnpm mock:up` / `pnpm mock:down`
- Vite mock mode uses `apps/web/.env.mock` → API at :3100

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

## Environment

- Node.js 24+, pnpm 9+
- TypeScript 6.x with strict mode
- No test framework configured

## Guidelines Note

From `docs/guidelines.md`: Start mock server for testing **only after receiving an error that it's not running**.
