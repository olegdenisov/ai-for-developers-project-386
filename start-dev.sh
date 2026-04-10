#!/bin/bash
# Скрипт для запуска Calendar Booking System в режиме разработки
# Запускает PostgreSQL, проверяет/создает базу данных и запускает dev серверы

set -e

echo "🚀 Запуск Calendar Booking System..."
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для проверки доступности порта
check_port() {
    lsof -i:$1 >/dev/null 2>&1 && return 0 || return 1
}

# 1. Проверка и запуск PostgreSQL
echo "📦 Проверка PostgreSQL..."
if docker ps --format "{{.Names}}" | grep -q "^calendar-postgres$"; then
    echo "${GREEN}✓${NC} PostgreSQL уже запущен"
elif docker ps -a --format "{{.Names}}" | grep -q "^calendar-postgres$"; then
    echo "${YELLOW}→${NC} Удаление старого контейнера и создание нового..."
    docker rm -f calendar-postgres >/dev/null 2>&1 || true
    echo "${YELLOW}→${NC} Создание и запуск нового контейнера PostgreSQL..."
    docker run -d \
        --name calendar-postgres \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=calendar_booking \
        -p 5432:5432 \
        postgres:16-alpine \
        postgres -c "log_statement=all" -c "listen_addresses=*"
else
    echo "${YELLOW}→${NC} Создание нового контейнера PostgreSQL..."
    docker run -d \
        --name calendar-postgres \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=calendar_booking \
        -p 5432:5432 \
        postgres:16-alpine \
        postgres -c "log_statement=all" -c "listen_addresses=*"
fi

# 2. Ожидание готовности PostgreSQL
echo "${YELLOW}→${NC} Ожидание готовности PostgreSQL..."
for i in {1..30}; do
    if docker exec calendar-postgres pg_isready -U postgres >/dev/null 2>&1; then
        echo "${GREEN}✓${NC} PostgreSQL готов"
        break
    fi
    sleep 1
done

# 3. Проверка и создание базы данных
echo "${YELLOW}→${NC} Проверка базы данных..."
if ! docker exec calendar-postgres psql -U postgres -lqt | grep -q "calendar_booking"; then
    echo "${YELLOW}→${NC} Создание базы данных calendar_booking..."
    docker exec calendar-postgres psql -U postgres -c "CREATE DATABASE calendar_booking;" 2>/dev/null || true
fi

# 4. Проверка наличия таблиц
echo "${YELLOW}→${NC} Проверка таблиц..."
TABLES_EXIST=$(docker exec calendar-postgres psql -U postgres -d calendar_booking -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'owners');" 2>/dev/null | grep -E "^ t$|^ f$" || echo "f")

if [[ "$TABLES_EXIST" == " f" ]] || [[ -z "$TABLES_EXIST" ]]; then
    echo "${YELLOW}→${NC} Создание таблиц..."
    docker exec -i calendar-postgres psql -U postgres -d calendar_booking << 'SQLEOF'
-- Grant schema permissions
GRANT ALL ON SCHEMA public TO postgres;
ALTER SCHEMA public OWNER TO postgres;

-- Create Enum Type
DO $$ BEGIN
    CREATE TYPE "booking_status" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Owners Table
CREATE TABLE IF NOT EXISTS "owners" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "isPredefined" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Event Types Table
CREATE TABLE IF NOT EXISTS "event_types" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "durationMinutes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ownerId" TEXT NOT NULL REFERENCES "owners"("id")
);

-- Create Slots Table
CREATE TABLE IF NOT EXISTS "slots" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Bookings Table
CREATE TABLE IF NOT EXISTS "bookings" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "guestName" TEXT NOT NULL,
  "guestEmail" TEXT NOT NULL,
  "guestNotes" TEXT,
  "status" "booking_status" NOT NULL DEFAULT 'CONFIRMED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "eventTypeId" TEXT NOT NULL REFERENCES "event_types"("id"),
  "slotId" TEXT NOT NULL UNIQUE REFERENCES "slots"("id")
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS "bookings_slotId_idx" ON "bookings"("slotId");
CREATE INDEX IF NOT EXISTS "bookings_eventTypeId_idx" ON "bookings"("eventTypeId");

-- Grant all privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON TYPE "booking_status" TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
SQLEOF
    echo "${GREEN}✓${NC} Таблицы созданы"
fi

