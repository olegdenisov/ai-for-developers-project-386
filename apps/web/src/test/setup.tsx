import '@testing-library/jest-dom';
import { cleanup, render as rtlRender } from '@testing-library/react';
import { afterEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import React from 'react';

// Очищаем DOM после каждого теста
afterEach(() => {
  cleanup();
});

// Мок для window.matchMedia
global.matchMedia =
  global.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () {
        return true;
      },
    };
  };

// Мок для ResizeObserver
global.ResizeObserver =
  global.ResizeObserver ||
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

// Мок для IntersectionObserver
global.IntersectionObserver =
  global.IntersectionObserver ||
  class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  };

// Хелпер для рендеринга с MantineProvider
export function renderWithProviders(ui: React.ReactElement) {
  return rtlRender(
    <MantineProvider>
      {ui}
    </MantineProvider>
  );
}
