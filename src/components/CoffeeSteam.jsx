import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Coffee steam ──────────────────────────────────────────────────────────────
// Soft circular vapour blobs that rise off the coffee, sway a little, and
// shrink + dissolve as they climb. Rendered as camera-facing sprites so the
// puffs read as round blobs from any angle.

// one shared soft-circle texture — a radial gradient fading out at the rim
const makePuffTexture = () => {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0,    'rgba(255, 255, 255, 0.9)');
  grad.addColorStop(0.4,  'rgba(255, 255, 255, 0.5)');
  grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.14)');
  grad.addColorStop(1,    'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const PUFF_COUNT = 7;
const RISE = 2.8;          // how far a puff climbs (in room-group units) before dissolving
const PEAK_OPACITY = 0.42;

const CoffeeSteam = ({ position }) => {
  const texture = useMemo(makePuffTexture, []);
  const spriteRefs = useRef([]);

  const puffs = useMemo(() =>
    Array.from({ length: PUFF_COUNT }, (_, i) => ({
      phase:    i / PUFF_COUNT,                  // staggered so the stream never breaks
      duration: 3.2 + Math.random() * 1.5,       // seconds for one full climb
      swayFreq: 1.2 + Math.random() * 1.2,
      swayAmp:  0.12 + Math.random() * 0.1,
      swayDir:  Math.random() * Math.PI * 2,
      size:     0.9 + Math.random() * 0.3,       // starting diameter ≈ half the cup opening
      jitterX:  (Math.random() - 0.5) * 0.3,
      jitterZ:  (Math.random() - 0.5) * 0.3,
    })), []);

  useFrame(({ clock }) => {
    const now = clock.getElapsedTime();
    puffs.forEach((p, i) => {
      const sprite = spriteRefs.current[i];
      if (!sprite) return;
      const t = (now / p.duration + p.phase) % 1;   // 0 = fresh off the coffee, 1 = dissolved
      // sway grows with height so puffs leave the cup centred, then drift
      const sway = Math.sin(t * Math.PI * 2 * p.swayFreq + p.swayDir) * p.swayAmp * t;
      sprite.position.set(
        p.jitterX + Math.cos(p.swayDir) * sway,
        t * RISE,
        p.jitterZ + Math.sin(p.swayDir) * sway,
      );
      const scale = p.size * (1 - 0.72 * t);        // blobs shrink as they climb
      sprite.scale.set(scale, scale, 1);
      // quick fade-in near the cup, slow dissolve on the way up
      sprite.material.opacity = Math.min(t / 0.12, 1) * (1 - t) ** 1.4 * PEAK_OPACITY;
    });
  });

  return (
    <group position={position} scale={1.1}>
      {puffs.map((_, i) => (
        <sprite key={i} ref={(el) => { spriteRefs.current[i] = el; }}>
          <spriteMaterial map={texture} transparent depthWrite={false} opacity={0} />
        </sprite>
      ))}
    </group>
  );
};

export default CoffeeSteam;