# 5. Проверка данных
echo "${YELLOW}→${NC} Проверка тестовых данных..."
OWNER_COUNT=$(docker exec calendar-postgres psql -U postgres -d calendar_booking -c "SELECT COUNT(*) FROM owners;" 2>/dev/null | grep -E "^\s*[0-9]+" | tr -d ' ' || echo "0")
if [ "$OWNER_COUNT" = "0" ]; then
    echo "${YELLOW}→${NC} Добавление тестовых данных..."
    docker exec -i calendar-postgres psql -U postgres -d calendar_booking << 'SQLEOF'
-- Grant permissions first
GRANT ALL ON SCHEMA public TO postgres;
ALTER SCHEMA public OWNER TO postgres;

-- Insert default owner
INSERT INTO "owners" ("id", "name", "email", "isPredefined") 
VALUES ('owner-001', 'Calendar Owner', 'owner@calendar.local', true)
ON CONFLICT DO NOTHING;

-- Insert sample event types
INSERT INTO "event_types" ("id", "name", "description", "durationMinutes", "ownerId", "createdAt", "updatedAt") VALUES
('sample-consultation', 'Консультация', 'Индивидуальная консультация по любым вопросам', 30, 'owner-001', NOW(), NOW()),
('sample-meeting', 'Встреча', 'Деловая встреча для обсуждения проектов', 60, 'owner-001', NOW(), NOW()),
('sample-call', 'Звонок', 'Короткий звонок для быстрого обсуждения', 15, 'owner-001', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Generate sample slots for next 14 days
INSERT INTO "slots" ("startTime", "endTime", "isAvailable", "createdAt")
SELECT 
  date_trunc('day', CURRENT_DATE + (d.day || ' days')::interval) + (hour || ' hours')::interval + (minute || ' minutes')::interval as "startTime",
  date_trunc('day', CURRENT_DATE + (d.day || ' days')::interval) + (hour || ' hours')::interval + (minute || ' minutes')::interval + interval '30 minutes' as "endTime",
  true as "isAvailable",
  NOW() as "createdAt"
FROM generate_series(0, 13) as d(day)
CROSS JOIN generate_series(9, 16) as hour
CROSS JOIN (VALUES (0), (30)) as minutes(minute)
WHERE EXTRACT(DOW FROM CURRENT_DATE + (d.day || ' days')::interval) NOT IN (0, 6)
ON CONFLICT DO NOTHING;

-- Grant privileges on new data
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
SQLEOF
    echo "${GREEN}✓${NC} Тестовые данные добавлены"
fi

echo ""
echo "${GREEN}✓${NC} PostgreSQL готов!"
echo "  URL: postgresql://postgres:postgres@localhost:5432/calendar_booking"
echo ""

# 6. Проверка зависимостей
echo "📦 Проверка зависимостей..."
if [ ! -d "node_modules" ] || [ ! -d "apps/api/node_modules" ] || [ ! -d "apps/web/node_modules" ]; then
    echo "${YELLOW}→${NC} Установка зависимостей..."
    pnpm install
fi
echo "${GREEN}✓${NC} Зависимости установлены"
echo ""

# 7. Генерация типов
echo "📝 Проверка сгенерированных типов..."
if [ ! -f "packages/shared-types/src/index.ts" ] || [ $(wc -l < "packages/shared-types/src/index.ts") -lt 100 ]; then
    echo "${YELLOW}→${NC} Генерация TypeScript типов из OpenAPI..."
    pnpm generate:types
fi
echo "${GREEN}✓${NC} Типы готовы"
echo ""

# 7.5. Генерация Prisma клиента
echo "🗄️ Проверка Prisma клиента..."
if [ ! -f "apps/api/prisma/generated/client/package.json" ]; then
    echo "${YELLOW}→${NC} Генерация Prisma клиента..."
    pnpm --filter api db:generate
    # Создаем package.json для корректного импорта ESM
    cat > apps/api/prisma/generated/client/package.json << 'EOF'
{
  "name": "generated-prisma-client",
  "type": "module",
  "main": "./client.ts",
  "types": "./client.ts",
  "exports": {
    ".": {
      "import": "./client.ts",
      "types": "./client.ts"
    }
  }
}
EOF
fi
echo "${GREEN}✓${NC} Prisma клиент готов"
echo ""

# 8. Запуск dev серверов
echo "🚀 Запуск серверов разработки..."
echo ""
echo "  API будет доступен по адресу:  http://localhost:3000"
echo "  Swagger UI:                    http://localhost:3000/docs"
echo "  Web приложение:                  http://localhost:5173"
echo ""
echo "${YELLOW}Нажмите Ctrl+C для остановки всех сервисов${NC}"
echo ""

# Устанавливаем правильный DATABASE_URL для API
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/calendar_booking?schema=public"

# Запуск через turbo
pnpm dev
