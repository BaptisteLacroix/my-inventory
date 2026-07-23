import type { Item } from '../state/types';
import { ItemThumb } from './ItemThumb';

interface ItemCardProps {
  item: Item;
  title: string;
  details: { label: string; value: string }[];
  needsInfo: boolean;
  onEdit?: () => void;
  onDelete: () => void;
}

export function ItemCard({ item, title, details, needsInfo, onEdit, onDelete }: ItemCardProps) {
  return (
    <div
      style={{
        background: '#fffdf8',
        border: '1px solid #ece3d4',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 14px rgba(46,40,32,.05)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ aspectRatio: '1/1', background: '#f0e9dc' }}>
        <ItemThumb photoFile={item.photoFile} />
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ fontFamily: "'Lora',serif", fontSize: 19, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
        {needsInfo && (
          <div
            style={{
              alignSelf: 'flex-start',
              background: '#fdf1df',
              color: '#b57d2e',
              fontSize: 13,
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 999,
            }}
          >
            Informations à ajouter
          </div>
        )}
        {details.map((d) => (
          <div key={d.label} style={{ fontSize: 14, lineHeight: 1.35 }}>
            <span style={{ color: '#a9927a', fontWeight: 700 }}>{d.label} : </span>
            <span style={{ color: '#3a342c' }}>{d.value}</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
          <button
            onClick={onEdit}
            style={{
              flex: 1,
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 11,
              padding: 12,
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            ✏️ Ajouter les informations
          </button>
          <button
            onClick={onDelete}
            style={{
              background: '#fbf3ee',
              color: '#b4553f',
              border: 'none',
              borderRadius: 11,
              padding: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Retirer
          </button>
        </div>
      </div>
    </div>
  );
}
