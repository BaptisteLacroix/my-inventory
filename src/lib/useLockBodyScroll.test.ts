import { describe, it, expect, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLockBodyScroll } from './useLockBodyScroll';

describe('useLockBodyScroll', () => {
  afterEach(() => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
  });

  it('pins the body at the current scroll offset while mounted', () => {
    Object.defineProperty(window, 'scrollY', { value: 240, configurable: true });
    window.scrollTo = (() => {}) as typeof window.scrollTo;
    const { unmount } = renderHook(() => useLockBodyScroll());

    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-240px');
    expect(document.body.style.width).toBe('100%');
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
  });

  it('restores the previous body styles and scroll position on unmount', () => {
    document.body.style.position = 'static';
    document.body.style.top = '10px';
    document.body.style.width = '80%';
    document.body.style.overflow = 'visible';
    Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });

    let scrollToCalledWith: unknown[] | null = null;
    window.scrollTo = ((...args: unknown[]) => {
      scrollToCalledWith = args;
    }) as typeof window.scrollTo;

    const { unmount } = renderHook(() => useLockBodyScroll());
    unmount();

    expect(document.body.style.position).toBe('static');
    expect(document.body.style.top).toBe('10px');
    expect(document.body.style.width).toBe('80%');
    expect(document.body.style.overflow).toBe('visible');
    expect(scrollToCalledWith).toEqual([0, 100]);
  });
});
