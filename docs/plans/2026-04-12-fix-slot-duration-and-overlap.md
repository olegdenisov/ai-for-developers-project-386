# Исправление длительности слотов и проверки перекрытия бронирований

## Overview

Исправить два архитектурных дефекта в системе бронирования:

1. **Неверная длительность слотов**: все слоты в БД — 30-минутные и не привязаны к типам событий. При запросе слотов для 15-мин события возвращаются 30-мин слоты; для 60-мин события слоты не находятся вовсе (или используется другой эндпоинт, возвращающий все 30-мин слоты).
2. **Не учитывается перекрытие бронирований**: если в 9:00 создана 60-мин бронь, слоты 15-мин и 30-мин событий с 9:00 до 10:00 остаются доступными.

**Решение**: привязать слоты к типам событий. Каждый тип события имеет собственный набор слотов с правильной длительностью. При проверке доступности учитывается временное перекрытие со всеми подтверждёнными бронированиями.

## Context

- Схема БД: `apps/api/prisma/schema.prisma` — модель `Slot` без `eventTypeId`
- Сервис слотов: `apps/api/src/modules/slots/slot.service.ts` — генерация и список слотов
- Сервис бронирований: `apps/api/src/modules/bookings/booking.service.ts` — `getAvailableSlotsForEventType`, `createBooking`
- Сервис типов событий: `apps/api/src/modules/event-types/event-type.service.ts` — CRUD без генерации слотов
- Сид: `apps/api/prisma/seed.ts` — генерирует только 30-мин слоты без привязки к типам
- E2E тесты: `apps/web/e2e/booking-flow.spec.ts`, `apps/web/e2e/cancel-booking.spec.ts`

## Development Approach

- **Testing approach**: Regular (код → тесты)
- Полностью завершать каждый шаг перед переходом к следующему
- **CRITICAL: каждый шаг включает написание/обновление тестов**
- **CRITICAL: все тесты должны проходить перед началом следующего шага**
- **CRITICAL: обновлять этот файл при изменении scope**

## Testing Strategy

- **Unit тесты** (backend): нет тестового фреймворка для backend — тесты только для фронта
- **E2E тесты** (Playwright): обязательно обновить/добавить для booking flow
- **Type-check**: `pnpm type-check` после каждого шага

## Progress Tracking

- Завершённые пункты помечать `[x]` сразу по выполнении
- Новые задачи добавлять с префиксом ➕
- Блокеры помечать с префиксом ⚠️

## What Goes Where

- Шаги с `[ ]` — изменения в коде
- Post-Completion — ручная проверка и деплой

## Implementation Steps

### Task 1: Миграция схемы БД — привязать Slot к EventType

Добавить `eventTypeId` в модель `Slot` и настроить каскадное удаление.

- [ ] В `apps/api/prisma/schema.prisma` добавить поле `eventTypeId String` и связь `eventType EventType @relation(...)` в модели `Slot`
- [ ] В модели `EventType` добавить `slots Slot[]`
- [ ] Настроить каскадное удаление: `onDelete: Cascade` на связи Slot → EventType
- [ ] Запустить `cd apps/api && pnpm db:generate` — сгенерировать новый Prisma client
- [ ] Создать Prisma миграцию: `cd apps/api && pnpm db:migrate`
- [ ] Запустить `pnpm type-check` — должен пройти без ошибок

### Task 2: Обновить генерацию слотов

Слоты генерируются с правильной длительностью для каждого типа события.

- [ ] В `apps/api/src/modules/slots/slot.service.ts` обновить `generateSlots` — добавить параметры `eventTypeId: string` и `durationMinutes: number`, использовать `durationMinutes` вместо `intervalMinutes` по умолчанию
- [ ] В `apps/api/src/modules/event-types/event-type.service.ts` в функции `createEventType` после создания типа события вызывать `generateSlots` для следующих 14 дней с нужной длительностью
- [ ] В `apps/api/src/modules/event-types/event-type.service.ts` в функции `updateEventType` при изменении `durationMinutes`: удалять все слоты этого типа события без активных бронирований, генерировать новые с правильной длительностью
- [ ] В `apps/api/prisma/seed.ts` обновить генерацию слотов: для каждого типа события генерировать слоты с его `durationMinutes` (вместо фиксированных 30 мин), передавать `eventTypeId`
- [ ] Проверить: `cd apps/api && pnpm db:reset` создаёт слоты правильной длительности для каждого типа
- [ ] Запустить `pnpm type-check` — должен пройти без ошибок

