export const API_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || '/api')
  : (import.meta.env.VITE_API_URL || 'http://localhost:3003/api');
export const IS_PRODUCTION = import.meta.env.PROD;
