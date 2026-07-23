import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react';
import { reducer } from './reducer';
import { initialState, type Action, type AppState } from './actions';
import { loadManifest, saveManifest } from '../lib/inventoryFile';

const SAVE_DEBOUNCE_MS = 500;

interface InventoryContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRooms = useRef(state.rooms);
  latestRooms.current = state.rooms;

  useEffect(() => {
    loadManifest().then((manifest) => dispatch({ type: 'LOAD_MANIFEST', manifest }));
  }, []);

  useEffect(() => {
    if (!state.loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveManifest({ version: 1, rooms: latestRooms.current });
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.rooms, state.loaded]);

  useEffect(() => {
    const flush = () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveManifest({ version: 1, rooms: latestRooms.current });
      }
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, []);

  return <InventoryContext.Provider value={{ state, dispatch }}>{children}</InventoryContext.Provider>;
}

export function useInventory(): InventoryContextValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
}
