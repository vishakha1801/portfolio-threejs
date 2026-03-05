import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';

import { HackerRoom } from '../components/HackerRoom.jsx';
import MonitorController from '../components/MonitorController.jsx';
import MacOSDesktop from '../components/MacOSDesktop.jsx';
import CanvasLoader from '../components/Loading.jsx';

const GrainParticles = () => {
  const positions = useMemo(() => {
    const arr = new Float32Array(8000 * 3);
    for (let i = 0; i < 8000; i++) {
      const r     = 20 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={1} color="#999999" transparent opacity={0.35} sizeAttenuation={false} />
    </points>
  );
};

const Hero = () => {
  const [isZoomed, setIsZoomed]           = useState(false);
  const [overlayBounds, setOverlayBounds] = useState(null);

  const controlsRef   = useRef();
  const screenMeshRef = useRef();

  const handleBoundsUpdate = useCallback((bounds) => setOverlayBounds(bounds), []);
  const handleClose = useCallback(() => {
    setOverlayBounds(null);
    setIsZoomed(false);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter'  && !isZoomed) setIsZoomed(true);
      if (e.key === 'Escape' &&  isZoomed) handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isZoomed, handleClose]);

  return (
    <section id="home" style={{ height: '100vh' }} className="w-full flex flex-col relative overflow-hidden">

      <div
        className="absolute inset-0"
        style={{
          cursor: isZoomed ? 'default' : 'pointer',
          background: 'radial-gradient(ellipse at 45% 55%, #3a3a3a 0%, #1c1c1c 35%, #0a0a0a 65%, #000000 100%)',
        }}
        onMouseMove={() => { if (!isZoomed) setIsZoomed(true); }}
        onClick={() => { if (isZoomed) handleClose(); }}
      >
        {/* Film grain overlay */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23g)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat', backgroundSize: '250px 250px',
            opacity: 0.08, mixBlendMode: 'overlay',
          }}
        />

        <Canvas style={{ width: '100%', height: '100vh' }} gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
          <Suspense fallback={<CanvasLoader />}>
            <PerspectiveCamera makeDefault position={[0, 0.3, 1.75]} fov={65} />
            <OrbitControls ref={controlsRef} enableZoom={false} />

            <GrainParticles />

            <MonitorController
              isZoomed={isZoomed}
              controlsRef={controlsRef}
              screenMeshRef={screenMeshRef}
              onZoomComplete={handleBoundsUpdate}
              onBoundsChange={handleBoundsUpdate}
            />

            <HackerRoom scale={8} position={[0, -0.3, 0]} screenMeshRef={screenMeshRef} />

            <ambientLight intensity={1.5} />
            <directionalLight position={[10, 10, 10]} intensity={1.0} />
            <directionalLight position={[-10, 5, -5]} intensity={0.5} />
          </Suspense>

        </Canvas>
      </div>

      {overlayBounds && isZoomed && (
        <MacOSDesktop bounds={overlayBounds} onClose={handleClose} />
      )}

    </section>
  );
};

export default Hero;
