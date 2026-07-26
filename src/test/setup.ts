import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom doesn't implement window.scrollTo, and useLockBodyScroll calls it on unmount to restore
// the pre-modal scroll position - without a stub every such test logs a "not implemented" error.
window.scrollTo = (() => {}) as typeof window.scrollTo;

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
