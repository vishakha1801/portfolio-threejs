import { useCallback, useEffect, useRef, useState } from 'react';

// ── Board constants ───────────────────────────────────────────────────────────
const COLS = 10;
const ROWS = 20;
const CELL = 16;

// ── Piece definitions ─────────────────────────────────────────────────────────
const PIECES = [
  { shapes: [[[1,1,1,1]], [[1],[1],[1],[1]]],                                                                                    color: '#00ccee' }, // I
  { shapes: [[[1,1],[1,1]]],                                                                                                     color: '#eeee00' }, // O
  { shapes: [[[0,1,0],[1,1,1]],[[1,0],[1,1],[1,0]],[[1,1,1],[0,1,0]],[[0,1],[1,1],[0,1]]],                                     color: '#aa00ee' }, // T
  { shapes: [[[0,1,1],[1,1,0]],[[1,0],[1,1],[0,1]]],                                                                            color: '#00ee44' }, // S
  { shapes: [[[1,1,0],[0,1,1]],[[0,1],[1,1],[1,0]]],                                                                            color: '#ee2222' }, // Z
  { shapes: [[[1,0,0],[1,1,1]],[[1,1],[1,0],[1,0]],[[1,1,1],[0,0,1]],[[0,1],[0,1],[1,1]]],                                     color: '#2255ff' }, // J
  { shapes: [[[0,0,1],[1,1,1]],[[1,0],[1,0],[1,1]],[[1,1,1],[1,0,0]],[[1,1],[0,1],[0,1]]],                                     color: '#ff8800' }, // L
];

// ── Board helpers ─────────────────────────────────────────────────────────────
const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
const newPiece   = () => { const p = PIECES[Math.floor(Math.random() * PIECES.length)]; return { piece: p, rot: 0, x: Math.floor(COLS / 2) - 1, y: 0 }; };
const getShape   = a => a.piece.shapes[a.rot % a.piece.shapes.length];

const isValid = (board, shape, x, y) => {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) {
        if (x + c < 0 || x + c >= COLS || y + r >= ROWS) return false;
        if (y + r >= 0 && board[y + r][x + c]) return false;
      }
  return true;
};

