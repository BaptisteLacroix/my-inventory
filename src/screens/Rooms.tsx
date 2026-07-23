import { confirm } from '@tauri-apps/plugin-dialog';
import { useInventory } from '../state/InventoryContext';
import { SUGGESTED_ROOMS } from '../lib/fields';

const roomButtonBase: React.CSSProperties = {
  border: 'none',
  borderRadius: 12,
  padding: 13,
  fontSize: 17,
  fontWeight: 800,
  cursor: 'pointer',
};

export function Rooms({ onToast }: { onToast: (msg: string) => void }) {
  const { state, dispatch } = useInventory();
  const used = state.rooms.map((r) => r.name.toLowerCase());
  const suggestions = SUGGESTED_ROOMS.filter((n) => !used.includes(n.toLowerCase()));

  const addRoom = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (used.includes(trimmed.toLowerCase())) {
      onToast(`« ${trimmed} » existe déjà.`);
      dispatch({ type: 'SET_NEW_ROOM_NAME', name: '' });
      return;
    }
    dispatch({ type: 'ADD_ROOM', name: trimmed });
    onToast(`« ${trimmed} » ajoutée. Cliquez dessus pour l'ouvrir.`);
  };

  const removeRoom = async (roomId: string) => {
    const room = state.rooms.find((r) => r.id === roomId);
    if (!room) return;
    if (room.items.length > 0) {
      const ok = await confirm(`Retirer « ${room.name} » et ses ${room.items.length} objet(s) ?`, {
        title: 'Confirmer la suppression',
      });
      if (!ok) return;
    }
    dispatch({ type: 'REMOVE_ROOM', roomId });
  };

  return (
    <div style={{ animation: 'fadeUp .4s ease both', paddingBottom: 40 }}>
      <div style={{ fontFamily: "'Lora',serif", fontSize: 30, fontWeight: 700, marginBottom: 8 }}>
        Étape 1 · Vos pièces
      </div>
      <p style={{ fontSize: 19, lineHeight: 1.55, color: '#5c5346', margin: '0 0 18px', maxWidth: 680 }}>
        Créez une pièce pour chaque endroit de votre logement (salon, cuisine, chambre…).
      </p>

      <div
        style={{
          background: '#fdf6e9',
          border: '1px solid #f0e2c4',
          borderRadius: 14,
          padding: '16px 18px',
          marginBottom: 22,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: '#c98a3f',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            flex: 'none',
          }}
        >
          i
        </div>
        <div style={{ fontSize: 17, color: '#7a6642', lineHeight: 1.5 }}>
          Touchez une pièce ci-dessous, ou écrivez la vôtre. Elle s'ajoute à votre liste : cliquez ensuite dessus
          pour l'ouvrir.
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {suggestions.map((name) => (
          <button
            key={name}
            onClick={() => addRoom(name)}
            style={{
              background: '#fffdf8',
              border: '2px dashed #d9cdb8',
              borderRadius: 999,
              padding: '11px 20px',
              fontSize: 17,
              fontWeight: 700,
              color: '#5c5346',
              cursor: 'pointer',
            }}
          >
            + {name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
        <input
          value={state.newRoomName}
          onChange={(e) => dispatch({ type: 'SET_NEW_ROOM_NAME', name: e.target.value })}
          placeholder="Ou écrivez une pièce (ex : véranda)"
          style={{
            flex: 1,
            minWidth: 220,
            border: '2px solid #e6ddcf',
            borderRadius: 14,
            padding: '15px 18px',
            fontSize: 18,
            color: '#3a342c',
            background: '#fffdf8',
          }}
        />
        <button
          onClick={() => addRoom(state.newRoomName)}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '15px 26px',
            fontSize: 18,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Ajouter
        </button>
      </div>

      {state.rooms.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
            gap: 16,
            marginBottom: 30,
          }}
        >
          {state.rooms.map((room) => (
            <div
              key={room.id}
              style={{
                background: '#fffdf8',
                border: '1px solid #ece3d4',
                borderRadius: 18,
                padding: 20,
                boxShadow: '0 4px 14px rgba(46,40,32,.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ fontFamily: "'Lora',serif", fontSize: 23, fontWeight: 700 }}>{room.name}</div>
              <div style={{ fontSize: 16, color: '#8a8073' }}>
                {room.items.length || 'Aucun'} objet{room.items.length > 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button
                  onClick={() => dispatch({ type: 'OPEN_ROOM', roomId: room.id })}
                  style={{ ...roomButtonBase, flex: 1, background: 'var(--accent)', color: '#fff' }}
                >
                  Ouvrir cette pièce →
                </button>
                <button
                  onClick={() => removeRoom(room.id)}
                  style={{ ...roomButtonBase, background: '#fbf3ee', color: '#b4553f', padding: '13px 16px', fontSize: 16 }}
                >
                  Retirer
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: 34,
            border: '2px dashed #e0d6c4',
            borderRadius: 18,
            color: '#9a8f7d',
            fontSize: 18,
            marginBottom: 30,
          }}
        >
          Aucune pièce pour l'instant. Ajoutez-en une ci-dessus pour commencer.
        </div>
      )}

      <div
        style={{
          position: 'sticky',
          bottom: 0,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          background: 'linear-gradient(to top, #f6f0e7 60%, rgba(246,240,231,0))',
          padding: '14px 0 16px',
          marginTop: 6,
        }}
      >
        <button
          onClick={() => dispatch({ type: 'GO_TO', screen: 'welcome' })}
          style={{
            background: '#fffdf8',
            color: '#5c5346',
            border: '2px solid #e6ddcf',
            borderRadius: 14,
            padding: '14px 24px',
            fontSize: 17,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          ← Précédent
        </button>
        <button
          onClick={() => dispatch({ type: 'GO_TO', screen: 'review' })}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '14px 26px',
            fontSize: 17,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Voir l'aperçu →
        </button>
      </div>
    </div>
  );
}
