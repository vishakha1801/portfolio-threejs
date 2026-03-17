import { useRef, useState } from 'react';
import { W, SANS, raised, sunken, deepRaised } from './theme.js';

const TASKBAR_H = 32;

// ── Title-bar icon buttons ────────────────────────────────────────────────────
export const TitleBtn95 = ({ label, onClick, style }) => {
  const [down, setDown] = useState(false);
  return (
    <div
      onMouseDown={() => onClick && setDown(true)}
      onMouseUp={() => setDown(false)}
      onMouseLeave={() => setDown(false)}
      onClick={onClick}
      style={{
        width: 16, height: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: W.winBg,
        ...(down ? sunken : raised),
        fontSize: 9, fontWeight: 700, fontFamily: SANS,
        color: W.black, cursor: 'default',
        flexShrink: 0, userSelect: 'none',
        ...style,
      }}
    >{label}</div>
  );
};

// ── Standard Win95 button ─────────────────────────────────────────────────────
export const Btn95 = ({ children, onClick, style }) => {
  const [down, setDown] = useState(false);
  return (
    <button
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      onMouseLeave={() => setDown(false)}
      onClick={onClick}
      style={{
        background: W.winBg, fontFamily: SANS, fontSize: 11, color: W.black,
        padding: '3px 12px', cursor: 'default',
        ...(down ? sunken : raised),
        ...style,
      }}
    >{children}</button>
  );
};

// ── Typography helpers ────────────────────────────────────────────────────────
export const H1 = ({ children, style }) => (
  <h1 style={{ fontFamily: SANS, fontSize: 20, margin: '0 0 2px 0', color: W.black, fontWeight: 700, ...style }}>
    {children}
  </h1>
);

export const Sub = ({ children }) => (
  <p style={{ fontFamily: SANS, fontSize: 12, color: '#444', margin: '0 0 14px 0' }}>{children}</p>
);

export const SecTitle = ({ children }) => (
  <div style={{
    fontFamily: SANS, fontSize: 11, fontWeight: 700,
    margin: '14px 0 6px 0', color: W.black,
    borderBottom: `1px solid ${W.dark}`, paddingBottom: 3,
    textTransform: 'uppercase', letterSpacing: 1,
  }}>{children}</div>
);

export const P = ({ children, style }) => (
  <p style={{ fontFamily: SANS, fontSize: 11, lineHeight: 1.7, color: '#111', margin: '0 0 8px 0', ...style }}>
    {children}
  </p>
);

// ── Draggable, maximizable Win95 window chrome ────────────────────────────────
const Win95Window = ({
  title, icon, onClose, onMinimize, onFocus,
  zIndex = 10, initialX = 20, initialY = 20,
  desktopW = 400, desktopH = 300,
  winWidth, winHeight,
  noMaximize = false,
  children,
}) => {
  const [pos, setPos]               = useState({ x: initialX, y: initialY });
  const [isMaximized, setIsMaximized] = useState(false);
  const preMax = useRef(null);
  const drag   = useRef({ active: false, sx: 0, sy: 0 });

  const onDown = (e) => {
    if (drag.current.active || isMaximized) return;
    e.preventDefault();
    onFocus?.();
    drag.current = { active: true, sx: e.clientX - pos.x, sy: e.clientY - pos.y };
    const mv = (e) => {
      if (drag.current.active) setPos({ x: e.clientX - drag.current.sx, y: e.clientY - drag.current.sy });
    };
    const up = () => {
      drag.current.active = false;
      document.removeEventListener('mousemove', mv);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', mv);
    document.addEventListener('mouseup', up);
  };

  const handleMaximize = (e) => {
    e.stopPropagation();
    if (isMaximized) {
      if (preMax.current) setPos(preMax.current);
      setIsMaximized(false);
    } else {
      preMax.current = { ...pos };
      setPos({ x: 0, y: 0 });
      setIsMaximized(true);
    }
  };

  const containerStyle = isMaximized
    ? {
        position: 'absolute', left: 0, top: 0,
        width: desktopW, height: desktopH - TASKBAR_H - 11,
        zIndex, background: W.winBg,
        border: 'none', outline: 'none',
        boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column',
      }
    : {
        position: 'absolute', left: pos.x, top: pos.y,
        zIndex, background: W.winBg, ...deepRaised,
        ...(winWidth  ? { width: winWidth }  : {}),
        ...(winHeight ? { height: winHeight, display: 'flex', flexDirection: 'column' } : {}),
      };

  return (
    <div onMouseDown={onFocus} style={containerStyle}>
      {/* Title bar */}
      <div onMouseDown={onDown} style={{
        background: W.titleActive,
        backgroundImage: `linear-gradient(90deg, ${W.titleActive}, #1084d0)`,
        padding: '2px 3px 2px 4px',
        display: 'flex', alignItems: 'center', gap: 3,
        cursor: isMaximized ? 'default' : 'move',
        userSelect: 'none', height: 22, flexShrink: 0,
      }}>
        {icon && <span style={{ fontSize: 11, lineHeight: 1 }}>{icon}</span>}
        <span style={{
          flex: 1, color: W.titleText, fontFamily: SANS, fontSize: 11, fontWeight: 700,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{title}</span>
        <TitleBtn95 label="─" onClick={(e) => { e.stopPropagation(); onMinimize?.(); }} />
        <TitleBtn95
          label={isMaximized ? '❐' : '□'}
          onClick={noMaximize ? undefined : handleMaximize}
          style={{ opacity: noMaximize ? 0.4 : 1, cursor: noMaximize ? 'default' : undefined }}
        />
        <TitleBtn95 label="✕" onClick={(e) => { e.stopPropagation(); onClose(); }} />
      </div>

      {/* Content slot */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: W.winBg }}>
        {children}
      </div>
    </div>
  );
};

export default Win95Window;
