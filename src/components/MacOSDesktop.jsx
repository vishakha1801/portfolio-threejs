import { useCallback, useEffect, useRef, useState } from 'react';

// ── WebGL noise overlay ───────────────────────────────────────────────────────
const VERT_SRC = `attribute vec2 a_pos; void main(){gl_Position=vec4(a_pos,0.0,1.0);}`;
const FRAG_SRC = `
  #ifdef GL_ES precision mediump float; #endif
  const float PHI=1.61803398874989484820459;
  uniform float u_time;
  float noise(vec2 xy,float seed){return fract(tan(distance(xy*PHI,xy)*seed)*xy.x);}
  void main(){
    float n=noise(gl_FragCoord.xy,fract(u_time)+1.0);
    gl_FragColor=vec4(n*0.9,n*0.9,n*0.9,0.04);
  }
`;

const NoiseOverlay = ({ w, h }) => {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current;
    canvas.width = w; canvas.height = h;
    const gl = canvas.getContext('webgl', { premultipliedAlpha: false });
    if (!gl) return;
    const mk = (src, type) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, mk(VERT_SRC, gl.VERTEX_SHADER));
    gl.attachShader(prog, mk(FRAG_SRC, gl.FRAGMENT_SHADER));
    gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(prog, 'u_time');
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const t0 = performance.now();
    let raf;
    const draw = () => { gl.uniform1f(uTime, (performance.now()-t0)*0.001); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); raf = requestAnimationFrame(draw); };
    draw();
    return () => { cancelAnimationFrame(raf); gl.deleteBuffer(buf); gl.deleteProgram(prog); };
  }, [w, h]);
  return <canvas ref={ref} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:10 }} />;
};

// ── XP Color constants ────────────────────────────────────────────────────────
const XP_TITLE    = 'linear-gradient(180deg,#5090d8 0%,#1260c7 6%,#1256bb 50%,#0f4fad 94%,#0a3d9b 100%)';
const XP_TASKBAR  = 'linear-gradient(to bottom,#1e5ecc 0%,#3a88e8 45%,#1e5ecc 100%)';
const XP_WIN_BG   = '#ece9d8';
const XP_BORDER   = '#0054e3';
const TAHOMA      = 'Tahoma, "Trebuchet MS", sans-serif';

