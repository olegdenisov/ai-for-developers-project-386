# Рефакторинг роутинга бронирования

## Overview

Переработать дерево маршрутов флоу бронирования:
- Ввести `bookingRoute` как общий layout с loader для данных хоста — все дочерние маршруты получают owner автоматически.
- Вынести `EventTypePage` из условного рендера `bookCatalogRoute` в полноценный `eventTypeRoute`.
- Убрать глобальные атомы-туннели `bookingEventTypeAtom` / `bookingSlotAtom` — данные передаются через URL и loader'ы.
- Убрать regex-хак в `bookingDetailRoute`.
- Убрать ручной `updateUrlParam` / `window.history.replaceState` — заменить на search params маршрута.

## Целевое дерево маршрутов

```
layoutRoute ("")
├── homeRoute ("")
├── bookingRoute ("bookings")              ← layout, loader: owner profile
│   ├── bookCatalogRoute ("new")           ← layout, loader: event types
│   │   └── eventTypeRoute (":eventTypeId") ← loader: event type + слоты
│   │       └── bookingConfirmationRoute ("confirm")  → ?slotId=
│   └── bookingDetailRoute (":id")         ← params: refine id ≠ "new"
└── adminRoute ("admin") ...
```

URL-флоу после рефакторинга (пути не меняются для каталога и деталей):
```
/bookings/new                         → каталог типов событий
/bookings/new/:eventTypeId            → выбор слота (было: ?eventTypeId=)
/bookings/new/:eventTypeId/confirm?slotId=  → форма бронирования
/bookings/:id                         → детали бронирования
```

## Context

- `apps/web/src/shared/router/layout.ts` — корневой `layoutRoute`
- `apps/web/src/app/router/routes.ts` — регистрация маршрутов, navigate, appRender
- `apps/web/src/pages/book-catalog/model/route.tsx` — текущий `bookCatalogRoute`
- `apps/web/src/pages/event-type/model/route.tsx` — URL-атомы и actions для слотов
- `apps/web/src/pages/booking-confirmation/model/route.tsx` — `bookingConfirmationRoute`
- `apps/web/src/pages/booking-detail/model/route.tsx` — `bookingDetailRoute`
- `apps/web/src/entities/owner/model/model.ts` — `ownerAtom`, `fetchOwner`
- `apps/web/src/features/create-booking/` — `bookingEventTypeAtom`, `bookingSlotAtom`
- `packages/api-client/src/index.ts` — `apiClient.ownerApi.getProfile()`

## Development Approach

- **Testing approach**: Regular (code first, then tests)
- Каждый шаг заканчивается прогоном `pnpm type-check` и тестов
- После завершения всех шагов — `pnpm build`

## Progress Tracking

- Завершённые пункты помечать `[x]`
- Найденные в процессе задачи добавлять с ➕
- Блокеры помечать ⚠️

## What Goes Where

- Checkboxes: только в `### Task N:` секциях
- Post-Completion: ручное тестирование в браузере

## Implementation Steps

---

### Task 1: Создать `bookingRoute` с loader для owner profile

- [x] Создать файл `apps/web/src/pages/booking/model/route.tsx`
  - `bookingRoute = layoutRoute.reatomRoute({ path: 'bookings', layout: true, async loader(), render(self) })`
  - loader: вызывает `apiClient.ownerApi.getProfile()`, возвращает `Owner`
  - render: `self.outlet().at(-1) ?? <Fragment />` (прозрачный layout)
- [x] Создать `apps/web/src/pages/booking/index.ts` — реэкспорт `bookingRoute`
- [x] Убрать fallback-заглушку из `entities/owner/model/model.ts` — раскомментировать настоящий вызов `apiClient.ownerApi.getProfile()`
- [x] Зарегистрировать `bookingRoute` в `apps/web/src/app/router/routes.ts` (импорт + экспорт)
- [x] Запустить `pnpm type-check` — ошибок быть не должно

---

### Task 2: Вынести `EventTypePage` в полноценный `eventTypeRoute`

- [x] Создать `eventTypeRoute = bookCatalogRoute.reatomRoute(":eventTypeId")` в новом файле `apps/web/src/pages/event-type/model/eventTypeRoute.tsx` (отдельный файл для избежания циклических импортов)
  - loader: читает `eventTypeId` из params; загружает event type из `loader.data()` parent'а (список event types уже есть в `bookCatalogRoute.loader`); сбрасывает `selectedDateAtom`, `selectedSlotAtom`
  - render: `<EventTypePage eventTypeId={self().eventTypeId} />`
- [x] Убрать из `bookCatalogRoute.render()` условный рендер `EventTypePage` и проверку `selectedEventTypeIdAtom`
  - `render(self)`: если `self.outlet().length > 0` → `self.outlet().at(-1)`, иначе → `<BookCatalogPage>`
- [x] Убрать из `bookCatalogRoute.loader` инициализацию `selectedEventTypeIdAtom` (она больше не нужна на уровне catalog)
- [x] Обновить `navigate` — добавить `navigate.eventType(eventTypeId: string)` → `eventTypeRoute.go({ eventTypeId })`
- [x] Обновить `handleEventTypeClick` в `BookCatalogPage` — вместо установки атома вызывать `navigate.eventType(id)`
- [x] Запустить `pnpm type-check` + `pnpm test` (unit)

---