// ── Component ─────────────────────────────────────────────────────────────────
const TetrisGame = () => {
  const canvasRef = useRef();
  const gs        = useRef(null);
  const [ui, setUi] = useState({ score: 0, level: 1, lines: 0, over: false });

  const mkState = () => ({ board: emptyBoard(), active: newPiece(), score: 0, level: 1, lines: 0, over: false });

  const drawCell = useCallback((ctx, x, y, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x + 1, y + 1, CELL - 2, 3);
    ctx.fillRect(x + 1, y + 1, 3, CELL - 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x + 1, y + CELL - 4, CELL - 2, 3);
    ctx.fillRect(x + CELL - 4, y + 1, 3, CELL - 2);
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gs.current) return;
    const ctx = canvas.getContext('2d');
    const s   = gs.current;
    const W2  = COLS * CELL;
    const H   = ROWS * CELL;

    ctx.fillStyle = '#080818';
    ctx.fillRect(0, 0, W2, H);

    ctx.strokeStyle = '#12122a';
    ctx.lineWidth   = 1;
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(W2, r * CELL); ctx.stroke(); }
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, H); ctx.stroke(); }

    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (s.board[r][c]) drawCell(ctx, c * CELL, r * CELL, s.board[r][c]);

    if (!s.over && s.active) {
      const shape = getShape(s.active);
      let ghostY  = s.active.y;
      while (isValid(s.board, shape, s.active.x, ghostY + 1)) ghostY++;

      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[r].length; c++)
          if (shape[r][c]) ctx.fillRect((s.active.x + c) * CELL + 2, (ghostY + r) * CELL + 2, CELL - 4, CELL - 4);

      for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[r].length; c++)
          if (shape[r][c]) drawCell(ctx, (s.active.x + c) * CELL, (s.active.y + r) * CELL, s.active.piece.color);
    }

    if (s.over) {
      ctx.fillStyle = 'rgba(0,0,10,0.82)';
      ctx.fillRect(0, 0, W2, H);
      ctx.fillStyle = '#ff4466';
      ctx.font = `bold ${CELL + 2}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W2 / 2, H / 2 - CELL);
      ctx.fillStyle = '#aaa';
      ctx.font = `${CELL - 2}px monospace`;
      ctx.fillText('press R to restart', W2 / 2, H / 2 + CELL);
    }
  }, [drawCell]);

  const lock = useCallback(() => {
    const s     = gs.current;
    const shape = getShape(s.active);
    const board = s.board.map(r => [...r]);

    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c] && s.active.y + r >= 0)
          board[s.active.y + r][s.active.x + c] = s.active.piece.color;

    let cleared = 0;
    const kept  = board.filter(row => row.some(c => !c));
    while (kept.length < ROWS) { kept.unshift(Array(COLS).fill(null)); cleared++; }

    const lines  = s.lines + cleared;
    const score  = s.score + [0, 40, 100, 300, 1200][cleared] * s.level;
    const level  = Math.floor(lines / 10) + 1;
    const active = newPiece();
    const over   = !isValid(kept, getShape(active), active.x, active.y);

    gs.current = { board: kept, active, score, level, lines, over };
    setUi({ score, level, lines, over });
  }, []);

  const tick = useCallback(() => {
    const s = gs.current;
    if (!s || s.over) return;
    const shape = getShape(s.active);
    if (isValid(s.board, shape, s.active.x, s.active.y + 1))
      gs.current = { ...s, active: { ...s.active, y: s.active.y + 1 } };
    else
      lock();
    render();
  }, [lock, render]);

  useEffect(() => { gs.current = mkState(); render(); }, [render]);

  useEffect(() => {
    if (ui.over) return;
    const id = setInterval(tick, Math.max(80, 700 - (ui.level - 1) * 60));
    return () => clearInterval(id);
  }, [tick, ui.level, ui.over]);

  useEffect(() => {
    const GAME_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space', 'KeyR']);
    const onKey = (e) => {
      if (!GAME_KEYS.has(e.code)) return;
      e.preventDefault();
      e.stopPropagation();
      const s = gs.current;
      if (!s) return;

      if (e.code === 'KeyR') {
        gs.current = mkState();
        setUi({ score: 0, level: 1, lines: 0, over: false });
        render();
        return;
      }
      if (s.over) return;

      let { active } = s;
      const shape = getShape(active);

      if      (e.code === 'ArrowLeft'  && isValid(s.board, shape, active.x - 1, active.y)) active = { ...active, x: active.x - 1 };
      else if (e.code === 'ArrowRight' && isValid(s.board, shape, active.x + 1, active.y)) active = { ...active, x: active.x + 1 };
      else if (e.code === 'ArrowDown'  && isValid(s.board, shape, active.x, active.y + 1)) active = { ...active, y: active.y + 1 };
      else if (e.code === 'ArrowUp') {
        const rotated = active.piece.shapes[(active.rot + 1) % active.piece.shapes.length];
        if (isValid(s.board, rotated, active.x, active.y)) active = { ...active, rot: active.rot + 1 };
      } else if (e.code === 'Space') {
        let ny = active.y;
        while (isValid(s.board, shape, active.x, ny + 1)) ny++;
        gs.current = { ...s, active: { ...active, y: ny } };
        lock();
        render();
        return;
      }

      gs.current = { ...s, active };
      render();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lock, render]);

  return (
    <div style={{ display: 'flex', background: '#080818' }}>
      <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} style={{ display: 'block', flexShrink: 0 }} />
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        padding: '12px 10px', background: '#0e0e22',
        borderLeft: '1px solid #1a1a3a', minWidth: 80,
      }}>
        {[['SCORE', ui.score], ['LEVEL', ui.level], ['LINES', ui.lines]].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#4466aa', letterSpacing: 1, marginBottom: 2 }}>{k}</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16, color: '#00ffcc' }}>{v}</div>
          </div>
        ))}
        <div style={{ marginTop: 'auto', fontFamily: 'monospace', fontSize: 8, color: '#334', lineHeight: 2 }}>
          ← → move<br />↑ rotate<br />↓ soft drop<br />SPC hard drop<br />R restart
        </div>
      </div>
    </div>
  );
};

export default TetrisGame;