// ── XP Window chrome ──────────────────────────────────────────────────────────
const XPWindow = ({ title, icon, onClose, onFocus, zIndex = 10, initialX = 20, initialY = 20, children }) => {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const drag = useRef({ active: false, sx: 0, sy: 0 });

  const onDown = (e) => {
    if (drag.current.active) return;
    e.preventDefault(); onFocus?.();
    drag.current = { active: true, sx: e.clientX - pos.x, sy: e.clientY - pos.y };
    const mv = (e) => { if (drag.current.active) setPos({ x: e.clientX - drag.current.sx, y: e.clientY - drag.current.sy }); };
    const up = () => { drag.current.active = false; document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', mv);
    document.addEventListener('mouseup', up);
  };

  return (
    <div onMouseDown={onFocus} style={{
      position: 'absolute', left: pos.x, top: pos.y, zIndex,
      border: `2px solid ${XP_BORDER}`,
      boxShadow: '3px 3px 10px rgba(0,0,0,0.55)',
      borderRadius: 4, overflow: 'hidden', minWidth: 180,
    }}>
      {/* Title bar */}
      <div onMouseDown={onDown} style={{
        background: XP_TITLE, padding: '2px 3px 3px 5px',
        display: 'flex', alignItems: 'center', gap: 3,
        cursor: 'default', userSelect: 'none',
      }}>
        {icon && <span style={{ fontSize: 11 }}>{icon}</span>}
        <span style={{ flex: 1, color: '#fff', fontFamily: TAHOMA, fontSize: 11, fontWeight: 700, textShadow: '1px 1px 1px rgba(0,0,0,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </span>
        {/* Inactive buttons */}
        {['–','□'].map(ch => (
          <div key={ch} style={{
            width: 14, height: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(180deg,#e0dcd0 0%,#b8b4a8 100%)',
            border: '1px solid #888', borderRadius: 2, fontSize: 9, color: '#333',
            fontFamily: TAHOMA, cursor: 'default', flexShrink: 0,
          }}>{ch}</div>
        ))}
        {/* Close */}
        <div
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(180deg,#e85050 0%,#a80000 100%)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(180deg,#e0dcd0 0%,#b8b4a8 100%)'; e.currentTarget.style.color = '#333'; }}
          style={{
            width: 16, height: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(180deg,#e0dcd0 0%,#b8b4a8 100%)',
            border: '1px solid #888', borderRadius: 2, fontSize: 12, color: '#333',
            fontFamily: TAHOMA, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          }}>×</div>
      </div>
      {/* Toolbar strip */}
      <div style={{ height: 1, background: '#315fbf' }} />
      {/* Content */}
      <div style={{ background: XP_WIN_BG }}>
        {children}
      </div>
    </div>
  );
};

// ── About content ─────────────────────────────────────────────────────────────
const AboutContent = () => (
  <div style={{ fontFamily: TAHOMA, fontSize: 11, padding: '8px 10px', width: 200 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #b8b4a8' }}>
      <span style={{ fontSize: 28 }}>💻</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 12 }}>Vishakha Pathak</div>
        <div style={{ color: '#666', fontSize: 10 }}>Software Engineer</div>
      </div>
    </div>
    {[
      ['School', 'MS Info Systems @ CMU'],
      ['Email',  'vishakhamanojpathak18@gmail.com'],
      ['GitHub', 'github.com/vishakha1801'],
      ['Web',    'vishakhapathak.com'],
    ].map(([k, v]) => (
      <div key={k} style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
        <span style={{ color: '#666', minWidth: 42, fontSize: 10 }}>{k}:</span>
        <span style={{ color: k === 'School' ? '#111' : '#0033cc', textDecoration: k !== 'School' ? 'underline' : 'none', fontSize: 10, wordBreak: 'break-all' }}>{v}</span>
      </div>
    ))}
    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #b8b4a8' }}>
      <div style={{ color: '#666', fontSize: 10, marginBottom: 5 }}>Skills:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {['React', 'TypeScript', 'Python', 'Java', 'AWS', 'SQL', 'Node.js'].map(s => (
          <span key={s} style={{
            background: '#fff', border: '1px solid #8aa0b8',
            padding: '1px 5px', fontSize: 9, color: '#333',
            borderRadius: 2,
          }}>{s}</span>
        ))}
      </div>
    </div>
  </div>
);

// ── Tetris ────────────────────────────────────────────────────────────────────
const COLS = 10, ROWS = 18, CELL = 10;

const PIECES = [
  { shapes: [[[1,1,1,1]],[[1],[1],[1],[1]]], color: '#00ccee' },
  { shapes: [[[1,1],[1,1]]], color: '#eeee00' },
  { shapes: [[[0,1,0],[1,1,1]],[[1,0],[1,1],[1,0]],[[1,1,1],[0,1,0]],[[0,1],[1,1],[0,1]]], color: '#aa00ee' },
  { shapes: [[[0,1,1],[1,1,0]],[[1,0],[1,1],[0,1]]], color: '#00ee44' },
  { shapes: [[[1,1,0],[0,1,1]],[[0,1],[1,1],[1,0]]], color: '#ee2222' },
  { shapes: [[[1,0,0],[1,1,1]],[[1,1],[1,0],[1,0]],[[1,1,1],[0,0,1]],[[0,1],[0,1],[1,1]]], color: '#2255ff' },
  { shapes: [[[0,0,1],[1,1,1]],[[1,0],[1,0],[1,1]],[[1,1,1],[1,0,0]],[[1,1],[0,1],[0,1]]], color: '#ff8800' },
];

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
const newPiece   = () => { const p = PIECES[Math.floor(Math.random()*PIECES.length)]; return { piece:p, rot:0, x:Math.floor(COLS/2)-1, y:0 }; };
const getShape   = (a) => a.piece.shapes[a.rot % a.piece.shapes.length];
const isValid    = (board, shape, x, y) => {
  for (let r=0;r<shape.length;r++) for (let c=0;c<shape[r].length;c++)
    if (shape[r][c]) { if (x+c<0||x+c>=COLS||y+r>=ROWS) return false; if (y+r>=0&&board[y+r][x+c]) return false; }
  return true;
};

const TetrisContent = () => {
  const canvasRef = useRef();
  const gs  = useRef(null);
  const [ui, setUi] = useState({ score:0, level:1, lines:0, over:false });

  const mkState = () => ({ board:emptyBoard(), active:newPiece(), score:0, level:1, lines:0, over:false });

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gs.current) return;
    const ctx = canvas.getContext('2d');
    const s = gs.current;
    const W = COLS*CELL, H = ROWS*CELL;
    ctx.fillStyle = '#111'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 0.5;
    for (let r=0;r<=ROWS;r++){ctx.beginPath();ctx.moveTo(0,r*CELL);ctx.lineTo(W,r*CELL);ctx.stroke();}
    for (let c=0;c<=COLS;c++){ctx.beginPath();ctx.moveTo(c*CELL,0);ctx.lineTo(c*CELL,H);ctx.stroke();}
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (s.board[r][c]){ctx.fillStyle=s.board[r][c];ctx.fillRect(c*CELL+1,r*CELL+1,CELL-2,CELL-2);}
    if (!s.over && s.active) {
      const shape = getShape(s.active);
      let gy = s.active.y;
      while (isValid(s.board,shape,s.active.x,gy+1)) gy++;
      ctx.fillStyle='rgba(255,255,255,0.08)';
      for (let r=0;r<shape.length;r++) for (let c=0;c<shape[r].length;c++) if (shape[r][c]) ctx.fillRect((s.active.x+c)*CELL+1,(gy+r)*CELL+1,CELL-2,CELL-2);
      ctx.fillStyle=s.active.piece.color;
      for (let r=0;r<shape.length;r++) for (let c=0;c<shape[r].length;c++) if (shape[r][c]) ctx.fillRect((s.active.x+c)*CELL+1,(s.active.y+r)*CELL+1,CELL-2,CELL-2);
    }
    if (s.over) {
      ctx.fillStyle='rgba(0,0,0,0.75)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#fff'; ctx.font=`bold ${CELL}px Tahoma`; ctx.textAlign='center';
      ctx.fillText('GAME OVER', W/2, H/2-CELL); ctx.font=`${CELL-1}px Tahoma`; ctx.fillText('press R', W/2, H/2+CELL);
    }
  }, []);

  const lock = useCallback(() => {
    const s = gs.current;
    const shape = getShape(s.active);
    const board = s.board.map(r=>[...r]);
    for (let r=0;r<shape.length;r++) for (let c=0;c<shape[r].length;c++) if (shape[r][c]&&s.active.y+r>=0) board[s.active.y+r][s.active.x+c]=s.active.piece.color;
    let cleared=0;
    const kept=board.filter(row=>row.some(c=>!c));
    while(kept.length<ROWS){kept.unshift(Array(COLS).fill(null));cleared++;}
    const lines=s.lines+cleared, score=s.score+[0,40,100,300,1200][cleared]*s.level, level=Math.floor(lines/10)+1;
    const active=newPiece(), over=!isValid(kept,getShape(active),active.x,active.y);
    gs.current={board:kept,active,score,level,lines,over}; setUi({score,level,lines,over});
  }, []);

  const tick = useCallback(() => {
    const s=gs.current; if(!s||s.over) return;
    const shape=getShape(s.active);
    if(isValid(s.board,shape,s.active.x,s.active.y+1)) gs.current={...s,active:{...s.active,y:s.active.y+1}}; else lock();
    render();
  }, [lock, render]);

  useEffect(() => { gs.current=mkState(); render(); }, [render]);
  useEffect(() => {
    if(ui.over) return;
    const id=setInterval(tick,Math.max(80,700-(ui.level-1)*60));
    return ()=>clearInterval(id);
  }, [tick,ui.level,ui.over]);

  useEffect(() => {
    const GAME_KEYS=new Set(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space','KeyR']);
    const onKey=(e)=>{
      if(!GAME_KEYS.has(e.code)) return;
      e.preventDefault(); e.stopPropagation();
      const s=gs.current; if(!s) return;
      if(e.code==='KeyR'){gs.current=mkState();setUi({score:0,level:1,lines:0,over:false});render();return;}
      if(s.over) return;
      let {active}=s; const shape=getShape(active);
      if(e.code==='ArrowLeft'&&isValid(s.board,shape,active.x-1,active.y)) active={...active,x:active.x-1};
      else if(e.code==='ArrowRight'&&isValid(s.board,shape,active.x+1,active.y)) active={...active,x:active.x+1};
      else if(e.code==='ArrowDown'&&isValid(s.board,shape,active.x,active.y+1)) active={...active,y:active.y+1};
      else if(e.code==='ArrowUp'){const rot=active.piece.shapes[(active.rot+1)%active.piece.shapes.length];if(isValid(s.board,rot,active.x,active.y))active={...active,rot:active.rot+1};}
      else if(e.code==='Space'){let ny=active.y;while(isValid(s.board,shape,active.x,ny+1))ny++;gs.current={...s,active:{...active,y:ny}};lock();render();return;}
      gs.current={...s,active}; render();
    };
    window.addEventListener('keydown',onKey);
    return ()=>window.removeEventListener('keydown',onKey);
  }, [lock, render]);

  return (
    <div style={{ display:'flex', gap:8, padding:'6px 8px', background:'#d4d0c8' }}>
      <canvas ref={canvasRef} width={COLS*CELL} height={ROWS*CELL} style={{ border:'2px inset #888', display:'block' }} />
      <div style={{ fontFamily:TAHOMA, fontSize:10, lineHeight:1.5, color:'#333' }}>
        {[['SCORE',ui.score],['LEVEL',ui.level],['LINES',ui.lines]].map(([k,v])=>(
          <div key={k} style={{ marginBottom:8 }}>
            <div style={{ color:'#666', fontSize:9 }}>{k}</div>
            <div style={{ fontWeight:700, fontSize:13 }}>{v}</div>
          </div>
        ))}
        <div style={{ marginTop:6, fontSize:9, color:'#888', lineHeight:1.8 }}>
          ←→ move<br/>↑ rotate<br/>↓ fall<br/>SPC drop<br/>R reset
        </div>
      </div>
    </div>
  );
};

// ── Desktop icon ──────────────────────────────────────────────────────────────
const DesktopIcon = ({ icon, label, onDoubleClick }) => {
  const [sel, setSel] = useState(false);
  return (
    <div
      onClick={() => setSel(true)}
      onDoubleClick={onDoubleClick}
      onBlur={() => setSel(false)}
      tabIndex={0}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', width:52, padding:4, cursor:'default', outline:'none' }}>
      <div style={{
        fontSize: 26, width:36, height:36,
        display:'flex', alignItems:'center', justifyContent:'center',
        background: sel ? 'rgba(100,160,230,0.5)' : 'transparent',
        outline: sel ? '1px dotted #fff' : 'none',
        borderRadius: 2,
      }}>{icon}</div>
      <span style={{
        fontFamily: TAHOMA, fontSize: 10, color: '#fff',
        textShadow: '1px 1px 2px #000',
        background: sel ? '#316ac5' : 'transparent',
        padding: '0 2px', textAlign: 'center', marginTop: 2,
        maxWidth: 52, wordBreak: 'break-word', lineHeight: 1.2,
      }}>{label}</span>
    </div>
  );
};

// ── Clock ─────────────────────────────────────────────────────────────────────
const Clock = () => {
  const [t, setT] = useState(() => new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }));
  useEffect(() => {
    const id = setInterval(() => setT(new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})), 30000);
    return () => clearInterval(id);
  }, []);
  return <span>{t}</span>;
};

