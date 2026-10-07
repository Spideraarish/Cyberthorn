import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

/**
 * ZeroTrustDefenseShield
 * A highly-visible, luminous, physical-glass 3D Cybernetic Defense Shield.
 * - Engineered for maximum visibility, high contrast, and radiant luminescence
 * - Parametric extruded cyber shield with glowing neon-free rim bevel
 * - Internal cryptographic enclave with rotating quantum core and perimeter nodes
 * - Smooth interactive cursor glide with responsive inertia
 */

function ShieldMesh({ mode = 'gcn', isAttacking = false, mousePosition }) {
  const groupRef = useRef();
  const innerCoreRef = useRef();
  const radarSweepRef = useRef();
  const pulseRingRef = useRef();

  // Color profiles (Refined, luminous, high-contrast)
  const themeColors = {
    gcn: {
      rim: '#2dd4bf',        // Phosphor teal
      glow: '#5eead4',
      core: '#0d9488',
      glass: '#0a2332',
      light: '#2dd4bf'
    },
    cnn: {
      rim: '#38bdf8',        // Ice cobalt
      glow: '#7dd3fc',
      core: '#0284c7',
      glass: '#0a203a',
      light: '#38bdf8'
    },
    kernel: {
      rim: '#f59e0b',        // Champagne bronze
      glow: '#fbbf24',
      core: '#b45309',
      glass: '#2e1c07',
      light: '#f59e0b'
    }
  };

  const theme = themeColors[mode] || themeColors.gcn;
  const activeColor = isAttacking ? '#f43f5e' : theme.rim;
  const glowColor = isAttacking ? '#fb7185' : theme.glow;
  const glassColor = isAttacking ? '#3b0d18' : theme.glass;

  // Build the parametric 3D shield geometry and inner contours
  const { shieldGeo, rimGeo, innerBorderGeo } = useMemo(() => {
    const shape = new THREE.Shape();
    // Top center apex
    shape.moveTo(0, 1.3);
    // Top right shoulder
    shape.bezierCurveTo(0.7, 1.25, 1.1, 0.9, 1.05, 0.25);
    // Lower right blade to bottom tip
    shape.bezierCurveTo(1.0, -0.45, 0.48, -1.05, 0, -1.4);
    // Lower left blade
    shape.bezierCurveTo(-0.48, -1.05, -1.0, -0.45, -1.05, 0.25);
    // Top left shoulder
    shape.bezierCurveTo(-1.1, 0.9, -0.7, 1.25, 0, 1.3);

    const extrudeSettings = {
      depth: 0.22,
      bevelEnabled: true,
      bevelSegments: 16,
      steps: 1,
      bevelSize: 0.1,
      bevelThickness: 0.1
    };

    const sGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    sGeo.center();

    // Outline contour for glowing rim
    const points = [];
    shape.curves.forEach(curve => {
      const pts = curve.getPoints(24);
      pts.forEach(p => points.push(new THREE.Vector3(p.x, p.y, 0.18)));
    });
    const rGeo = new THREE.BufferGeometry().setFromPoints(points);

    // Inner contour for sub-enclave
    const innerPoints = [];
    const scale = 0.76;
    shape.curves.forEach(curve => {
      const pts = curve.getPoints(20);
      pts.forEach(p => innerPoints.push(new THREE.Vector3(p.x * scale, p.y * scale, 0.22)));
    });
    const ibGeo = new THREE.BufferGeometry().setFromPoints(innerPoints);

    return { shieldGeo: sGeo, rimGeo: rGeo, innerBorderGeo: ibGeo };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth cursor-tracking tilt
    const targetX = (mousePosition.current.x * Math.PI) / 8;
    const targetY = (mousePosition.current.y * Math.PI) / 8;

    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetY + Math.sin(state.clock.elapsedTime * 0.7) * 0.05,
      0.06
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetX + Math.cos(state.clock.elapsedTime * 0.5) * 0.07,
      0.06
    );

    // Inner quantum core rotation
    if (innerCoreRef.current) {
      const speed = isAttacking ? 3.0 : 1.2;
      innerCoreRef.current.rotation.y += delta * 0.6 * speed;
      innerCoreRef.current.rotation.z += delta * 0.35 * speed;
    }

    // Oscillating radar sweep
    if (radarSweepRef.current) {
      radarSweepRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.65;
    }

    // Pulse ring rotation
    if (pulseRingRef.current) {
      pulseRingRef.current.rotation.z += delta * 0.4;
    }
  });

  return (
    <group ref={groupRef} scale={1.18}>
      
      {/* ── 1. MAIN SCULPTED GLASS SHIELD BODY (HIGH CONTRAST & TRANSMISSION) ── */}
      <mesh geometry={shieldGeo}>
        <meshPhysicalMaterial
          color={glassColor}
          emissive={activeColor}
          emissiveIntensity={isAttacking ? 0.45 : 0.2}
          roughness={0.08}
          metalness={0.25}
          transmission={0.88}
          thickness={1.1}
          ior={1.52}
          reflectivity={0.95}
          clearcoat={1.0}
          clearcoatRoughness={0.06}
          transparent={true}
          opacity={0.96}
        />
      </mesh>

      {/* ── 2. LUMINOUS GLOWING PERIMETER RIM CONTOUR ── */}
      <lineLoop geometry={rimGeo}>
        <lineBasicMaterial
          color={glowColor}
          transparent
          opacity={isAttacking ? 1.0 : 0.85}
          linewidth={2}
        />
      </lineLoop>

      {/* ── 3. HOLOGRAPHIC INNER DEFENSE BOUNDARY ── */}
      <lineLoop geometry={innerBorderGeo}>
        <lineBasicMaterial
          color={activeColor}
          transparent
          opacity={isAttacking ? 0.95 : 0.6}
          linewidth={1.5}
        />
      </lineLoop>

      {/* ── 4. CENTRAL ZERO-TRUST QUANTUM CORE (THE HEART OF THE SHIELD) ── */}
      <group ref={innerCoreRef} position={[0, 0, 0.16]}>
        {/* Outer Wireframe Octahedron */}
        <mesh scale={isAttacking ? 0.38 : 0.32}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={glowColor}
            emissive={glowColor}
            emissiveIntensity={isAttacking ? 2.8 : 1.6}
            wireframe
          />
        </mesh>

        {/* Inner Solid Quantum Enclave Token */}
        <mesh scale={0.16}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color={activeColor}
            emissive={activeColor}
            emissiveIntensity={isAttacking ? 3.5 : 2.0}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
      </group>

      {/* ── 5. ROTATING MICRO-SEGMENTATION GYROSCOPE RING ── */}
      <mesh ref={pulseRingRef} position={[0, 0, 0.1]} scale={0.78}>
        <torusGeometry args={[0.75, 0.014, 16, 64]} />
        <meshStandardMaterial
          color={activeColor}
          emissive={activeColor}
          emissiveIntensity={isAttacking ? 2.0 : 1.1}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* ── 6. DYNAMIC RADAR SWEEP LINE ── */}
      <mesh ref={radarSweepRef} position={[0, 0, 0.2]}>
        <planeGeometry args={[1.6, 0.02]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={isAttacking ? 0.8 : 0.45}
        />
      </mesh>

      {/* ── 7. PERIMETER TOPOLOGICAL SATELLITE CHIPS ── */}
      <group position={[0, 0, 0.18]}>
        {[
          [0.85, 0.45],
          [-0.85, 0.45],
          [0.55, -0.75],
          [-0.55, -0.75],
          [0, 1.15]
        ].map(([x, y], idx) => (
          <mesh key={idx} position={[x, y, 0]} scale={0.045}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={glowColor}
              emissive={glowColor}
              emissiveIntensity={isAttacking ? 3.0 : 1.8}
            />
          </mesh>
        ))}
      </group>

    </group>
  );
}

