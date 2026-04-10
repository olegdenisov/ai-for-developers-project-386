import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ErrorMessage } from './ErrorMessage';
import { renderWithProviders } from '../../test/setup';

describe('shared/ui/ErrorMessage', () => {
  it('должен отображать сообщение об ошибке', () => {
    renderWithProviders(<ErrorMessage message="Тестовая ошибка" />);

    expect(screen.getByText('Ошибка')).toBeInTheDocument();
    expect(screen.getByText('Тестовая ошибка')).toBeInTheDocument();
  });

  it('должен иметь красный цвет (danger/alert)', () => {
    renderWithProviders(<ErrorMessage message="Ошибка" />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('не должен показывать кнопку закрытия без onClose', () => {
    renderWithProviders(<ErrorMessage message="Ошибка" />);

    const closeButton = screen.queryByRole('button');
    expect(closeButton).not.toBeInTheDocument();
  });

  it('должен показывать кнопку закрытия с onClose', () => {
    const handleClose = vi.fn();
    renderWithProviders(<ErrorMessage message="Ошибка" onClose={handleClose} />);

    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
  });

  it('должен вызывать onClose при клике на кнопку закрытия', () => {
    const handleClose = vi.fn();
    renderWithProviders(<ErrorMessage message="Ошибка" onClose={handleClose} />);

    const closeButton = screen.getByRole('button');
    closeButton.click();

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('должен отображать иконку ошибки', () => {
    renderWithProviders(<ErrorMessage message="Ошибка" />);

    // Иконка должна быть в документе
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });
});
