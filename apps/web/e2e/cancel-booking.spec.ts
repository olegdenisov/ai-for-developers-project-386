import { test, expect } from '@playwright/test';

/**
 * Примечание: тесты требуют успешного создания бронирования.
 * Mock-сервер теперь возвращает UUID для слотов, соответствующий схеме API.
 * Тесты пропущены (skip), так как требуют настроенного mock-сервера Prism.
 */
test.describe('Отмена бронирования', () => {
  test.skip('пользователь может отменить бронирование', async ({ page }) => {
    // Создаем бронирование
    await page.goto('/');
    await page.locator('main').getByRole('button', { name: /Записаться/i }).click();

    // Выбираем тип события
    const eventTypeCards = page.locator('[style*="cursor: pointer"]').first();
    await eventTypeCards.click();

    // Выбираем дату (8 апреля - есть слоты в моке) и слот
    await page.getByText('8').first().click();
    // Ждем появления слотов
    await page.waitForSelector('text=/Свободно/', { timeout: 5000 });
    const availableSlot = page.getByText('Свободно').first();
    await availableSlot.click();
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
    await expect(page.getByText('Отменить бронирование')).toBeVisible();
    await expect(page.getByText(/Вы уверены, что хотите отменить/i)).toBeVisible();

    // Подтверждаем отмену
    await page.getByRole('button', { name: 'Отменить бронирование' }).click();

    // Проверяем что бронирование отменено
    // В реальном приложении здесь должна быть проверка статуса
    await expect(page.getByText('Встреча запланирована')).not.toBeVisible();
  });

  test.skip('пользователь может закрыть модальное окно отмены без отмены', async ({ page }) => {
    // Создаем бронирование
    await page.goto('/');
    await page.locator('main').getByRole('button', { name: /Записаться/i }).click();

    const eventTypeCards = page.locator('[style*="cursor: pointer"]').first();
    await eventTypeCards.click();

    // Выбираем дату (8 апреля - есть слоты в моке) и слот
    await page.getByText('8').first().click();
    // Ждем появления слотов
    await page.waitForSelector('text=/Свободно/', { timeout: 5000 });
    const availableSlot = page.getByText('Свободно').first();
    await availableSlot.click();
    await page.getByRole('button', { name: 'Продолжить' }).click();

    await page.getByLabel(/Ваше имя/i).fill('Тест');
    await page.getByLabel(/Адрес электронной почты/i).fill('test@example.com');
    await page.getByRole('button', { name: 'Подтвердить' }).click();

    await expect(page.getByText('Встреча запланирована')).toBeVisible();

    // Открываем модалку отмены
    await page.getByText('Отмена').click();
    await expect(page.getByText('Отменить бронирование')).toBeVisible();

    // Закрываем модалку по кнопке "Закрыть"
    await page.getByRole('button', { name: /^Закрыть$/ }).click();

    // Проверяем что модалка закрылась и мы остались на странице
    await expect(page.getByText('Встреча запланирована')).toBeVisible();
  });
});
