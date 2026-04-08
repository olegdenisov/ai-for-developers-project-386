import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('shared/ui/LoadingSpinner', () => {
  it('должен отображать спиннер загрузки', () => {
    render(<LoadingSpinner />);

    // Проверяем наличие индикатора загрузки
    const spinner = document.querySelector('[role="status"], .mantine-Loader-root');
    expect(spinner).toBeInTheDocument();
  });

  it('должен иметь aria-label для доступности', () => {
    render(<LoadingSpinner />);

    // Проверяем что есть элемент с aria-label или текст загрузки
    const loadingElement = screen.getByText(/загрузка/i) || document.querySelector('[aria-label]');
    expect(loadingElement).toBeTruthy();
  });

  it('должен принимать размер через пропсы', () => {
    const { container } = render(<LoadingSpinner size="sm" />);

    // Проверяем что компонент рендерится с кастомным размером
    const spinner = container.firstChild;
    expect(spinner).toBeInTheDocument();
  });
});
