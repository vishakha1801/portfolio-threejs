import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

const INTRO_POS   = new THREE.Vector3(0, 2.2, 6.5);
const HOME_POS    = new THREE.Vector3(0, 0.3, 1.75);
const HOME_TARGET = new THREE.Vector3(0, 0, 0);

// Drives the camera fly-in from the far intro position to the home position.
// Disables OrbitControls during the animation; re-enables them on completion.
const IntroController = ({ introComplete, controlsRef }) => {
  const { camera } = useThree();
  const tweenRef   = useRef(null);

  // Place camera at the intro position immediately on mount (before any render)
  useEffect(() => {
    camera.position.copy(INTRO_POS);
    camera.lookAt(HOME_TARGET);
    if (controlsRef.current) {
      controlsRef.current.target.copy(HOME_TARGET);
      controlsRef.current.update();
      controlsRef.current.enabled = false;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fly to home position when the user dismisses the BIOS screen
  useEffect(() => {
    if (!introComplete) return;
    if (tweenRef.current) tweenRef.current.kill();
    tweenRef.current = gsap.to(camera.position, {
      x: HOME_POS.x, y: HOME_POS.y, z: HOME_POS.z,
      duration: 1.6, ease: 'power2.inOut',
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

export default IntroController;