### Task 3: Переместить `bookingConfirmationRoute` под `eventTypeRoute`

- [ ] Изменить родителя: `bookingConfirmationRoute = eventTypeRoute.reatomRoute({ path: 'confirm', ... })`
- [ ] Loader больше не читает `bookingEventTypeAtom` / `bookingSlotAtom` — вместо этого:
  - `eventTypeId` — из params (наследуется от `eventTypeRoute`)
  - `slotId` — из `new URLSearchParams(window.location.search).get('slotId')`
  - `owner` — из `bookingRoute.loader.data()` (уже загружен)
  - loader выполняет `apiClient.getSlot(slotId)` чтобы получить объект слота
  - Guard: если `slotId` отсутствует → `navigate.eventType(eventTypeId)`
- [ ] Обновить `navigate.bookingConfirmation(slotId)` → `bookingConfirmationRoute.go({}, ...)` с search param `?slotId=`
- [ ] Обновить `proceedToBooking` action в `EventTypePage` — передавать slotId через URL, не через атом
- [ ] Убрать использование `bookingEventTypeAtom` и `bookingSlotAtom` из confirmation route
- [ ] Запустить `pnpm type-check` + `pnpm test`

---

### Task 4: Перенести `bookCatalogRoute` и `bookingDetailRoute` под `bookingRoute`

- [ ] `bookCatalogRoute`: сменить parent с `layoutRoute` на `bookingRoute`, path: `"bookings/new"` → `"new"`
- [ ] `bookingDetailRoute`: сменить parent с `layoutRoute` на `bookingRoute`, path: `"bookings/:id"` → `":id"`
  - params refine `val !== 'new'` оставить — предотвращает матч `/bookings/new` как детальную страницу
  - Добавить комментарий: `// 'new' зарезервирован для флоу создания бронирования`
- [ ] Loader `bookingDetailRoute`: owner брать из `bookingRoute.loader.data()` вместо дублирующего запроса (если owner использовался на странице деталей)
- [ ] Обновить `isAnyRouteLoading` в `routes.ts` — добавить `bookingRoute.loader.pending()`, `eventTypeRoute.loader.pending()`
- [ ] Запустить `pnpm type-check` + `pnpm test`

---

### Task 5: Удалить атомы-туннели и ручную URL-синхронизацию

- [ ] Удалить `bookingEventTypeAtom` и `bookingSlotAtom` из `apps/web/src/features/create-booking/model/model.ts` — больше не нужны
- [ ] Удалить `updateUrlParam` и `parseDateParam` из `apps/web/src/pages/event-type/model/route.tsx` — заменить URL-синхронизацию на search params маршрута или убрать если не используется
- [ ] Удалить `selectedEventTypeIdAtom` если больше нигде не используется
- [ ] Убрать инициализацию URL-атомов из `bookCatalogRoute.loader` (строки `params.get('eventTypeId')` и т.д.)
- [ ] Проверить `apps/web/src/features/create-booking/index.ts` — убрать экспорт удалённых атомов
- [ ] Запустить `pnpm type-check` + `pnpm test`

---

### Task 6: Финальная проверка

- [ ] Убедиться, что все маршруты зарегистрированы в `routes.ts` и реэкспортированы
- [ ] Убедиться, что `navigate.*` helpers покрывают все переходы флоу
- [ ] Запустить полный `pnpm test` — все тесты зелёные
- [ ] Запустить `pnpm type-check` — без ошибок
- [ ] Запустить `pnpm build` — сборка успешна
- [ ] Сделать итоговый коммит

## Technical Details

**Передача owner через дерево loader'ов:**
```ts
// bookingRoute loader
async loader() {
  const response = await wrap(apiClient.ownerApi.getProfile())
  return response.data  // Owner
}

// bookingDetailRoute loader — owner уже загружен
async loader({ id }) {
  const owner = bookingRoute.loader.data()  // без доп. запроса
  const response = await wrap(apiClient.getBooking(id))
  ...
}
```

**Убираем атомы-туннели, slotId идёт через URL:**
```
// Было: выбор слота → bookingSlotAtom.set(slot) → navigate.bookingConfirmation()
// Стало: выбор слота → navigate.bookingConfirmation(slot.id)
//        → URL: /bookings/new/:eventTypeId/confirm?slotId=<id>
//        → loader читает slotId из search params, грузит слот из API
```

**Дерево вложенности маршрутов в коде:**
```ts
export const bookingRoute     = layoutRoute.reatomRoute(...)
export const bookCatalogRoute = bookingRoute.reatomRoute(...)
export const eventTypeRoute   = bookCatalogRoute.reatomRoute(...)
export const confirmRoute     = eventTypeRoute.reatomRoute(...)
export const detailRoute      = bookingRoute.reatomRoute(...)
```

## Post-Completion

**Ручное тестирование в браузере (mock-режим):**
- `pnpm start:mock`
- Открыть `/bookings/new` → каталог отображается
- Кликнуть на тип события → URL меняется на `/bookings/new/:eventTypeId`
- Выбрать слот → кнопка "Далее" → URL меняется на `/bookings/new/:eventTypeId/confirm?slotId=`
- Заполнить форму → бронирование создаётся → редирект на `/bookings/:id`
- На `/bookings/:id` видно имя хоста (owner.name)
- Кнопка "Перенести" — модалка с reschedule работает
- Refresh на любом URL → страница загружается корректно (без потери данных)
