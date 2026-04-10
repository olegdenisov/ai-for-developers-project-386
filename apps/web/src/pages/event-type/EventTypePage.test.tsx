import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders as render } from '@/test/setup';
import { EventTypePage } from './EventTypePage';

// Мок для API клиента
vi.mock('@shared/api', () => ({
  apiClient: {
    getPublicEventType: vi.fn().mockResolvedValue({
      status: 200,
      data: {
        id: 'event-1',
        name: 'Встреча 30 мин',
        description: 'Короткая встреча для обсуждения',
        durationMinutes: 30,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    }),
    getAvailableSlotsForEventType: vi.fn().mockResolvedValue({
      status: 200,
      data: [],
    }),
  },
}));

// Мокируем atoms для изоляции тестов
vi.mock('./model/route', () => ({
  fetchSlotsForDate: vi.fn(),
  fetchSlotsForCalendar: vi.fn(),
  isSlotsLoading: vi.fn().mockReturnValue(false),
  currentCalendarMonthAtom: vi.fn().mockReturnValue(new Date('2024-01-01')),
  selectedDateAtom: vi.fn().mockReturnValue(null),
  selectedSlotAtom: Object.assign(vi.fn().mockReturnValue(null), { set: vi.fn() }),
  selectedSlotIdAtom: vi.fn().mockReturnValue(null),
  slotsAtom: vi.fn().mockReturnValue([]),
}));

vi.mock('./model/model', () => ({
  calendarDaysAtom: vi.fn().mockReturnValue([]),
  slotsForSelectedDateAtom: vi.fn().mockReturnValue([]),
  goToPrevMonth: vi.fn(),
  goToNextMonth: vi.fn(),
  selectDate: vi.fn(),
  selectSlot: vi.fn(),
  proceedToBooking: vi.fn(),
  goBack: vi.fn(),
}));

describe('pages/event-type/EventTypePage', () => {
  it('должен рендериться без ошибок с eventTypeId', () => {
    const { container } = render(<EventTypePage eventTypeId="event-1" />);
    expect(container).toBeTruthy();
  });

  it('должен рендериться без ошибок без eventTypeId', () => {
    const { container } = render(<EventTypePage />);
    expect(container).toBeTruthy();
  });
});
