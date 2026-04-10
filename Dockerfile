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

# ===================== STAGE 3: Production =====================
FROM node:24-alpine AS production

WORKDIR /app

# Системные зависимости для Prisma
RUN apk add --no-cache openssl

# Копируем root node_modules (виртуальный .pnpm стор с реальными пакетами)
COPY --from=builder /app/node_modules ./node_modules

# Копируем node_modules самого API (симлинки на .pnpm стор — нужны для резолва зависимостей)
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# Копируем конфигурацию workspace
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./

# Копируем манифесты пакетов
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder /app/packages/api-client/package.json ./packages/api-client/

# Копируем исходники пакетов (нужны для workspace-ссылок в TypeScript)
COPY --from=builder /app/packages ./packages

# Копируем собранный API и Prisma схему с миграциями
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Копируем собранный фронтенд (статические файлы)
COPY --from=builder /app/apps/web/dist ./apps/web/dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE ${PORT}

# Запуск: применяем миграции (|| true — не падаем если нет БД), затем стартуем API
CMD ["sh", "-c", "apps/api/node_modules/.bin/prisma migrate deploy --schema apps/api/prisma/schema.prisma || true && exec node apps/api/dist/main.js"]
