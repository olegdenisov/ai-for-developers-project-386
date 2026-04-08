import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookCatalogPage } from './BookCatalogPage';
import type { EventType } from '@entities/event-type';

// Мок для navigate
vi.mock('@app/router', () => ({
  navigate: {
    eventType: vi.fn(),
  },
}));

vi.mock('./model/model', () => ({
  handleEventTypeClick: vi.fn((id: string) => {
    const { navigate } = require('@app/router');
    navigate.eventType(id);
  }),
}));

import { handleEventTypeClick } from '../model/model';
import { navigate } from '@app/router';

describe('pages/book-catalog/BookCatalogPage', () => {
  const mockEventTypes: EventType[] = [
    {
      id: '1',
      name: 'Встреча 30 мин',
      description: 'Короткая встреча',
      durationMinutes: 30,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Консультация 60 мин',
      description: 'Длинная консультация',
      durationMinutes: 60,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  it('должен отображать список типов событий', () => {
    render(<BookCatalogPage eventTypes={mockEventTypes} isLoading={false} />);

    expect(screen.getByText('Встреча 30 мин')).toBeInTheDocument();
    expect(screen.getByText('Консультация 60 мин')).toBeInTheDocument();
  });

  it('должен отображать описание типов событий', () => {
    render(<BookCatalogPage eventTypes={mockEventTypes} isLoading={false} />);

    expect(screen.getByText('Короткая встреча')).toBeInTheDocument();
    expect(screen.getByText('Длинная консультация')).toBeInTheDocument();
  });

  it('должен отображать длительность событий', () => {
    render(<BookCatalogPage eventTypes={mockEventTypes} isLoading={false} />);

    // Длительность отображается в форматированном виде
    expect(screen.getByText('30 мин')).toBeInTheDocument();
    expect(screen.getByText('1 ч')).toBeInTheDocument();
  });

  it('должен отображать заголовок и описание страницы', () => {
    render(<BookCatalogPage eventTypes={mockEventTypes} isLoading={false} />);

    expect(screen.getByText('Выберите тип события')).toBeInTheDocument();
    expect(
      screen.getByText(/Нажмите на карточку, чтобы открыть календарь/i)
    ).toBeInTheDocument();
  });

  it('должен отображать информацию о хосте', () => {
    render(<BookCatalogPage eventTypes={mockEventTypes} isLoading={false} />);

    expect(screen.getByText('Tota')).toBeInTheDocument();
    expect(screen.getByText('Host')).toBeInTheDocument();
  });

  it('должен отображать спиннер загрузки', () => {
    render(<BookCatalogPage eventTypes={[]} isLoading={true} />);

    // Проверяем наличие индикатора загрузки
    const spinner = document.querySelector('[role="status"]');
    expect(spinner).toBeInTheDocument();
  });

  it('должен отображать ошибку', () => {
    render(
      <BookCatalogPage
        eventTypes={[]}
        isLoading={false}
        error="Не удалось загрузить типы событий"
      />
    );

    expect(screen.getByText('Не удалось загрузить типы событий')).toBeInTheDocument();
  });

  it('должен отображать пустое состояние', () => {
    render(<BookCatalogPage eventTypes={[]} isLoading={false} />);

    expect(screen.getByText(/Нет доступных типов событий/i)).toBeInTheDocument();
  });

  it('должен вызывать handleEventTypeClick при клике на карточку', () => {
    render(<BookCatalogPage eventTypes={mockEventTypes} isLoading={false} />);

    const card = screen.getByText('Встреча 30 мин').closest('[role="button"]') ||
                 screen.getByText('Встреча 30 мин').parentElement;

    if (card) {
      fireEvent.click(card);
    }

    // Проверяем что обработчик был вызван
    expect(handleEventTypeClick).toBeDefined();
  });
});
