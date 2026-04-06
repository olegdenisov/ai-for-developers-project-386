# AGENTS.md - Calendar Booking System

## Project Overview

Turborepo monorepo with calendar booking system:
- **apps/api**: Fastify + Prisma + PostgreSQL backend
- **apps/web**: React 19 + Vite + FSD + Reatom v1000 + Mantine frontend
- **packages/shared-types**: Generated TypeScript types from TypeSpec
- **packages/api-client**: Generated fetch API client

## Build Commands

```bash
# Development (start all services in parallel)
pnpm dev

# Build all packages
pnpm build

# Type checking
pnpm type-check

# Linting
pnpm lint

# Clean build artifacts
pnpm clean
```

### API-Specific Commands (apps/api)

```bash
cd apps/api
pnpm dev              # Start with tsx watch
pnpm build            # Compile TypeScript
pnpm start            # Run compiled dist/main.js
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run Prisma migrations
pnpm db:seed          # Seed database
pnpm db:studio        # Open Prisma Studio
```

### Web-Specific Commands (apps/web)

```bash
cd apps/web
pnpm dev              # Vite dev server (port 5173)
pnpm build            # TypeScript + Vite build
pnpm preview          # Preview production build
pnpm type-check       # tsc --noEmit
```

### API Generation Commands

```bash
# Generate OpenAPI spec from TypeSpec
pnpm generate:openapi

# Generate TypeScript types from OpenAPI
pnpm generate:types

# Generate API client from OpenAPI
pnpm generate:client

# Run all generation steps
pnpm generate:all
```

### Docker Commands

```bash
pnpm docker:up        # Start all services (PostgreSQL + API + Web)
pnpm docker:down      # Stop all services
pnpm docker:logs      # Follow logs
```

## Code Style Guidelines

### Module System
- **ESM only**: All packages use `"type": "module"`
- Import local files without extension (e.g., `import { foo } from './bar'`)

### Imports Order
1. External dependencies (e.g., `react`, `fastify`, `@reatom/core`)
2. Workspace packages (e.g., `@calendar-booking/api-client`)
3. Absolute path aliases (e.g., `@shared/config`, `@entities/booking`)
4. Relative imports (e.g., `./validation`, `../model/model`)

### Naming Conventions
- **Variables/Functions**: camelCase (`getProfile`, `bookingAtom`)
- **Components**: PascalCase (`BookingPage`, `Layout`)
- **Types/Interfaces**: PascalCase (`Booking`, `CreateBookingRequest`)
- **Atoms**: Suffix with `Atom` (`currentBookingAtom`, `formErrorsAtom`)
- **Actions**: camelCase, descriptive (`submitBookingForm`, `fetchOwner`)
- **Constants**: UPPER_SNAKE_CASE for true constants

### Comments
- **All code comments must be in Russian** (все комментарии в коде должны быть на русском языке)
- This includes inline comments, JSDoc, and block comments
- Exception: auto-generated code from external tools (e.g., Prisma, OpenAPI generators)

### Git Commits
- **All commit messages must be in Russian** (все сообщения коммитов должны быть на русском языке)
- Use conventional commit style: `feat: добавлена новая функция` or `fix: исправлена ошибка валидации`
- Keep commit messages concise and descriptive

### Types & Interfaces
- Prefer `interface` over `type` for object shapes
- Use explicit return types on exported functions
- Use `strict: true` TypeScript mode
- Use Zod for runtime validation, infer types with `z.infer`

### Error Handling
- Use custom error classes extending `AppError` (see `apps/api/src/common/errors/`)
- Error classes: `NotFoundError`, `ValidationError`, `SlotConflictError`, `ConflictError`
- Always include error code and status code
- Frontend: Use Reatom's `wrap()` for async error handling
- API returns JSON errors with `{ code, message, errors? }`

### Backend (Fastify)
- Controllers: Export async functions taking `(request, reply)`
- Services: Export pure async functions, throw `AppError` subclasses
- Routes: Use Zod schemas with `fastify-type-provider-zod`
- Use Prisma with Serializable isolation for transactions
- Business rules documented in code comments

### Frontend (FSD Architecture)

Path aliases configured in `vite.config.ts`:
- `@/`: `src/`
- `@app/`: `src/app/` (init, providers, router, styles)
- `@pages/`: `src/pages/` (route pages)
- `@features/`: `src/features/` (user scenarios)
- `@entities/`: `src/entities/` (business entities with atoms)
- `@shared/`: `src/shared/` (api, config, lib, ui)

#### State Management (Reatom v1000)
- Define atoms with names: `atom<T>(value, 'name')`
- Define actions with names: `action(fn, 'name').extend(withAsync())`
- Define computed with names: `computed(() => ..., 'name')`
- Use `withAsync()` for async actions
- Use `wrap()` to handle promises
- Access atom values: `atom()` (calling the atom)

#### Component Patterns
- Use `reatomComponent()` for components accessing atoms
- Props interfaces defined at top with clear comments
- Use Mantine components for UI
- Use `@tabler/icons-react` for icons
- Form validation with Zod + Mantine form

### Database (Prisma)
- Schema in `apps/api/prisma/schema.prisma`
- Generated client at `apps/api/prisma/generated/client`
- Use transactions with `isolationLevel: 'Serializable'` for critical operations
- Seed script in `apps/api/prisma/seed.ts`

## Environment Requirements

- Node.js 24+
- pnpm 9+
- PostgreSQL 15+ (via Docker or local)

## Key Environment Variables

### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: API server port (default: 3000)
- `WEB_URL`: Frontend URL for CORS

### Frontend
- `VITE_API_URL`: Backend API URL

## Testing

**Note**: No test framework is currently configured. Tests should be added using a framework like Vitest or Jest following the existing code patterns.

## File Structure Patterns

### API Module Pattern
```
modules/[name]/
├── [name].routes.ts     # Route definitions with Zod schemas
├── [name].controller.ts # Request handlers
└── [name].service.ts    # Business logic
```

### FSD Entity Pattern
```
entities/[name]/
├── index.ts            # Public API exports
└── model/
    ├── model.ts        # Reatom atoms and actions (combined in one file)
    └── types.ts        # Domain types
```

### FSD Feature Pattern
```
features/[name]/
├── index.ts            # Public API exports
└── model/
    ├── model.ts        # Feature atoms and actions (combined in one file)
    └── validation.ts   # Zod schemas
```
