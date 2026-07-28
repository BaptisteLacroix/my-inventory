import { useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useLockBodyScroll } from '../lib/useLockBodyScroll';
import {
  WIKI_SCREENS,
  WIKI_STEPS,
  WIKI_FAQ,
  WIKI_TROUBLE,
  wikiShot,
  wikiVideo,
  wikiAsset,
  canReplayTour,
  findWikiScreen,
  type WikiBlock,
  type WikiScreen,
  type WikiSelection,
} from '../lib/wiki';

interface WikiPanelProps {
  selection: WikiSelection;
  onSelect: (selection: WikiSelection) => void;
  onClose: () => void;
  onReplayTour: (screenId: string) => void;
}

const NON_SCREEN_NAV: { id: 'steps' | 'faq' | 'trouble'; icon: string; title: string }[] = [
  { id: 'steps', icon: '🧭', title: 'Le pas-à-pas' },
  { id: 'faq', icon: '❓', title: 'Questions fréquentes' },
  { id: 'trouble', icon: '🛟', title: 'En cas de problème' },
];

function navBtnStyle(active: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    border: 'none',
    borderRadius: 11,
    padding: '11px 12px',
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
    textAlign: 'left',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : '#5c5346',
  };
}

/** Screenshot with a graceful fallback while the image file has not been added yet. */
function WikiShot({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <>
      <div
        style={{
          border: '1px solid #e6ddcf',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 6px 18px rgba(46,40,32,.08)',
          marginBottom: 8,
          background: '#fff',
        }}
      >
        {failed ? (
          <div
            style={{
              aspectRatio: '16/10',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a9927a',
              fontSize: 14,
              padding: 16,
              textAlign: 'center',
            }}
          >
            Capture à venir
          </div>
        ) : (
          <img
            src={src}
            alt={`Capture de l'écran « ${title} »`}
            onError={() => setFailed(true)}
            style={{ width: '100%', display: 'block' }}
          />
        )}
      </div>
      <div style={{ fontSize: 12, color: '#a9927a', textAlign: 'center', marginBottom: 20 }}>
        Capture de l'écran « {title} »
      </div>
    </>
  );
}

/** Demo video with a placeholder while the file has not been added yet. */
function WikiVideo({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#5c5346', marginBottom: 8 }}>🎬 Vidéo de démonstration</div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 12,
          overflow: 'hidden',
          border: '2px dashed #d9cdb8',
          background: '#fffdf8',
        }}
      >
        {failed ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a9927a',
              fontSize: 15,
              padding: 16,
              textAlign: 'center',
            }}
          >
            Emplacement pour une courte vidéo (à ajouter plus tard).
          </div>
        ) : (
          <video
            src={src}
            controls
            onError={() => setFailed(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>
    </>
  );
}

/** An image attached to a single explanation step, with a placeholder fallback. */
function StepImage({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div style={{ marginTop: 10 }}>
      <div
        style={{
          border: '1px solid #e6ddcf',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 4px 12px rgba(46,40,32,.06)',
        }}
      >
        {failed ? (
          <div
            style={{
              aspectRatio: '16/10',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a9927a',
              fontSize: 14,
              padding: 16,
              textAlign: 'center',
            }}
          >
            Image à venir
          </div>
        ) : (
          <img src={src} alt={alt} onError={() => setFailed(true)} style={{ width: '100%', display: 'block' }} />
        )}
      </div>
      {caption && <div style={{ fontSize: 12, color: '#a9927a', textAlign: 'center', marginTop: 6 }}>{caption}</div>}
    </div>
  );
}

/** A video attached to a single explanation step, with a placeholder fallback. */
function StepVideo({ src, caption }: { src: string; caption?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div style={{ marginTop: 10 }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid #e6ddcf',
          background: '#000',
        }}
      >
        {failed ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a9927a',
              fontSize: 14,
              padding: 16,
              textAlign: 'center',
              background: '#fffdf8',
            }}
          >
            Vidéo à venir
          </div>
        ) : (
          <video
            src={src}
            controls
            onError={() => setFailed(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>
      {caption && <div style={{ fontSize: 12, color: '#a9927a', textAlign: 'center', marginTop: 6 }}>{caption}</div>}
    </div>
  );
}

/** One numbered explanation step: the text row plus any image/video attached to it. */
function StepBlock({ block, index }: { block: WikiBlock; index: number }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--accent)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 15,
            flex: 'none',
          }}
        >
          {index + 1}
        </div>
        <div style={{ fontSize: 16, lineHeight: 1.5, color: '#3a342c', paddingTop: 2 }}>
          <strong>{block.h}</strong> — {block.t}
        </div>
      </div>
      {(block.image || block.video) && (
        <div style={{ marginLeft: 40 }}>
          {block.image && <StepImage src={wikiAsset(block.image)} alt={block.h} caption={block.caption} />}
          {block.video && <StepVideo src={wikiAsset(block.video)} caption={block.image ? undefined : block.caption} />}
        </div>
      )}
    </div>
  );
}

const kickerStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  color: '#c98a3f',
  marginBottom: 5,
};
const headingStyle: CSSProperties = { fontFamily: "'Lora',serif", fontSize: 26, fontWeight: 700, marginBottom: 18 };
const qaCardStyle: CSSProperties = {
  background: '#fffdf8',
  border: '1px solid #ece3d4',
  borderRadius: 12,
  padding: '14px 16px',
  marginBottom: 11,
};

function ScreenSection({ screen, onReplayTour }: { screen: WikiScreen; onReplayTour: (id: string) => void }) {
  return (
    <>
      <div style={kickerStyle}>{screen.kicker}</div>
      <h2 style={{ fontFamily: "'Lora',serif", fontSize: 26, fontWeight: 700, margin: '0 0 14px' }}>{screen.title}</h2>

      <WikiShot src={wikiShot(screen)} title={screen.title} />

      {screen.blocks.map((b, i) => (
        <StepBlock key={i} block={b} index={i} />
      ))}

      <div
        style={{
          background: '#fdf6e9',
          border: '1px solid #f0e2c4',
          borderRadius: 12,
          padding: '13px 16px',
          margin: '16px 0 24px',
          fontSize: 15,
          color: '#7a6642',
          lineHeight: 1.5,
        }}
      >
        💡 <strong>Astuce :</strong> {screen.tip}
      </div>

      <WikiVideo src={wikiVideo(screen)} />

      {canReplayTour(screen) && (
        <div style={{ marginTop: 22 }}>
          <button
            onClick={() => onReplayTour(screen.id)}
            style={{
              background: '#fffdf8',
              color: 'var(--accent)',
              border: '2px solid var(--accent)',
              borderRadius: 12,
              padding: '11px 18px',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            ▶ Revoir les bulles de cet écran
          </button>
        </div>
      )}
    </>
  );
}

export function WikiPanel({ selection, onSelect, onClose, onReplayTour }: WikiPanelProps) {
  useLockBodyScroll();

  const screen = findWikiScreen(selection) ?? null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 930,
        background: 'rgba(46,40,32,.45)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#f6f0e7',
          width: 'min(96vw, max(440px, 50vw))',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,.3)',
          animation: 'slideInRight .3s ease both',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: '#fffdf8',
            borderBottom: '1px solid #ece3d4',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flex: 'none',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'var(--accent)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            ?
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Lora',serif", fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}>
              Guide d'utilisation
            </div>
            <div style={{ fontSize: 13, color: '#8a8073' }}>Écran par écran</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#fffdf8',
              color: '#5c5346',
              border: '2px solid #e6ddcf',
              borderRadius: 11,
              padding: '10px 16px',
              fontSize: 16,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Fermer ✕
          </button>
        </div>

        {/* Body: nav + content */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <div
            style={{
              width: 220,
              flex: 'none',
              background: '#fffdf8',
              borderRight: '1px solid #ece3d4',
              overflow: 'auto',
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
            }}
          >
            {WIKI_SCREENS.map((w) => (
              <button key={w.id} onClick={() => onSelect(w.id)} style={navBtnStyle(selection === w.id)}>
                <span style={{ fontSize: 20, width: 26, textAlign: 'center', flex: 'none' }}>{w.icon}</span>
                <span style={{ textAlign: 'left', lineHeight: 1.25 }}>{w.nav}</span>
              </button>
            ))}
            {NON_SCREEN_NAV.map((n) => (
              <button key={n.id} onClick={() => onSelect(n.id)} style={navBtnStyle(selection === n.id)}>
                <span style={{ fontSize: 20, width: 26, textAlign: 'center', flex: 'none' }}>{n.icon}</span>
                <span style={{ textAlign: 'left', lineHeight: 1.25 }}>{n.title}</span>
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '22px 24px 50px' }}>
            {screen && <ScreenSection screen={screen} onReplayTour={onReplayTour} />}

            {selection === 'steps' && (
              <>
                <div style={kickerStyle}>Le parcours complet</div>
                <div style={headingStyle}>En 5 étapes</div>
                {WIKI_STEPS.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 18, alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 17,
                        flex: 'none',
                      }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 3 }}>{s.h}</div>
                      <div style={{ fontSize: 16, lineHeight: 1.5, color: '#5c5346' }}>{s.t}</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {selection === 'faq' && (
              <>
                <div style={kickerStyle}>Questions fréquentes</div>
                <div style={headingStyle}>Vous vous demandez peut-être…</div>
                {WIKI_FAQ.map((q, i) => (
                  <div key={i} style={qaCardStyle}>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 5, color: '#3a342c' }}>{q.q}</div>
                    <div style={{ fontSize: 15, lineHeight: 1.5, color: '#5c5346' }}>{q.a}</div>
                  </div>
                ))}
              </>
            )}

            {selection === 'trouble' && (
              <>
                <div style={kickerStyle}>En cas de souci</div>
                <div style={headingStyle}>Si quelque chose ne marche pas</div>
                {WIKI_TROUBLE.map((p, i) => (
                  <div key={i} style={qaCardStyle}>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 5, color: '#b4553f' }}>⚠ {p.q}</div>
                    <div style={{ fontSize: 15, lineHeight: 1.5, color: '#5c5346' }}>{p.a}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
