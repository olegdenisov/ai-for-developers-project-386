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

test.describe('Навигация', () => {
  test('пользователь может перейти с главной на страницу бронирования', async ({ page }) => {
    await page.goto('/');

    // Проверяем что мы на главной
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();

    // Кликаем "Записаться" (в main)
    await page.locator('main').getByRole('button', { name: /Записаться/i }).click();

    // Проверяем переход
    await expect(page).toHaveURL(/.*bookings\/new/);
    await expect(page.getByText('Выберите тип события')).toBeVisible();
  });

  test('пользователь может вернуться назад со страницы выбора слотов', async ({ page }) => {
    // Идем на страницу выбора типа события
    await page.goto('/bookings/new');

    // Выбираем тип события
    await page.getByTestId('event-type-card').first().click();

    // Проверяем что мы на странице выбора слотов
    await expect(page).toHaveURL(/.*event-types\//);

    // Кликаем "Назад"
    await page.getByRole('button', { name: 'Назад' }).first().click();

    // Проверяем что вернулись на каталог
    await expect(page).toHaveURL(/.*bookings\/new/);
  });

  test('пользователь может вернуться на главную со страницы деталей бронирования', async ({ page }) => {
    // Создаем бронирование
    await page.goto('/');
    await page.locator('main').getByRole('button', { name: /Записаться/i }).click();

    await page.getByTestId('event-type-card').first().click();

    // Выбираем доступную дату и слот
    await selectAvailableDate(page);
    await selectAvailableSlot(page);
    await page.getByRole('button', { name: 'Продолжить' }).click();

    await page.getByLabel(/Ваше имя/i).fill('Тест Навигации');
    await page.getByLabel(/Адрес электронной почты/i).fill('nav@example.com');
    await page.getByRole('button', { name: 'Подтвердить' }).click();

    // Проверяем что на странице деталей
    await expect(page.getByText('Встреча запланирована')).toBeVisible();

    // Кликаем "На главную"
    await page.getByRole('button', { name: 'На главную' }).click();

    // Проверяем переход на главную
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
  });

  test('навигация через Layout работает корректно', async ({ page }) => {
    await page.goto('/');

    // Проверяем наличие ссылок в Layout
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Проверяем ссылку "Записаться" в хедере
    const bookButton = page.getByRole('button', { name: /Записаться/i }).first();
    await expect(bookButton).toBeVisible();

    // Кликаем
    await bookButton.click();

    // Проверяем переход
    await expect(page).toHaveURL(/.*bookings\/new/);
  });

  test('переход между страницами сохраняет состояние', async ({ page }) => {
    // Идем на страницу выбора типа события
    await page.goto('/bookings/new');

    // Выбираем тип события
    const eventTypeCard = page.getByTestId('event-type-card').first();
    const eventName = await eventTypeCard.textContent();
    await eventTypeCard.click();

    // Проверяем что тип события отображается на странице выбора слотов
    await expect(page.getByText(eventName || '')).toBeVisible();
  });
});
