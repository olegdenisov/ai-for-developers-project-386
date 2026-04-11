import { test, expect } from '@playwright/test';

// ============================================
// MOCK DATA
// ============================================

const existingEventType = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Консультация 30 мин',
  description: 'Индивидуальная консультация',
  durationMinutes: 30,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// ============================================
// ТЕСТЫ
// ============================================

test.describe('Создание типа события (admin)', () => {
  test.beforeEach(async ({ page }) => {
    // Мутируемый список — обновляется после POST
    let eventTypes = [existingEventType];

    // GET /event-types — список; POST /event-types — создание
    // Используем точный API-URL чтобы не перехватить навигацию на /admin/event-types
    await page.route('http://localhost:3000/event-types', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(eventTypes),
        });
      } else if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        const created = {
          id: '44444444-4444-4444-4444-444444444444',
          name: body.name,
          description: body.description ?? null,
          durationMinutes: body.durationMinutes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        eventTypes = [...eventTypes, created];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/event-types');
  });

  test('отображает существующие типы событий', async ({ page }) => {
    await expect(page.getByText('Консультация 30 мин')).toBeVisible();
  });

  test('открывает модалку по кнопке Создать', async ({ page }) => {
    await page.getByRole('button', { name: 'Создать' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Создать тип события')).toBeVisible();
  });

  test('модалка содержит поля Название, Описание и Длительность', async ({ page }) => {
    await page.getByRole('button', { name: 'Создать' }).click();

    await expect(page.getByLabel('Название')).toBeVisible();
    await expect(page.getByLabel('Описание')).toBeVisible();
    await expect(page.getByLabel('Длительность (минуты)')).toBeVisible();
  });

  test('успешно создаёт тип события и обновляет список', async ({ page }) => {
    await page.getByRole('button', { name: 'Создать' }).click();

    // Заполняем форму
    await page.getByLabel('Название').fill('Стратегическая сессия');
    await page.getByLabel('Описание').fill('Планирование на квартал');
    await page.getByLabel('Длительность (минуты)').fill('60');

    // Отправляем через кнопку внутри модалки
    await page.getByRole('dialog').getByRole('button', { name: 'Создать' }).click();

    // Модалка закрывается
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Новый тип события появился в таблице
    await expect(page.getByText('Стратегическая сессия')).toBeVisible();
  });

  test('закрывает модалку по кнопке Отмена', async ({ page }) => {
    await page.getByRole('button', { name: 'Создать' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: 'Отмена' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('не закрывает модалку при незаполненном обязательном поле Название', async ({ page }) => {
    await page.getByRole('button', { name: 'Создать' }).click();

    // Поле Название оставляем пустым — нажимаем Создать
    await page.getByRole('dialog').getByRole('button', { name: 'Создать' }).click();

    // Модалка должна остаться открытой (форма не прошла валидацию)
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
