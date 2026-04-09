import { test, expect } from './fixtures/mock-api';
import type { Page } from '@playwright/test';

/**
 * Вспомогательная функция: выбирает первую доступную дату в календаре.
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

test.describe('Отмена бронирования', () => {
  test('пользователь может отменить бронирование', async ({ page }) => {
    // Создаем бронирование
    await page.goto('/');
    await page.locator('main').getByRole('button', { name: /Записаться/i }).click();

    await page.getByTestId('event-type-card').first().click();

    // Выбираем доступную дату и слот
    await selectAvailableDate(page);
    await selectAvailableSlot(page);
    await page.getByRole('button', { name: 'Продолжить' }).click();

    // Заполняем форму и создаем бронирование
    await page.getByLabel(/Ваше имя/i).fill('Пользователь для отмены');
    await page.getByLabel(/Адрес электронной почты/i).fill('cancel@example.com');
    await page.getByRole('button', { name: 'Подтвердить' }).click();

    // Ждем перехода на страницу деталей
    await expect(page.getByText('Встреча запланирована')).toBeVisible();

    // Нажимаем на ссылку "Отмена"
    await page.getByText('Отмена').click();

    // Проверяем что открылось модальное окно
    await expect(page.getByRole('heading', { name: 'Отменить бронирование' })).toBeVisible();
    await expect(page.getByText(/Вы уверены, что хотите отменить/i)).toBeVisible();

    // Подтверждаем отмену
    await page.getByRole('button', { name: 'Отменить бронирование' }).click();

    // Проверяем что бронирование отменено — перенаправление на главную
    await expect(page).toHaveURL('/');
  });

  test('пользователь может закрыть модальное окно отмены без отмены', async ({ page }) => {
    // Создаем бронирование
    await page.goto('/');
    await page.locator('main').getByRole('button', { name: /Записаться/i }).click();

    await page.getByTestId('event-type-card').first().click();

    // Выбираем доступную дату и слот
    await selectAvailableDate(page);
    await selectAvailableSlot(page);
    await page.getByRole('button', { name: 'Продолжить' }).click();

    await page.getByLabel(/Ваше имя/i).fill('Тест');
    await page.getByLabel(/Адрес электронной почты/i).fill('test@example.com');
    await page.getByRole('button', { name: 'Подтвердить' }).click();

    await expect(page.getByText('Встреча запланирована')).toBeVisible();

    // Открываем модалку отмены
    await page.getByText('Отмена').click();
    await expect(page.getByRole('heading', { name: 'Отменить бронирование' })).toBeVisible();

    // Закрываем модалку по кнопке "Закрыть"
    await page.getByRole('button', { name: /^Закрыть$/ }).click();

    // Проверяем что модалка закрылась и мы остались на странице
    await expect(page.getByText('Встреча запланирована')).toBeVisible();
  });
});
