import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, ContactShadows } from '@react-three/drei';

import { Room }             from '../components/Room.jsx';
import MonitorController    from '../components/MonitorController.jsx';
import IntroController      from '../components/IntroController.jsx';
import FreeCamController    from '../components/FreeCamController.jsx';
import GrainParticles       from '../components/GrainParticles.jsx';
import Desktop              from '../components/Desktop.jsx';
import CanvasLoader         from '../components/Loading.jsx';
import BiosLoader           from '../components/BiosLoader.jsx';
import MobileWarning, { isMobileDevice } from '../components/MobileWarning.jsx';
import { createAmbientAudio } from '../utils/audio.js';

// ── HUD button — VT323 vintage terminal style ─────────────────────────────────
const HudBtn = ({ title, active, onClick, label }) => (
  <button
    title={title}
    onClick={onClick}
    style={{
      fontFamily: "'VT323', monospace",
      fontSize: 15, letterSpacing: 2,
      background: 'rgba(0,0,0,0.75)',
      border: `1px solid ${active ? '#c8a96e' : '#555'}`,
      color: active ? '#c8a96e' : '#aaa',
      padding: '4px 10px',
      cursor: 'pointer',
      backdropFilter: 'blur(6px)',
      transition: 'border-color 0.2s, color 0.2s',
      userSelect: 'none',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#c8a96e'; e.currentTarget.style.color = '#c8a96e'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = active ? '#c8a96e' : '#555'; e.currentTarget.style.color = active ? '#c8a96e' : '#aaa'; }}
  >{label}</button>
);

// ── Hero ──────────────────────────────────────────────────────────────────────
const Hero = ({ onIntroComplete }) => {
  const [mobileWarningDone, setMobileWarningDone] = useState(() => !isMobileDevice());
  const [introComplete, setIntroComplete] = useState(false);
  const [isZoomed,      setIsZoomed]      = useState(false);
  const [overlayBounds, setOverlayBounds] = useState(null);
  const [freeCam,       setFreeCam]       = useState(false);
  const [muted,         setMuted]         = useState(false);

  const controlsRef    = useRef();
  const screenMeshRef  = useRef();
  const coolingDownRef = useRef(false);
  const audioRef       = useRef(null);

  const handleBoundsUpdate = useCallback((b) => setOverlayBounds(b), []);

  const handleClose = useCallback(() => {
    setOverlayBounds(null);
    setIsZoomed(false);
    coolingDownRef.current = true;
    setTimeout(() => { coolingDownRef.current = false; }, 1600);
  }, []);

  const handleBiosStart = useCallback(() => {
    setIntroComplete(true);
    onIntroComplete?.();
    audioRef.current = createAmbientAudio();
    audioRef.current.play();
  }, [onIntroComplete]);

  const toggleMute = useCallback(() => {
    setMuted(m => {
      const next = !m;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  }, []);

  const toggleFreeCam = useCallback(() => {
    setFreeCam(f => !f);
    if (isZoomed) handleClose();
  }, [isZoomed, handleClose]);

  // Escape key — close overlay or exit free cam
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (isZoomed) handleClose();
      if (freeCam) setFreeCam(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isZoomed, freeCam, handleClose]);

  // Canvas click — toggle zoom (disabled during free cam)
  const handleClick = useCallback(() => {
    if (!introComplete || freeCam) return;
    if (!isZoomed && !coolingDownRef.current) setIsZoomed(true);
    else if (isZoomed) handleClose();
  }, [introComplete, isZoomed, freeCam, handleClose]);

  // Stop audio on unmount
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  return (
    <section id="home" style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>

      {/* 3D canvas */}
      <div
        className="absolute inset-0"
        style={{
          cursor: freeCam ? 'grab' : introComplete ? 'pointer' : 'default',
          background: 'radial-gradient(ellipse at 45% 55%, #3a3a3a 0%, #1c1c1c 35%, #0a0a0a 65%, #000 100%)',
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

            <IntroController   introComplete={introComplete} controlsRef={controlsRef} />
            <FreeCamController freeCam={freeCam}             controlsRef={controlsRef} />
            <GrainParticles />

            <MonitorController
              isZoomed={isZoomed}
              introComplete={introComplete}
              controlsRef={controlsRef}
              screenMeshRef={screenMeshRef}
              onZoomComplete={handleBoundsUpdate}
              onBoundsChange={handleBoundsUpdate}
            />

            <Room scale={8} position={[0, -0.3, 0]} screenMeshRef={screenMeshRef} />

            <ContactShadows position={[0, -0.3, 0]} opacity={0.75} scale={5}   blur={3.5} far={2}   color="#000000" />
            <ContactShadows position={[0, -0.3, 0]} opacity={0.45} scale={2.5} blur={0.8} far={0.8} color="#000000" />

            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 10, 10]}  intensity={1.4} />
            <directionalLight position={[-10, 5, -5]}  intensity={0.2} />
          </Suspense>
        </Canvas>

        {/* Free cam hint */}
        {freeCam && (
          <div style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            fontFamily: "'VT323', monospace", fontSize: 16, color: '#555',
            pointerEvents: 'none', letterSpacing: 2,
          }}>
            FREE CAM  ·  DRAG TO ORBIT  ·  ESC TO EXIT
          </div>
        )}
      </div>

      {/* HUD — visible after intro */}
      {introComplete && (
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 20 }}>
          <HudBtn title={muted ? 'Unmute' : 'Mute'}              active={muted}    onClick={toggleMute}    label={muted    ? '[ MUTE ]'     : '[ SOUND ]'} />
          <HudBtn title={freeCam ? 'Exit free cam' : 'Free camera'} active={freeCam} onClick={toggleFreeCam} label={freeCam  ? '[ EXIT CAM ]' : '[ FREE CAM ]'} />
        </div>
      )}

      {/* Mobile warning → BIOS → desktop overlay */}
      {!mobileWarningDone && <MobileWarning onContinue={() => setMobileWarningDone(true)} />}
      {mobileWarningDone && !introComplete && <BiosLoader onStart={handleBiosStart} />}
      {overlayBounds && isZoomed && <Desktop bounds={overlayBounds} onClose={handleClose} />}
    </section>
  );
};

export default Hero;
