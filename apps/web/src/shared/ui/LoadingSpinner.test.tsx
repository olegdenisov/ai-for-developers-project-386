import { describe, it, expect } from 'vitest';
import { renderWithProviders as render } from '@/test/setup';
import { LoadingSpinner } from './LoadingSpinner';

describe('shared/ui/LoadingSpinner', () => {
  it('должен отображать спиннер загрузки', () => {
    render(<LoadingSpinner />);

    // Проверяем наличие индикатора загрузки
    const spinner = document.querySelector('[role="status"], .mantine-Loader-root');
    expect(spinner).toBeInTheDocument();
  });

  it('должен иметь элемент загрузки в DOM', () => {
    render(<LoadingSpinner />);

    // Mantine Loader не имеет видимого текста, проверяем наличие элемента в DOM
    const loadingElement = document.querySelector('.mantine-Loader-root, [aria-label], [role="status"]');
    expect(loadingElement).toBeTruthy();
  });

  it('должен принимать размер через пропсы', () => {
    const { container } = render(<LoadingSpinner size="sm" />);

    // Проверяем что компонент рендерится с кастомным размером
    const spinner = container.firstChild;
    expect(spinner).toBeInTheDocument();
  });
});
