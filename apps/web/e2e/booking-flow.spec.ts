import { test, expect } from './fixtures/mock-api';
import type { Page } from '@playwright/test';

/**
 * Вспомогательная функция: выбирает первую доступную дату в календаре.
 * Кликает по дате с индикатором доступных слотов (data-testid="calendar-day-available").
 */
async function selectAvailableDate(page: Page) {
  const dateWithSlots = page.getByTestId('calendar-day-available').first();
  await dateWithSlots.click();
}

/**
 * Вспомогательная функция: выбирает первый доступный слот.
 */
async function selectAvailableSlot(page: Page) {
  await page.waitForSelector('text=/Свободно/', { timeout: 5000 });
  await page.getByText('Свободно').first().click();
}

test.describe('Полный флоу бронирования', () => {
  test('пользователь может успешно забронировать встречу', async ({ page }) => {
    // 1. Открываем главную страницу
    await page.goto('/');
    await expect(page).toHaveTitle(/Calendar/i);

    // 2. Проверяем наличие основных элементов на главной
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
    await expect(page.getByText(/Забронируйте встречу за минуту/i)).toBeVisible();

    // 3. Кликаем "Записаться" (в main, не в хедере)
    await page.locator('main').getByRole('button', { name: /Записаться/i }).click();

    // 4. Проверяем переход на страницу каталога типов событий
    await expect(page).toHaveURL(/.*bookings\/new/);
    await expect(page.getByText('Выберите тип события')).toBeVisible();

    // 5. Выбираем первый доступный тип события
    await page.getByTestId('event-type-card').first().click();

    // 6. Проверяем переход на страницу выбора слотов
    await expect(page).toHaveURL(/.*\?eventTypeId=/);
    await expect(page.getByText('Календарь')).toBeVisible();

    // 7. Выбираем доступную дату (динамически, по наличию слотов)
    await selectAvailableDate(page);

    // 8. Проверяем что отображаются слоты
    await expect(page.getByText('Статус слотов')).toBeVisible();

    // 9. Выбираем доступный слот
    await selectAvailableSlot(page);

    // 10. Кликаем "Продолжить"
    await page.getByRole('button', { name: 'Продолжить' }).click();

    // 11. Проверяем переход на страницу подтверждения
    await expect(page).toHaveURL(/.*confirm/);
    await expect(page.getByText(/Подтвердить/i)).toBeVisible();

    // 12. Заполняем форму
    await page.getByLabel(/Ваше имя/i).fill('Тестовый Пользователь');
    await page.getByLabel(/Адрес электронной почты/i).fill('test@example.com');
    await page.getByLabel(/Дополнительная информация/i).fill('Тестовая заметка для встречи');

    // 13. Проверяем что кнопка "Подтвердить" доступна
    const submitButton = page.getByRole('button', { name: 'Подтвердить' });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test('пользователь видит ошибку при попытке бронирования без выбора слота', async ({ page }) => {
    await page.goto('/');
    await page.locator('main').getByRole('button', { name: /Записаться/i }).click();

    // Выбираем тип события
    await page.getByTestId('event-type-card').first().click();

    // Проверяем что кнопка "Продолжить" неактивна без выбора слота
    const continueButton = page.getByRole('button', { name: 'Продолжить' });
    await expect(continueButton).toBeDisabled();
  });

  test('валидация формы бронирования', async ({ page }) => {
    await page.goto('/');
    await page.locator('main').getByRole('button', { name: /Записаться/i }).click();

    // Выбираем тип события
    await page.getByTestId('event-type-card').first().click();

    // Выбираем доступную дату и слот
    await selectAvailableDate(page);
    await selectAvailableSlot(page);
    await page.getByRole('button', { name: 'Продолжить' }).click();

    // Проверяем страницу подтверждения
    await expect(page).toHaveURL(/.*confirm/);

    const submitButton = page.getByRole('button', { name: 'Подтвердить' });
    const emailInput = page.getByLabel(/Адрес электронной почты/i);

    // Заполняем невалидный email и отправляем
    await emailInput.fill('invalid-email');
    await submitButton.click();

    // Проверяем что остались на странице (валидация не прошла)
    await expect(page).toHaveURL(/.*confirm/);

    // Проверяем отображение ошибки валидации email
    await expect(page.getByText(/некорректный|invalid|email/i)).toBeVisible();

    // Проверяем что поле имени обязательно
    await emailInput.fill('valid@example.com');
    await submitButton.click();
    await expect(page).toHaveURL(/.*confirm/);
  });
});
