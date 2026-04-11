import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/setup';
import { BookingConfirmationPage } from './BookingConfirmationPage';
import type { EventType } from '@entities/event-type';
import type { Slot } from '@entities/slot';
import type { Owner } from '@entities/owner';

describe('pages/booking-confirmation/BookingConfirmationPage', () => {
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
    isAvailable: true,
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockOwner: Owner = {
    id: 'owner-1',
    name: 'Host',
    email: 'host@example.com',
    isPredefined: true,
    createdAt: '2024-01-01T00:00:00Z',
  };

  // Мок поля формы: совместим с bindField из @reatom/react
  const mockField = (value: string, name: string) => ({
    value: () => value,
    validation: () => ({ error: undefined }),
    change: vi.fn(),
    focus: { in: vi.fn(), out: vi.fn() },
    name,
  });

  // submit — вызываемая функция с методами ready/pending/error
  const submitFn = Object.assign(vi.fn(() => Promise.resolve()), {
    ready: () => true,
    pending: () => false,
    error: () => null,
  });

  // wasSubmitted — вызываемый атом (функция) с методом set
  const wasSubmittedAtom = Object.assign(() => false, { set: vi.fn() });

  const mockForm = {
    form: {
      fields: {
        guestName: mockField('Иван Иванов', 'guestName'),
        guestEmail: mockField('ivan@example.com', 'guestEmail'),
        guestNotes: mockField('Тестовая заметка', 'guestNotes'),
      },
      submit: submitFn,
    },
    wasSubmitted: wasSubmittedAtom,
  };

  it('должен отображать спиннер загрузки', () => {
    renderWithProviders(<BookingConfirmationPage isLoading={true} />);

    const spinner = document.querySelector('[role="status"], .mantine-Loader-root');
    expect(spinner).toBeInTheDocument();
  });

  it('должен отображать ошибку', () => {
    renderWithProviders(
      <BookingConfirmationPage
        isLoading={false}
        error="Ошибка загрузки данных"
      />
    );

    expect(screen.getByText('Ошибка загрузки данных')).toBeInTheDocument();
    expect(screen.getByText('Назад')).toBeInTheDocument();
  });

  it('должен отображать сообщение об отсутствии данных', () => {
    renderWithProviders(<BookingConfirmationPage isLoading={false} />);

    expect(screen.getByText(/Данные бронирования не найдены/i)).toBeInTheDocument();
  });

  it('должен отображать сводку о встрече', () => {
    renderWithProviders(
      <BookingConfirmationPage
        eventType={mockEventType}
        slot={mockSlot}
        owner={mockOwner}
        form={mockForm as any}
        isLoading={false}
      />
    );

    expect(screen.getByText('Встреча 30 мин')).toBeInTheDocument();
    expect(screen.getAllByText('Host').length).toBeGreaterThan(0);
  });

  it('должен отображать форму с полями ввода', () => {
    renderWithProviders(
      <BookingConfirmationPage
        eventType={mockEventType}
        slot={mockSlot}
        owner={mockOwner}
        form={mockForm as any}
        isLoading={false}
      />
    );

    expect(screen.getByLabelText(/Ваше имя/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Адрес электронной почты/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Дополнительная информация/i)).toBeInTheDocument();
  });

  it('должен отображать кнопки Назад и Подтвердить', () => {
    renderWithProviders(
      <BookingConfirmationPage
        eventType={mockEventType}
        slot={mockSlot}
        owner={mockOwner}
        form={mockForm as any}
        isLoading={false}
      />
    );

    expect(screen.getByText('Назад')).toBeInTheDocument();
    expect(screen.getByText('Подтвердить')).toBeInTheDocument();
  });

  it('должен отображать кнопку Добавить гостей', () => {
    renderWithProviders(
      <BookingConfirmationPage
        eventType={mockEventType}
        slot={mockSlot}
        owner={mockOwner}
        form={mockForm as any}
        isLoading={false}
      />
    );

    expect(screen.getByText('Добавить гостей')).toBeInTheDocument();
  });

  it('должен отображать информацию о дате и времени', () => {
    renderWithProviders(
      <BookingConfirmationPage
        eventType={mockEventType}
        slot={mockSlot}
        owner={mockOwner}
        form={mockForm as any}
        isLoading={false}
      />
    );

    // Проверяем что отображается дата (формат зависит от dayjs)
    const dateElement = screen.getByText(/понедельник|вторник|среда|четверг|пятница|суббота|воскресенье/i);
    expect(dateElement).toBeInTheDocument();
  });

  it('должен отображать длительность встречи', () => {
    renderWithProviders(
      <BookingConfirmationPage
        eventType={mockEventType}
        slot={mockSlot}
        owner={mockOwner}
        form={mockForm as any}
        isLoading={false}
      />
    );

    expect(screen.getByText(/30 минут/i)).toBeInTheDocument();
  });
});
