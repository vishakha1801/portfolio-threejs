import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

import { HackerRoom } from '../components/HackerRoom.jsx';
import MonitorController from '../components/MonitorController.jsx';
import MacOSDesktop from '../components/MacOSDesktop.jsx';
import CanvasLoader from '../components/Loading.jsx';

// shared font style — referenced by multiple UI components so kept at module level
const VT = { fontFamily: "'VT323', monospace" };

// far-back position the camera starts at before the user dismisses the intro
const INTRO_POS  = new THREE.Vector3(0, 2.2, 6.5);
// resting position once intro is gone — close enough to read the scene, not claustrophobic
const HOME_POS   = new THREE.Vector3(0, 0.3, 1.75);
const HOME_TARGET = new THREE.Vector3(0, 0, 0);

/* ── Sets camera to zoomed-out on mount, animates home when intro ends ── */
const IntroController = ({ introComplete, controlsRef }) => {
  const { camera } = useThree();
  const tweenRef = useRef(null);

  // On mount: snap camera to far-out position so the intro feels like "entering" the scene
  useEffect(() => {
    camera.position.copy(INTRO_POS);
    camera.lookAt(HOME_TARGET);
    if (controlsRef.current) {
      controlsRef.current.target.copy(HOME_TARGET);
      controlsRef.current.update();
      // keep orbit controls locked until the user is actually at the home position
      controlsRef.current.enabled = false;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When intro dismissed: fly camera to home
  useEffect(() => {
    if (!introComplete) return;
    // kill any in-progress tween before starting a new one — avoids competing animations
    if (tweenRef.current) tweenRef.current.kill();
    tweenRef.current = gsap.to(camera.position, {
      x: HOME_POS.x, y: HOME_POS.y, z: HOME_POS.z,
      duration: 1.6,
      ease: 'power2.inOut',
      onUpdate: () => camera.lookAt(HOME_TARGET),
      onComplete: () => {
        if (controlsRef.current) {
          controlsRef.current.target.copy(HOME_TARGET);
          controlsRef.current.update();
          controlsRef.current.enabled = true;
        }
      },
    });
  }, [introComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

/* ── "Click anywhere to begin" — types in with random delays ── */
const HelpPrompt = ({ visible }) => {
  const HELP_TEXT = 'Click anywhere to begin';
  const [text, setText] = useState('');

  useEffect(() => {
    let cancelled = false;
    const type = (i, cur) => {
      if (i >= HELP_TEXT.length || cancelled) return;
      // random per-character delay (40–120 ms) makes it feel like real typing, not an animation
      setTimeout(() => {
        const next = cur + HELP_TEXT[i];
        setText(next);
        type(i + 1, next);
      }, Math.random() * 80 + 40);
    };
    // 600 ms head start gives the 3D scene time to load before drawing attention here
    setTimeout(() => type(0, ''), 600);
    return () => { cancelled = true; };
  }, []);

  if (!text) return null;

  return (
    <div style={{
      position: 'absolute', bottom: 52, width: '100%',
      display: 'flex', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 10,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity 0.45s ease, transform 0.45s ease',
    }}>
      <span style={{ ...VT, fontSize: 26, color: '#d0d0d0', letterSpacing: 2 }}>
        {text}
        {visible && <span style={{ animation: 'blink 0.7s step-end infinite', marginLeft: 2 }}>█</span>}
      </span>
    </div>
  );
};

/* ── Grain particles ── */
const GrainParticles = () => {
  // useMemo so the Float32Array is only allocated once — not on every render
  const positions = useMemo(() => {
    const arr = new Float32Array(8000 * 3);
    for (let i = 0; i < 8000; i++) {
      // spherical distribution keeps particles uniform — simple random XYZ would cluster at corners
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
      {/* sizeAttenuation=false keeps stars the same pixel size regardless of depth */}
      <pointsMaterial size={1} color="#999999" transparent opacity={0.35} sizeAttenuation={false} />
    </points>
  );
};

const Hero = () => {
  const [introComplete, setIntroComplete] = useState(false);
  const [isZoomed, setIsZoomed]           = useState(false);
  const [overlayBounds, setOverlayBounds] = useState(null);

  const controlsRef    = useRef();
  const screenMeshRef  = useRef();
  const coolingDownRef = useRef(false);

  const handleBoundsUpdate = useCallback((bounds) => setOverlayBounds(bounds), []);

  const handleClose = useCallback(() => {
    setOverlayBounds(null);
    setIsZoomed(false);
    // cooldown prevents a re-zoom click from firing while the camera is still travelling back
    coolingDownRef.current = true;
    setTimeout(() => { coolingDownRef.current = false; }, 1600); // match zoom-out tween duration
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && isZoomed) handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isZoomed, handleClose]);

  const handleClick = useCallback(() => {
    // three-stage click: dismiss intro → zoom into monitor → zoom back out
    if (!introComplete) setIntroComplete(true);
    else if (!isZoomed && !coolingDownRef.current) setIsZoomed(true);
    else if (isZoomed) handleClose();
  }, [introComplete, isZoomed, handleClose]);

  return (
    <section id="home" style={{ height: '100vh' }} className="w-full flex flex-col relative overflow-hidden">
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>

      <div
        className="absolute inset-0"
        style={{
          cursor: 'pointer',
          background: 'radial-gradient(ellipse at 45% 55%, #3a3a3a 0%, #1c1c1c 35%, #0a0a0a 65%, #000000 100%)',
        }}
        onClick={handleClick}
      >
        {/* Film grain overlay */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23g)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat', backgroundSize: '250px 250px',
          opacity: 0.08, mixBlendMode: 'overlay',
        }} />

        <Canvas style={{ width: '100%', height: '100vh' }} gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
          <Suspense fallback={<CanvasLoader />}>
            <PerspectiveCamera makeDefault position={[0, 0.3, 1.75]} fov={65} />
            <OrbitControls ref={controlsRef} enableZoom={false} />

            <IntroController introComplete={introComplete} controlsRef={controlsRef} />

            <GrainParticles />

            <MonitorController
              isZoomed={isZoomed}
              introComplete={introComplete}
              controlsRef={controlsRef}
              screenMeshRef={screenMeshRef}
              onZoomComplete={handleBoundsUpdate}
              onBoundsChange={handleBoundsUpdate}
            />

            <HackerRoom scale={8} position={[0, -0.3, 0]} screenMeshRef={screenMeshRef} />

            {/* two shadow passes: soft wide one for ambience, tight sharp one for contact grounding */}
            <ContactShadows position={[0, -0.3, 0]} opacity={0.75} scale={5} blur={3.5} far={2} color="#000000" />
            <ContactShadows position={[0, -0.3, 0]} opacity={0.45} scale={2.5} blur={0.8} far={0.8} color="#000000" />

            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 10, 10]} intensity={1.4} />
            <directionalLight position={[-10, 5, -5]} intensity={0.2} />
          </Suspense>
        </Canvas>

        <HelpPrompt visible={!introComplete} />
      </div>

      {overlayBounds && isZoomed && (
        <MacOSDesktop bounds={overlayBounds} onClose={handleClose} />
      )}
    </section>
  );
};

export default Hero;
