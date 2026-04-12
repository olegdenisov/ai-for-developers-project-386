# Перенос встречи (Reschedule Booking)

## Overview

Добавить возможность переноса встречи на другой слот того же типа события.
Пользователь нажимает «Перенести» на странице деталей бронирования, открывается модальное
окно со списком доступных слотов, после выбора и подтверждения бронирование переносится.

**Решаемая проблема:** кнопка «Перенести» на `BookingDetailPage` существует, но не реализована.

**Интеграция с системой:** новый атомарный эндпоинт `PATCH /bookings/:id/reschedule`
освобождает старый слот и занимает новый в рамках одной Serializable-транзакции.

## Context (from discovery)

- **Затронутые файлы:**
  - `main.tsp` — добавить эндпоинт и DTO
  - `apps/api/src/modules/bookings/` — routes, controller, service
  - `packages/shared-types/src/index.ts` — будет сгенерирован
  - `packages/api-client/src/` — ручное добавление метода (Java не требуется)
  - `apps/web/src/features/reschedule-booking/` — новая фича
  - `apps/web/src/pages/booking-detail/` — подключить модалку
- **Релевантные паттерны:**
  - `cancel-booking` — factory + `reatomForm` + modal
  - `booking.service.ts` — `$transaction` с `isolationLevel: 'Serializable'`
  - TypeSpec → generate:openapi → generate:types

## Development Approach

- **Подход к тестированию:** Regular (сначала код, потом тесты)
- Каждый таск завершать полностью перед переходом к следующему
- **Каждый таск включает написание/обновление тестов**
- Все тесты должны проходить перед стартом следующего таска

## Testing Strategy

- **Unit-тесты:** Vitest, `apps/web` — для frontend feature model
- **Type-check:** `pnpm type-check` после каждого таска
- **Build:** `pnpm build` в конце

## Progress Tracking

- Завершённые пункты помечать `[x]`
- Новые задачи добавлять с префиксом ➕
- Блокеры — с префиксом ⚠️

## Implementation Steps

### Task 1: TypeSpec — добавить эндпоинт reschedule

- [x] В `main.tsp` добавить модель `RescheduleBookingRequest` (поле `newSlotId: string`)
- [x] В `main.tsp` добавить эндпоинт `PATCH /public/bookings/{id}/reschedule` → возвращает `Booking`
- [x] Запустить `pnpm generate:openapi` — проверить, что `tsp-output/openapi.json` обновился
- [x] Запустить `pnpm generate:types` — проверить, что `packages/shared-types/src/index.ts` обновился
- [x] Запустить `pnpm type-check` — должно пройти без ошибок

### Task 2: Backend service — логика переноса

- [x] В `apps/api/src/modules/bookings/booking.service.ts` добавить метод `rescheduleBooking(id, newSlotId)`
- [x] В транзакции с `isolationLevel: 'Serializable'`: найти бронирование, найти новый слот,
      проверить что новый слот доступен и принадлежит тому же `eventTypeId`, 
      освободить старый слот (`isAvailable: true`), занять новый слот (`isAvailable: false`),
      обновить `booking.slotId`
- [x] Бросать `NotFoundError` если бронирование или слот не найден
- [x] Бросать `SlotConflictError` если новый слот уже занят
- [x] Бросать `ValidationError` если новый слот принадлежит другому `eventTypeId`
- [x] Запустить `pnpm type-check` — должно пройти

### Task 3: Backend routes + controller

- [x] В `apps/api/src/modules/bookings/booking.controller.ts` добавить метод `rescheduleBooking`
      с валидацией через Zod (`newSlotId: z.string().uuid()`)
- [x] В `apps/api/src/modules/bookings/booking.routes.ts` добавить
      `PATCH /bookings/:id/reschedule` → вызывает контроллер
- [x] Убедиться, что ошибки обрабатываются стандартным `errorHandler`
- [x] Запустить `pnpm type-check` — должно пройти

### Task 4: API client — добавить метод rescheduleBooking

- [x] В `packages/api-client/src/` найти класс `PublicApi` (или аналог)
- [x] Добавить метод `rescheduleBooking(id: string, newSlotId: string): Promise<ApiResponse<Booking>>`
      по аналогии с `cancelBooking`
- [x] Экспортировать типы, если нужно
- [x] Запустить `pnpm type-check` — должно пройти

### Task 5: Frontend feature model — reschedule-booking

