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
globalThis.matchMedia =
  globalThis.matchMedia ||
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
globalThis.ResizeObserver =
  globalThis.ResizeObserver ||
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

// Мок для IntersectionObserver
globalThis.IntersectionObserver =
  globalThis.IntersectionObserver ||
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
