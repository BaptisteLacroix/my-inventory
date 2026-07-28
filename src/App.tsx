import { useCallback, useRef, useState } from 'react';
import { confirm } from '@tauri-apps/plugin-dialog';
import { useInventory } from './state/InventoryContext';
import { useWiki } from './state/WikiContext';
import { StepTimeline } from './components/StepTimeline';
import { Toast } from './components/Toast';
import { Welcome } from './screens/Welcome';
import { Rooms } from './screens/Rooms';
import { Items } from './screens/Items';
import { Review } from './screens/Review';
import { Export } from './screens/Export';
import { UpdateChecker } from './components/UpdateChecker';
import { clearInventoryImages } from './lib/inventoryFile';
import type { Screen } from './state/types';

function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((msg: string) => {
    setMessage(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2600);
  }, []);
  return { message, show };
}

function App() {
  const { state, dispatch } = useInventory();
  const { message, show } = useToast();
  const { openWiki } = useWiki();
  const [updateCheckSignal, setUpdateCheckSignal] = useState(0);

  function navigate(screen: Screen) {
    if (screen === 'items' && !state.currentRoomId) {
      dispatch({ type: 'GO_TO', screen: 'rooms' });
      return;
    }
    dispatch({ type: 'GO_TO', screen });
  }

  async function resetAll() {
    const ok = await confirm("Effacer tout l'inventaire et recommencer à zéro ?", { title: 'Confirmer' });
    if (!ok) return;
    await clearInventoryImages();
    dispatch({ type: 'RESET_ALL' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', color: '#3a342c' }}>
      <div style={{ width: '100%', maxWidth: 1600, margin: '0 auto', padding: '20px 32px 0', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontFamily: "'Lora',serif",
                fontWeight: 700,
                fontSize: 22,
              }}
            >
              M
            </div>
            <div style={{ fontFamily: "'Lora',serif", fontSize: 22, fontWeight: 700, lineHeight: 1 }}>My Inventory</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => openWiki()}
              style={{
                background: '#fffdf8',
                color: 'var(--accent)',
                border: '2px solid var(--accent)',
                borderRadius: 12,
                padding: '9px 16px',
                fontSize: 16,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                }}
              >
                ?
              </span>
              Aide
            </button>
            <button
              onClick={() => setUpdateCheckSignal((n) => n + 1)}
              style={{ background: 'transparent', color: '#5c5346', border: 'none', borderRadius: 12, padding: '10px 10px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              Vérifier les mises à jour
            </button>
            <button
              onClick={resetAll}
              style={{ background: 'transparent', color: '#a9927a', border: 'none', borderRadius: 12, padding: '10px 8px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              Recommencer
            </button>
          </div>
        </div>

        <StepTimeline screen={state.screen} onNavigate={navigate} />
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: 1600,
          margin: '0 auto',
          padding: '0 32px 32px',
          boxSizing: 'border-box',
        }}
      >
        {state.screen === 'welcome' && <Welcome onStart={() => dispatch({ type: 'GO_TO', screen: 'rooms' })} />}
        {state.screen === 'rooms' && <Rooms onToast={show} />}
        {state.screen === 'items' && <Items onToast={show} />}
        {state.screen === 'review' && <Review />}
        {state.screen === 'export' && <Export onToast={show} />}
      </div>

      <Toast message={message} />
      <UpdateChecker onToast={show} manualCheckSignal={updateCheckSignal} />
    </div>
  );
}

export default App;