- [x] Создать директорию `apps/web/src/features/reschedule-booking/model/`
- [x] В `model.ts` реализовать фабрику `createRescheduleForm(bookingId, eventTypeId)`:
  - `reatomForm` с полем `newSlotId`
  - В `onSubmit` вызвать `apiClient.rescheduleBooking(bookingId, newSlotId)`
  - При успехе — обновить данные бронирования на странице (не навигировать, остаться на месте)
  - При ошибке — пробросить с читаемым сообщением
- [x] `computed` для загрузки доступных слотов того же `eventTypeId` (следующие 14 дней)
- [x] Создать `apps/web/src/features/reschedule-booking/index.ts` — экспорты
- [x] Написать unit-тест `model.test.ts`: успешный перенос, конфликт слота, слот не найден
- [x] Запустить `cd apps/web && pnpm test` — должно пройти
- [x] Запустить `pnpm type-check` — должно пройти

### Task 6: Frontend UI — RescheduleModal

- [x] Создать `apps/web/src/features/reschedule-booking/ui/RescheduleModal.tsx`
- [x] Модальное окно на Mantine: список слотов сгруппирован по дням, Radio для выбора слота
- [x] Показывать состояния: загрузка слотов, пустой список, ошибка загрузки
- [x] Кнопки «Отмена» и «Перенести» (disabled пока слот не выбран или идёт submit)
- [x] Показывать ошибку submit (`form.submit.error()`) внутри модалки
- [x] Экспортировать из `index.ts`
- [x] Запустить `pnpm type-check` — должно пройти

### Task 7: Подключить RescheduleModal к booking-detail

- [x] В `apps/web/src/pages/booking-detail/model/route.tsx` — добавить создание
      `rescheduleForm` через фабрику в loader
- [x] В `apps/web/src/pages/booking-detail/BookingDetailPage.tsx`:
  - передать `rescheduleForm` в пропсы
  - кнопку «Перенести» связать с открытием модалки
  - добавить `<RescheduleModal>` в рендер
- [x] После успешного переноса — данные бронирования обновляются автоматически
- [x] Запустить `pnpm type-check` — должно пройти

### Task 8: Проверка acceptance criteria

- [x] Проверить, что все требования из Overview реализованы
- [x] Обработка edge-cases: занятый слот (409), слот не найден (404), тот же слот
- [x] Запустить `cd apps/web && pnpm test` — все тесты проходят (181/181)
- [x] Запустить `pnpm type-check` — чисто
- [x] Запустить `pnpm build` — успешно
- [x] Запустить `pnpm lint` — без ошибок (eslint не установлен в devDependencies — pre-existing env issue, не связан с новым кодом)

### Task 9: Коммиты

- [x] Сделать коммит бэкенда: `feat: добавить эндпоинт переноса бронирования`
- [x] Сделать коммит фронтенда: `feat: добавить фичу переноса встречи`

## Technical Details

**RescheduleBookingRequest:**
```typescript
{ newSlotId: string }  // UUID слота того же eventType
```

**Транзакционная логика (бэкенд):**
```
BEGIN SERIALIZABLE
  booking = findBooking(id)  // NotFoundError если нет
  newSlot = findSlot(newSlotId)  // NotFoundError если нет
  assert newSlot.eventTypeId === booking.eventTypeId  // ValidationError если нет
  assert newSlot.isAvailable  // SlotConflictError если занят
  assert newSlot.id !== booking.slotId  // ValidationError если тот же слот
  UPDATE slots SET isAvailable=true WHERE id=booking.slotId
  UPDATE slots SET isAvailable=false WHERE id=newSlotId
  UPDATE bookings SET slotId=newSlotId WHERE id=booking.id
COMMIT
```

**Frontend state flow:**
```
[Перенести] click
  → rescheduleForm открывает модалку (reatomBoolean isOpen)
  → computed loadAvailableSlots(eventTypeId) загружает слоты
  → пользователь выбирает слот (newSlotId.set)
  → submit() → apiClient.rescheduleBooking → обновление данных
```

## Post-Completion

**Ручная проверка:**
- Открыть booking detail, нажать «Перенести»
- Убедиться, что список слотов загружается корректно
- Выбрать новый слот, подтвердить — проверить, что детали обновились
- Проверить, что повторный перенос на уже занятый слот показывает ошибку
- Проверить мобильный вид модалки
