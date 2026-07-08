import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

// ── Live desk clock ───────────────────────────────────────────────────────────
// The GLTF bakes a static "5:29" into the timmer_screen texture. This component
// overlays a thin plane on the screen's front face and draws the visitor's
// actual local time onto a canvas texture: light-pink 7-segment digits with
// faint "ghost" segments on a black panel.

const W = 840, H = 410;              // matches the screen face's ~2.05:1 aspect
const CELL_W = 112, CELL_H = 218, T = 28;
const DIGIT_X = [150, 280, 448, 578];
const DIGIT_Y = 96;

// which segments light up per digit (standard 7-segment layout a..g)
const SEGMENTS = {
  0: 'abcdef', 1: 'bc',     2: 'abged', 3: 'abgcd',   4: 'fgbc',
  5: 'afgcd',  6: 'afgedc', 7: 'abc',   8: 'abcdefg', 9: 'abcdfg',
};

const PALETTE_BASE = {
  frame:  '#141014',
  screen: '#0c090c',
  rim:    'rgba(255, 179, 198, 0.16)',
  lit:    '#ffb3c6',
  ghost:  '#302127',
};
// emissive map: only the lit segments glow, everything else stays dark
const PALETTE_GLOW = { frame: '#000000', screen: null, rim: null, lit: '#c14e6b', ghost: null };

// classic hexagonal LCD segment shape
function fillSegment(ctx, cx, cy, len, horizontal) {
  const l = len / 2, h = T / 2;
  ctx.beginPath();
  if (horizontal) {
    ctx.moveTo(cx - l, cy);
    ctx.lineTo(cx - l + h, cy - h);
    ctx.lineTo(cx + l - h, cy - h);
    ctx.lineTo(cx + l, cy);
    ctx.lineTo(cx + l - h, cy + h);
    ctx.lineTo(cx - l + h, cy + h);
  } else {
    ctx.moveTo(cx, cy - l);
    ctx.lineTo(cx + h, cy - l + h);
    ctx.lineTo(cx + h, cy + l - h);
    ctx.lineTo(cx, cy + l);
    ctx.lineTo(cx - h, cy + l - h);
    ctx.lineTo(cx - h, cy - l + h);
  }
  ctx.closePath();
  ctx.fill();
}

// digit === null draws all segments as ghosts (blank leading hour digit)
function drawDigit(ctx, x, y, digit, lit, ghost) {
  const hLen = CELL_W - T - 6;
  const vLen = CELL_H / 2 - T / 2 - 6;
  const topY = y + T / 4 + CELL_H / 4;
  const botY = y + CELL_H - (T / 4 + CELL_H / 4);
  const segs = {
    a: [x + CELL_W / 2, y + T / 2, hLen, true],
    g: [x + CELL_W / 2, y + CELL_H / 2, hLen, true],
    d: [x + CELL_W / 2, y + CELL_H - T / 2, hLen, true],
    f: [x + T / 2, topY, vLen, false],
    b: [x + CELL_W - T / 2, topY, vLen, false],
    e: [x + T / 2, botY, vLen, false],
    c: [x + CELL_W - T / 2, botY, vLen, false],
  };
  const on = digit === null ? '' : SEGMENTS[digit];
  for (const [name, [cx, cy, len, horizontal]] of Object.entries(segs)) {
    const color = on.includes(name) ? lit : ghost;
    if (!color) continue;
    ctx.fillStyle = color;
    fillSegment(ctx, cx, cy, len, horizontal);
  }
}

function drawFace(ctx, digits, colonOn, p) {
  ctx.fillStyle = p.frame;
  ctx.fillRect(0, 0, W, H);
  if (p.screen) {
    ctx.fillStyle = p.screen;
    ctx.beginPath();
    ctx.roundRect(54, 44, W - 108, H - 88, 24);
    ctx.fill();
  }
  if (p.rim) {
    ctx.strokeStyle = p.rim;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.roundRect(58, 48, W - 116, H - 96, 21);
    ctx.stroke();
  }
  // single-digit hours leave slot 0 as a ghost, so the lit time (280→690)
  // sits right of the panel centre — shift the group left to re-centre it
  const xOff = digits[0] === null ? -65 : 0;
  ctx.save();
  ctx.translate(xOff, 0);
  digits.forEach((d, i) => drawDigit(ctx, DIGIT_X[i], DIGIT_Y, d, p.lit, p.ghost));
  const colonColor = colonOn ? p.lit : p.ghost;
  if (colonColor) {
    ctx.fillStyle = colonColor;
    for (const dy of [-48, 48]) {
      ctx.beginPath();
      ctx.arc(420, H / 2 + dy, 15, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

const DeskClock = () => {
  const { mapTex, glowTex, redraw } = useMemo(() => {
    const makeCanvas = () => {
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      return c;
    };
    const baseCanvas = makeCanvas();
    const glowCanvas = makeCanvas();
    const mapTex  = new THREE.CanvasTexture(baseCanvas);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    mapTex.colorSpace = glowTex.colorSpace = THREE.SRGBColorSpace;
    mapTex.anisotropy = glowTex.anisotropy = 4;

    let last = '';
    const redraw = () => {
      const now     = new Date();
      const hours   = now.getHours() % 12 || 12;   // 12-hour, no leading zero — like the original 5:29
      const mins    = now.getMinutes();
      const colonOn = now.getSeconds() % 2 === 0;  // colon blinks once a second
      const key = `${hours}:${mins}:${colonOn}`;
      if (key === last) return;
      last = key;
      const digits = [hours >= 10 ? 1 : null, hours % 10, Math.floor(mins / 10), mins % 10];
      drawFace(baseCanvas.getContext('2d'), digits, colonOn, PALETTE_BASE);
      drawFace(glowCanvas.getContext('2d'), digits, colonOn, PALETTE_GLOW);
      mapTex.needsUpdate = glowTex.needsUpdate = true;
    };
    return { mapTex, glowTex, redraw };
  }, []);

  useEffect(() => {
    redraw();
    const id = setInterval(redraw, 250);
    return () => clearInterval(id);
  }, [redraw]);

  // rendered as a child of the timmer_screen mesh — the parent's non-uniform
  // scale stretches this unit plane to exactly cover the screen's front face
  // (geometry face is 1×1 in local space with its surface at z ≈ 0.989).
  // slightly oversized and nearly flush so the baked "5:29" never peeks out
  // around the edges at glancing angles
  return (
    <mesh position={[0, 0, 0.996]} scale={[1.01, 1.01, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        map={mapTex}
        emissiveMap={glowTex}
        emissive="#ffffff"
        emissiveIntensity={0.8}
        roughness={0.6}
        metalness={0}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  );
};

export default DeskClock;
