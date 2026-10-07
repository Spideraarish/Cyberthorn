import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function LiquidGlassCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // ── SCENE SETUP ───────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // ── BESPOKE LUXURY LIGHTING (NON-AI PALETTE) ──────────────
    // Platinum silver ambient with phosphor mint & champagne amber caustics
    const ambientLight = new THREE.AmbientLight(0xe2e8f0, 0.5);
    scene.add(ambientLight);

    const mintLight = new THREE.PointLight(0x00f5b4, 7, 22);
    mintLight.position.set(-3, 2, 4);
    scene.add(mintLight);

    const platinumLight = new THREE.PointLight(0xdbeafe, 6, 20);
    platinumLight.position.set(3, -2, 3);
    scene.add(platinumLight);

    const amberLight = new THREE.PointLight(0xf59e0b, 3.5, 16);
    amberLight.position.set(0, 3, -2);
    scene.add(amberLight);

    // ── LIQUID GLASS GEOMETRY & PHYSICAL MATERIAL ────────────
    const glassGeometry = new THREE.IcosahedronGeometry(1.6, 64);
    const posAttribute = glassGeometry.attributes.position;
    const originalPositions = new Float32Array(posAttribute.array);

    // Smoked crystal optical glass
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x080c14,
      emissive: 0x020b12,
      roughness: 0.04,
      metalness: 0.08,
      transmission: 0.94,
      thickness: 1.7,
      ior: 1.52, // Optical flint glass
      specularIntensity: 1.0,
      specularColor: 0x00f5b4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.92
    });

    const glassOrb = new THREE.Mesh(glassGeometry, glassMaterial);
    scene.add(glassOrb);

    // Floating orbital satellite glass droplets
    const dropletGroup = new THREE.Group();
    scene.add(dropletGroup);

    const dropletGeom = new THREE.SphereGeometry(0.22, 32, 32);
    const dropletMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f5b4,
      transmission: 0.92,
      roughness: 0.03,
      thickness: 0.7,
      ior: 1.5,
      transparent: true,
      opacity: 0.85
    });

    const droplets = [];
    for (let i = 0; i < 6; i++) {
      const droplet = new THREE.Mesh(dropletGeom, dropletMat.clone());
      const angle = (i / 6) * Math.PI * 2;
      const radius = 2.6 + (i % 2) * 0.4;
      droplet.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.5,
        (Math.random() - 0.5) * 1.5
      );
      droplet.userData = {
        angle,
        speed: 0.005 + i * 0.002,
        radius,
        baseY: droplet.position.y
      };
      dropletGroup.add(droplet);
      droplets.push(droplet);
    }

    // ── INTERACTIVE MOUSE PARALLAX ────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.7;
      targetY = y * 0.7;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // ── RESIZE HANDLER ────────────────────────────────────────
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // ── ANIMATION LOOP WITH LIQUID ORGANIC OSCILLATION ────────
    let clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera / orb mouse interpolation
      mouseX += (targetX - mouseX) * 0.04;
      mouseY += (targetY - mouseY) * 0.04;

      glassOrb.rotation.x = elapsedTime * 0.12 + mouseY * 0.35;
      glassOrb.rotation.y = elapsedTime * 0.16 + mouseX * 0.45;

      // Displace vertices to create fluid liquid pulsing effect
      const positions = glassGeometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const u = i * 3;
        const ox = originalPositions[u];
        const oy = originalPositions[u + 1];
        const oz = originalPositions[u + 2];

        // Harmonic organic wave equation
        const wave = Math.sin(ox * 2 + elapsedTime * 1.6) *
                     Math.cos(oy * 2 + elapsedTime * 1.3) *
                     Math.sin(oz * 2 + elapsedTime * 1.1);

        const displacement = 1 + wave * 0.07;

        positions.array[u] = ox * displacement;
        positions.array[u + 1] = oy * displacement;
        positions.array[u + 2] = oz * displacement;
      }
      positions.needsUpdate = true;
      glassGeometry.computeVertexNormals();

      // Orbit satellite glass droplets
      droplets.forEach((d) => {
        d.userData.angle += d.userData.speed;
        d.position.x = Math.cos(d.userData.angle) * d.userData.radius;
        d.position.y = d.userData.baseY + Math.sin(elapsedTime * 1.8 + d.userData.angle) * 0.2;
        d.position.z = Math.sin(d.userData.angle) * d.userData.radius * 0.4;
        d.rotation.x += 0.02;
        d.rotation.y += 0.025;
      });

      // Move caustic lights
      mintLight.position.x = Math.sin(elapsedTime * 0.7) * 3;
      mintLight.position.y = Math.cos(elapsedTime * 0.5) * 2;
      platinumLight.position.x = -Math.cos(elapsedTime * 0.6) * 3;
      platinumLight.position.y = -Math.sin(elapsedTime * 0.4) * 2;

      renderer.render(scene, camera);
    };

    animate();

    // ── CLEANUP ───────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      glassGeometry.dispose();
      glassMaterial.dispose();
      dropletGeom.dispose();
      dropletMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="cq-liquid-canvas-container"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden'
      }}
    />
  );
}
