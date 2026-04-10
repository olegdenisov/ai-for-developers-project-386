import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders as render } from '@/test/setup';
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
    render(<HomePage />);

    expect(screen.getAllByText('Calendar').length).toBeGreaterThan(0);
  });

  it('должен отображать описание приложения', () => {
    render(<HomePage />);

    expect(
      screen.getByText(/Забронируйте встречу за минуту/i)
    ).toBeInTheDocument();
  });

  it('должен отображать кнопку Записаться', () => {
    render(<HomePage />);

    expect(screen.getAllByText('Записаться').length).toBeGreaterThan(0);
  });

  it('должен вызывать navigate.booking при клике на кнопку Записаться', () => {
    render(<HomePage />);

    const button = screen.getAllByText('Записаться')[0];
    fireEvent.click(button);

    expect(navigate.booking).toHaveBeenCalledTimes(1);
  });

  it('должен отображать бейдж Быстрая запись на звонок', () => {
    render(<HomePage />);

    expect(screen.getByText(/Быстрая запись на звонок/i)).toBeInTheDocument();
  });

  it('должен отображать карточку возможностей', () => {
    render(<HomePage />);

    expect(screen.getByText('Возможности')).toBeInTheDocument();
    expect(
      screen.getByText(/Выбор типа события и удобного времени/i)
    ).toBeInTheDocument();
  });

  it('должен отображать список возможностей', () => {
    render(<HomePage />);

    expect(
      screen.getByText(/Быстрое бронирование с подтверждением/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Управление типами встреч/i)
    ).toBeInTheDocument();
  });
});
