import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { confirm } from '@tauri-apps/plugin-dialog';
import type { Item, ItemFields } from '../state/types';
import { ItemThumb } from './ItemThumb';
import { useLockBodyScroll } from '../lib/useLockBodyScroll';
import { useTour } from '../state/TourContext';

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '2px solid #e6ddcf',
  borderRadius: 12,
  padding: '13px 15px',
  fontSize: 18,
  background: '#fff',
};

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 16, fontWeight: 800, marginBottom: 5 };

interface ItemFormModalProps {
  item: Item;
  onSave: (fields: ItemFields) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function ItemFormModal({ item, onSave, onCancel, onDelete }: ItemFormModalProps) {
  useLockBodyScroll();
  const [draft, setDraft] = useState<ItemFields>(item.fields);
  const { startFormTour } = useTour();

  useEffect(() => {
    startFormTour();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key: keyof ItemFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  async function handleDelete() {
    const ok = await confirm('Supprimer cet objet ?', { title: 'Confirmer la suppression' });
    if (ok) onDelete();
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        background: 'rgba(46,40,32,.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 24,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          background: '#fffdf8',
          borderRadius: 20,
          width: 'min(660px,96vw)',
          padding: 26,
          boxShadow: '0 24px 70px rgba(46,40,32,.4)',
          animation: 'fadeUp .3s ease both',
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
          <div style={{ width: 90, height: 90, borderRadius: 12, overflow: 'hidden', background: '#f0e9dc', flex: 'none' }}>
            <ItemThumb photoFile={item.photoFile} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Lora',serif", fontSize: 24, fontWeight: 700 }}>Décrivez votre objet</div>
            <div style={{ fontSize: 16, color: '#8a8073', lineHeight: 1.4 }}>
              Remplissez seulement ce que vous savez. Le reste peut rester vide.
            </div>
          </div>
          <button
            onClick={() => startFormTour(true)}
            style={{
              flex: 'none',
              alignSelf: 'flex-start',
              background: '#f3fbf8',
              color: 'var(--accent)',
              border: '2px solid var(--accent)',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            ? Aide
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div id="tour-form-name">
            <label style={labelStyle}>Nom de l'objet</label>
            <input
              value={draft.nom ?? ''}
              onChange={set('nom')}
              placeholder="Ex : Canapé en cuir marron"
              style={inputStyle}
            />
          </div>
          <div id="tour-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Prix d'achat</label>
              <input value={draft.prix ?? ''} onChange={set('prix')} placeholder="Ex : 850 €" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date d'achat</label>
              <input value={draft.date ?? ''} onChange={set('date')} placeholder="Ex : mars 2018" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Lieu d'achat</label>
              <input
                value={draft.lieu ?? ''}
                onChange={set('lieu')}
                placeholder="Ex : Conforama, Lyon"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Dimensions</label>
              <input
                value={draft.dimensions ?? ''}
                onChange={set('dimensions')}
                placeholder="Ex : 200 x 90 x 85 cm"
                style={inputStyle}
              />
            </div>
          </div>
          <div id="tour-form-serie">
            <label style={labelStyle}>Numéro de série / référence</label>
            <input
              value={draft.serie ?? ''}
              onChange={set('serie')}
              placeholder="Ex : SN-48213 (souvent au dos de l'objet)"
              style={inputStyle}
            />
          </div>
          <div id="tour-form-note">
            <label style={labelStyle}>Autres informations</label>
            <textarea
              value={draft.note ?? ''}
              onChange={set('note')}
              placeholder="Écrivez librement tout ce que vous voulez ajouter : état, couleur, souvenir, cadeau…"
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>
        </div>

        <div id="tour-form-save" style={{ display: 'flex', gap: 10, marginTop: 22, alignItems: 'center' }}>
          <button
            onClick={handleDelete}
            style={{
              background: '#fbf3ee',
              color: '#b4553f',
              border: 'none',
              borderRadius: 12,
              padding: '14px 18px',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Supprimer
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={onCancel}
            style={{
              background: '#fffdf8',
              color: '#5c5346',
              border: '2px solid #e6ddcf',
              borderRadius: 12,
              padding: '14px 22px',
              fontSize: 17,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(draft)}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '14px 26px',
              fontSize: 17,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
