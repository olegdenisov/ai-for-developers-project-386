# AGENTS.md - Calendar Booking System

## Project Structure

Turborepo monorepo:
- **apps/api**: Fastify + Prisma + PostgreSQL backend
- **apps/web**: React 19 + Vite + FSD + Reatom v1000 + Mantine frontend  
- **packages/shared-types**: Generated TypeScript types from TypeSpec
- **packages/api-client**: Generated fetch API client

## Development Commands

```bash
# Three development modes:
pnpm dev:mock          # Prism mock (3100) + Web (5173) - for isolated frontend dev
pnpm dev               # API + Web via turbo (need PostgreSQL running)
pnpm docker:up         # Full stack in Docker (Postgres + API + Web)

# Code generation workflow (runs automatically when main.tsp changes)
pnpm generate:all      # TypeSpec → OpenAPI → Types + Client

# Database operations
pnpm db:generate       # Generate Prisma client
pnpm db:migrate        # Run migrations
pnpm db:seed           # Seed database
pnpm db:studio         # Prisma Studio
```

## Critical Rules

### Language Requirements
- **All code comments must be in Russian** (auto-generated code exempted)
- **All git commit messages must be in Russian** using conventional style: `feat: добавлена функция`

### Module System
- **ESM only**: `"type": "module"` in all packages
- Import local files without extension: `import { foo } from './bar'`

### Import Order
1. External dependencies (`react`, `fastify`, `@reatom/core`)
2. Workspace packages (`@calendar-booking/api-client`)
3. Path aliases (`@shared/config`, `@entities/booking`)
4. Relative imports (`./validation`, `../model/model`)

## Backend (Fastify + Prisma)

### API Module Pattern
```
modules/[name]/
├── [name].routes.ts      # Route definitions with Zod schemas
├── [name].controller.ts  # Request handlers
└── [name].service.ts     # Business logic
```

### Error Handling
Use custom error classes extending `AppError`:
- `NotFoundError` → 404
- `ValidationError` → 400 (with `errors[]` array)
- `SlotConflictError` → 409 (double booking prevention)
- `ConflictError` → 409

Always include `code` and `statusCode`. API returns JSON: `{ code, message, errors? }`

### Database
- Use transactions with `isolationLevel: 'Serializable'` for critical operations
- Prisma client generated to `apps/api/prisma/generated/client`
- Business rule: No double booking (enforced via Serializable transactions)

## Frontend (FSD + Reatom v1000)

### Path Aliases (vite.config.ts)
- `@/` → `src/`
- `@app/`, `@pages/`, `@features/`, `@entities/`, `@shared/`

### Reatom v1000 Patterns
```typescript
// Always name atoms/actions/computed
atom<T>(value, 'name')
action(fn, 'name').extend(withAsync())
computed(() => ..., 'name')

// Async handling with wrap()
const fetchData = action(async () => {
  const response = await wrap(apiClient.method())
  if (!response.ok) throw new Error(...)
  atom.set(await wrap(response.json()))
}, 'fetchData').extend(withAsync())
```

### Component Patterns
- Use `reatomComponent()` for components accessing atoms
- Props interfaces at top with Russian comments
- UI components from Mantine v7, icons from `@tabler/icons-react`
- Forms: Zod + Mantine form validation

### File Structure
```
entities/[name]/
├── index.ts
└── model/
    ├── model.ts        # Reatom atoms + actions (single file)
    └── types.ts        # Domain types

features/[name]/
├── index.ts
└── model/
    ├── model.ts        # Feature atoms + actions
    └── validation.ts   # Zod schemas
```

## Code Generation Workflow

```
main.tsp (TypeSpec spec)
    ↓ pnpm generate:openapi
openapi.json
    ↓ pnpm generate:types
packages/shared-types/src/index.ts
    ↓ pnpm generate:client
packages/api-client/src/ (fetch client)
```

- Prism mock server (`pnpm mock:up`) serves from `tsp-output/openapi.json`
- Vite in `mock` mode uses `apps/web/.env.mock` (API at :3100)

## Environment

- Node.js 24+, pnpm 9+
- TypeScript 6.x with strict mode enabled
- No test framework configured (add Vitest/Jest when needed)
