import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  const mockForm = {
    fields: {
      guestName: {
        value: () => 'Иван Иванов',
        error: () => null,
        onChange: vi.fn(),
      },
      guestEmail: {
        value: () => 'ivan@example.com',
        error: () => null,
        onChange: vi.fn(),
      },
      guestNotes: {
        value: () => 'Тестовая заметка',
        error: () => null,
        onChange: vi.fn(),
      },
    },
    submit: {
      pending: () => false,
      ready: () => true,
      error: () => null,
    },
  };

  it('должен отображать спиннер загрузки', () => {
    render(<BookingConfirmationPage isLoading={true} />);

    const spinner = document.querySelector('[role="status"]');
    expect(spinner).toBeInTheDocument();
  });

  it('должен отображать ошибку', () => {
    render(
      <BookingConfirmationPage
        isLoading={false}
        error="Ошибка загрузки данных"
      />
    );

    expect(screen.getByText('Ошибка загрузки данных')).toBeInTheDocument();
    expect(screen.getByText('Назад')).toBeInTheDocument();
  });

  it('должен отображать сообщение об отсутствии данных', () => {
    render(<BookingConfirmationPage isLoading={false} />);

    expect(screen.getByText(/Данные бронирования не найдены/i)).toBeInTheDocument();
  });

  it('должен отображать сводку о встрече', () => {
    render(
      <BookingConfirmationPage
        eventType={mockEventType}
        slot={mockSlot}
        owner={mockOwner}
        form={mockForm as any}
        isLoading={false}
      />
    );

    expect(screen.getByText('Встреча 30 мин')).toBeInTheDocument();
    expect(screen.getByText('Host')).toBeInTheDocument();
  });

  it('должен отображать форму с полями ввода', () => {
    render(
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
    render(
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
    render(
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
    render(
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
    render(
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
