# Рефакторинг: унификация типов, утилит и паттернов

## Overview

После реализации фичи `reschedule-booking` в кодовой базе накопились несоответствия:
- Типы entities определены вручную вместо использования сгенерированных типов из `@calendar-booking/api-client`
- `parseApiError` дублируется в 6+ фичах с разной реализацией и смешанным языком сообщений
- `formatDate` / `formatTime` определены прямо в компоненте `RescheduleModal.tsx`
- Паттерн открытия модальных окон несогласован: `cancel-booking` использует хак с полем формы
- `as`-приведения снижают типобезопасность в model-файлах
- `booking.service.ts` — 72-строчная функция с 7 проверками; логика обновления слотов дублируется

**Цель**: устранить дублирование, унифицировать паттерны, обеспечить единый источник истины для типов.

## Context

- **Затронутые файлы**:
  - `apps/web/src/entities/*/model/types.ts` (slot, owner, booking, event-type)
  - `apps/web/src/features/reschedule-booking/model/model.ts`
  - `apps/web/src/features/cancel-booking/model/model.ts`
  - `apps/web/src/features/cancel-booking/ui/CancelBookingModal.tsx`
  - `apps/web/src/features/create-booking/model/model.ts`
  - `apps/web/src/features/edit-event-type/model/model.ts`
  - `apps/web/src/features/create-event-type/model/model.ts`
  - `apps/web/src/features/delete-event-type/model/model.ts`
  - `apps/web/src/features/owner-bookings/model/model.ts`
  - `apps/web/src/pages/booking-detail/BookingDetailPage.tsx`
  - `apps/api/src/modules/bookings/booking.service.ts`
- **Паттерны**: FSD, Reatom v1000, сгенерированный api-client из OpenAPI
- **Зависимости**: `@calendar-booking/api-client`, `@calendar-booking/shared-types`

## Development Approach

- **Подход к тестированию**: Regular (сначала код, потом тесты)
- Завершать каждый таск полностью перед переходом к следующему
- **CRITICAL: каждый таск должен заканчиваться тестами** — они обязательны, а не опциональны
- **CRITICAL: все тесты должны проходить перед переходом к следующему таску**
- **CRITICAL: обновлять этот файл при изменении скоупа во время выполнения**

## Testing Strategy

- **Unit-тесты**: обязательны для каждого таска (Vitest)
- **E2E**: только для таска 4 (изменение модального паттерна затрагивает UI)
- Команды проверки: `pnpm type-check`, `cd apps/web && pnpm test`, `pnpm build`

## Progress Tracking

- Отмечать выполненные пункты `[x]` сразу после завершения
- Добавлять новые задачи с префиксом ➕
- Фиксировать блокеры с префиксом ⚠️

## Implementation Steps

### Task 1: Типы entities из сгенерированного api-client

Заменить ручные интерфейсы в `entities/*/model/types.ts` на реэкспорты из `@calendar-booking/api-client`.

- [x] В `entities/slot/model/types.ts`: заменить ручной `interface Slot` на `export type { Slot } from '@calendar-booking/api-client'`; в `SlotWithBooking.booking.status` — заменить `'CONFIRMED' | 'CANCELLED' | 'COMPLETED'` на `BookingStatus` из api-client (`'confirmed' | 'cancelled' | 'completed'`)
- [x] Найти и исправить все сравнения статусов в фичах: `status === 'CONFIRMED'` → `status === 'confirmed'` и т.д. (таких сравнений не найдено)
- [x] В `entities/owner/model/types.ts`: заменить ручной `interface Owner` на `export type { Owner } from '@calendar-booking/api-client'`
- [x] В `entities/booking/model/types.ts`: заменить ручной `CancelBookingRequest` на `export type { CancelBookingRequest } from '@calendar-booking/api-client'`
- [x] В `entities/event-type/model/types.ts`: заменить `CreateEventTypeRequest`, `UpdateEventTypeRequest` на импорты из api-client
- [x] Проверить, что все фичи, импортирующие типы через `@entities/*`, продолжают компилироваться
- [x] Запустить `pnpm type-check` — ошибок не добавляется; запустить `cd apps/web && pnpm test` — все тесты проходят (189/189)

### Task 2: Shared-утилиты: parseApiError и форматирование дат

Создать shared-утилиты и обновить все фичи, использующие дублированную логику.

- [x] Создать `apps/web/src/shared/lib/api-error.ts` с `export function parseApiError(err: unknown, fallback: string): Error` — логика: парсит JSON из `err.message` (ищет `code` и `message`), код `SLOT_ALREADY_BOOKED` → «Выбранный слот уже занят»; коды на русском
- [x] `formatDate`/`formatTime` уже существуют в `shared/lib/date.ts` (dayjs) — новый файл не создавался
- [x] Добавить экспорт `parseApiError` в `apps/web/src/shared/lib/index.ts`
- [x] Обновить `reschedule-booking/model/model.ts`: удалить inline `parseApiError`, импортировать из `@shared/lib`; обновить `RescheduleModal.tsx` — использовать `formatDate`/`formatTime` из `@shared/lib`
- [x] Исправить EN-сообщения на RU в `cancel-booking` и `create-booking`; остальные фичи уже на русском
- [x] Написать unit-тесты для `parseApiError` (6 кейсов в `api-error.test.ts`); тесты `formatDate`/`formatTime` уже существуют
- [x] Обновить тесты `create-booking/model.test.ts` под новые RU-сообщения
- [x] Запустить `pnpm type-check && pnpm vitest run` — 190/190 тестов проходят

