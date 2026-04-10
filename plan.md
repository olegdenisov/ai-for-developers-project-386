# Настройка E2E тестов в GitHub Actions CI

## Контекст

E2E тесты используют Playwright с route mocking — реальный бекенд и БД не нужны. Playwright запускает Vite dev сервер через `webServer`. Сгенерированные файлы (`tsp-output/openapi.json`, `packages/shared-types/src/index.ts`) в `.gitignore` — в CI их нужно пересоздавать.

## Шаги

### 1. Создать `.github/workflows/e2e.yml` ✅

Файл создан. Workflow запускается при push/PR в `main`:
- Устанавливает pnpm 9 + Node 24 с кешем
- `pnpm install --frozen-lockfile`
- `pnpm generate:openapi && pnpm generate:types` — пересоздаёт gitignored файлы
- Устанавливает только Chromium (быстрее чем 5 браузеров)
- Запускает `playwright test --project=chromium`
- Загружает HTML отчёт как артефакт (7 дней, даже при падении)
