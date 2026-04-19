import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders as render } from '@/test/setup';
import { BookCatalogPage } from './BookCatalogPage';
import type { EventType } from '@entities/event-type';

// Мок для handleEventTypeClick
vi.mock('./model/model', () => ({
  handleEventTypeClick: vi.fn(),
}));

import { handleEventTypeClick } from './model/model';

describe('pages/book-catalog/BookCatalogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
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
    expect(screen.getByText('60 мин')).toBeInTheDocument();
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

    // Проверяем наличие индикатора загрузки (Mantine Loader)
    const spinner = document.querySelector('.mantine-Loader-root, [role="status"]');
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

    const cards = screen.getAllByTestId('event-type-card');
    fireEvent.click(cards[0]);

    expect(handleEventTypeClick).toHaveBeenCalledWith('1');
  });
});
