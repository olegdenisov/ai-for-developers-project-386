import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomePage } from './HomePage';

// Мок для navigate
vi.mock('@app/router', () => ({
  navigate: {
    booking: vi.fn(),
  },
}));

import { navigate } from '@app/router';

describe('pages/home/HomePage', () => {
  it('должен отображать заголовок Calendar', () => {
    render(<HomePage eventTypes={[]} isLoading={false} />);

    expect(screen.getByText('Calendar')).toBeInTheDocument();
  });

  it('должен отображать описание приложения', () => {
    render(<HomePage eventTypes={[]} isLoading={false} />);

    expect(
      screen.getByText(/Забронируйте встречу за минуту/i)
    ).toBeInTheDocument();
  });

  it('должен отображать кнопку Записаться', () => {
    render(<HomePage eventTypes={[]} isLoading={false} />);

    const button = screen.getByText('Записаться');
    expect(button).toBeInTheDocument();
  });

  it('должен вызывать navigate.booking при клике на кнопку Записаться', () => {
    render(<HomePage eventTypes={[]} isLoading={false} />);

    const button = screen.getByText('Записаться');
    fireEvent.click(button);

    expect(navigate.booking).toHaveBeenCalledTimes(1);
  });

  it('должен отображать бейдж Быстрая запись на звонок', () => {
    render(<HomePage eventTypes={[]} isLoading={false} />);

    expect(screen.getByText(/Быстрая запись на звонок/i)).toBeInTheDocument();
  });

  it('должен отображать карточку возможностей', () => {
    render(<HomePage eventTypes={[]} isLoading={false} />);

    expect(screen.getByText('Возможности')).toBeInTheDocument();
    expect(
      screen.getByText(/Выбор типа события и удобного времени/i)
    ).toBeInTheDocument();
  });

  it('должен отображать ошибку если передана', () => {
    render(<HomePage eventTypes={[]} isLoading={false} error="Тестовая ошибка" />);

    expect(screen.getByText('Ошибка')).toBeInTheDocument();
    expect(screen.getByText('Тестовая ошибка')).toBeInTheDocument();
  });

  it('должен отображать список возможностей', () => {
    render(<HomePage eventTypes={[]} isLoading={false} />);

    // Проверяем что есть элементы списка
    expect(
      screen.getByText(/Быстрое бронирование с подтверждением/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Управление типами встреч/i)
    ).toBeInTheDocument();
  });
});
