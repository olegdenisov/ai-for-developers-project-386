# План: рефакторинг UX фичи переноса встречи

Дата: 2026-04-19

## Контекст

По результатам UX-ревью (`@agent-quality-reviewer`) фича переноса встречи функционирует,
но имеет критические проблемы удобства. Архитектура хорошая — все изменения только в
`RescheduleModal.tsx` и `BookingDetailPage.tsx`, модель (`model.ts`) не затрагивается.

---

## Шаг 1. Исправить точку входа в `BookingDetailPage.tsx`

**Проблема:** действия «Перенести» и «Отмена» оформлены как инлайн-ссылки (`Anchor`)
в строке мелкого текста — слабо заметны, не соответствуют весу действия.

- [ ] Заменить блок `Хотите внести изменения?` на группу явных кнопок:
  ```tsx
  <Group justify="center" gap="sm">
    <Button variant="outline" onClick={handleReschedule}>
      Перенести встречу
    </Button>
    <Button variant="outline" color="red" onClick={handleCancel}>
      Отменить встречу
    </Button>
  </Group>
  ```
- [ ] Убедиться что кнопки отображаются только при `booking.status === 'confirmed'`
- [ ] Запустить тесты: `pnpm vitest run` + `pnpm type-check`
- [ ] Сделать коммит: `feat: заменить инлайн-ссылки переноса/отмены на кнопки`

---

## Шаг 2. Показать текущий слот в шапке модалки (`RescheduleModal.tsx`)

**Проблема:** пользователь не видит, с какого времени переносится встреча.

- [ ] Добавить prop `currentSlot: Slot` в интерфейс `RescheduleModalProps`
- [ ] Передать `booking.slot` в `RescheduleModal` из `BookingDetailPage`
- [ ] В модалке, перед списком слотов, добавить блок «Текущий слот»:
  ```tsx
  <Alert variant="light" color="blue" title="Текущее время встречи">
    {formatDate(currentSlot.startTime, 'dddd, D MMMM')} •{' '}
    {formatTime(currentSlot.startTime)} — {formatTime(currentSlot.endTime)}
  </Alert>
  ```
- [ ] Запустить тесты + type-check
- [ ] Сделать коммит: `feat: показывать текущий слот в модалке переноса`

---

## Шаг 3. Добавить день недели к заголовкам дат в модалке

**Проблема:** заголовки «19 апреля 2026» без дня недели — пользователи думают
категориями «хочу перенести на среду», а не на конкретное число.

- [ ] В `RescheduleModal.tsx` при отображении заголовка дня изменить формат:
  ```tsx
  // было:
  {formatDate(day)}
  // стало:
  {formatDate(day, 'dddd, D MMMM')}
  ```
  Убедиться что `formatDate` из `@shared/lib` поддерживает dayjs-форматы.
  Если нет — добавить поддержку второго аргумента `format`.
- [ ] Проверить что dayjs настроен с русской локалью (уже есть в `app/`)
- [ ] Запустить тесты + type-check
- [ ] Сделать коммит: `feat: добавить день недели к датам в модалке переноса`

---

## Шаг 4. Добавить навигацию по датам (фильтр-таблетки)

**Проблема:** при 14 днях по ~8 слотов — 100+ радиокнопок в одном скролл-контейнере.
Пользователь не может перейти к нужной дате без прокрутки всего списка.

- [ ] Добавить горизонтальный ряд таблеток-фильтров над `ScrollArea`:
  ```tsx
  <ScrollArea type="scroll" offsetScrollbars>
    <Group gap="xs" wrap="nowrap" pb="xs">
      {sortedDays.map((day) => (
        <Button
          key={day}
          variant={selectedDay === day ? 'filled' : 'default'}
          size="compact-sm"
          onClick={() => setSelectedDay(day)}
        >
          {formatDate(day, 'D MMM')}
        </Button>
      ))}
    </Group>
  </ScrollArea>
  ```
- [ ] Добавить локальный `useState<string | null>` для `selectedDay` в компоненте
  (или Reatom-атом, если предпочтительно без React state)
- [ ] По умолчанию `selectedDay = null` → показывать все дни
- [ ] При выборе таблетки — показывать только слоты этого дня (фильтровать `sortedDays`)
- [ ] Сбрасывать `selectedDay` при закрытии модалки (в `close` action)
- [ ] Запустить тесты + type-check
- [ ] Сделать коммит: `feat: добавить фильтрацию по дате в модалке переноса`

---

## Шаг 5. Показывать выбранный слот перед кнопкой подтверждения

**Проблема:** после выбора радиокнопки нет визуального чекпоинта —
пользователь может не заметить, что выбрал не тот слот.

- [ ] Под `ScrollArea` добавить условный блок, если `selectedSlotId` заполнен:
  ```tsx
  {selectedSlotId && selectedSlotData && (
    <Text size="sm" c="dimmed" ta="center">
      Вы выбрали: {formatDate(selectedSlotData.startTime, 'dddd, D MMMM')} •{' '}
      {formatTime(selectedSlotData.startTime)} — {formatTime(selectedSlotData.endTime)}
    </Text>
  )}
  ```
  Где `selectedSlotData = slots.find(s => s.id === selectedSlotId)`
- [ ] Запустить тесты + type-check
- [ ] Сделать коммит: `feat: показывать выбранный слот перед подтверждением переноса`

---

## Шаг 6. Добавить кнопку «Повторить» при ошибке загрузки слотов

**Проблема:** при ошибке API показывается только текст «Попробуйте позже» без
возможности повторить запрос без закрытия и повторного открытия модалки.

- [ ] В блоке `slotsError` добавить кнопку повтора:
  ```tsx
  <Alert color="red" title="Ошибка загрузки">
    Не удалось загрузить доступные слоты.
    <Button
      size="compact-sm"
      variant="subtle"
      color="red"
      mt="xs"
      onClick={() => {
        rescheduleForm.isOpen.set(false)
        rescheduleForm.isOpen.set(false)
        // Небольшой таймаут для сброса async atom перед повторной загрузкой
        setTimeout(() => rescheduleForm.isOpen.set(true), 50)
      }}
    >
      Повторить
    </Button>
  </Alert>
  ```
  Alternatively — вынести retry-логику в `close`/`open` actions модели.
- [ ] Запустить тесты + type-check
- [ ] Сделать коммит: `feat: добавить кнопку повтора при ошибке загрузки слотов`

---

## Финальная проверка

- [ ] Запустить полный набор тестов: `pnpm vitest run`
- [ ] Запустить сборку: `pnpm build`
- [ ] Проверить вручную в браузере (mock-режим): `pnpm start:mock`
  - Открыть `/bookings/:id` → проверить кнопки «Перенести» / «Отменить»
  - Открыть модалку переноса → проверить текущий слот, таблетки, выбранный слот
  - Выбрать слот → убедиться в отображении подтверждения
  - Нажать «Перенести» → проверить успешное закрытие модалки

---

## Порядок выполнения (рекомендуемый)

Шаги 1–3 — минимальные изменения, делаются за один сеанс.
Шаги 4–6 — независимы, можно делать в любом порядке.
