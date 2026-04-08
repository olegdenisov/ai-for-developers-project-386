import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventTypePage } from './EventTypePage';
import type { EventType } from '@entities/event-type';
import type { Owner } from '@entities/owner';

describe('pages/event-type/EventTypePage', () => {
  const mockEventType: EventType = {
    id: 'event-1',
    name: 'Встреча 30 мин',
    description: 'Короткая встреча для обсуждения',
    durationMinutes: 30,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockOwner: Owner = {
    id: 'owner-1',
    name: 'Host',
    email: 'host@example.com',
    isPredefined: true,
    createdAt: '2024-01-01T00:00:00Z',
  };

  it('должен отображать информацию о владельце', () => {
    render(<EventTypePage eventType={mockEventType} owner={mockOwner} isLoading={false} />);

    expect(screen.getByText('Host')).toBeInTheDocument();
  });

  it('должен отображать название события', () => {
    render(<EventTypePage eventType={mockEventType} owner={mockOwner} isLoading={false} />);

    expect(screen.getByText('Встреча 30 мин')).toBeInTheDocument();
  });

  it('должен отображать длительность события', () => {
    render(<EventTypePage eventType={mockEventType} owner={mockOwner} isLoading={false} />);

    expect(screen.getByText(/30 мин/i)).toBeInTheDocument();
  });

  it('должен отображать описание события', () => {
    render(<EventTypePage eventType={mockEventType} owner={mockOwner} isLoading={false} />);

    expect(screen.getByText('Короткая встреча для обсуждения')).toBeInTheDocument();
  });

  it('должен отображать календарь', () => {
    render(<EventTypePage eventType={mockEventType} owner={mockOwner} isLoading={false} />);

    expect(screen.getByText('Календарь')).toBeInTheDocument();
  });

  it('должен отображать кнопку Назад', () => {
    render(<EventTypePage eventType={mockEventType} owner={mockOwner} isLoading={false} />);

    const backButtons = screen.getAllByText('Назад');
    expect(backButtons.length).toBeGreaterThan(0);
  });

  it('должен отображать статус выбранной даты', () => {
    render(<EventTypePage eventType={mockEventType} owner={mockOwner} isLoading={false} />);

    expect(screen.getByText('Выбранная дата')).toBeInTheDocument();
  });

  it('должен отображать статус выбранного времени', () => {
    render(<EventTypePage eventType={mockEventType} owner={mockOwner} isLoading={false} />);

    expect(screen.getByText('Выбранное время')).toBeInTheDocument();
  });

  it('должен отображать спиннер загрузки', () => {
    render(<EventTypePage isLoading={true} />);

    const spinner = document.querySelector('[role="status"]');
    expect(spinner).toBeInTheDocument();
  });

  it('должен отображать ошибку', () => {
    render(<EventTypePage isLoading={false} error="Тип события не найден" />);

    expect(screen.getByText('Тип события не найден')).toBeInTheDocument();
  });

  it('должен отображать сообщение когда тип события не найден', () => {
    render(<EventTypePage isLoading={false} />);

    expect(screen.getByText(/Тип события не найден/i)).toBeInTheDocument();
  });

  it('должен отображать заголовок Статус слотов', () => {
    render(<EventTypePage eventType={mockEventType} owner={mockOwner} isLoading={false} />);

    expect(screen.getByText('Статус слотов')).toBeInTheDocument();
  });

  it('должен отображать сообщение о выборе даты', () => {
    render(<EventTypePage eventType={mockEventType} owner={mockOwner} isLoading={false} />);

    expect(screen.getByText(/Выберите дату для просмотра доступных слотов/i)).toBeInTheDocument();
  });

  it('должен отображать кнопки навигации по месяцам', () => {
    render(<EventTypePage eventType={mockEventType} owner={mockOwner} isLoading={false} />);

    // Проверяем наличие кнопок навигации (обычно это стрелки или иконки)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
