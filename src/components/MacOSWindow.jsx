import { useRef, useState } from 'react';

const MacOSWindow = ({
  title,
  onClose,
  onFocus,
  children,
  zIndex    = 20,
  initialX  = 16,
  initialY  = 16,
}) => {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const dragRef = useRef({ active: false, startX: 0, startY: 0 });

  const onTitleMouseDown = (e) => {
    if (dragRef.current.active) return;
    e.preventDefault();
    onFocus?.();
    dragRef.current = { active: true, startX: e.clientX - pos.x, startY: e.clientY - pos.y };
    const onMove = (e) => {
      if (!dragRef.current.active) return;
      setPos({ x: e.clientX - dragRef.current.startX, y: e.clientY - dragRef.current.startY });
    };
    const onUp = () => {
      dragRef.current.active = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div
      onMouseDown={onFocus}
      style={{
        position: 'absolute',
        left: pos.x, top: pos.y,
        width: 260,
        maxHeight: 280,
        display: 'flex', flexDirection: 'column',
        zIndex,
        /* Mac OS 8/9 raised-bevel chrome */
        borderTop:    '2px solid #ffffff',
        borderLeft:   '2px solid #ffffff',
        borderRight:  '2px solid #888888',
        borderBottom: '2px solid #888888',
        background: '#c8a0b8',
        fontFamily: "'Chicago','Charcoal',system-ui",
      }}>

      {/* Title bar */}
      <div
        onMouseDown={onTitleMouseDown}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 5px',
          background: '#3a3a3a',
          cursor: 'move', userSelect: 'none', minHeight: 22,
        }}>
        {/* Three square Mac OS buttons */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            width: 12, height: 12, padding: 0, flexShrink: 0,
            background: '#c0c0c0', border: '1px solid #000',
            cursor: 'pointer',
          }}
        />
        <div style={{ width: 12, height: 12, background: '#c0c0c0', border: '1px solid #000', flexShrink: 0 }} />
        <div style={{ width: 12, height: 12, background: '#c0c0c0', border: '1px solid #000', flexShrink: 0 }} />
        <span style={{
          flex: 1, textAlign: 'center',
          fontSize: 11, color: '#fff',
          letterSpacing: '0.5px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title}
        </span>
      </div>

      {/* Content area */}
      <div style={{
        background: '#fffef8',
        padding: '10px 12px',
        overflowY: 'auto',
        flex: 1,
        fontSize: 12, lineHeight: 1.6, color: '#1a1a1a',
      }}>
        {children}
      </div>
    </div>
  );
};

export default MacOSWindow;
