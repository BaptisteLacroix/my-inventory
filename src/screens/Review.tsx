import { useInventory } from '../state/InventoryContext';
import { itemTitle, itemDetails } from '../lib/fields';
import { parsePrice, fmtEuro } from '../lib/price';
import { ItemThumb } from '../components/ItemThumb';

export function Review() {
  const { state, dispatch } = useInventory();
  const itemCount = state.rooms.reduce((n, r) => n + r.items.length, 0);
  const total = state.rooms.reduce(
    (sum, r) => sum + r.items.reduce((s, it) => s + parsePrice(it.fields.prix), 0),
    0,
  );

  const stat = (value: string | number, label: string) => (
    <div style={{ background: '#fffdf8', border: '1px solid #ece3d4', borderRadius: 16, padding: '18px 24px', flex: 1, minWidth: 150 }}>
      <div style={{ fontFamily: "'Lora',serif", fontSize: 32, fontWeight: 700, color: 'var(--accent)' }}>{value}</div>
      <div style={{ fontSize: 16, color: '#8a8073' }}>{label}</div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeUp .4s ease both', paddingBottom: 40 }}>
      <div style={{ fontFamily: "'Lora',serif", fontSize: 30, fontWeight: 700, marginBottom: 8 }}>
        Étape 3 · Aperçu
      </div>
      <p style={{ fontSize: 19, lineHeight: 1.55, color: '#5c5346', margin: '0 0 22px', maxWidth: 700 }}>
        Voici tout ce que vous avez rassemblé. Vérifiez tranquillement. Vous pouvez encore modifier ce que vous
        voulez.
      </p>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 26 }}>
        {stat(state.rooms.length, 'pièce(s)')}
        {stat(itemCount, 'objet(s)')}
        {stat(fmtEuro(total), 'valeur estimée')}
      </div>

      {state.rooms.map((room) => (
        <div key={room.id} style={{ marginBottom: 26 }}>
          <div
            style={{
              fontFamily: "'Lora',serif",
              fontSize: 22,
              fontWeight: 700,
              borderBottom: '2px solid #ece3d4',
              paddingBottom: 8,
              marginBottom: 14,
            }}
          >
            {room.name}{' '}
            <span style={{ fontSize: 16, color: '#a9927a', fontWeight: 600 }}>
              · {room.items.length || 'aucun'} objet{room.items.length > 1 ? 's' : ''}
            </span>
          </div>
          {room.items.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
              {room.items.map((item) => {
                const details = itemDetails(item);
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      background: '#fffdf8',
                      border: '1px solid #ece3d4',
                      borderRadius: 14,
                      padding: 12,
                    }}
                  >
                    <div style={{ width: 120, height: 120, borderRadius: 10, overflow: 'hidden', background: '#f0e9dc', flex: 'none' }}>
                      <ItemThumb photoFile={item.photoFile} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.2, marginBottom: 5 }}>
                        {itemTitle(item)}
                      </div>
                      {details.map((d) => (
                        <div key={d.label} style={{ fontSize: 13.5, lineHeight: 1.4 }}>
                          <span style={{ color: '#a9927a', fontWeight: 700 }}>{d.label} : </span>
                          <span style={{ color: '#3a342c' }}>{d.value}</span>
                        </div>
                      ))}
                      {details.length === 0 && (
                        <div style={{ fontSize: 13.5, color: '#b57d2e', fontStyle: 'italic' }}>
                          Aucune information ajoutée
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: '#a9927a', fontSize: 16, fontStyle: 'italic' }}>Aucun objet dans cette pièce.</div>
          )}
        </div>
      ))}

      <div
        style={{
          position: 'sticky',
          bottom: 0,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          background: 'linear-gradient(to top, #f6f0e7 60%, rgba(246,240,231,0))',
          padding: '16px 0',
          marginTop: 10,
        }}
      >
        <button
          onClick={() => dispatch({ type: 'GO_TO', screen: 'items' })}
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
          ← Modifier
        </button>
        <button
          onClick={() => dispatch({ type: 'GO_TO', screen: 'export' })}
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
          Passer au PDF →
        </button>
      </div>
    </div>
  );
}
