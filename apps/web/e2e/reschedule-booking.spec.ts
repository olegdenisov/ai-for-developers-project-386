import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/mock-api';

const BOOKING_ID = '22222222-2222-2222-2222-222222222222';

async function openModal(page: Page) {
  await page.getByRole('button', { name: 'Перенести встречу' }).click();
  await expect(page.getByRole('heading', { name: 'Перенести встречу' })).toBeVisible();
}

async function selectFirstAvailableSlot(page: Page) {
  const dialog = page.getByRole('dialog');
  // Ждём первой активной кнопки дня (hasSlots=true → enabled)
  const firstEnabledDay = dialog.getByRole('button', { name: /^\d+$/, disabled: false }).first();
  await expect(firstEnabledDay).toBeVisible({ timeout: 5000 });
  await firstEnabledDay.click();
  // Выбираем первый слот времени
  const firstTimeSlot = dialog.getByRole('button', { name: /\d{2}:\d{2}/ }).first();
  await expect(firstTimeSlot).toBeVisible();
  await firstTimeSlot.click();
}

test.describe('Перенос бронирования', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/bookings/${BOOKING_ID}`);
    await expect(page.getByText('Встреча запланирована')).toBeVisible();
  });

  test('кнопки "Перенести встречу" и "Отменить встречу" видны для confirmed бронирования', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Перенести встречу' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Отменить встречу' })).toBeVisible();
  });

  test('пользователь может открыть и закрыть модалку переноса', async ({ page }) => {
    await page.getByRole('button', { name: 'Перенести встречу' }).click();
    await expect(page.getByRole('heading', { name: 'Перенести встречу' })).toBeVisible();

    await page.getByRole('button', { name: /^Отмена$/ }).click();
    await expect(page.getByRole('heading', { name: 'Перенести встречу' })).not.toBeVisible();
  });

  test('модалка показывает текущий слот и мини-календарь', async ({ page }) => {
    await openModal(page);
    const dialog = page.getByRole('dialog');

    // Текст текущего времени встречи
    await expect(dialog.getByText('Сейчас:')).toBeVisible();

    // Ждём загрузки и проверяем кнопки дней в мини-календаре
    await expect(dialog.getByRole('button', { name: /^\d+$/ }).first()).toBeVisible({ timeout: 5000 });
  });

  test('пользователь может успешно перенести бронирование', async ({ page }) => {
    await openModal(page);
    const dialog = page.getByRole('dialog');

    await selectFirstAvailableSlot(page);

    // Карточка «Было → Станет» появляется после выбора слота
    await expect(dialog.getByText('Было')).toBeVisible();
    await expect(dialog.getByText('Станет')).toBeVisible();

    // Подтверждаем перенос
    await dialog.getByRole('button', { name: 'Перенести', exact: true }).click();

    // Модалка закрывается
    await expect(page.getByRole('heading', { name: 'Перенести встречу' })).not.toBeVisible();
  });

  test('выбор дня показывает слоты только этого дня', async ({ page }) => {
    await openModal(page);
    const dialog = page.getByRole('dialog');

    // До выбора дня слоты времени не видны
    await expect(dialog.getByRole('button', { name: /^\d+$/, disabled: false }).first()).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByRole('button', { name: /\d{2}:\d{2}/ })).toHaveCount(0);

    // После клика первого дня — 3 слота (по тестовому моку: 3 слота на день)
    await dialog.getByRole('button', { name: /^\d+$/, disabled: false }).first().click();
    await expect(dialog.getByRole('button', { name: /\d{2}:\d{2}/ })).toHaveCount(3);

    // После клика второго дня — снова 3 слота (другой день)
    await dialog.getByRole('button', { name: /^\d+$/, disabled: false }).nth(1).click();
    await expect(dialog.getByRole('button', { name: /\d{2}:\d{2}/ })).toHaveCount(3);
  });

  test('кнопка "Перенести" неактивна без выбора слота и активируется после выбора', async ({ page }) => {
    await openModal(page);
    const dialog = page.getByRole('dialog');

    // Сразу неактивна (нет выбранного слота)
    await expect(dialog.getByRole('button', { name: 'Перенести', exact: true })).toBeDisabled();

    // Выбираем день и слот — кнопка активируется
    await selectFirstAvailableSlot(page);
    await expect(dialog.getByRole('button', { name: 'Перенести', exact: true })).toBeEnabled();
  });

  test('отображает ошибку при конфликте слота (409)', async ({ page }) => {
    // Переопределяем маршрут — возвращаем конфликт бронирования
    await page.route(/\/public\/bookings\/[^/]+\/reschedule/, async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'SLOT_ALREADY_BOOKED', message: 'Выбранный слот уже занят' }),
      });
    });

    await openModal(page);
    await selectFirstAvailableSlot(page);

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Перенести', exact: true }).click();

    // Модалка остаётся открытой, ошибка видна
    await expect(page.getByRole('heading', { name: 'Перенести встречу' })).toBeVisible();
    await expect(page.getByText('Выбранный слот уже занят')).toBeVisible();
  });

  test('показывает сообщение при отсутствии доступных слотов', async ({ page }) => {
    // Переопределяем маршрут слотов — пустой список
    await page.route(/\/public\/event-types\/[^/]+\/slots/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await openModal(page);

    await expect(page.getByText('Нет доступных слотов в ближайшие 14 дней')).toBeVisible({ timeout: 5000 });
  });

  test('показывает ошибку загрузки слотов и кнопку «Повторить»', async ({ page }) => {
    // Переопределяем маршрут слотов — серверная ошибка
    await page.route(/\/public\/event-types\/[^/]+\/slots/, async (route) => {
      await route.fulfill({ status: 500 });
    });

    await openModal(page);

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible();
  });

  test('страница отражает новые данные бронирования после успешного переноса', async ({ page }) => {
    await openModal(page);
    await selectFirstAvailableSlot(page);

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Перенести', exact: true }).click();

    // Модалка закрылась — страница по-прежнему показывает статус confirmed
    await expect(page.getByRole('heading', { name: 'Перенести встречу' })).not.toBeVisible();
    await expect(page.getByText('Встреча запланирована')).toBeVisible();
  });
});
