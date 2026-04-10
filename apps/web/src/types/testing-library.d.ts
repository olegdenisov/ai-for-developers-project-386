// Аугментация @testing-library/react — TypeScript не может разрешить реэкспорты
// из @testing-library/dom через pnpm phantom deps (pretty-format не установлен напрямую).
// Добавляем недостающие экспорты вручную.

export {};

declare module '@testing-library/react' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const screen: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const fireEvent: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function waitFor(callback: () => unknown, options?: unknown): Promise<any>;
}
