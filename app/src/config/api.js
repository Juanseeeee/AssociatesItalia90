// Centralized API configuration
// This ensures that we only need to change the API URL logic in one place.

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

// You can add other environment-dependent configurations here
export const IS_PRODUCTION = import.meta.env.PROD;
