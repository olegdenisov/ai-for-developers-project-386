# AGENTS.md - TypeSpec Calendar Booking API

## Project Overview

This is a **Hexlet educational project** implementing a Calendar Call Booking API specification using **TypeSpec**. The API describes a booking system where guests can schedule calls with a calendar owner without authentication.

**Key Features:**
- TypeSpec API specification (`main.tsp`)
- OpenAPI 3.0 generation
- REST API design with HTTP/REST decorators
- No authentication/authorization - single predefined owner
- Business rule: no double-booking at the same time

## Build/Lint/Test Commands

### TypeSpec CLI Commands

```bash
# Compile and validate TypeSpec (basic check)
tsp compile main.tsp

# Compile with OpenAPI emitter (generates openapi.json)
tsp compile main.tsp --emit @typespec/openapi3

# Format TypeSpec files
tsp format "**/*.tsp"

# Check formatting without writing
tsp format "**/*.tsp" --check

# Validate only (no emit)
tsp compile main.tsp --no-emit
```

### Alternative: Using npx

```bash
npx tsp compile main.tsp
npx tsp format "**/*.tsp"
```

### Hexlet Tests

```bash
# Hexlet tests run automatically on every commit via GitHub Actions
# Workflow file: .github/workflows/hexlet-check.yml
# DO NOT MODIFY the hexlet-check.yml file
```

## Code Style Guidelines

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Namespace | PascalCase | `CalendarBooking` |
| Models | PascalCase | `EventType`, `Booking` |
| Interfaces | PascalCase + Api suffix | `OwnerApi`, `SlotsApi` |
| Enums | PascalCase | `BookingStatus` |
| Enum members | camelCase | `confirmed`, `cancelled` |
| Properties | camelCase | `durationMinutes`, `guestEmail` |
| Operations | camelCase | `createBooking`, `getProfile` |
| DTOs | PascalCase + Request/Response suffix | `CreateEventTypeRequest` |

### Imports and Using Statements

Order and format:
```typespec
import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.OpenAPI;
```

- Always use `using` after imports to avoid prefixing decorators
- Group imports logically: standard library first, then third-party

### Model Definitions

```typespec
model EventType {
  @key
  @format("uuid")
  id: string;

  @minLength(1)
  @maxLength(100)
  name: string;

  /** Длительность события в минутах */
  @minValue(1)
  @maxValue(480)
  durationMinutes: int32;

  @visibility("read")
  createdAt: utcDateTime;
}
```

**Rules:**
- Use `@key` for identifier fields
- Use `@format("uuid")` for UUID fields
- Use validation decorators: `@minLength`, `@maxLength`, `@minValue`, `@maxValue`
- Add doc comments `/** */` for business logic fields
- Use `@visibility("read")` for auto-generated timestamp fields

### Interface Definitions

```typespec
@route("/event-types")
@tag("Event Types")
interface EventTypesApi {
  @get
  listEventTypes(): EventType[];

  @get
  @route("/{id}")
  getEventType(@path id: string): EventType | NotFoundError;

  @post
  createEventType(@body request: CreateEventTypeRequest): EventType | ValidationError;
}
```

**Rules:**
- Always use `@route()` at interface level for base path
- Use `@tag()` for OpenAPI grouping
- Combine HTTP method decorators (`@get`, `@post`, etc.) with `@route()` for sub-paths
- Use `@path` for path parameters
- Use `@body` for request bodies
- Use `@query` for query parameters

### Error Handling

```typespec
@error
model ErrorResponse {
  code: string;
  message: string;
  details?: string[];
}

@error
model NotFoundError {
  @statusCode
  statusCode: 404;
  code: "NOT_FOUND";
  message: string;
}
```

**Rules:**
- Mark error models with `@error` decorator
- Include `@statusCode` in error models
- Use union return types: `SuccessType | ErrorType`

### Documentation

- Use `/** */` doc comments for models, properties, and operations
- Document business rules explicitly
- Use Russian for domain-specific descriptions (project convention)
- Include HTTP method descriptions in doc comments

### Formatting

- Use 2 spaces for indentation
- Max line length: 100 characters
- Group related models with section comments:
```typespec
// ============================================
// DOMAIN ENTITIES
// ============================================
```

### File Structure

Typical `.tsp` file organization:
1. Imports
2. `using` statements
3. Service decorator with `@service`
4. Server definitions with `@server`
5. Namespace declaration
6. Domain entities (Models)
7. DTOs for operations
8. Error models
9. API interfaces (grouped by domain)
10. Service description alias

## TypeSpec-Specific Conventions

### Built-in Types

| Type | Use For |
|------|---------|
| `string` | Text data |
| `int32` | Integer values (duration, counts) |
| `boolean` | Flags |
| `utcDateTime` | Timestamps |
| `plainDate` | Date-only fields |

### Common Decorators

| Decorator | Usage |
|-----------|-------|
| `@service()` | Define API metadata |
| `@server()` | Define server URLs |
| `@route()` | Define URL path |
| `@tag()` | Group operations in OpenAPI |
| `@key` | Primary key identifier |
| `@format("uuid")` | UUID format validation |
| `@error` | Error response model |
| `@statusCode` | HTTP status code |
| `@visibility()` | Control serialization |
| `@minLength/@maxLength` | String validation |
| `@minValue/@maxValue` | Numeric validation |
| `@path` | Path parameter |
| `@query` | Query parameter |
| `@body` | Request body |

## CI/CD

GitHub Actions runs Hexlet tests on every push. Do not modify:
- `.github/workflows/hexlet-check.yml`

## References

- [TypeSpec Documentation](https://typespec.io/docs)
- [TypeSpec Style Guide](https://typespec.io/docs/handbook/style-guide)
- [TypeSpec CLI](https://typespec.io/docs/handbook/cli/)
- [REST API Guide](https://typespec.io/docs/getting-started/getting-started-rest/)
