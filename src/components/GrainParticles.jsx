import { useMemo } from 'react';

// 8 000 points distributed on a hollow sphere — adds subtle depth and
// atmosphere to the 3D scene without affecting performance significantly.
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

export default GrainParticles;
