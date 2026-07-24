import { describe, it, expect, vi, afterEach } from 'vitest';
import { hasSeenTour, markTourSeen } from './tourStorage';

describe('tourStorage', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('reports a tour as unseen before it is marked', () => {
    expect(hasSeenTour('welcome')).toBe(false);
  });

  it('reports a tour as seen once marked', () => {
    markTourSeen('welcome');
    expect(hasSeenTour('welcome')).toBe(true);
  });

  it('namespaces keys so unrelated tours do not collide', () => {
    markTourSeen('welcome');
    expect(hasSeenTour('rooms')).toBe(false);
  });

  it('writes under the inv_tour_seen_ prefix', () => {
    markTourSeen('form');
    expect(window.localStorage.getItem('inv_tour_seen_form')).toBe('1');
  });

  it('hasSeenTour swallows a throwing localStorage and returns false', () => {
    vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(hasSeenTour('welcome')).toBe(false);
  });

  it('markTourSeen swallows a throwing localStorage without raising', () => {
    vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => markTourSeen('welcome')).not.toThrow();
  });
});