### Task 3: Исправить запрос доступных слотов с проверкой перекрытия

Основная бизнес-логика: возвращать только слоты нужного типа события, которые не перекрываются с существующими бронированиями.

- [ ] В `apps/api/src/modules/bookings/booking.service.ts` переписать `getAvailableSlotsForEventType`:
  - Запрашивать слоты только с `eventTypeId` нужного типа события (`where: { eventTypeId }`)
  - Убрать фильтр `slotDuration >= eventType.durationMinutes` (больше не нужен)
  - Запрашивать все CONFIRMED бронирования, которые пересекаются с запрашиваемым диапазоном дат (include `slot`)
  - Фильтровать слоты: исключать те, у которых `startTime < booking.slot.endTime && endTime > booking.slot.startTime` для любого существующего бронирования
- [ ] В `apps/api/src/modules/slots/slot.service.ts` в `listAvailableSlots` при наличии `eventTypeId` также фильтровать по `eventTypeId` (привести в соответствие с новой архитектурой)
- [ ] Запустить `pnpm type-check` — должен пройти без ошибок

### Task 4: Обновить создание бронирования

Проверять, что слот принадлежит нужному типу события.

- [ ] В `apps/api/src/modules/bookings/booking.service.ts` в `createBooking`: добавить проверку `slot.eventTypeId === data.eventTypeId`, при несоответствии бросать `ValidationError`
- [ ] Убрать устаревшую проверку `slotDuration < eventType.durationMinutes` (слоты теперь имеют правильную длительность)
- [ ] Убедиться, что `isAvailable = false` ставится только на бронируемый слот (остальные перекрытые слоты блокируются динамически через проверку перекрытия в Task 3)
- [ ] Запустить `pnpm type-check` — должен пройти без ошибок

### Task 5: Обновить E2E тесты

- [ ] Проверить `apps/web/e2e/booking-flow.spec.ts` — убедиться, что тест проходит с новой логикой слотов
- [ ] Проверить `apps/web/e2e/cancel-booking.spec.ts` — убедиться, что после отмены бронирования слоты снова доступны
- [ ] Запустить E2E тесты: `cd apps/web && pnpm test:e2e`

### Task 6: Финальная верификация

- [ ] Запустить `pnpm build` — должен пройти без ошибок
- [ ] Запустить `pnpm type-check` — без ошибок
- [ ] Запустить `cd apps/web && pnpm test:e2e` — все E2E проходят
- [ ] Проверить сценарий: сид создаёт 3 типа событий (15, 30, 60 мин) с правильными слотами
- [ ] Проверить сценарий: слоты 15-мин события — действительно 15-мин интервалы
- [ ] Проверить сценарий: бронь 60-мин в 9:00 → слоты 15-мин и 30-мин с 9:00 до 10:00 недоступны

## Technical Details

### Модель Slot после изменения

```prisma
model Slot {
  id            String    @id @default(uuid())
  startTime     DateTime
  endTime       DateTime
  isAvailable   Boolean   @default(true)
  createdAt     DateTime  @default(now())
  
  eventType     EventType  @relation(fields: [eventTypeId], references: [id], onDelete: Cascade)
  eventTypeId   String
  
  booking       Booking?

  @@index([eventTypeId])
  @@map("slots")
}
```

### Логика проверки перекрытия

```
Слот занят, если существует CONFIRMED бронирование, где:
  booking.slot.startTime < slot.endTime
  AND
  booking.slot.endTime > slot.startTime
```

### Генерация слотов (рабочие часы 9:00–17:00)

- 15-мин слоты: 32 слота/день → 9:00, 9:15, 9:30, ... 16:45
- 30-мин слоты: 16 слотов/день → 9:00, 9:30, ... 16:30
- 60-мин слоты: 8 слотов/день → 9:00, 10:00, ... 16:00

## Post-Completion

**Ручная проверка в браузере:**
- Открыть каталог событий, выбрать событие 15 мин, убедиться что слоты — 15-минутные
- Забронировать 60-мин событие в 9:00, убедиться что для 15-мин и 30-мин событий 9:00–10:00 недоступны
- Отменить 60-мин бронь, убедиться что слоты снова доступны

**После деплоя:**
- Запустить `db:seed` для обновления тестовых данных
