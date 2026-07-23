import { useEffect } from 'react';

/**
 * Prevents the page behind a full-screen modal from scrolling while the modal is open.
 *
 * Just setting `overflow: hidden` on the body isn't enough here: if the page was scrolled down
 * (e.g. looking at the last photo added), a `position: fixed` overlay still renders relative to
 * that scrolled document, not the visual viewport, so the modal opens off-screen below the fold.
 * Pinning the body at its current scroll offset via negative `top` (and restoring scrollY on
 * close) keeps the fixed overlay aligned with what's actually visible on screen.
 */
export function useLockBodyScroll() {
  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body.style;
    const previous = { position: body.position, top: body.top, width: body.width, overflow: body.overflow };

    body.position = 'fixed';
    body.top = `-${scrollY}px`;
    body.width = '100%';
    body.overflow = 'hidden';

    return () => {
      body.position = previous.position;
      body.top = previous.top;
      body.width = previous.width;
      body.overflow = previous.overflow;
      window.scrollTo(0, scrollY);
    };
  }, []);
}
