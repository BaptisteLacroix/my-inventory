import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Room } from '../state/types';
import { flatItems, printMeta, type FlatItem, type PrintMeta } from '../lib/pdf';
import { Spinner } from './Spinner';

interface PdfPreviewModalProps {
  rooms: Room[];
  generating: boolean;
  downloadLabel: string;
  onClose: () => void;
  onDownload: () => void;
  onPrint: () => void;
}

export function PdfPreviewModal({ rooms, generating, downloadLabel, onClose, onDownload, onPrint }: PdfPreviewModalProps) {
  const [items, setItems] = useState<FlatItem[] | null>(null);
  const meta: PrintMeta = printMeta(rooms);

  useEffect(() => {
    let cancelled = false;
    flatItems(rooms).then((result) => {
      if (!cancelled) setItems(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageCount = (items?.length ?? 0) + 1;

  return createPortal(
    <div
      className="print-container"
      style={{ position: 'fixed', inset: 0, zIndex: 920, background: 'rgba(46,40,32,.62)', display: 'flex', flexDirection: 'column' }}
    >
      <div
        className="no-print"
        style={{
          background: '#fffdf8',
          borderBottom: '1px solid #ece3d4',
          padding: '14px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          boxShadow: '0 4px 16px rgba(0,0,0,.12)',
        }}
      >
        <div style={{ fontFamily: "'Lora',serif", fontSize: 21, fontWeight: 700 }}>Aperçu de votre document</div>
        <div style={{ fontSize: 15, color: '#8a8073' }}>
          {meta.itemCount} objet(s) · {pageCount} page(s)
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={onPrint}
          disabled={generating}
          style={{
            background: '#fffdf8',
            color: '#5c5346',
            border: '2px solid #e6ddcf',
            borderRadius: 12,
            padding: '12px 20px',
            fontSize: 16,
            fontWeight: 800,
            cursor: generating ? 'default' : 'pointer',
          }}
        >
          Imprimer
        </button>
        <button
          onClick={onClose}
          style={{
            background: '#fffdf8',
            color: '#5c5346',
            border: '2px solid #e6ddcf',
            borderRadius: 12,
            padding: '12px 20px',
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Fermer
        </button>
        <button
          onClick={onDownload}
          disabled={generating}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '12px 24px',
            fontSize: 16,
            fontWeight: 800,
            cursor: generating ? 'default' : 'pointer',
            boxShadow: '0 6px 16px rgba(47,125,110,.28)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {generating && <Spinner size={16} color="#fff" trackColor="rgba(255,255,255,.35)" />}
          {downloadLabel}
        </button>
      </div>
      <div
        className="print-area"
        style={{ flex: 1, overflow: 'auto', padding: '26px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}
      >
        <div
          className="print-page"
          style={{
            width: 'min(620px,94vw)',
            minHeight: 520,
            background: '#fff',
            borderRadius: 6,
            boxShadow: '0 10px 34px rgba(0,0,0,.28)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '56px 44px',
            color: '#2a2620',
          }}
        >
          <div style={{ fontSize: 14, letterSpacing: '.18em', textTransform: 'uppercase', color: '#8a8073', marginBottom: 14 }}>
            Inventaire pour l'assurance
          </div>
          <div style={{ fontFamily: "'Lora',serif", fontSize: 38, fontWeight: 700, marginBottom: 22 }}>Liste de mes objets</div>
          <div style={{ fontSize: 18, color: '#5c5346', lineHeight: 1.9 }}>
            <div>{meta.dateStr}</div>
            <div>
              {meta.roomCount} pièce(s) · {meta.itemCount} objet(s)
            </div>
            <div>
              Valeur totale estimée : <strong>{meta.totalStr}</strong>
            </div>
          </div>
        </div>

        {items === null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fff', fontSize: 17 }}>
            <Spinner size={22} color="#fff" trackColor="rgba(255,255,255,.3)" />
            Préparation de l'aperçu…
          </div>
        )}

        {items?.map((p, i) => (
          <div
            key={i}
            className="print-page"
            style={{
              width: 'min(620px,94vw)',
              background: '#fff',
              borderRadius: 6,
              boxShadow: '0 10px 34px rgba(0,0,0,.28)',
              padding: 40,
              color: '#2a2620',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                fontSize: 13,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: '#8a8073',
                borderBottom: '1px solid #ddd4c4',
                paddingBottom: 8,
                marginBottom: 14,
              }}
            >
              {p.roomName}
            </div>
            <div style={{ fontFamily: "'Lora',serif", fontSize: 26, fontWeight: 700, marginBottom: 14 }}>{p.title}</div>
            {p.photoDataUrl && (
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <img src={p.photoDataUrl} style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 6, border: '1px solid #e6ddcf' }} />
              </div>
            )}
            {p.fields.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
                <tbody>
                  {p.fields.map((f) => (
                    <tr key={f.label}>
                      <td style={{ padding: '8px 10px', fontWeight: 800, color: '#5c5346', width: '38%', verticalAlign: 'top', borderBottom: '1px solid #eee6d8' }}>
                        {f.label}
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #eee6d8', lineHeight: 1.5 }}>{f.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: '#a9927a', fontStyle: 'italic', fontSize: 16 }}>Aucune information renseignée pour cet objet.</div>
            )}
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}
