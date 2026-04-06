# Calendar Booking System

Turborepo монорепозиторий с системой бронирования встреч (Fastify + React 19 + FSD + Reatom v1000 + Mantine)

## 📁 Структура

```
calendar-booking/
├── apps/
│   ├── api/                 # Backend: Fastify + Prisma + PostgreSQL
│   └── web/                 # Frontend: React 19 + Vite + FSD
├── packages/
│   ├── shared-types/        # Генерированные типы из TypeSpec
│   └── api-client/          # Генерированный API клиент
├── docker/                  # Docker конфигурации
└── main.tsp                 # TypeSpec спецификация API
```

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 24+
- pnpm 9+
- Docker и Docker Compose

### Установка

```bash
# Установка зависимостей
pnpm install

# Запуск инфраструктуры (PostgreSQL)
docker-compose -f docker/docker-compose.yml up -d postgres

# Генерация Prisma клиента и миграции
pnpm db:generate
pnpm db:migrate

# Seed базы данных (опционально)
pnpm db:seed
```

### Разработка

```bash
# Запуск всех сервисов в режиме разработки
pnpm dev

# Или по отдельности:
# Terminal 1: Backend
cd apps/api && pnpm dev

# Terminal 2: Frontend
cd apps/web && pnpm dev
```

### Генерация API клиента

```bash
# Сгенерировать OpenAPI из TypeSpec, затем TypeScript типы и клиент
pnpm generate:all

# Или пошагово:
pnpm generate:openapi   # TypeSpec → OpenAPI JSON
pnpm generate:types     # OpenAPI → TS types
pnpm generate:client    # OpenAPI → Fetch client
```

## 🐳 Docker

### Полный запуск в Docker

```bash
# Запуск всех сервисов (PostgreSQL + API + Web)
docker-compose -f docker/docker-compose.yml up -d

# Просмотр логов
docker-compose -f docker/docker-compose.yml logs -f

# Остановка
docker-compose -f docker/docker-compose.yml down
```

### Только база данных

```bash
docker-compose -f docker/docker-compose.yml up -d postgres
```

## 🛠 Технологии

### Backend
- **Fastify** - Web framework
- **Prisma** - ORM для PostgreSQL
- **Zod** - Валидация + fastify-type-provider-zod
- **@fastify/swagger** - Документация API

### Frontend
- **React 19** - UI library
- **Vite** - Build tool
- **Mantine v7** - UI компоненты
- **Reatom v1000** - State management + Router
- **FSD** - Feature Sliced Design архитектура
- **Zod** - Валидация форм

### Инфраструктура
- **Turborepo** - Monorepo менеджмент
- **pnpm** - Package manager
- **TypeSpec** - API спецификация
- **Docker** - Контейнеризация

## 📋 API Endpoints

После запуска API доступно по адресу `http://localhost:3000`:

- **GET** `/health` - Health check
- **GET** `/docs` - Swagger UI документация

### Owner API (владелец)
- **GET** `/owner/profile` - Информация о владельце
- **GET** `/owner/bookings` - Список бронирований

### Event Types API
- **GET** `/event-types` - Список типов событий
- **GET** `/event-types/:id` - Получить тип события
- **POST** `/event-types` - Создать тип события
- **PUT** `/event-types/:id` - Обновить тип события
- **DELETE** `/event-types/:id` - Удалить тип события

### Slots API
- **GET** `/slots` - Список доступных слотов
- **GET** `/slots/:id` - Получить слот

### Public API (гости)
- **GET** `/public/event-types` - Публичный список типов
- **GET** `/public/event-types/:id` - Получить тип события
- **GET** `/public/event-types/:eventTypeId/slots` - Слоты для типа
- **POST** `/public/bookings` - Создать бронирование
- **GET** `/public/bookings/:id` - Получить бронирование
- **POST** `/public/bookings/:id/cancel` - Отменить бронирование

## 🧪 Тестирование

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 📝 Бизнес-правила

1. **Нет двойного бронирования**: На одно и то же время нельзя создать две записи (реализовано через Prisma transaction с Serializable isolation level)
2. **Нет удаления типов с активными бронированиями**: Тип события нельзя удалить, если есть активные бронирования
3. **Слоты генерируются автоматически**: При seed базы данных создаются слоты на 14 дней вперед

## 🏗 Архитектура

### Backend (Fastify)
```
apps/api/src/
├── modules/              # Доменные модули
│   ├── owner/
│   ├── event-types/
│   ├── slots/
│   └── bookings/
├── common/              # Общие утилиты
│   └── errors/          # Кастомные ошибки
├── prisma/              # Prisma schema и миграции
└── main.ts              # Entry point
```

### Frontend (FSD)
```
apps/web/src/
├── app/                 # Инициализация приложения
│   ├── providers/       # Mantine + Reatom провайдеры
│   ├── router/          # Роутинг
│   └── styles/          # Глобальные стили
├── pages/               # Страницы
│   ├── home/            # Главная
│   ├── event-type/      # Страница типа события
│   └── booking/         # Бронирование
├── features/            # Пользовательские сценарии
│   ├── create-booking/
│   ├── view-slots/
│   └── ...
├── entities/            # Бизнес-сущности (Reatom atoms)
│   ├── event-type/
│   ├── slot/
│   ├── booking/
│   └── owner/
└── shared/              # Переиспользуемые модули
    ├── api/             # API клиент
    ├── config/          # Конфигурация
    ├── lib/             # Утилиты
    └── ui/              # UI компоненты
```

## 📦 Скрипты

| Скрипт | Описание |
|--------|----------|
| `pnpm dev` | Запуск всех сервисов в dev режиме |
| `pnpm build` | Сборка всех пакетов |
| `pnpm generate:all` | Генерация типов и API клиента |
| `pnpm db:migrate` | Prisma миграции |
| `pnpm db:seed` | Seed базы данных |
| `pnpm db:studio` | Prisma Studio |
| `pnpm docker:up` | Запуск Docker |
| `pnpm docker:down` | Остановка Docker |

## 🔧 Environment Variables

### Backend (`apps/api/.env`)
```
DATABASE_URL=postgresql://calendar:calendar@localhost:5432/calendar_booking
PORT=3000
WEB_URL=http://localhost:5173
```

### Frontend (`apps/web/.env`)
```
VITE_API_URL=http://localhost:3000
```

## 📄 Лицензия

ISC
