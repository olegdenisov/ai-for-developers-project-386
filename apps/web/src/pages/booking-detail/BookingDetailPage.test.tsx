import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  const mockCancelForm = {
    fields: {
      reason: {
        value: () => '',
        set: vi.fn(),
        reset: vi.fn(),
      },
    },
    submit: {
      pending: () => false,
      error: () => null,
      errorAtom: {
        set: vi.fn(),
      },
    },
  };

  it('должен отображать спиннер загрузки', () => {
    render(<BookingDetailPage isLoading={true} />);

    const spinner = document.querySelector('[role="status"]');
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

    expect(screen.getByText('Host')).toBeInTheDocument();
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

    // Проверяем что устанавливается пустая строка в reason (инициализация модалки)
    expect(mockCancelForm.fields.reason.set).toHaveBeenCalledWith('');
  });

  it('должен корректно закрывать модальное окно когда errorAtom существует', () => {
    render(
      <BookingDetailPage
        booking={mockBooking}
        cancelForm={mockCancelForm as any}
        isLoading={false}
      />
    );

    // Открываем модальное окно
    const cancelLink = screen.getByText('Отмена');
    fireEvent.click(cancelLink);

    // Закрываем модальное окно через кнопку "Закрыть"
    const closeButton = screen.getByText('Закрыть');
    fireEvent.click(closeButton);

    // Проверяем что errorAtom.set был вызван для сброса ошибки
    expect(mockCancelForm.fields.reason.reset).toHaveBeenCalled();
    expect(mockCancelForm.submit.errorAtom.set).toHaveBeenCalledWith(null);
  });

  it('должен корректно закрывать модальное окно когда errorAtom отсутствует', () => {
    // Mock без errorAtom - проверка защиты от ошибки "Cannot read properties of undefined"
    const mockCancelFormWithoutErrorAtom = {
      fields: {
        reason: {
          value: () => '',
          set: vi.fn(),
          reset: vi.fn(),
        },
      },
      submit: {
        pending: () => false,
        error: () => null,
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

    // Открываем модальное окно
    const cancelLink = screen.getByText('Отмена');
    fireEvent.click(cancelLink);

    // Закрываем модальное окно - не должно выбрасывать ошибку
    const closeButton = screen.getByText('Закрыть');
    expect(() => fireEvent.click(closeButton)).not.toThrow();

    // Проверяем что reset был вызван
    expect(mockCancelFormWithoutErrorAtom.fields.reason.reset).toHaveBeenCalled();
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
