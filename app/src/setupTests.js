import '@testing-library/jest-dom';
import { vi } from 'vitest';

if (!globalThis.fetch) {
  globalThis.fetch = vi.fn();
}

globalThis.matchMedia = globalThis.matchMedia || function() {
  return {
    matches: false,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  };
};
