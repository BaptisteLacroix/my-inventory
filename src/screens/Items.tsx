import { useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useInventory } from '../state/InventoryContext';
import { useTour } from '../state/TourContext';
import { readAndDownscaleImage, listImagesInFolder } from '../lib/image';
import { writeItemImage, deleteItemImage } from '../lib/inventoryFile';
import { itemTitle, itemDetails, itemNeedsInfo } from '../lib/fields';
import { ItemCard } from '../components/ItemCard';
import { ItemFormModal } from '../components/ItemFormModal';
import type { ItemFields } from '../state/types';

export function Items({ onToast }: { onToast: (msg: string) => void }) {
  const { state, dispatch } = useInventory();
  const { startScreenTour } = useTour();
  const [importing, setImporting] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const room = state.rooms.find((r) => r.id === state.currentRoomId) ?? null;
  const editingItem = room?.items.find((it) => it.id === editingItemId) ?? null;

  useEffect(() => {
    if (!room) dispatch({ type: 'GO_TO', screen: 'rooms' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  useEffect(() => {
    startScreenTour('items');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!room) return null;

  async function importPaths(paths: string[]) {
    if (!paths.length || !room) return;
    setImporting(true);
    onToast('Ajout des photos en cours…');
    try {
      const newItems: { id: string; photoFile: string }[] = [];
      for (const path of paths) {
        try {
          const jpegBytes = await readAndDownscaleImage(path);
          const id = crypto.randomUUID();
          const photoFile = await writeItemImage(id, jpegBytes);
          newItems.push({ id, photoFile });
        } catch (err) {
          console.error('Échec import photo', path, err);
        }
      }
      if (newItems.length) {
        dispatch({ type: 'ADD_ITEMS', roomId: room.id, items: newItems });
        onToast(`${newItems.length} photo${newItems.length > 1 ? 's' : ''} ajoutée${newItems.length > 1 ? 's' : ''} !`);
      } else {
        onToast("Aucune image n'a pu être ajoutée.");
      }
    } finally {
      setImporting(false);
    }
  }

  async function onPickFiles() {
    const selected = await open({
      multiple: true,
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
    });
    if (!selected) return;
    const paths = Array.isArray(selected) ? selected : [selected];
    await importPaths(paths);
  }

  async function onPickFolder() {
    const folder = await open({ directory: true });
    if (!folder || Array.isArray(folder)) return;
    const paths = await listImagesInFolder(folder);
    if (!paths.length) {
      onToast('Aucune image trouvée dans ce dossier.');
      return;
    }
    await importPaths(paths);
  }

  async function onDeleteItem(itemId: string) {
    const item = room!.items.find((it) => it.id === itemId);
    dispatch({ type: 'DELETE_ITEM', roomId: room!.id, itemId });
    if (item?.photoFile) await deleteItemImage(item.photoFile);
  }

  function onSaveFields(fields: ItemFields) {
    if (!room || !editingItemId) return;
    dispatch({ type: 'SET_ITEM_FIELDS', roomId: room.id, itemId: editingItemId, fields });
    setEditingItemId(null);
    onToast('Informations enregistrées.');
  }

  async function onDeleteEditingItem() {
    if (!editingItemId) return;
    await onDeleteItem(editingItemId);
    setEditingItemId(null);
  }

  return (
    <div style={{ animation: 'fadeUp .4s ease both', paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ fontFamily: "'Lora',serif", fontSize: 30, fontWeight: 700 }}>Étape 2 · {room.name}</div>
        <button
          onClick={() => dispatch({ type: 'GO_TO', screen: 'rooms' })}
          style={{
            background: '#fffdf8',
            color: '#5c5346',
            border: '2px solid #e6ddcf',
            borderRadius: 11,
            padding: '9px 16px',
            fontSize: 15,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          ⇄ Changer de pièce
        </button>
      </div>
      <p style={{ fontSize: 19, lineHeight: 1.55, color: '#5c5346', margin: '0 0 22px', maxWidth: 700 }}>
        Ajoutez les photos de vos objets. Cliquez sur un des grands boutons ci-dessous.
      </p>

      <div
        id="tour-import-area"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
          gap: 16,
          marginBottom: 14,
        }}
      >
        <button
          onClick={onPickFiles}
          disabled={importing}
          style={{
            background: 'var(--accent)',
            border: 'none',
            borderRadius: 16,
            padding: '24px 20px',
            cursor: importing ? 'default' : 'pointer',
            opacity: importing ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 6px 18px rgba(47,125,110,.28)',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              background: 'rgba(255,255,255,.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
              fontSize: 30,
              color: '#fff',
            }}
          >
            ＋
          </div>
          <div>
            <div style={{ fontSize: 21, fontWeight: 800, color: '#fff' }}>Ajouter des photos</div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,.85)' }}>Cliquez pour choisir vos images</div>
          </div>
        </button>
        <button
          onClick={onPickFolder}
          disabled={importing}
          style={{
            background: '#fffdf8',
            border: '3px solid var(--accent)',
            borderRadius: 16,
            padding: '24px 20px',
            cursor: importing ? 'default' : 'pointer',
            opacity: importing ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              background: '#eef7f3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
              fontSize: 28,
              color: 'var(--accent)',
            }}
          >
            🗀
          </div>
          <div>
            <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--accent)' }}>Choisir un dossier</div>
            <div style={{ fontSize: 15, color: '#8a8073' }}>Toutes les photos d'un coup</div>
          </div>
        </button>
      </div>
      <div
        id="tour-info-hint"
        style={{
          background: '#fdf6e9',
          border: '1px solid #f0e2c4',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 24,
          fontSize: 16,
          color: '#7a6642',
          lineHeight: 1.5,
        }}
      >
        Sous chaque photo, le bouton <strong>« Ajouter les informations »</strong> vous laisse noter le nom, le
        prix, les dimensions…
      </div>

      {room.items.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
          {room.items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              title={itemTitle(item)}
              details={itemDetails(item)}
              needsInfo={itemNeedsInfo(item)}
              onEdit={() => setEditingItemId(item.id)}
              onDelete={() => onDeleteItem(item.id)}
            />
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
          }}
        >
          Aucune photo ici pour l'instant. Cliquez sur un bouton ci-dessus.
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
          padding: '16px 0',
          marginTop: 16,
        }}
      >
        <button
          onClick={() => dispatch({ type: 'GO_TO', screen: 'rooms' })}
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
          ← Mes pièces
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
          Continuer vers l'aperçu →
        </button>
      </div>

      {editingItem && (
        <ItemFormModal
          item={editingItem}
          onSave={onSaveFields}
          onCancel={() => setEditingItemId(null)}
          onDelete={onDeleteEditingItem}
        />
      )}
    </div>
  );
}
