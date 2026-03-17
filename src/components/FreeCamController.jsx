import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

const HOME_POS    = new THREE.Vector3(0, 0.3, 1.75);
const HOME_TARGET = new THREE.Vector3(0, 0, 0);

// Toggles free OrbitControls (zoom + full rotation).
// On deactivate, smoothly returns the camera to the home position.
const FreeCamController = ({ freeCam, controlsRef }) => {
  const { camera } = useThree();

  useEffect(() => {
    if (!controlsRef.current) return;
    if (freeCam) {
      controlsRef.current.enableZoom = true;
      controlsRef.current.enabled    = true;
    } else {
      gsap.to(camera.position, {
        x: HOME_POS.x, y: HOME_POS.y, z: HOME_POS.z,
        duration: 1.4, ease: 'power2.inOut',
        onUpdate: () => camera.lookAt(HOME_TARGET),
        onComplete: () => {
          controlsRef.current.enableZoom = false;
          controlsRef.current.target.copy(HOME_TARGET);
          controlsRef.current.update();
        },
      });
    }
  }, [freeCam]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

export default FreeCamController;
