import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';

const VT     = { fontFamily: "'VT323', monospace" };
const AMBER  = '#c8a96e';
const DIM    = '#6b4f28';
const BRIGHT = '#e8c98e';

// Boot lines finish in ~1.3s — fast enough to feel snappy, slow enough to read
const BOOT_LINES = [
  { t: 'VISHAKHA PATHAK  —  Personal Computer  —  2025',   d: 0    },
  { t: 'System BIOS v1.0  |  Portfolio Edition',            d: 150  },
  { t: '',                                                   d: 260  },
  { t: 'Running startup checks...',                          d: 360  },
  { t: '  Memory check ........................... OK',      d: 520  },
  { t: '  Display adapter ........................ OK',      d: 680  },
  { t: '  Keyboard & mouse ....................... OK',       d: 840  },
  { t: '  Portfolio drive mounted ............... OK',       d: 1000 },
  { t: '',                                                   d: 1120 },
  { t: 'Loading portfolio assets...',                        d: 1200 },
];

const BAR_WIDTH = 18;

const BiosLoader = ({ onStart }) => {
  const { active, progress, total, loaded } = useProgress();

  const [visibleLines, setVisibleLines] = useState([]);
  const [bootDone, setBootDone] = useState(false);
  const [loadDone, setLoadDone] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // Reveal boot lines on a fixed timer
  useEffect(() => {
    const timers = BOOT_LINES.map(({ t, d }, i) =>
      setTimeout(() => {
        setVisibleLines(prev => [...prev, t]);
        if (i === BOOT_LINES.length - 1) setBootDone(true);
      }, d)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Mark assets loaded
  useEffect(() => {
    if (progress >= 100) setLoadDone(true);
  }, [active, progress]);

  // Show dialog once boot text is done AND assets are loaded
  useEffect(() => {
    if (bootDone && loadDone) {
      // Small pause after the last boot line before the dialog appears
      const t = setTimeout(() => setShowDialog(true), 300);
      return () => clearTimeout(t);
    }
  }, [bootDone, loadDone]);

  const filled = Math.round((progress / 100) * BAR_WIDTH);
  const bar    = '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000',
      ...VT,
    }}>
      <style>{`
        @keyframes bios-pulse  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes dialog-in   { from{opacity:0;transform:translate(-50%,-48%)} to{opacity:1;transform:translate(-50%,-50%)} }
      `}</style>

      {/* ── Full-screen boot text ── */}
      <div style={{
        position: 'absolute', inset: 0,
        padding: '8vh 8vw',
        // dim the background when the dialog is up so it reads clearly
        opacity: showDialog ? 0.25 : 1,
        transition: 'opacity 0.4s ease',
      }}>
        {visibleLines.map((line, i) => (
          <div key={i} style={{
            color: line.includes('OK') ? BRIGHT : line === '' ? undefined : AMBER,
            fontSize: 18, lineHeight: 1.65,
          }}>
            {line || '\u00a0'}
          </div>
        ))}

        {/* Inline progress while waiting for assets */}
        {bootDone && !loadDone && (
          <div style={{ marginTop: 6 }}>
            <div style={{ color: AMBER, fontSize: 18 }}>
              [{bar}] {progress.toFixed(0)}%{'  '}
              <span style={{ animation: 'bios-pulse 0.8s infinite' }}>▌</span>
            </div>
            <div style={{ color: DIM, fontSize: 14, marginTop: 2 }}>
              {loaded} of {total || '?'} files
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
          <span>© 2025 Vishakha Pathak</span>
          <span>All rights reserved</span>
        </div>
      </div>

      {/* ── Dialog box — appears once everything is ready ── */}
      {showDialog && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          border: `1px solid ${AMBER}`,
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

          <div style={{ color: BRIGHT, fontSize: 26, letterSpacing: 2, marginBottom: 6 }}>
            Vishakha Pathak
          </div>
          <div style={{ color: DIM, fontSize: 18, letterSpacing: 1, marginBottom: 32 }}>
            Portfolio  —  2025
          </div>

          <button
            onClick={onStart}
            style={{
              ...VT, fontSize: 20, letterSpacing: 4,
              background: 'transparent',
              border: `1px solid ${AMBER}`, color: AMBER,
              padding: '10px 40px', cursor: 'pointer',
              animation: 'bios-pulse 1.4s step-end infinite',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = AMBER; e.currentTarget.style.color = '#000'; e.currentTarget.style.animation = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = AMBER; e.currentTarget.style.animation = 'bios-pulse 1.4s step-end infinite'; }}
          >
            START
          </button>
        </div>
      )}
    </div>
  );
};

export default BiosLoader;
