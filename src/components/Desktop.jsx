import { useCallback, useEffect, useRef, useState } from 'react';
import NoiseOverlay      from './desktop/NoiseOverlay.jsx';
import Win95Window       from './desktop/Win95Window.jsx';
import ShowcaseExplorer, { WINDOW_W, WINDOW_H } from './desktop/ShowcaseExplorer.jsx';
import TetrisGame        from './desktop/TetrisGame.jsx';
import { W, SANS, raised, sunken, deepRaised } from './desktop/theme.js';

// ── Desktop icon ──────────────────────────────────────────────────────────────
const DesktopIcon = ({ icon, label, onDoubleClick }) => {
  const [sel, setSel] = useState(false);
  return (
    <div
      onClick={() => setSel(true)}
      onDoubleClick={onDoubleClick}
      onBlur={() => setSel(false)}
      tabIndex={0}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 54, padding: 4, cursor: 'default', outline: 'none' }}
    >
      <div style={{
        fontSize: 26, width: 36, height: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: sel ? 'rgba(0,0,128,0.5)' : 'transparent',
        outline: sel ? '1px dotted #fff' : 'none',
      }}>{icon}</div>
      <span style={{
        fontFamily: SANS, fontSize: 10, color: W.white,
        textShadow: '1px 1px 2px #000',
        background: sel ? W.titleActive : 'transparent',
        padding: '0 2px', textAlign: 'center', marginTop: 2,
        maxWidth: 54, wordBreak: 'break-word', lineHeight: 1.2,
      }}>{label}</span>
    </div>
  );
};

// ── Taskbar clock ─────────────────────────────────────────────────────────────
const Clock = () => {
  const fmt = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const [t, setT] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 30000);
    return () => clearInterval(id);
  }, []);
  return <span>{t}</span>;
};

// ── Window registry ───────────────────────────────────────────────────────────
const WINDOWS_DEF = [
  { id: 'showcase', label: 'Portfolio', icon: '🖥', isShowcase: true },
  { id: 'tetris',   label: 'Tetris',    icon: '🎮', Panel: TetrisGame },
];

const WIN_SIZES = {
  showcase: { w: WINDOW_W, h: WINDOW_H },
  tetris:   { w: 260,      h: 360 },
  default:  { w: 260,      h: 360 },
};

const TASKBAR_H = 32;

