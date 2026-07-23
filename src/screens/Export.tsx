import { useState } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { openPath } from '@tauri-apps/plugin-opener';
import { useInventory } from '../state/InventoryContext';
import { generatePDF } from '../lib/pdf';
import { getAppDataDir, join, writeFile, ensureDir } from '../lib/storage';
import { PdfPreviewModal } from '../components/PdfPreviewModal';

export function Export({ onToast }: { onToast: (msg: string) => void }) {
  const { state, dispatch } = useInventory();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const itemCount = state.rooms.reduce((n, r) => n + r.items.length, 0);

  function openPreview() {
    if (itemCount === 0) {
      onToast("Ajoutez d'abord au moins une photo.");
      return;
    }
    setPreviewOpen(true);
  }

  async function handleDownload() {
    if (generating) return;
    setGenerating(true);
    try {
      const { blob } = await generatePDF(state.rooms);
      const path = await save({ defaultPath: 'mon-inventaire.pdf', filters: [{ name: 'Document PDF', extensions: ['pdf'] }] });
      if (!path) return;
      await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
      onToast('PDF enregistré !');
    } catch (err) {
      console.error(err);
      onToast('Une erreur est survenue lors de la création du PDF.');
    } finally {
      setGenerating(false);
    }
  }

  async function handlePrint() {
    if (generating) return;
    setGenerating(true);
    try {
      const { blob } = await generatePDF(state.rooms);
      const appData = await getAppDataDir();
      const tmpDir = await join(appData, 'tmp');
      await ensureDir(tmpDir);
      const path = await join(tmpDir, 'apercu-impression.pdf');
      await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
      await openPath(path);
      onToast('Une fenêtre va s\'ouvrir avec votre document ; utilisez le bouton Imprimer de cette fenêtre.');
    } catch (err) {
      console.error(err);
      onToast("Une erreur est survenue lors de la préparation de l'impression.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div
      style={{
        animation: 'fadeUp .4s ease both',
        textAlign: 'center',
        paddingBottom: 50,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ fontFamily: "'Lora',serif", fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
        Étape 4 · Créer votre PDF
      </div>
      <p style={{ fontSize: 20, lineHeight: 1.6, color: '#5c5346', maxWidth: 620, margin: '0 auto 8px' }}>
        Vous y êtes presque ! Nous allons créer un document avec une photo et ses informations par page.
      </p>
      <p style={{ fontSize: 18, lineHeight: 1.6, color: '#8a8073', maxWidth: 600, margin: '0 auto 26px' }}>
        Regardez d'abord l'aperçu, puis téléchargez ou imprimez votre document.
      </p>

      <div
        style={{
          background: '#fffdf8',
          border: '1px solid #ece3d4',
          borderRadius: 18,
          padding: 22,
          maxWidth: 440,
          margin: '0 auto 28px',
          boxShadow: '0 4px 14px rgba(46,40,32,.05)',
        }}
      >
        <div style={{ fontSize: 17, color: '#5c5346', lineHeight: 1.7 }}>
          Votre document contiendra :
          <br />
          <strong style={{ color: 'var(--accent)' }}>{itemCount} objet(s)</strong> répartis dans{' '}
          <strong style={{ color: 'var(--accent)' }}>{state.rooms.length} pièce(s)</strong>
        </div>
      </div>

      <button
        onClick={openPreview}
        style={{
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 16,
          padding: '20px 42px',
          fontSize: 22,
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 8px 22px rgba(47,125,110,.30)',
        }}
      >
        Voir l'aperçu du PDF
      </button>
      <div style={{ marginTop: 22 }}>
        <button
          onClick={() => dispatch({ type: 'GO_TO', screen: 'review' })}
          style={{ background: 'none', border: 'none', color: '#a9927a', fontSize: 17, fontWeight: 700, cursor: 'pointer' }}
        >
          ← Revenir à l'aperçu
        </button>
      </div>

      {previewOpen && (
        <PdfPreviewModal
          rooms={state.rooms}
          generating={generating}
          downloadLabel={generating ? 'Création en cours…' : 'Télécharger le PDF'}
          onClose={() => setPreviewOpen(false)}
          onDownload={handleDownload}
          onPrint={handlePrint}
        />
      )}
    </div>
  );
}
