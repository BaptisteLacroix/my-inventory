import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useInventory } from './InventoryContext';
import { useTour } from './TourContext';
import { HelpFab } from '../components/HelpFab';
import { WikiPanel } from '../components/WikiPanel';
import { WIKI_SCREENS, findWikiScreen, replayableScreen, type WikiSelection } from '../lib/wiki';
import type { Screen } from './types';

interface WikiContextValue {
  /** Open the wiki. Pass a section id to jump to it; defaults to the current screen. */
  openWiki: (selection?: WikiSelection) => void;
}

const WikiContext = createContext<WikiContextValue | null>(null);

/** The wiki section to show for a given app screen: its own guide, or the first one. */
function defaultSelection(screen: Screen): WikiSelection {
  return findWikiScreen(screen)?.id ?? WIKI_SCREENS[0]?.id ?? 'welcome';
}

export function WikiProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useInventory();
  const { startScreenTour } = useTour();
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<WikiSelection>('welcome');

  const openWiki = useCallback(
    (sel?: WikiSelection) => {
      setSelection(sel ?? defaultSelection(state.screen));
      setOpen(true);
    },
    [state.screen],
  );

  const closeWiki = useCallback(() => setOpen(false), []);

  const replayTour = useCallback(
    (screenId: string) => {
      const screen = replayableScreen(screenId);
      if (!screen) return;
      setOpen(false);
      // 'items' needs a current room for its tour targets to exist; fall back to 'rooms'.
      const target: Screen = screen === 'items' && !state.currentRoomId ? 'rooms' : screen;
      if (state.screen !== target) dispatch({ type: 'GO_TO', screen: target });
      // Let the target screen mount before measuring the tour highlight.
      window.setTimeout(() => startScreenTour(target, true), 500);
    },
    [state.screen, state.currentRoomId, dispatch, startScreenTour],
  );

  return (
    <WikiContext.Provider value={{ openWiki }}>
      {children}
      {!open && <HelpFab onClick={() => openWiki()} />}
      {open && (
        <WikiPanel selection={selection} onSelect={setSelection} onClose={closeWiki} onReplayTour={replayTour} />
      )}
    </WikiContext.Provider>
  );
}

export function useWiki(): WikiContextValue {
  const ctx = useContext(WikiContext);
  if (!ctx) throw new Error('useWiki must be used within WikiProvider');
  return ctx;
}
