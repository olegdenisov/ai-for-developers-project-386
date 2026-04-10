// Environment configuration
export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  NODE_ENV: import.meta.env.MODE || 'development',
  IS_DEV: import.meta.env.DEV || false,
  IS_PROD: import.meta.env.PROD || false,
} as const;
