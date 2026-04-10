import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders as render } from '@/test/setup';
import { BookingDetailPage } from './BookingDetailPage';
import type { Booking } from '@entities/booking';
import type { EventType } from '@entities/event-type';
import type { Slot } from '@entities/slot';

describe('pages/booking-detail/BookingDetailPage', () => {
  const mockEventType: EventType = {
    id: 'event-1',
    name: 'Встреча 30 мин',
    description: 'Короткая встреча',
    durationMinutes: 30,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockSlot: Slot = {
    id: 'slot-1',
    startTime: '2024-01-15T10:00:00Z',
    endTime: '2024-01-15T10:30:00Z',
    isAvailable: false,
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockBooking: Booking = {
    id: 'booking-1',
    eventTypeId: 'event-1',
    slotId: 'slot-1',
    guestName: 'Иван Иванов',
    guestEmail: 'ivan@example.com',
    guestNotes: 'Тестовая заметка',
    status: 'CONFIRMED',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    eventType: mockEventType,
    slot: mockSlot,
  };

  // Статeful мок для reason, чтобы модальное окно корректно открывалось/закрывалось
  let reasonValue = '';

  beforeEach(() => {
    reasonValue = '';
    vi.clearAllMocks();
  });
  const mockCancelForm = {
    fields: {
      reason: Object.assign(
        vi.fn().mockImplementation(() => reasonValue),
        {
          set: vi.fn().mockImplementation((val: string) => { reasonValue = val; }),
          reset: vi.fn(),
        }
      ),
    },
    submit: {
      ready: vi.fn().mockReturnValue(true),
      pending: vi.fn().mockReturnValue(false),
      error: vi.fn().mockReturnValue(null),
      errorAtom: {
        set: vi.fn(),
      },
    },
  };

  it('должен отображать спиннер загрузки', () => {
    render(<BookingDetailPage isLoading={true} />);

    const spinner = document.querySelector('.mantine-Loader-root, [role="status"]');
    expect(spinner).toBeInTheDocument();
  });

  it('должен отображать ошибку', () => {
    render(<BookingDetailPage isLoading={false} error="Бронирование не найдено" />);

    expect(screen.getByText('Бронирование не найдено')).toBeInTheDocument();
    expect(screen.getByText('Назад')).toBeInTheDocument();
  });

  it('должен отображать заголовок успеха', () => {
    render(
      <BookingDetailPage
        booking={mockBooking}
        isLoading={false}
      />
    );

    expect(screen.getByText('Встреча запланирована')).toBeInTheDocument();
  });

  it('должен отображать детали встречи (что, когда, кто, где)', () => {
    render(
      <BookingDetailPage
        booking={mockBooking}
        isLoading={false}
      />
    );

    expect(screen.getByText('Что')).toBeInTheDocument();
    expect(screen.getByText('Когда')).toBeInTheDocument();
    expect(screen.getByText('Кто')).toBeInTheDocument();
    expect(screen.getByText('Где')).toBeInTheDocument();
  });

  it('должен отображать информацию о госте', () => {
    render(
      <BookingDetailPage
        booking={mockBooking}
        isLoading={false}
      />
    );

    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('ivan@example.com')).toBeInTheDocument();
  });

  it('должен отображать информацию о хосте', () => {
    render(
      <BookingDetailPage
        booking={mockBooking}
        isLoading={false}
      />
    );

    expect(screen.getAllByText('Host').length).toBeGreaterThan(0);
    expect(screen.getByText('host@example.com')).toBeInTheDocument();
  });

  it('должен отображать дополнительную информацию если есть', () => {
    render(
      <BookingDetailPage
        booking={mockBooking}
        isLoading={false}
      />
    );

    expect(screen.getByText('Дополнительная информация')).toBeInTheDocument();
    expect(screen.getByText('Тестовая заметка')).toBeInTheDocument();
  });

  it('должен отображать кнопки добавления в календарь', () => {
    render(
      <BookingDetailPage
        booking={mockBooking}
        isLoading={false}
      />
    );

    expect(screen.getByText(/Добавить в календарь/i)).toBeInTheDocument();
  });

  it('должен отображать кнопку На главную', () => {
    render(
      <BookingDetailPage
        booking={mockBooking}
        isLoading={false}
      />
    );

    expect(screen.getByText('На главную')).toBeInTheDocument();
  });

  it('должен отображать ссылки на изменение и отмену', () => {
    render(
      <BookingDetailPage
        booking={mockBooking}
        isLoading={false}
      />
    );

    expect(screen.getByText('Перенести')).toBeInTheDocument();
    expect(screen.getByText('Отмена')).toBeInTheDocument();
  });

  it('должен открывать модальное окно отмены при клике на Отмена', () => {
    render(
      <BookingDetailPage
        booking={mockBooking}
        cancelForm={mockCancelForm as any}
        isLoading={false}
      />
    );

    const cancelLink = screen.getByText('Отмена');
    fireEvent.click(cancelLink);

    // Проверяем что устанавливается флаг открытия модалки
    expect(mockCancelForm.fields.reason.set).toHaveBeenCalledWith('cancel_requested');
  });

  it('должен корректно закрывать модальное окно когда errorAtom существует', () => {
    // Предустанавливаем состояние, при котором модальное окно открыто
    reasonValue = 'cancel_requested';

    render(
      <BookingDetailPage
        booking={mockBooking}
        cancelForm={mockCancelForm as any}
        isLoading={false}
      />
    );

    // Модальное окно должно быть открыто, ищем кнопку "Закрыть"
    const closeButton = screen.getByText('Закрыть');
    fireEvent.click(closeButton);

    // Проверяем что reason сброшен и errorAtom.set был вызван для сброса ошибки
    expect(mockCancelForm.fields.reason.set).toHaveBeenCalledWith('');
    expect(mockCancelForm.submit.errorAtom.set).toHaveBeenCalledWith(null);
  });

  it('должен корректно закрывать модальное окно когда errorAtom отсутствует', () => {
    // Mock без errorAtom - проверка защиты от ошибки "Cannot read properties of undefined"
    let reasonValue2 = 'cancel_requested'; // Предустанавливаем открытое состояние
    const mockCancelFormWithoutErrorAtom = {
      fields: {
        reason: Object.assign(
          vi.fn().mockImplementation(() => reasonValue2),
          {
            set: vi.fn().mockImplementation((val: string) => { reasonValue2 = val; }),
            reset: vi.fn(),
          }
        ),
      },
      submit: {
        ready: vi.fn().mockReturnValue(true),
        pending: vi.fn().mockReturnValue(false),
        error: vi.fn().mockReturnValue(null),
        // errorAtom отсутствует - имитируем старый баг
      },
    };

    render(
      <BookingDetailPage
        booking={mockBooking}
        cancelForm={mockCancelFormWithoutErrorAtom as any}
        isLoading={false}
      />
    );

    // Модальное окно открыто, закрываем - не должно выбрасывать ошибку
    const closeButton = screen.getByText('Закрыть');
    expect(() => fireEvent.click(closeButton)).not.toThrow();

    // Проверяем что set('') был вызван для закрытия модалки
    expect(mockCancelFormWithoutErrorAtom.fields.reason.set).toHaveBeenCalledWith('');
  });

  it('должен отображать ошибку когда отсутствует eventType в бронировании', () => {
    const bookingWithoutEventType = {
      ...mockBooking,
      eventType: undefined,
    };

    render(
      <BookingDetailPage
        booking={bookingWithoutEventType as any}
        isLoading={false}
      />
    );

    expect(screen.getByText('Детали бронирования недоступны. Не удалось загрузить информацию о типе события или слоте.')).toBeInTheDocument();
    expect(screen.getByText('Назад')).toBeInTheDocument();
  });

  it('должен отображать ошибку когда отсутствует slot в бронировании', () => {
    const bookingWithoutSlot = {
      ...mockBooking,
      slot: undefined,
    };

    render(
      <BookingDetailPage
        booking={bookingWithoutSlot as any}
        isLoading={false}
      />
    );

    expect(screen.getByText('Детали бронирования недоступны. Не удалось загрузить информацию о типе события или слоте.')).toBeInTheDocument();
    expect(screen.getByText('Назад')).toBeInTheDocument();
  });
});
