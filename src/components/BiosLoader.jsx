import { useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import CrtOverlay from './CrtOverlay.jsx';

const VT     = { fontFamily: "'VT323', monospace" };
const TEXT   = '#ddd3cd';  // warm off-white body text
const DIM    = '#6f625d';
const ROSE   = '#c99a94';  // muted dusty-rose accent
const BRIGHT = '#f0e4de';
const GLOW   = '0 0 4px rgba(221,211,205,0.3)'; // faint phosphor bloom

// Short boot sequence — name first, then the real asset load.
const BOOT_LINES = [
  { t: 'VISHAKHA PATHAK  —  Portfolio  —  2026', d: 0   },
  { t: '',                                       d: 150 },
  { t: 'Initializing display...',                d: 300 },
  { t: 'Preparing 3D environment...',            d: 650 },
  { t: 'Loading assets...',                      d: 1000 },
];

const BiosLoader = ({ onStart }) => {
  const { progress, total, loaded } = useProgress();

  const [visibleLines, setVisibleLines] = useState([]);
  const [bootDone, setBootDone]     = useState(false);
  const [loadDone, setLoadDone]     = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const startedRef = useRef(false);

  // Reveal boot lines on a fixed timer
  useEffect(() => {
    const timers = BOOT_LINES.map((line, i) =>
      setTimeout(() => {
        setVisibleLines(prev => [...prev, line.t]);
        if (i === BOOT_LINES.length - 1) setBootDone(true);
      }, line.d)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Mark assets loaded
  useEffect(() => {
    if (progress >= 100) setLoadDone(true);
  }, [progress]);

  // Show dialog once boot text is done AND assets are loaded
  useEffect(() => {
    if (bootDone && loadDone) {
      const t = setTimeout(() => setShowDialog(true), 300);
      return () => clearTimeout(t);
    }
  }, [bootDone, loadDone]);

  // Straight cut into the scene
  const handleStart = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    onStart();
  };

  // ENTER also starts once the dialog is up
  useEffect(() => {
    if (!showDialog) return;
    const onKey = (e) => { if (e.key === 'Enter') handleStart(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showDialog]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000',
      ...VT,
      animation: 'bios-flicker 0.15s steps(1) infinite',
    }}>
      <style>{`
        @keyframes bios-pulse  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes btn-glow    { 0%,100%{box-shadow:0 0 6px #c99a9433} 50%{box-shadow:0 0 14px #c99a9488} }
        @keyframes dialog-in   { from{opacity:0;transform:translate(-50%,-48%)} to{opacity:1;transform:translate(-50%,-50%)} }
        @keyframes bios-flicker {
          0%  { filter: brightness(0.985); }
          20% { filter: brightness(1); }
          40% { filter: brightness(0.968); }
          60% { filter: brightness(1); }
          80% { filter: brightness(0.978); }
        }
      `}</style>

      {/* same tube artifacts as the in-scene desktop, tuned up for pure black */}
      <CrtOverlay scanlineOpacity={0.2} scanlineSpacing={3} vignette={0.45} vignetteStart={60} />

      {/* ── Full-screen boot text ── */}
      <div style={{
        position: 'absolute', inset: 0,
        padding: '8vh 8vw',
        opacity: showDialog ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }}>
        {visibleLines.map((line, i) => (
          <div key={i} style={{
            color: line === '' ? undefined : TEXT,
            fontSize: 18, lineHeight: 1.65,
            textShadow: GLOW,
          }}>
            {line || '\u00a0'}
          </div>
        ))}

        {/* Real progress while waiting for assets */}
        {bootDone && !loadDone && (
          <div style={{ marginTop: 10, maxWidth: 360 }}>
            <div style={{ color: TEXT, fontSize: 18 }}>
              {progress.toFixed(0)}%
              <span style={{ color: DIM }}>{'  '}·{'  '}{loaded} of {total || '?'} files</span>
              <span style={{ animation: 'bios-pulse 0.8s infinite' }}> ▌</span>
            </div>
            <div style={{
              marginTop: 8, height: 3,
              background: 'rgba(221,211,205,0.14)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: ROSE,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* Bottom footer line */}
        <div style={{
          position: 'absolute', bottom: '6vh', left: '8vw', right: '8vw',
          borderTop: `1px solid ${DIM}`, paddingTop: 10,
          display: 'flex', justifyContent: 'space-between',
          color: DIM, fontSize: 14,
        }}>
          <span>© 2026 Vishakha Pathak</span>
          <span>All rights reserved</span>
        </div>
      </div>

      {/* ── Dialog box — appears once everything is ready ── */}
      {showDialog && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          border: `1px solid ${ROSE}`,
          background: '#000',
          padding: '36px 48px',
          textAlign: 'center',
          minWidth: 320,
          animation: 'dialog-in 0.35s ease both',
        }}>
          {/* Inner border for depth */}
          <div style={{
            position: 'absolute', inset: 5,
            border: `1px solid ${DIM}`,
            pointerEvents: 'none',
          }} />

          <div style={{ color: BRIGHT, fontSize: 26, letterSpacing: 2, marginBottom: 6, textShadow: GLOW }}>
            Vishakha Pathak
          </div>
          <div style={{ color: DIM, fontSize: 18, letterSpacing: 1, marginBottom: 32 }}>
            Portfolio  —  2026
          </div>

          <button
            onClick={handleStart}
            style={{
              ...VT, fontSize: 20, letterSpacing: 4,
              background: 'transparent',
              border: `1px solid ${ROSE}`, color: ROSE,
              padding: '10px 40px', cursor: 'pointer',
              animation: 'btn-glow 2s ease-in-out infinite',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = ROSE; e.currentTarget.style.color = '#000'; e.currentTarget.style.animation = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ROSE; e.currentTarget.style.animation = 'btn-glow 2s ease-in-out infinite'; }}
          >
            ENTER
          </button>
          <div style={{ color: DIM, fontSize: 14, marginTop: 16, letterSpacing: 1 }}>
            click or press enter
          </div>
        </div>
      )}
    </div>
  );
};

export default BiosLoader;
