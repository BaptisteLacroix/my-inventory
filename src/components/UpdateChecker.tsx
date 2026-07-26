import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { Spinner } from './Spinner';
import { useLockBodyScroll } from '../lib/useLockBodyScroll';

type Phase = 'available' | 'downloading' | 'error';

const AUTO_CHECK_DELAY_MS = 2500;

const ghostButton: React.CSSProperties = {
  background: '#fffdf8',
  color: '#5c5346',
  border: '2px solid #e6ddcf',
  borderRadius: 12,
  padding: '12px 20px',
  fontSize: 16,
  fontWeight: 800,
  cursor: 'pointer',
};

const primaryButton: React.CSSProperties = {
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  padding: '12px 22px',
  fontSize: 16,
  fontWeight: 800,
  cursor: 'pointer',
};

interface UpdateCheckerProps {
  onToast: (msg: string) => void;
  /** Bump this (e.g. from a header button) to force an immediate check, reporting the result even when no update is found. */
  manualCheckSignal: number;
}

export function UpdateChecker({ onToast, manualCheckSignal }: UpdateCheckerProps) {
  const [update, setUpdate] = useState<Update | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const runCheck = useCallback(
    async (manual: boolean) => {
      try {
        const result = await check();
        if (result) {
          setUpdate(result);
          setDismissed(false);
        } else if (manual) {
          onToast('Vous avez déjà la dernière version.');
        }
      } catch (err) {
        console.error('Échec de la vérification des mises à jour', err);
        if (manual) onToast('Impossible de vérifier les mises à jour pour le moment.');
      }
    },
    [onToast],
  );

  useEffect(() => {
    const timer = setTimeout(() => runCheck(false), AUTO_CHECK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [runCheck]);

  useEffect(() => {
    if (manualCheckSignal > 0) runCheck(true);
  }, [manualCheckSignal, runCheck]);

  if (!update || dismissed) return null;

  return <UpdateDialog update={update} onDismiss={() => setDismissed(true)} onToast={onToast} />;
}

function UpdateDialog({ update, onDismiss, onToast }: { update: Update; onDismiss: () => void; onToast: (msg: string) => void }) {
  useLockBodyScroll();
  const [phase, setPhase] = useState<Phase>('available');
  const [progress, setProgress] = useState<{ downloaded: number; total: number | null }>({ downloaded: 0, total: null });

  async function handleUpdate() {
    setPhase('downloading');
    setProgress({ downloaded: 0, total: null });
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          setProgress({ downloaded: 0, total: event.data.contentLength ?? null });
        } else if (event.event === 'Progress') {
          setProgress((p) => ({ ...p, downloaded: p.downloaded + event.data.chunkLength }));
        }
      });
      await relaunch();
    } catch (err) {
      console.error("Échec de l'installation de la mise à jour", err);
      setPhase('error');
      onToast("La mise à jour n'a pas pu être installée.");
    }
  }

  const percent = progress.total ? Math.min(100, Math.round((progress.downloaded / progress.total) * 100)) : null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 950,
        background: 'rgba(46,40,32,.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          background: '#fffdf8',
          borderRadius: 20,
          width: 'min(520px,94vw)',
          padding: 28,
          boxShadow: '0 24px 70px rgba(46,40,32,.4)',
          animation: 'fadeUp .3s ease both',
        }}
      >
        <div style={{ fontFamily: "'Lora',serif", fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
          Une nouvelle version est disponible
        </div>
        <div style={{ fontSize: 16, color: '#8a8073', marginBottom: 18 }}>
          Version {update.version} (vous avez la {update.currentVersion})
        </div>

        {update.body && (
          <div
            style={{
              background: '#fdf6e9',
              border: '1px solid #f0e2c4',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 22,
              fontSize: 15,
              color: '#5c5346',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              maxHeight: 220,
              overflow: 'auto',
            }}
          >
            {update.body}
          </div>
        )}

        {phase === 'downloading' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Spinner size={28} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#3a342c' }}>
              {percent !== null ? `Téléchargement en cours… ${percent}%` : 'Téléchargement en cours…'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onDismiss} style={ghostButton}>
              Plus tard
            </button>
            <button onClick={handleUpdate} style={primaryButton}>
              Mettre à jour
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
