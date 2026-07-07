'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from 'next-themes';

function ParticleNetwork() {
  const { theme, systemTheme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
  
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const { mouse } = useThree();

  const particleCount = 150;
  const maxDistance = 2.5;

  // Generate particles
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = [];
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5;
      vel.push(new THREE.Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02));
    }
    return [pos, vel];
  }, []);

  const lineGeometry = useMemo(() => new THREE.BufferGeometry(), []);
  
  const particleColor = isDark ? '#A855F7' : '#94a3b8'; // Purple in dark, slate in light
  const lineColor = isDark ? '#22d3ee' : '#cbd5e1'; // Cyan in dark, light slate in light

  useFrame((state) => {
    if (!pointsRef.current || !linesRef.current) return;
    
    // Parallax based on mouse
    const targetX = mouse.x * 2;
    const targetY = mouse.y * 2;
    state.camera.position.x += (targetX - state.camera.position.x) * 0.05;
    state.camera.position.y += (targetY - state.camera.position.y) * 0.05;
    state.camera.lookAt(0, 0, -5);

    // Move particles
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] += velocities[i].x;
      positions[i * 3 + 1] += velocities[i].y;
      positions[i * 3 + 2] += velocities[i].z;

      // Wrap around bounds
      if (positions[i * 3] > 10 || positions[i * 3] < -10) velocities[i].x *= -1;
      if (positions[i * 3 + 1] > 10 || positions[i * 3 + 1] < -10) velocities[i].y *= -1;
      if (positions[i * 3 + 2] > 5 || positions[i * 3 + 2] < -15) velocities[i].z *= -1;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Connect lines
    const linePositions = [];
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < maxDistance * maxDistance) {
          linePositions.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
            positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
          );
        }
      }
    }
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    
    // Rotate entire network slowly
    pointsRef.current.rotation.y += 0.001;
    linesRef.current.rotation.y += 0.001;
    pointsRef.current.rotation.x += 0.0005;
    linesRef.current.rotation.x += 0.0005;
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.05} color={particleColor} transparent opacity={0.6} sizeAttenuation />
      </points>
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial color={lineColor} transparent opacity={0.15} />
      </lineSegments>
    </>
  );
}

export function Workspace3DBg() {
  const { theme, systemTheme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none transition-colors duration-1000">
      {/* Background Colors */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isDark ? 'opacity-100 bg-[#06040A]' : 'opacity-0 bg-[#f8fafc]'}`} />
      <div className={`absolute inset-0 transition-opacity duration-1000 ${!isDark ? 'opacity-100 bg-[#f8fafc]' : 'opacity-0'}`} />
      
      {/* Ambient glowing orbs */}
      {isDark && (
        <>
          <div className="absolute top-[10%] right-[10%] w-[30%] h-[40%] rounded-full mix-blend-screen filter blur-[150px] bg-purple-600/10 animate-blob" />
          <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] rounded-full mix-blend-screen filter blur-[150px] bg-cyan-600/10 animate-blob animation-delay-2000" />
        </>
      )}
      {!isDark && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-100/40 via-transparent to-transparent" />
      )}

      {/* R3F Canvas */}
      <div className="absolute inset-0 opacity-80">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 2]} gl={{ antialias: false, alpha: true }}>
          <AdaptiveDpr pixelated />
          <ParticleNetwork />
        </Canvas>
      </div>
    </div>
  );
}
