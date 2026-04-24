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
    status: 'confirmed',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    eventType: mockEventType,
    slot: mockSlot,
  };

  // Статeful мок для isOpen, чтобы модальное окно корректно открывалось/закрывалось
  let isOpenValue = false;

  beforeEach(() => {
    isOpenValue = false;
    vi.clearAllMocks();
  });

  const mockCancelForm = {
    isOpen: vi.fn().mockImplementation(() => isOpenValue),
    open: vi.fn().mockImplementation(() => { isOpenValue = true; }),
    close: vi.fn().mockImplementation(() => { isOpenValue = false; }),
    form: {
      fields: {
        reason: Object.assign(vi.fn().mockReturnValue(''), { set: vi.fn(), reset: vi.fn() }),
      },
      submit: Object.assign(vi.fn(), {
        ready: vi.fn().mockReturnValue(true),
        pending: vi.fn().mockReturnValue(false),
        error: Object.assign(vi.fn().mockReturnValue(null), { set: vi.fn() }),
        reset: vi.fn(),
      }),
      reset: vi.fn(),
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

  it('должен отображать кнопки переноса и отмены', () => {
    render(
      <BookingDetailPage
        booking={mockBooking}
        isLoading={false}
      />
    );

    expect(screen.getByText('Перенести встречу')).toBeInTheDocument();
    expect(screen.getByText('Отменить встречу')).toBeInTheDocument();
  });

  it('должен открывать модальное окно отмены при клике на Отменить встречу', () => {
    render(
      <BookingDetailPage
        booking={mockBooking}
        cancelForm={mockCancelForm as any}
        isLoading={false}
      />
    );

    const cancelLink = screen.getByText('Отменить встречу');
    fireEvent.click(cancelLink);

    // Проверяем что вызван open() для открытия модалки
    expect(mockCancelForm.open).toHaveBeenCalled();
  });

  it('должен открывать модальное окно переноса при клике на Перенести встречу', () => {
    const mockRescheduleForm = {
      isOpen: Object.assign(vi.fn().mockReturnValue(false), { set: vi.fn() }),
      availableSlots: Object.assign(vi.fn().mockReturnValue([]), {
        data: vi.fn().mockReturnValue([]),
        ready: vi.fn().mockReturnValue(true),
        error: vi.fn().mockReturnValue(null),
        subscribe: vi.fn(),
      }),
      form: {
        fields: { newSlotId: Object.assign(vi.fn().mockReturnValue(''), { set: vi.fn() }) },
        submit: Object.assign(vi.fn(), {
          ready: vi.fn().mockReturnValue(true),
          error: Object.assign(vi.fn().mockReturnValue(null), { set: vi.fn() }),
        }),
        reset: vi.fn(),
      },
      close: vi.fn(),
      retry: vi.fn(),
    };

    render(
      <BookingDetailPage
        booking={mockBooking}
        rescheduleForm={mockRescheduleForm as any}
        isLoading={false}
      />
    );

    const rescheduleLink = screen.getByText('Перенести встречу');
    fireEvent.click(rescheduleLink);

    expect(mockRescheduleForm.isOpen.set).toHaveBeenCalledWith(true);
  });

  it('не должен отображать ссылки переноса и отмены для отменённого бронирования', () => {
    const cancelledBooking = { ...mockBooking, status: 'cancelled' as const };

    render(
      <BookingDetailPage
        booking={cancelledBooking}
        isLoading={false}
      />
    );

    expect(screen.queryByText('Перенести встречу')).not.toBeInTheDocument();
    expect(screen.queryByText('Отменить встречу')).not.toBeInTheDocument();
  });

  it('должен корректно закрывать модальное окно через close()', () => {
    // Предустанавливаем состояние, при котором модальное окно открыто
    isOpenValue = true;

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

    // Проверяем что close() был вызван
    expect(mockCancelForm.close).toHaveBeenCalled();
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
