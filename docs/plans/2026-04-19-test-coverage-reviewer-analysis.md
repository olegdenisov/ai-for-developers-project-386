# План: исправление тестов по результатам test-reviewer

Дата: 2026-04-19

## Проблемы и чеклисты

### 1. Удалить / переписать тесты мёртвого кода

#### 1.1 `view-slots/model/model.test.ts` — 11 тестов для неиспользуемого модуля
- [x] Убедиться, что `features/view-slots` нигде не импортируется в рабочем коде
- [x] Удалить весь модуль `features/view-slots` (включая тесты)

#### 1.2 `create-booking/model/model.test.ts` — атомы, обойдённые в реальном UI
- [x] Подтвердить, что `bookingFormAtom`, `updateFormField`, `submitBookingForm` не используются в компонентах (в `route.tsx` импортируется только `bookingFormSchema` из `validation.ts`)
- [x] Удалить `apps/web/src/features/create-booking/model/model.test.ts`
- [ ] Написать тест для `createBookingForm` из `pages/booking-confirmation/model/route.tsx` (перенесено в п. 3.3)

#### 1.3 `entities/booking/model/model.test.ts` — неиспользуемые computed-атомы
- [x] Убедиться, что `isFetchingBooking`, `isCreatingBooking`, `isCancellingBooking` не используются нигде в UI
- [x] Удалить computed-атомы из `model.ts` и их экспорты из `index.ts`
- [x] Удалить тесты `computed states` из `model.test.ts`
- Примечание: `bookingErrorAtom`, `isBookingSuccessAtom`, `clearCurrentBooking` оставлены — они используются внутри `createBooking` action

---

### 2. Починить фейковые assertions

#### 2.1 `BookCatalogPage.test.tsx` — клик по карточке
- [x] Найти тест `должен вызывать handleEventTypeClick при клике на карточку`
- [x] Заменить `expect(handleEventTypeClick).toBeDefined()` на `expect(handleEventTypeClick).toHaveBeenCalledWith('1')`
- [x] Исправить нестабильный селектор — использовать `getAllByTestId('event-type-card')[0]`
- [x] Добавить `beforeEach(() => vi.clearAllMocks())` для изоляции тестов

#### 2.2 `LoadingSpinner.test.tsx` — пропс `size`
- [x] Найти тест `должен принимать размер через пропсы`
- [x] Добавить `data-size={size}` в `LoadingSpinner.tsx` к компоненту `Loader`
- [x] Заменить `expect(spinner).toBeInTheDocument()` на `expect(document.querySelector('[data-size="sm"]')).toBeInTheDocument()`

---

### 3. Добавить недостающие unit-тесты

#### 3.1 `features/cancel-booking/model` — нет тестов для `createCancelForm`
- [x] Создать `apps/web/src/features/cancel-booking/model/model.test.ts`
- [x] Покрыто (9 тестов):
  - [x] Начальное состояние `isOpen=false`
  - [x] `open` / `close` модалки + сброс полей и `form.submit.error`
  - [x] Успешная отмена → `navigate.home()`, передача правильных аргументов API
  - [x] Пустое поле reason → передаётся `undefined` в API
  - [x] Ошибка API → выбрасывает сообщение, навигация не выполняется
  - [x] Дефолтное сообщение при отсутствии `message` в ответе

#### 3.2 `pages/event-type/model/model.ts` и `route.tsx` — центральная логика бронирования
- [x] Создать `apps/web/src/pages/event-type/model/model.test.ts`
- [x] Покрыто (17 тестов):
  - [x] `selectDate` устанавливает дату, сбрасывает `selectedSlotAtom` и `selectedSlotIdAtom`
  - [x] `selectSlot` только для доступных слотов
  - [x] `proceedToBooking` навигирует при наличии слота и типа; не навигирует без них
  - [x] `goBack` очищает все атомы, навигирует на каталог
  - [x] `slotsForSelectedDateAtom` возвращает слоты для выбранной даты
  - [x] `fetchSlotsForCalendar` вызывает API, устанавливает `slotsAtom`; не вызывает без `eventTypeId`
  - [x] `fetchSlotsForDate` загружает слоты недели; не вызывает без даты

#### 3.3 `pages/booking-confirmation/model/route.tsx` — форма подтверждения
- [x] Создать `apps/web/src/pages/booking-confirmation/model/route.test.ts`
- [x] Покрыто (6 тестов):
  - [x] Успешный сабмит → `navigateFn(booking.id)`, корректные аргументы API
  - [x] 409-конфликт → выбрасывает сообщение, навигации нет
  - [x] 400 ошибка → выбрасывает сообщение из ответа
  - [x] Дефолтное сообщение при отсутствии `message`
  - [x] Начальные пустые значения формы

---

### 4. Исправить хрупкий E2E

#### 4.1 `admin-create-event-type.spec.ts` — нет mock-fixture
- [x] Заменить `import { test, expect } from '@playwright/test'` на `import { test, expect } from './fixtures/mock-api'`
- [x] Маршрут `/event-types` уже мокируется в `beforeEach` теста — конфликтов с fixture нет
- [ ] Запустить тест без запущенного backend и убедиться, что он проходит

---

## Порядок выполнения (рекомендуемый)

1. Пункт 2 (фейковые assertions) — быстрая победа, минимальный риск
2. Пункт 1 (мёртвый код) — снижает шум в тест-сьюте
3. Пункт 4 (E2E fixture) — изолирует E2E от состояния backend
4. Пункт 3 (новые unit-тесты) — наибольшая ценность, требует больше времени