// ── Main component ────────────────────────────────────────────────────────────
const WINDOWS_DEF = [
  { id:'about',  label:'About Me',    icon:'📋', Panel:AboutContent,  w:224, h:0 },
  { id:'tetris', label:'Tetris',      icon:'🎮', Panel:TetrisContent, w:160, h:0 },
];

const MacOSDesktop = ({ bounds, onClose }) => {
  const [visible,      setVisible]      = useState(false);
  const [openWindows,  setOpenWindows]  = useState([{ ...WINDOWS_DEF[0], zIndex:10 }]);
  const [startOpen,    setStartOpen]    = useState(false);
  const [activeWin,    setActiveWin]    = useState('about');
  const zRef = useRef(10);

  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(raf);
  }, []);

  const bringToFront = useCallback((id) => {
    zRef.current += 1;
    setActiveWin(id);
    setOpenWindows(prev => prev.map(w => w.id===id ? {...w, zIndex:zRef.current} : w));
  }, []);

  const openWindow = useCallback((def) => {
    setStartOpen(false);
    const existing = openWindows.find(w => w.id===def.id);
    if (existing) { bringToFront(def.id); return; }
    zRef.current += 1;
    const offset = openWindows.length * 14;
    setOpenWindows(prev => [...prev, { ...def, zIndex:zRef.current, initialX: 10+offset, initialY: 10+offset }]);
    setActiveWin(def.id);
  }, [openWindows, bringToFront]);

  const closeWindow = useCallback((id) => {
    setOpenWindows(prev => prev.filter(w => w.id!==id));
  }, []);

  const handleExit = () => { setVisible(false); setTimeout(onClose, 300); };

  const TASKBAR_H = 24;

  return (
    <div style={{
      position: 'fixed',
      left: bounds.left, top: bounds.top,
      width: bounds.width, height: bounds.height,
      zIndex: 100, overflow: 'hidden',
      borderRadius: 8,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.35s ease',
      animation: 'xp-jitter 0.3s ease-in-out infinite, xp-flicker 6s ease-in-out infinite',
    }}>
      <style>{`
        @keyframes xp-jitter {
          10%  { transform: translate(-0.2px,-0.2px); }
          20%  { transform: translate(0.15px,-0.2px); }
          30%  { transform: translate(-0.15px,0px);   }
          40%  { transform: translate(0px,0.15px);    }
          50%  { transform: translate(0.15px,0.15px); }
          60%  { transform: translate(-0.2px,0.15px); }
          70%  { transform: translate(0px,-0.15px);   }
          80%  { transform: translate(0.15px,0px);    }
          90%  { transform: translate(-0.15px,0.15px);}
          100% { transform: translate(0px,0px);       }
        }
        @keyframes xp-flicker {
          0%,100%{opacity:1} 5%{opacity:0.97} 48%{opacity:1} 50%{opacity:0.94} 52%{opacity:1} 93%{opacity:0.98} 95%{opacity:1}
        }
      `}</style>

      <NoiseOverlay w={Math.round(bounds.width)} h={Math.round(bounds.height)} />

      {/* CRT scanlines */}
      <div style={{ position:'absolute', inset:0, zIndex:9999, pointerEvents:'none',
        backgroundImage:'repeating-linear-gradient(0deg,rgba(0,0,0,0.04) 0px,rgba(0,0,0,0.04) 1px,transparent 1px,transparent 2px)' }} />

      {/* Desktop area */}
      <div
        style={{
          position: 'absolute', left:0, top:0,
          width:'100%', height:`calc(100% - ${TASKBAR_H}px)`,
          background: 'radial-gradient(ellipse at 50% 110%, #5aad38 0%, #3d8e20 35%, #285f10 55%, #4a8ec8 55%, #2c70c0 75%, #1850a8 100%)',
          overflow: 'hidden',
        }}
        onClick={() => setStartOpen(false)}>

        {/* Desktop icons */}
        <div style={{ display:'flex', flexDirection:'column', gap:4, padding:'6px 4px', position:'relative', zIndex:1 }}>
          {WINDOWS_DEF.map(def => (
            <DesktopIcon key={def.id} icon={def.icon} label={def.label} onDoubleClick={() => openWindow(def)} />
          ))}
        </div>

        {/* Open windows */}
        {openWindows.map((w, idx) => {
          const Panel = w.Panel;
          return (
            <XPWindow
              key={w.id}
              title={w.label}
              icon={w.icon}
              zIndex={w.zIndex}
              initialX={w.initialX ?? 10 + idx*14}
              initialY={w.initialY ?? 10 + idx*14}
              onClose={() => closeWindow(w.id)}
              onFocus={() => bringToFront(w.id)}>
              <Panel />
            </XPWindow>
          );
        })}

        {/* Start menu popup */}
        {startOpen && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, width: 160, zIndex: 5000,
            border: `2px solid ${XP_BORDER}`,
            boxShadow: '3px 0 8px rgba(0,0,0,0.5)',
            borderRadius: '4px 4px 0 0', overflow: 'hidden',
          }}>
            <div style={{ background: XP_TITLE, padding:'6px 8px', color:'#fff', fontFamily:TAHOMA, fontSize:11, fontWeight:700 }}>
              Vishakha Pathak
            </div>
            <div style={{ background:'#d4d0c8', padding:'4px 0' }}>
              {WINDOWS_DEF.map(def => (
                <div key={def.id}
                  onClick={() => openWindow(def)}
                  onMouseEnter={e => e.currentTarget.style.background='#316ac5'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 10px', cursor:'default', fontFamily:TAHOMA, fontSize:11, color:'#000' }}>
                  <span style={{ fontSize:14 }}>{def.icon}</span>{def.label}
                </div>
              ))}
              <div style={{ borderTop:'1px solid #999', margin:'4px 0' }} />
              <div
                onClick={handleExit}
                onMouseEnter={e => e.currentTarget.style.background='#316ac5'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 10px', cursor:'default', fontFamily:TAHOMA, fontSize:11, color:'#000' }}>
                <span style={{ fontSize:14 }}>⏻</span> Shut Down
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Taskbar */}
      <div style={{
        position: 'absolute', bottom:0, left:0, right:0,
        height: TASKBAR_H, display:'flex', alignItems:'center', gap:2,
        background: XP_TASKBAR, padding:'0 3px', flexShrink:0, zIndex:4000,
        borderTop: '1px solid #6090d8',
      }}>
        {/* Start button */}
        <button
          onClick={(e) => { e.stopPropagation(); setStartOpen(s => !s); }}
          style={{
            background: startOpen
              ? 'linear-gradient(180deg,#2a8000 0%,#3fa800 100%)'
              : 'linear-gradient(180deg,#4cba1e 0%,#2e8a00 100%)',
            border: '1px solid #1a5800',
            borderRadius: '0 9px 9px 0', padding:'1px 8px 1px 5px',
            fontFamily:TAHOMA, fontWeight:700, fontSize:11, color:'#fff',
            cursor:'pointer', letterSpacing:'0.02em',
            display:'flex', alignItems:'center', gap:3, height:20,
            boxShadow: startOpen ? 'inset 1px 1px 2px rgba(0,0,0,0.3)' : 'none',
          }}>
          <span style={{ fontSize:13 }}>⊞</span> start
        </button>

        {/* Divider */}
        <div style={{ width:1, height:16, background:'#0a4fb5', margin:'0 2px' }} />

        {/* Open window buttons */}
        {openWindows.map(w => (
          <button key={w.id}
            onClick={() => bringToFront(w.id)}
            style={{
              background: activeWin===w.id
                ? 'linear-gradient(180deg,#7aaad8 0%,#4878b8 100%)'
                : 'linear-gradient(180deg,#3070c8 0%,#1a52a0 100%)',
              border: '1px solid #0a4fb5',
              padding:'1px 6px', maxWidth:70, height:18,
              fontFamily:TAHOMA, fontSize:10, color:'#fff',
              cursor:'pointer', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              display:'flex', alignItems:'center', gap:3,
              boxShadow: activeWin===w.id ? 'inset 1px 1px 2px rgba(0,0,0,0.3)' : 'none',
            }}>
            <span style={{ fontSize:10 }}>{w.icon}</span>{w.label}
          </button>
        ))}

        <div style={{ flex:1 }} />

        {/* System tray */}
        <div style={{
          background:'linear-gradient(180deg,#1258b8 0%,#2474d8 100%)',
          border:'1px solid #0a4fb5', padding:'1px 6px', height:18,
          fontFamily:TAHOMA, fontSize:10, color:'#fff',
          display:'flex', alignItems:'center', gap:4, borderRadius:2,
        }}>
          🔊 <Clock />
        </div>
      </div>
    </div>
  );
};

export default MacOSDesktop;
