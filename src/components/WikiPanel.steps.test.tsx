import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// A synthetic screen with per-step media, so these tests are independent of the
// editable content in src/data/wiki.json.
const synthScreen = {
  id: 'demo',
  nav: 'Démo',
  kicker: 'Démonstration',
  title: 'Démo',
  icon: '📸',
  tip: 'astuce',
  blocks: [
    { h: 'Étape une', t: 'texte un', image: 'demo-1.png', caption: 'légende un' },
    { h: 'Étape deux', t: 'texte deux' },
    { h: 'Étape trois', t: 'texte trois', video: 'demo-3.mp4' },
  ],
};

vi.mock('../lib/wiki', () => ({
  WIKI_SCREENS: [synthScreen],
  WIKI_STEPS: [],
  WIKI_FAQ: [],
  WIKI_TROUBLE: [],
  wikiShot: () => '/assets/wiki/screen-demo.png',
  wikiVideo: () => '/assets/wiki/video-demo.mp4',
  wikiAsset: (name: string) => '/assets/wiki/' + name,
  canReplayTour: () => false,
  findWikiScreen: (id: string) => (id === 'demo' ? synthScreen : undefined),
}));

const { WikiPanel } = await import('./WikiPanel');

function setup() {
  render(<WikiPanel selection="demo" onSelect={() => {}} onClose={() => {}} onReplayTour={() => {}} />);
}

describe('WikiPanel step media', () => {
  it('renders an image under a step that has one, using the step title as alt', () => {
    setup();
    expect(screen.getByAltText('Étape une')).toHaveAttribute('src', '/assets/wiki/demo-1.png');
  });

  it('shows the caption of a step image', () => {
    setup();
    expect(screen.getByText('légende un')).toBeInTheDocument();
  });

  it('renders no image for a step without one', () => {
    setup();
    expect(screen.queryByAltText('Étape deux')).not.toBeInTheDocument();
  });

  it('falls back to a placeholder when a step image fails to load', () => {
    setup();
    fireEvent.error(screen.getByAltText('Étape une'));
    expect(screen.getByText('Image à venir')).toBeInTheDocument();
  });

  it('renders a video for a step that has one', () => {
    setup();
    expect(document.querySelector('video[src="/assets/wiki/demo-3.mp4"]')).not.toBeNull();
  });
});
