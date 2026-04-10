# ===================== STAGE 1: Зависимости =====================
FROM node:24-alpine AS deps

WORKDIR /app

# Активируем pnpm через corepack
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Копируем манифесты workspace для кэширования слоёв
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/api-client/package.json ./packages/api-client/

# Устанавливаем все зависимости
RUN pnpm install --frozen-lockfile

# ===================== STAGE 2: Сборка =====================
FROM deps AS builder

WORKDIR /app

# Копируем исходный код
COPY . .

# Генерируем Prisma Client
RUN pnpm --filter @calendar-booking/api run db:generate

# Собираем фронтенд (VITE_API_URL=/ — относительные запросы к тому же origin)
RUN VITE_API_URL=/ pnpm --filter @calendar-booking/web build

# Собираем API (TypeScript → JavaScript)
RUN pnpm --filter @calendar-booking/api build

# Создаём standalone-деплой API: flat node_modules без симлинков (включая devDeps для prisma CLI)
RUN pnpm deploy --filter @calendar-booking/api /standalone

# ===================== STAGE 3: Production =====================
FROM node:24-alpine AS production

WORKDIR /app

# Системные зависимости для Prisma
RUN apk add --no-cache openssl

# Копируем standalone-деплой API (flat node_modules, dist, prisma, package.json)
COPY --from=builder /standalone .

# Копируем собранный фронтенд в путь, который ожидает API:
# __dirname = /app/dist, path.resolve(__dirname, '../../web/dist') = /app/web/dist
COPY --from=builder /app/apps/web/dist ./web/dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE ${PORT}

# Запуск: применяем миграции, затем стартуем API
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma && node_modules/.bin/tsx prisma/seed.ts || true && exec node dist/main.js"]