### Task 3: Типобезопасность — убрать as-assertions

Убрать небезопасные `as`-приведения в model-файлах, используя правильные типы из api-client.

- [x] `return [] as Slot[]` → `return emptySlots` (типизированная переменная), `initState: emptySlots`; в computed явная аннотация `Promise<Slot[]>`
- [x] `response.data as Slot[]` → `response.data` (тип уже `Slot[]` из api-client)
- [x] `response.data as Booking` → `response.data` (тип уже `Booking` из api-client)
- [x] `JSON.parse(...) as {...}` — убрано в таске 2 через `parseApiError`
- [x] `response.data as { message?: string }` в create-booking — убрано в таске 2
- [x] Дублирующиеся аннотации `acc: Record<...>` и `slot: Slot` в RescheduleModal → убраны; `slots: Slot[]` аннотирован при чтении из атома
- [x] Убраны `as Booking[]` / `as Booking` в `owner-bookings` и `cancel-booking`; `as { message?: string }` в cancel-booking — оставлен (ошибочный ответ не является `Booking`)
- [x] Запустить `pnpm type-check` — чисто; `pnpm vitest run` — 190/190

### Task 4: Унификация паттерна модальных окон (cancel-booking)

Перевести `cancel-booking` на явный `isOpen` atom, аналогично `reschedule-booking`.

- [ ] В `cancel-booking/model/model.ts`: добавить `const isOpen = atom(false, 'cancelBookingForm#${bookingId}.isOpen')`; добавить функцию `open()` → `isOpen.set(true)`; добавить функцию `close()` → `isOpen.set(false)`, `form.reset()`, сброс ошибки submit; убрать использование `reason = 'cancel_requested'` как триггера
- [ ] Убрать `// @ts-ignore` из `cancel-booking/model/model.ts` (если типы теперь корректны)
- [ ] В `cancel-booking/ui/CancelBookingModal.tsx`: заменить вычисление `isOpen` через reason на чтение `cancelForm.isOpen()`
- [ ] В `pages/booking-detail/BookingDetailPage.tsx`: заменить `cancelForm.fields.reason.set('cancel_requested')` на `cancelForm.open()`
- [ ] Написать/обновить unit-тесты для `cancel-booking` модели: проверить что `open()` ставит `isOpen = true`, `close()` сбрасывает форму
- [ ] Запустить `pnpm type-check && cd apps/web && pnpm test` — всё проходит
- [ ] Запустить `cd apps/web && pnpm test:e2e` — E2E для cancel-booking проходят

### Task 5: Backend — рефакторинг booking.service.ts

Вынести дублированную логику в приватные методы, сократить `rescheduleBooking()`.

- [ ] Вынести `updateSlotAvailability(tx, slotId, isAvailable)` в приватный метод — эта логика дублируется в `createBooking` и `rescheduleBooking`
- [ ] Вынести проверки из `rescheduleBooking()` в `validateBookingForReschedule(tx, bookingId)` и `validateNewSlot(tx, newSlotId, eventTypeId)`
- [ ] Функция `rescheduleBooking()` должна сократиться с ~72 строк до ~25, оркестрируя вызовы вспомогательных функций
- [ ] Убедиться, что все вспомогательные методы имеют комментарии на русском языке
- [ ] Запустить `pnpm type-check && pnpm build` — без ошибок

### Task 6: Итоговая проверка

- [ ] Запустить `pnpm type-check` — чисто
- [ ] Запустить `pnpm build` — успешно
- [ ] Запустить `cd apps/web && pnpm test` — все unit-тесты проходят
- [ ] Запустить `cd apps/web && pnpm test:e2e` — все E2E-тесты проходят
- [ ] Запустить `pnpm lint` — нет ошибок
- [ ] Убедиться, что черновик `docs/plans/2026-04-17-refactoring.md` больше не нужен как отдельный файл

## Technical Details

**Порядок выполнения тасков**:
- Task 1 → Task 3 (типы нужны для устранения `as`)
- Task 2 → Task 3 (зависимость: `parseApiError` из шага 2 закрывает некоторые `as` из шага 3)
- Task 4 независим от 1–3
- Task 5 независим, только backend

**Статусы бронирований**: значения в нижнем регистре (`'confirmed'`, `'cancelled'`, `'completed'`), Prisma enum использует верхний (`CONFIRMED`), но API и фронтенд — нижний.

**FSD**: shared-утилиты в `apps/web/src/shared/lib/`, экспортируются через `shared/lib/index.ts`.

## Post-Completion

**Ручная проверка**:
- Открыть страницу деталей бронирования, кликнуть «Перенести» — убедиться, что модаль работает корректно
- Кликнуть «Отменить» — убедиться, что модаль открывается/закрывается через новый `isOpen` atom
- Проверить отображение ошибок на русском языке при неудачных запросах
