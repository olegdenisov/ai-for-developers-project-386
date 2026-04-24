import { test as base, expect } from '@playwright/test';

// ============================================
// MOCK DATA
// ============================================

const EVENT_TYPE_ID = '11111111-1111-1111-1111-111111111111';
const SLOT_ID = '33333333-3333-3333-3333-333333333333';
const BOOKING_ID = '22222222-2222-2222-2222-222222222222';

const now = new Date();

const mockOwner = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Tota',
  email: 'tota@example.com',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockEventType = {
  id: EVENT_TYPE_ID,
  name: 'Консультация 30 мин',
  description: 'Индивидуальная консультация',
  durationMinutes: 30,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

/**
 * Генерирует слоты на ближайшие дни текущего месяца.
 * Создаёт по 3 слота на каждый из 5 дней начиная с текущего+1.
 */
function generateSlots() {
  const slots = [];
  for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    const times = [
      { start: '10:00:00', end: '10:30:00' },
      { start: '11:00:00', end: '11:30:00' },
      { start: '14:00:00', end: '14:30:00' },
    ];

    for (let i = 0; i < times.length; i++) {
      slots.push({
        id: `33333333-3333-3333-3333-33333333${String(dayOffset).padStart(2, '0')}${String(i).padStart(2, '0')}`,
        startTime: `${dateStr}T${times[i].start}Z`,
        endTime: `${dateStr}T${times[i].end}Z`,
        isAvailable: true,
        eventTypeId: EVENT_TYPE_ID,
        createdAt: '2024-01-01T00:00:00Z',
      });
    }
  }
  return slots;
}

const mockSlots = generateSlots();

function createMockBooking(overrides: Record<string, unknown> = {}) {
  const slot = mockSlots[0];
  return {
    id: BOOKING_ID,
    eventTypeId: EVENT_TYPE_ID,
    slotId: slot.id,
    guestName: 'Тестовый Пользователь',
    guestEmail: 'test@example.com',
    guestNotes: '',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    eventType: mockEventType,
    slot,
    ...overrides,
  };
}

// ============================================
// FIXTURE
// ============================================

export const test = base.extend({
  page: async ({ page }, use) => {
    // GET /owner/profile — профиль хоста
    await page.route('**/owner/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockOwner),
      });
    });

    // GET /public/event-types — список типов событий
    await page.route('**/public/event-types', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockEventType]),
        });
      } else {
        await route.continue();
      }
    });

    // GET /public/event-types/:id/slots* — доступные слоты
    await page.route(/\/public\/event-types\/[^/]+\/slots/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSlots),
      });
    });

    // GET /public/event-types/:id — тип события по ID
    await page.route(/\/public\/event-types\/[^/]+$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockEventType),
      });
    });

    // GET /slots/:id — слот по ID (используется в bookingConfirmationRoute)
    await page.route(/\/slots\/[^/]+$/, async (route) => {
      if (route.request().method() === 'GET') {
        const url = route.request().url();
        const slotId = url.split('/slots/')[1]?.split('?')[0];
        const slot = mockSlots.find((s) => s.id === slotId) ?? mockSlots[0];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(slot),
        });
      } else {
        await route.continue();
      }
    });

    // PATCH /public/bookings/:id/reschedule — перенос бронирования
    await page.route(/\/public\/bookings\/[^/]+\/reschedule/, async (route) => {
      if (route.request().method() === 'PATCH') {
        const postData = route.request().postDataJSON();
        const newSlot = mockSlots.find((s) => s.id === postData?.newSlotId) ?? mockSlots[1];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockBooking({ slotId: newSlot.id, slot: newSlot })),
        });
      } else {
        await route.continue();
      }
    });

    // POST /public/bookings/:id/cancel — отмена бронирования
    await page.route(/\/public\/bookings\/[^/]+\/cancel/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockBooking({ status: 'cancelled' })),
      });
    });

    // GET /public/bookings/:id — детали бронирования
    await page.route(/\/public\/bookings\/[^/]+$/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockBooking()),
        });
      } else {
        await route.continue();
      }
    });

    // POST /public/bookings — создание бронирования
    await page.route('**/public/bookings', async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(
            createMockBooking({
              guestName: postData?.guestName || 'Тестовый Пользователь',
              guestEmail: postData?.guestEmail || 'test@example.com',
              guestNotes: postData?.guestNotes || '',
              slotId: postData?.slotId || mockSlots[0].id,
            })
          ),
        });
      } else {
        await route.continue();
      }
    });

    await use(page);
  },
});

export { expect };
