import type { Screen } from '../state/types';
import content from '../data/wiki.json';

// The wiki text lives in ../data/wiki.json so it can be edited without touching code.
// This module just gives it types and resolves the media paths.

/** A single numbered explanation line inside a screen guide. */
export interface WikiBlock {
  h: string;
  t: string;
  /** Optional image filename in public/assets/wiki/, shown under this step. */
  image?: string;
  /** Optional video filename in public/assets/wiki/, shown under this step. */
  video?: string;
  /** Optional small caption shown beneath this step's image/video. */
  caption?: string;
}

/** A per-screen guide section shown in the wiki. */
export interface WikiScreen {
  id: string;
  nav: string;
  kicker: string;
  title: string;
  icon: string;
  /** Screenshot filename in public/assets/wiki/. Defaults to `screen-<id>.png`. */
  image?: string;
  /** Video filename in public/assets/wiki/. Defaults to `video-<id>.mp4`. */
  video?: string;
  /** Show the "replay tour" button. Defaults to true when `id` is a real app screen. */
  showReplayTour?: boolean;
  blocks: WikiBlock[];
  tip: string;
}

/** A question/answer pair (used for FAQ and troubleshooting). */
export interface WikiQA {
  q: string;
  a: string;
}

/** A step in the overall walkthrough. */
export interface WikiStep {
  h: string;
  t: string;
}

interface WikiContent {
  screens: WikiScreen[];
  steps: WikiStep[];
  faq: WikiQA[];
  trouble: WikiQA[];
}

/** Fixed, non-screen sections that always appear at the bottom of the nav. */
export type WikiExtraSection = 'steps' | 'faq' | 'trouble';

/** Which section id is selected: a screen id from the JSON, or a fixed extra section. */
export type WikiSelection = string;

const data = content as WikiContent;

export const WIKI_SCREENS: WikiScreen[] = data.screens;
export const WIKI_STEPS: WikiStep[] = data.steps;
export const WIKI_FAQ: WikiQA[] = data.faq;
export const WIKI_TROUBLE: WikiQA[] = data.trouble;

/** App screens whose guided tour can be replayed from the wiki. */
const REPLAYABLE_SCREENS: Screen[] = ['welcome', 'rooms', 'items', 'review', 'export'];

const WIKI_MEDIA_BASE = '/assets/wiki/';

/** Resolved screenshot URL for a screen guide. Drop the file in `public/assets/wiki/`. */
export const wikiShot = (screen: WikiScreen) => WIKI_MEDIA_BASE + (screen.image ?? `screen-${screen.id}.png`);

/** Resolved demo-video URL for a screen guide. Drop the file in `public/assets/wiki/`. */
export const wikiVideo = (screen: WikiScreen) => WIKI_MEDIA_BASE + (screen.video ?? `video-${screen.id}.mp4`);

/** Resolve a bare media filename (e.g. a step's image) to its URL under public/assets/wiki/. */
export const wikiAsset = (filename: string) => WIKI_MEDIA_BASE + filename;

/** The app screen this wiki id maps to (for replaying its tour), or null if it isn't one. */
export function replayableScreen(id: string): Screen | null {
  return (REPLAYABLE_SCREENS as string[]).includes(id) ? (id as Screen) : null;
}

/** Whether a screen guide should show its "replay tour" button. */
export function canReplayTour(screen: WikiScreen): boolean {
  return screen.showReplayTour !== false && replayableScreen(screen.id) !== null;
}

/** Find a screen guide by its id. */
export function findWikiScreen(id: string): WikiScreen | undefined {
  return WIKI_SCREENS.find((s) => s.id === id);
}
