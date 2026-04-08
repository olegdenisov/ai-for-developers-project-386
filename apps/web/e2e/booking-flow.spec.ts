import { test, expect } from '@playwright/test';

test.describe('Полный флоу бронирования', () => {
  test('пользователь может успешно забронировать встречу', async ({ page }) => {
    // 1. Открываем главную страницу
    await page.goto('/');
    await expect(page).toHaveTitle(/Calendar/i);

    // 2. Проверяем наличие основных элементов на главной
    await expect(page.getByText('Calendar')).toBeVisible();
    await expect(page.getByText(/Забронируйте встречу за минуту/i)).toBeVisible();

    // 3. Кликаем "Записаться"
    await page.getByRole('button', { name: /Записаться/i }).click();

    // 4. Проверяем переход на страницу каталога типов событий
    await expect(page).toHaveURL(/.*bookings\/new/);
    await expect(page.getByText('Выберите тип события')).toBeVisible();

    // 5. Выбираем первый доступный тип события
    const eventTypeCards = page.locator('[style*="cursor: pointer"]').first();
    await eventTypeCards.click();

    // 6. Проверяем переход на страницу выбора слотов
    await expect(page).toHaveURL(/.*event-types\//);
    await expect(page.getByText('Календарь')).toBeVisible();

    // 7. Выбираем доступную дату (с зеленым индикатором доступных слотов)
    const availableDate = page.locator('text=/\\d+ св\\./').first();
    await availableDate.click();

    // 8. Проверяем что отображаются слоты
    await expect(page.getByText('Статус слотов')).toBeVisible();

    // 9. Выбираем доступный слот
    const availableSlot = page.getByText('Свободно').first();
    await availableSlot.click();

    // 10. Кликаем "Продолжить"
    await page.getByRole('button', { name: 'Продолжить' }).click();

    // 11. Проверяем переход на страницу подтверждения
    await expect(page).toHaveURL(/.*booking-confirmation/);
    await expect(page.getByText(/Подтвердить/i)).toBeVisible();

    // 12. Заполняем форму
    await page.getByLabel(/Ваше имя/i).fill('Тестовый Пользователь');
    await page.getByLabel(/Адрес электронной почты/i).fill('test@example.com');
    await page.getByLabel(/Дополнительная информация/i).fill('Тестовая заметка для встречи');

    // 13. Подтверждаем бронирование
    await page.getByRole('button', { name: 'Подтвердить' }).click();

    // 14. Проверяем переход на страницу деталей бронирования
    await expect(page).toHaveURL(/.*bookings\//);
    await expect(page.getByText('Встреча запланирована')).toBeVisible();

    // 15. Проверяем детали бронирования
    await expect(page.getByText('Тестовый Пользователь')).toBeVisible();
    await expect(page.getByText('test@example.com')).toBeVisible();
  });

  test('пользователь видит ошибку при попытке бронирования без выбора слота', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Записаться/i }).click();

    // Выбираем тип события
    const eventTypeCards = page.locator('[style*="cursor: pointer"]').first();
    await eventTypeCards.click();

    // Проверяем что кнопка "Продолжить" неактивна без выбора слота
    const continueButton = page.getByRole('button', { name: 'Продолжить' });
    await expect(continueButton).toBeDisabled();
  });

  test('валидация формы бронирования', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Записаться/i }).click();

    // Выбираем тип события
    const eventTypeCards = page.locator('[style*="cursor: pointer"]').first();
    await eventTypeCards.click();

    // Выбираем дату и слот
    const availableDate = page.locator('text=/\\d+ св\\./').first();
    await availableDate.click();
    const availableSlot = page.getByText('Свободно').first();
    await availableSlot.click();
    await page.getByRole('button', { name: 'Продолжить' }).click();

    // Проверяем страницу подтверждения
    await expect(page).toHaveURL(/.*booking-confirmation/);

    // Пытаемся отправить пустую форму
    // В Mantine форма с валидацией Zod должна блокировать отправку
    const submitButton = page.getByRole('button', { name: 'Подтвердить' });

    // Проверяем что поля обязательные
    const nameInput = page.getByLabel(/Ваше имя/i);
    const emailInput = page.getByLabel(/Адрес электронной почты/i);

    // Заполняем невалидный email
    await emailInput.fill('invalid-email');
    await submitButton.click();

    // Проверяем что остались на странице (валидация не прошла)
    await expect(page).toHaveURL(/.*booking-confirmation/);
  });
});