export default function R3FLiquidGlassCrystal({ 
  mode = 'gcn', 
  isAttacking = false, 
  height = '100%' 
}) {
  const mousePosition = useRef({ x: 0, y: 0 });

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mousePosition.current = { x, y };
  };

  const handlePointerLeave = () => {
    mousePosition.current = { x: 0, y: 0 };
  };

  const themeLightColor = mode === 'kernel' ? '#f59e0b' : mode === 'cnn' ? '#38bdf8' : '#2dd4bf';

  return (
    <div 
      className="r3f-defense-shield-wrapper"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        width: '100%',
        height: height,
        minHeight: '380px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        userSelect: 'none'
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.3], fov: 40 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        {/* Studio Lighting Rig specifically tuned to illuminate the shield */}
        <ambientLight intensity={0.9} color="#e2e8f0" />
        
        {/* Strong Front Key Light */}
        <directionalLight position={[2, 4, 4]} intensity={2.2} color="#ffffff" />
        
        {/* Powerful Internal / Backlight shining forward through the glass */}
        <pointLight position={[0, 0, -1.8]} intensity={32} color={themeLightColor} distance={10} />
        
        {/* Rim Lights highlighting the edges */}
        <pointLight position={[-4, -2, 3]} intensity={18} color={themeLightColor} />
        <pointLight position={[4, -2, 3]} intensity={14} color="#ffffff" />
        <pointLight position={[0, -4, 2]} intensity={12} color={themeLightColor} />

        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.35}>
          <ShieldMesh 
            mode={mode} 
            isAttacking={isAttacking} 
            mousePosition={mousePosition} 
          />
        </Float>

        <ContactShadows
          position={[0, -2.0, 0]}
          opacity={0.4}
          scale={5.8}
          blur={2.4}
          far={3.8}
          color={mode === 'kernel' ? '#b45309' : '#042f2e'}
        />
      </Canvas>
    </div>
  );
}
