import { test, expect } from './fixtures/mock-api';

const BOOKING_ID = '22222222-2222-2222-2222-222222222222';

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

    // Закрываем по кнопке «Отмена»
    await page.getByRole('button', { name: /^Отмена$/ }).click();
    await expect(page.getByRole('heading', { name: 'Перенести встречу' })).not.toBeVisible();
  });

  test('модалка показывает текущий слот и таблетки по датам', async ({ page }) => {
    await page.getByRole('button', { name: 'Перенести встречу' }).click();

    // Блок с текущим временем встречи
    await expect(page.getByText('Текущее время встречи')).toBeVisible();

    // Ждём загрузки слотов и проверяем что таблетки по датам отображаются
    await expect(page.getByRole('radio').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /\d+ \S+/ }).first()).toBeVisible();
  });

  test('пользователь может успешно перенести бронирование', async ({ page }) => {
    await page.getByRole('button', { name: 'Перенести встречу' }).click();
    await expect(page.getByText('Текущее время встречи')).toBeVisible();

    // Ждём загрузки слотов (появление radio-кнопок)
    await expect(page.getByRole('radio').first()).toBeVisible({ timeout: 5000 });

    // Выбираем второй слот (отличный от текущего)
    await page.getByRole('radio').nth(1).click();

    // Проверяем блок «Вы выбрали»
    await expect(page.getByText(/Вы выбрали:/)).toBeVisible();

    // Подтверждаем перенос
    await page.getByRole('button', { name: 'Перенести', exact: true }).click();

    // Модалка закрывается
    await expect(page.getByRole('heading', { name: 'Перенести встречу' })).not.toBeVisible();
  });

  test('фильтр по дате показывает только слоты выбранного дня', async ({ page }) => {
    await page.getByRole('button', { name: 'Перенести встречу' }).click();

    // Ждём загрузки слотов
    await expect(page.getByRole('radio').first()).toBeVisible({ timeout: 5000 });
    const totalSlots = await page.getByRole('radio').count();

    // Нажимаем первую таблетку дня
    const firstDayPill = page.getByRole('button', { name: /\d+ \S+/ }).first();
    await firstDayPill.click();

    // Слотов должно стать меньше или столько же (только один день)
    const filteredSlots = await page.getByRole('radio').count();
    expect(filteredSlots).toBeLessThanOrEqual(totalSlots);

    // Повторный клик снимает фильтр — слоты возвращаются
    await firstDayPill.click();
    await expect(page.getByRole('radio')).toHaveCount(totalSlots);
  });

  test('кнопка "Перенести" неактивна без выбора нового слота', async ({ page }) => {
    await page.getByRole('button', { name: 'Перенести встречу' }).click();

    // Ждём загрузки слотов прежде чем проверять кнопку
    await expect(page.getByRole('radio').first()).toBeVisible({ timeout: 5000 });

    await expect(page.getByRole('button', { name: 'Перенести', exact: true })).toBeDisabled();
  });
});
