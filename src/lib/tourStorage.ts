const PREFIX = 'inv_tour_seen_';

export function hasSeenTour(key: string): boolean {
  try {
    return localStorage.getItem(PREFIX + key) === '1';
  } catch {
    return false;
  }
}

export function markTourSeen(key: string): void {
  try {
    localStorage.setItem(PREFIX + key, '1');
  } catch {
    // Storage unavailable - the tour will just replay next time, which is harmless.
  }
}