// ── Main desktop component ────────────────────────────────────────────────────
const Desktop = ({ bounds, onClose }) => {
  const [visible,  setVisible]  = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [activeWin, setActiveWin] = useState('showcase');
  const zRef = useRef(10);

  const centerPos = useCallback((id) => {
    const { w, h } = WIN_SIZES[id] ?? WIN_SIZES.default;
    return {
      x: Math.max(0, Math.round((bounds.width  - w) / 2)),
      y: Math.max(0, Math.round((bounds.height - TASKBAR_H - h) / 2)),
    };
  }, [bounds]);

  const [openWindows, setOpenWindows] = useState(() => {
    const p = { x: Math.max(0, Math.round((bounds.width - WINDOW_W) / 2)), y: Math.max(0, Math.round((bounds.height - TASKBAR_H - WINDOW_H) / 2)) };
    return [{ id: 'showcase', label: 'Portfolio', icon: '🖥', isShowcase: true, zIndex: 10, initialX: p.x, initialY: p.y, minimized: false }];
  });

  // Fade in after two animation frames so the CSS transition fires
  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(raf);
  }, []);

  const bringToFront = useCallback((id) => {
    zRef.current += 1;
    setActiveWin(id);
    setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: zRef.current } : w));
  }, []);

  const openWindow = useCallback((def) => {
    setStartOpen(false);
    if (openWindows.find(w => w.id === def.id)) { bringToFront(def.id); return; }
    zRef.current += 1;
    const p      = centerPos(def.id);
    const offset = openWindows.length * 14;
    setOpenWindows(prev => [...prev, { ...def, zIndex: zRef.current, initialX: p.x + offset, initialY: p.y + offset, minimized: false }]);
    setActiveWin(def.id);
  }, [openWindows, bringToFront, centerPos]);

  const closeWindow    = useCallback((id) => setOpenWindows(prev => prev.filter(w => w.id !== id)), []);
  const minimizeWindow = useCallback((id) => setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: true } : w)), []);
  const toggleMinimize = useCallback((id) => {
    zRef.current += 1;
    setActiveWin(id);
    setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: !w.minimized, zIndex: zRef.current } : w));
  }, []);

  const handleExit = () => { setVisible(false); setTimeout(onClose, 300); };

  return (
    <div style={{
      position: 'fixed', left: bounds.left, top: bounds.top,
      width: bounds.width, height: bounds.height,
      zIndex: 100, overflow: 'hidden',
      // Pixel-crisp text rendering matches the Win98 bitmap font aesthetic
      WebkitFontSmoothing: 'none', MozOsxFontSmoothing: 'grayscale',
      borderRadius: 3,
      background: '#000',
      boxShadow: [
        '0 0 0 1px #0a0a0a',
        'inset 0 0 0 1px rgba(255,255,255,0.04)',
        'inset 0 0 80px rgba(0,0,0,0.75)',
        '0 8px 48px rgba(0,0,0,0.9)',
      ].join(', '),
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.35s ease',
    }}>
      <style>{`
        @keyframes crt-flicker {
          0%   { filter: brightness(0.981); }
          5%   { filter: brightness(1); }
          10%  { filter: brightness(0.968); }
          15%  { filter: brightness(1); }
          20%  { filter: brightness(0.974); }
          25%  { filter: brightness(1); }
          30%  { filter: brightness(0.962); }
          35%  { filter: brightness(0.987); }
          40%  { filter: brightness(0.981); }
          45%  { filter: brightness(1); }
          50%  { filter: brightness(1); }
          55%  { filter: brightness(0.956); }
          60%  { filter: brightness(0.981); }
          65%  { filter: brightness(1); }
          70%  { filter: brightness(0.968); }
          75%  { filter: brightness(0.987); }
          80%  { filter: brightness(1); }
          85%  { filter: brightness(0.974); }
          90%  { filter: brightness(0.987); }
          95%  { filter: brightness(0.962); }
          100% { filter: brightness(0.981); }
        }
        @keyframes scan-roll {
          0%   { transform: translateY(-8%); }
          100% { transform: translateY(108%); }
        }
      `}</style>

      {/* CRT effects wrapper */}
      <div style={{ position: 'absolute', inset: 0, animation: 'crt-flicker 0.15s steps(1) infinite' }}>
        <NoiseOverlay w={Math.round(bounds.width)} h={Math.round(bounds.height)} />

        {/* Scanlines */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 9999, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 2px)',
        }} />

        {/* Rolling scan band */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '8%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.018) 50%, transparent 100%)',
          animation: 'scan-roll 4s linear infinite',
          pointerEvents: 'none', zIndex: 9998,
        }} />

        {/* Corner vignette */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9997,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 75%, rgba(0,0,0,0.16) 100%)',
        }} />

        {/* Top-edge glint */}
        <div style={{
          position: 'absolute', top: 0, left: '8%', right: '8%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.12) 70%, transparent)',
          pointerEvents: 'none', zIndex: 9997,
        }} />

        {/* Desktop area */}
        <div style={{
          position: 'absolute', left: 0, top: 0,
          width: '100%', height: `calc(100% - ${TASKBAR_H}px)`,
          background: W.desktop, overflow: 'hidden',
        }} onClick={() => setStartOpen(false)}>

          {/* Desktop icons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '6px 4px', position: 'relative', zIndex: 1 }}>
            {WINDOWS_DEF.map(def => (
              <DesktopIcon key={def.id} icon={def.icon} label={def.label} onDoubleClick={() => openWindow(def)} />
            ))}
          </div>

          {/* Open windows — opacity:0 rather than unmounting preserves Tetris game state */}
          {openWindows.map(w => {
            const hidden = { opacity: 0, pointerEvents: 'none' };
            if (w.isShowcase) return (
              <div key={w.id} style={w.minimized ? hidden : {}}>
                <ShowcaseExplorer
                  onClose={() => closeWindow(w.id)} onMinimize={() => minimizeWindow(w.id)} onFocus={() => bringToFront(w.id)}
                  zIndex={w.zIndex} initialX={w.initialX} initialY={w.initialY}
                  desktopW={bounds.width} desktopH={bounds.height}
                />
              </div>
            );
            const Panel = w.Panel;
            return (
              <div key={w.id} style={w.minimized ? hidden : {}}>
                <Win95Window
                  title={w.label} icon={w.icon}
                  zIndex={w.zIndex} initialX={w.initialX} initialY={w.initialY}
                  desktopW={bounds.width} desktopH={bounds.height}
                  noMaximize={w.id === 'tetris'}
                  onClose={() => closeWindow(w.id)} onMinimize={() => minimizeWindow(w.id)} onFocus={() => bringToFront(w.id)}
                >
                  <Panel />
                </Win95Window>
              </div>
            );
          })}

          {/* Start menu */}
          {startOpen && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 170, zIndex: 5000, background: W.winBg, ...deepRaised }}>
              <div style={{ background: `linear-gradient(90deg, ${W.titleActive}, #1084d0)`, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, ...sunken, background: '#000060', display: 'flex', alignItems: 'center', justifyContent: 'center', color: W.white, fontSize: 12, fontWeight: 700, fontFamily: SANS }}>VP</div>
                <span style={{ color: W.white, fontFamily: SANS, fontSize: 11, fontWeight: 700 }}>Vishakha Pathak</span>
              </div>
              <div style={{ padding: '4px 0' }}>
                {WINDOWS_DEF.map(def => (
                  <div key={def.id} onClick={() => openWindow(def)}
                    onMouseEnter={e => { e.currentTarget.style.background = W.titleActive; e.currentTarget.style.color = W.white; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = W.black; }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', cursor: 'default', fontFamily: SANS, fontSize: 11, color: W.black }}>
                    <span style={{ fontSize: 16 }}>{def.icon}</span>{def.label}
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${W.dark}`, margin: '4px 8px' }} />
                <div onClick={handleExit}
                  onMouseEnter={e => { e.currentTarget.style.background = W.titleActive; e.currentTarget.style.color = W.white; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = W.black; }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', cursor: 'default', fontFamily: SANS, fontSize: 11, color: W.black }}>
                  <span style={{ fontSize: 16 }}>⏻</span> Shut Down
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Taskbar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: TASKBAR_H, display: 'flex', alignItems: 'center', gap: 3,
          background: W.taskbar, padding: '4px 4px',
          borderTop: `2px solid ${W.white}`, zIndex: 4000,
        }}>
          {/* Start button */}
          <div
            onClick={(e) => { e.stopPropagation(); setStartOpen(s => !s); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '2px 8px', height: 22,
              background: W.winBg, fontFamily: SANS, fontWeight: 700, fontSize: 11, color: W.black,
              cursor: 'default', userSelect: 'none',
              ...(startOpen ? sunken : raised),
            }}
          >
            <img src="/win98.svg" alt="" style={{ width: 16, height: 16, marginRight: 4, position: 'relative', top: 1 }} />
            Start
          </div>

          <div style={{ width: 2, height: 22, borderLeft: `1px solid ${W.dark}`, borderRight: `1px solid ${W.white}`, margin: '0 2px' }} />

          {/* Open window buttons */}
          {openWindows.map(w => (
            <div key={w.id} onClick={() => toggleMinimize(w.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '1px 6px', maxWidth: 120, height: 22,
                background: W.winBg, fontFamily: SANS, fontSize: 10, color: W.black,
                cursor: 'default', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                ...(activeWin === w.id && !w.minimized ? sunken : raised),
              }}
            >
              <span style={{ fontSize: 10 }}>{w.icon}</span>
              {w.label}
            </div>
          ))}

          <div style={{ flex: 1 }} />

          {/* System tray clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 22, padding: '0 8px', fontFamily: SANS, fontSize: 10, color: W.black, ...sunken }}>
            🔊 <Clock />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Desktop;
