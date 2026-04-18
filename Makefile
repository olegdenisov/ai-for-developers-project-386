# Команды для разработки Calendar Booking System

# ──────────────────────────────────────────────
# Запуск приложения
# ──────────────────────────────────────────────

dev:
	pnpm start:dev

dev-mock:
	pnpm start:mock

dev-turbo:
	pnpm dev

# ──────────────────────────────────────────────
# Сборка и проверка качества кода
# ──────────────────────────────────────────────

build:
	pnpm build

type-check:
	pnpm type-check

lint:
	pnpm lint

# ──────────────────────────────────────────────
# Тесты
# ──────────────────────────────────────────────

test:
	cd apps/web && pnpm test

test-watch:
	cd apps/web && pnpm test:watch

test-ui:
	cd apps/web && pnpm test:ui

test-coverage:
	cd apps/web && pnpm test:coverage

test-e2e:
	cd apps/web && pnpm test:e2e

test-e2e-ui:
	cd apps/web && pnpm test:e2e:ui

test-e2e-debug:
	cd apps/web && pnpm test:e2e:debug

test-all: test test-e2e

playwright-install:
	cd apps/web && pnpm playwright:install

# ──────────────────────────────────────────────
# База данных
# ──────────────────────────────────────────────

db-generate:
	pnpm db:generate

db-migrate:
	pnpm db:migrate

db-seed:
	pnpm db:seed

db-studio:
	pnpm db:studio

db-reset:
	cd apps/api && pnpm db:reset

# ──────────────────────────────────────────────
# Генерация кода (TypeSpec → OpenAPI → TS types + API client)
# ──────────────────────────────────────────────

generate:
	pnpm generate:all

generate-openapi:
	pnpm generate:openapi

generate-types:
	pnpm generate:types

generate-client:
	pnpm generate:client

# ──────────────────────────────────────────────
# Docker — полный стек
# ──────────────────────────────────────────────

docker-up:
	pnpm docker:up

docker-down:
	pnpm docker:down

docker-logs:
	pnpm docker:logs

# ──────────────────────────────────────────────
# Docker — Prism mock-сервер (без БД)
# ──────────────────────────────────────────────

mock-up:
	pnpm mock:up

mock-down:
	pnpm mock:down

mock-logs:
	pnpm mock:logs

# ──────────────────────────────────────────────
# Установка зависимостей
# ──────────────────────────────────────────────

install:
	pnpm install

deps-update:
	pnpm update

clean:
	pnpm clean

.PHONY: dev dev-mock dev-turbo build type-check lint \
	test test-watch test-ui test-coverage \
	test-e2e test-e2e-ui test-e2e-debug test-all playwright-install \
	db-generate db-migrate db-seed db-studio db-reset \
	generate generate-openapi generate-types generate-client \
	docker-up docker-down docker-logs \
	mock-up mock-down mock-logs \
	install deps-update clean
