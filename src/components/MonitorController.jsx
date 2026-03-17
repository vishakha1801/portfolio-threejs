import { useEffect, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

// Module-level constants — allocated once, never re-created on render
const HOME_POS    = new THREE.Vector3(0, 0.3, 1.75);
const HOME_TARGET = new THREE.Vector3(0, 0, 0);

const MonitorController = ({
  isZoomed,
  introComplete,
  controlsRef,
  screenMeshRef,
  onZoomComplete,
  onBoundsChange,
}) => {
  const { camera, gl } = useThree();
  const tweenRef        = useRef(null);
  const mouseRef        = useRef({ x: 0, y: 0 });
  const parallaxRef     = useRef({ x: 0, y: 0 });
  const blockParallaxRef = useRef(false);

  // Track normalised mouse position (-0.5 … 0.5)
  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current = {
        x:  e.clientX / window.innerWidth  - 0.5,
        y:  e.clientY / window.innerHeight - 0.5,
      };
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Subtle camera parallax while in home view
  useFrame(() => {
    // skip entirely during intro or when a zoom tween owns the camera
    if (!introComplete || blockParallaxRef.current) return;

    const tx = mouseRef.current.x *  0.35;
    const ty = mouseRef.current.y * -0.22;

    // lerp factor 0.06 gives a lazy follow — snappier values feel jittery on fast mouse moves
    parallaxRef.current.x += (tx - parallaxRef.current.x) * 0.06;
    parallaxRef.current.y += (ty - parallaxRef.current.y) * 0.06;

    camera.position.x = HOME_POS.x + parallaxRef.current.x;
    camera.position.y = HOME_POS.y + parallaxRef.current.y;
    camera.lookAt(HOME_TARGET);
  });

  // ── Bound projection ────────────────────────────────────────────────────────
  const computeBounds = useCallback(() => {
    if (!screenMeshRef.current) return null;

    // Force world matrix update — computeBounds is called from a GSAP callback,
    // not from useFrame, so matrices may be stale.
    screenMeshRef.current.updateWorldMatrix(true, true);

    // Canvas element rect in viewport-relative CSS pixels
    const canvasRect = gl.domElement.getBoundingClientRect();

    // World-space AABB: Box3.setFromObject traverses all parent transforms
    const box = new THREE.Box3().setFromObject(screenMeshRef.current);

    // Camera is at higher z than screen → front face (visible) has max z
    const corners = [
      new THREE.Vector3(box.min.x, box.min.y, box.max.z), // bottom-left
      new THREE.Vector3(box.max.x, box.min.y, box.max.z), // bottom-right
      new THREE.Vector3(box.min.x, box.max.y, box.max.z), // top-left
      new THREE.Vector3(box.max.x, box.max.y, box.max.z), // top-right
    ];

    const projected = corners.map((worldPos) => {
      // .project(camera) → NDC, using camera's matrixWorldInverse + projectionMatrix
      const ndc = worldPos.clone().project(camera);
      return {
        x: ( ndc.x * 0.5 + 0.5) * canvasRect.width  + canvasRect.left,
        y: (-ndc.y * 0.5 + 0.5) * canvasRect.height + canvasRect.top,
      };
    });

    const xs = projected.map((p) => p.x);
    const ys = projected.map((p) => p.y);
    const rawLeft   = Math.min(...xs);
    const rawTop    = Math.min(...ys);
    const rawWidth  = Math.max(...xs) - rawLeft;
    const rawHeight = Math.max(...ys) - rawTop;

    // Inset per side to trim geometry border so overlay matches visible screen area
    const ix = rawWidth  * 0.02;
    const iy = rawHeight * 0.02;
    return { left: rawLeft + ix, top: rawTop + iy, width: rawWidth - ix * 2, height: rawHeight - iy * 2 };
  }, [camera, gl, screenMeshRef]);

  // ── Zoom in / out on isZoomed change ────────────────────────────────────────
  useEffect(() => {
    if (tweenRef.current) tweenRef.current.kill();

    if (isZoomed) {
      // block parallax during the whole zoom cycle so the camera doesn't jerk against the tween
      blockParallaxRef.current = true;

      // fallback coords used if the ref isn't attached yet — measured from the GLTF geometry
      const screenCenter = screenMeshRef.current
        ? screenMeshRef.current.getWorldPosition(new THREE.Vector3())
        : new THREE.Vector3(-0.1874, 0.365, 0.343);

      if (controlsRef.current) controlsRef.current.enabled = false;

      // Camera sits 0.38 world units in front of screen center.
      // At FOV 65°, visible height = 2 * 0.38 * tan(32.5°) ≈ 0.485 units.
      // Monitor bezel height ≈ 0.342 units → fills ~70% of viewport height.
      const zoomPos = {
        x: screenCenter.x,
        y: screenCenter.y,
        z: screenCenter.z + 0.38,
      };

      tweenRef.current = gsap.to(camera.position, {
        x: zoomPos.x, y: zoomPos.y, z: zoomPos.z,
        duration: 1.4,
        ease: 'power4.out',
        onUpdate: () => camera.lookAt(screenCenter),
        onComplete: () => {
          // Force matrix update so projection is accurate at rest
          camera.lookAt(screenCenter);
          camera.updateMatrixWorld(true);
          const bounds = computeBounds();
          if (bounds) onZoomComplete(bounds);
        },
      });

      // Simultaneously tween controls.target so pivot tracks the screen
      if (controlsRef.current) {
        gsap.to(controlsRef.current.target, {
          x: screenCenter.x, y: screenCenter.y, z: screenCenter.z,
          duration: 1.4,
          ease: 'power4.out',
          onUpdate: () => controlsRef.current?.update(),
        });
      }

    } else {
      // Zoom out — always return to the fixed initial angle
      if (controlsRef.current) controlsRef.current.enabled = false;

      tweenRef.current = gsap.to(camera.position, {
        x: HOME_POS.x, y: HOME_POS.y, z: HOME_POS.z,
        duration: 1.2,
        ease: 'power2.inOut',
        onUpdate: () => camera.lookAt(HOME_TARGET),
        onComplete: () => {
          // reset parallax accumulator so the camera doesn't jump if mouse moved during zoom
          blockParallaxRef.current = false;
          parallaxRef.current = { x: 0, y: 0 };
          if (controlsRef.current) {
            controlsRef.current.target.copy(HOME_TARGET);
            controlsRef.current.update();
            controlsRef.current.enabled = true;
          }
        },
      });

      if (controlsRef.current) {
        gsap.to(controlsRef.current.target, {
          x: HOME_TARGET.x, y: HOME_TARGET.y, z: HOME_TARGET.z,
          duration: 1.2,
          ease: 'power2.inOut',
          onUpdate: () => controlsRef.current?.update(),
        });
      }
    }
  }, [isZoomed]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recompute overlay bounds on viewport resize ──────────────────────────────
  useEffect(() => {
    if (!isZoomed) return;
    const onResize = () => {
      const b = computeBounds();
      if (b) onBoundsChange(b);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isZoomed, computeBounds, onBoundsChange]);

  return null;
};

export default MonitorController;
