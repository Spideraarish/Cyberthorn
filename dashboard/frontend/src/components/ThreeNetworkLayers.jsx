import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

/* ── EXPANSIVE 3D MULTI-TIER PIPELINE VISUALIZER ──
   A clean, spacious, conflict-free 3D architectural network.
   Packets physically traverse through 3 distinct, non-overlapping 3D platforms:
   - Tier 01 (Left):   Wire Ingestion Mesh (AF_PACKET 64MB Ring)
   - Tier 02 (Center): Neural Cognition Mesh (GraphSAGE GNN Topology)
   - Tier 03 (Right):  Kernel Enforcement Plane (Netfilter Priority 0 Hook)
   Color Palette: Deep Smoked Obsidian, Electric Cyan (#00F2FE), 
   Phosphor Mint (#2DD4BF), Ice Cobalt (#38BDF8), and Pure White Photon Beams.
*/

export default function ThreeNetworkLayers() {
  const mountRef = useRef(null);
  const [stats, setStats] = useState({ rate: '28.4k/s', latency: '38.4ms' });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 480;

    // ── 1. SCENE & CAMERA ──
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    // Angled camera looking down at the 3 spacious platforms
    camera.position.set(0.6, 3.6, 6.0);
    camera.lookAt(0.0, -0.1, 0.0);

    // ── 2. RENDERER (100% TRANSPARENT BACKGROUND) ──
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ── 3. COLOR PALETTE ──
    const C_CYAN = 0x00f2fe;   // Ingestion
    const C_MINT = 0x2dd4bf;   // Neural
    const C_COBALT = 0x38bdf8; // Enforcement
    const C_THREAT = 0xf43f5e; // Laser Ruby (Drop)
    const C_WHITE = 0xffffff;  // Energy Photon

    // ── 4. THREE EXPANSIVE PLATFORMS (LEFT, CENTER, RIGHT — ZERO OVERLAP) ──
    // Platform dimensions
    const platW = 1.6;
    const platD = 1.8;

    const platformsData = [
      { id: 'ingest', x: -2.3, y: 0.0, z: 0.5, color: C_CYAN, name: '01 WIRE INGESTION' },
      { id: 'neural', x: 0.0,  y: 0.25, z: 0.0, color: C_MINT, name: '02 NEURAL COGNITION' },
      { id: 'enforce', x: 2.3, y: 0.0, z: -0.5, color: C_COBALT, name: '03 KERNEL ENFORCEMENT' }
    ];

    platformsData.forEach((p) => {
      // 1. Semi-transparent frosted glass platform
      const geo = new THREE.PlaneGeometry(platW, platD);
      const mat = new THREE.MeshBasicMaterial({
        color: p.color,
        transparent: true,
        opacity: 0.04,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(p.x, p.y, p.z);
      scene.add(mesh);

      // 2. Luminous neon perimeter border
      const hw = platW / 2;
      const hd = platD / 2;
      const borderPts = [
        new THREE.Vector3(p.x - hw, p.y, p.z - hd),
        new THREE.Vector3(p.x + hw, p.y, p.z - hd),
        new THREE.Vector3(p.x + hw, p.y, p.z + hd),
        new THREE.Vector3(p.x - hw, p.y, p.z + hd),
        new THREE.Vector3(p.x - hw, p.y, p.z - hd)
      ];
      const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPts);
      const borderMat = new THREE.LineBasicMaterial({
        color: p.color,
        transparent: true,
        opacity: 0.65,
        linewidth: 1.5
      });
      scene.add(new THREE.Line(borderGeo, borderMat));

      // 3. Coordinate cross grid inside platform
      const grid = new THREE.GridHelper(platW, 4, p.color, 0x1e293b);
      grid.position.set(p.x, p.y, p.z);
      if (grid.material) {
        grid.material.transparent = true;
        grid.material.opacity = 0.15;
      }
      scene.add(grid);
    });

    // ── 5. CLEAN, DISTRIBUTED NODES ON EACH PLATFORM ──
    const nodesT1 = [
      new THREE.Vector3(-2.8, 0.0, 0.1),
      new THREE.Vector3(-2.3, 0.0, 1.0),
      new THREE.Vector3(-1.8, 0.0, 0.2)
    ];

    const nodesT2 = [
      new THREE.Vector3(-0.5, 0.25, -0.4),
      new THREE.Vector3(0.5, 0.25, -0.3),
      new THREE.Vector3(0.0, 0.25, 0.1),
      new THREE.Vector3(-0.4, 0.25, 0.6),
      new THREE.Vector3(0.4, 0.25, 0.5)
    ];

    const nodesT3 = [
      new THREE.Vector3(1.8, 0.0, -0.8),
      new THREE.Vector3(2.3, 0.0, 0.0),
      new THREE.Vector3(2.8, 0.0, -0.7)
    ];

    const nodeSpheres = [];
    const createNode = (pos, color, r = 0.08) => {
      // Core sphere
      const geo = new THREE.SphereGeometry(r, 16, 16);
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);

      // Outer pulsing ring
      const ringGeo = new THREE.RingGeometry(r * 1.3, r * 1.9, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(pos);
      scene.add(ring);

      nodeSpheres.push({ mesh, ring, color });
      return mesh;
    };

    nodesT1.forEach(p => createNode(p, C_CYAN));
    nodesT2.forEach(p => createNode(p, C_MINT));
    nodesT3.forEach(p => createNode(p, C_COBALT));

    // ── 6. NEURAL SYNAPSES WITHIN TIER 02 (CLEAN, UN-TANGLED) ──
    const t2Edges = [
      [nodesT2[0], nodesT2[1]],
      [nodesT2[0], nodesT2[2]],
      [nodesT2[1], nodesT2[2]],
      [nodesT2[2], nodesT2[3]],
      [nodesT2[2], nodesT2[4]],
      [nodesT2[3], nodesT2[4]]
    ];

    t2Edges.forEach(([p1, p2]) => {
      const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const mat = new THREE.LineBasicMaterial({
        color: C_MINT,
        transparent: true,
        opacity: 0.4
      });
      scene.add(new THREE.Line(geo, mat));
    });

    // ── 7. 3D INTER-LAYER LASER HIGHWAYS (STREAMING LEFT -> CENTER -> RIGHT) ──
    // Smooth 3D curves bridging Tier 1 -> Tier 2 -> Tier 3
    const conduits = [
      // Highway A (Upper Pipeline)
      new THREE.CatmullRomCurve3([
        nodesT1[0],
        new THREE.Vector3(-1.4, 0.45, 0.0),
        nodesT2[0],
        new THREE.Vector3(1.1, 0.45, -0.5),
        nodesT3[0]
      ]),
      // Highway B (Central Core Pipeline)
      new THREE.CatmullRomCurve3([
        nodesT1[2],
        new THREE.Vector3(-0.9, 0.35, 0.15),
        nodesT2[2],
        new THREE.Vector3(1.1, 0.3, 0.0),
        nodesT3[1]
      ]),
      // Highway C (Lower Pipeline)
      new THREE.CatmullRomCurve3([
        nodesT1[1],
        new THREE.Vector3(-1.3, 0.35, 0.7),
        nodesT2[3],
        new THREE.Vector3(1.2, 0.35, 0.0),
        nodesT3[2]
      ])
    ];

    // Render Highway Lines
    conduits.forEach((curve) => {
      const pts = curve.getPoints(45);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: C_CYAN,
        transparent: true,
        opacity: 0.28,
        linewidth: 1.2
      });
      scene.add(new THREE.Line(geo, mat));
    });

    // ── 8. MOVING 3D DATA PACKETS (STREAMING THROUGH THE NETWORK) ──
    const PACKET_COUNT = 15;
    const packets = [];
    const packetGeo = new THREE.SphereGeometry(0.052, 12, 12);

    for (let i = 0; i < PACKET_COUNT; i++) {
      const pathIndex = i % conduits.length;
      const isThreat = i % 4 === 0; // Periodic simulated threat

      const mat = new THREE.MeshBasicMaterial({
        color: isThreat ? C_THREAT : C_WHITE
      });
      const mesh = new THREE.Mesh(packetGeo, mat);
      scene.add(mesh);

      packets.push({
        mesh,
        curve: conduits[pathIndex],
        progress: i / PACKET_COUNT,
        speed: 0.0035 + (i % 3) * 0.001,
        isThreat,
        pathIndex
      });
    }

    // ── 9. SEVERANCE SHOCKWAVE EFFECT (AT TIER 3 FOR THREAT PACKETS) ──
    const shockwaves = [];
    const shockwaveGeo = new THREE.RingGeometry(0.03, 0.08, 24);

    const triggerShockwave = (pos) => {
      const mat = new THREE.MeshBasicMaterial({
        color: C_THREAT,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(shockwaveGeo, mat);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.copy(pos);
      scene.add(mesh);
      shockwaves.push({ mesh, scale: 1, maxScale: 8.0, opacity: 0.95 });
    };

    // ── 10. MOUSE PARALLAX CONTROLS ──
    let targetRotY = 0;
    let targetRotX = 0;
    let currentRotY = 0;
    let currentRotX = 0;

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = x * 0.35;
      targetRotX = y * 0.25;
    };

    container.addEventListener('pointermove', onPointerMove);

    // ── 11. ANIMATION RENDER LOOP ──
    let reqId;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth camera parallax
      currentRotY += (targetRotY - currentRotY) * 0.05;
      currentRotX += (targetRotX - currentRotX) * 0.05;

      scene.rotation.y = currentRotY + Math.sin(elapsed * 0.25) * 0.025;
      scene.rotation.x = currentRotX + Math.cos(elapsed * 0.2) * 0.015;

      // Pulse node auras
      nodeSpheres.forEach((ns, idx) => {
        const p = Math.sin(elapsed * 2.8 + idx * 0.7);
        ns.ring.scale.set(1 + p * 0.25, 1 + p * 0.25, 1);
        ns.ring.material.opacity = 0.35 + p * 0.2;
      });

      // Update 3D Packets traveling Left -> Center -> Right
      packets.forEach((pkt) => {
        pkt.progress += pkt.speed;

        // Packet reaches Tier 3 (Right: Kernel Enforcement)
        if (pkt.progress >= 1.0) {
          if (pkt.isThreat) {
            // Netfilter Priority 0 Drop Severance Shockwave!
            const endPt = pkt.curve.getPoint(1.0);
            triggerShockwave(endPt);
          }
          pkt.progress = 0; // Re-enter at Tier 1 Wire Ingestion
        }

        const pt = pkt.curve.getPoint(pkt.progress);
        pkt.mesh.position.copy(pt);

        // Smooth color transition based on horizontal stage
        if (!pkt.isThreat) {
          if (pkt.progress < 0.33) {
            pkt.mesh.material.color.setHex(C_CYAN); // Ingestion: Cyan
          } else if (pkt.progress < 0.66) {
            pkt.mesh.material.color.setHex(C_MINT); // Neural AI: Mint
          } else {
            pkt.mesh.material.color.setHex(C_COBALT); // Enforcement: Cobalt
          }
        }
      });

      // Update Shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.scale += delta * 8;
        sw.opacity -= delta * 1.6;
        sw.mesh.scale.set(sw.scale, sw.scale, 1);
        sw.mesh.material.opacity = Math.max(0, sw.opacity);

        if (sw.opacity <= 0) {
          scene.remove(sw.mesh);
          shockwaves.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Window resize
    const onResize = () => {
      if (!container) return;
      const nw = container.clientWidth || 700;
      const nh = container.clientHeight || 480;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(reqId);
      container.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '740px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}
    >
      {/* ── TOP ARCHITECTURAL STATUS BAR (CLEAN, SINGLE STRIP) ── */}
      <div 
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 18px',
          marginBottom: '6px',
          background: 'rgba(7, 12, 20, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '9999px',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00f2fe', boxShadow: '0 0 10px #00f2fe' }} />
          <span style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--cq-text-main)' }}>
            3D ZERO-TRUST WIRE TOPOLOGY
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '10.5px', color: 'var(--cq-text-dim)' }}>
            LINE RATE: <strong style={{ color: 'var(--cq-text-main)' }}>{stats.rate}</strong>
          </span>
          <span style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '10.5px', color: 'var(--cq-text-dim)' }}>
            SLA: <strong style={{ color: '#00f2fe' }}>&lt; {stats.latency}</strong>
          </span>
        </div>
      </div>

      {/* ── 3D WEBGL STAGE (SPACIOUS, EXPANSIVE, CONFLICT-FREE) ── */}
      <div 
        ref={mountRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '460px',
          background: 'transparent',
          overflow: 'visible',
          cursor: 'grab'
        }}
      />

      {/* ── CLEAN 3-TIER LABELS (PERFECTLY ALIGNED WITH THE 3 PLATFORMS BELOW) ── */}
      <div 
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px',
          marginTop: '6px',
          zIndex: 10
        }}
      >
        {/* Tier 1 Label */}
        <div 
          style={{
            padding: '8px 12px',
            background: 'rgba(5, 8, 15, 0.75)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            borderRadius: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00f2fe' }} />
            <span style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '10.5px', fontWeight: 700, color: '#00f2fe' }}>
              01 WIRE INGEST
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cq-text-muted)', lineHeight: '1.3' }}>
            AF_PACKET 64MB memory ring
          </div>
        </div>

        {/* Tier 2 Label */}
        <div 
          style={{
            padding: '8px 12px',
            background: 'rgba(5, 8, 15, 0.75)',
            border: '1px solid rgba(45, 212, 191, 0.25)',
            borderRadius: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#2dd4bf' }} />
            <span style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '10.5px', fontWeight: 700, color: '#2dd4bf' }}>
              02 NEURAL REASONING
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cq-text-muted)', lineHeight: '1.3' }}>
            GraphSAGE GNN topology mesh
          </div>
        </div>

        {/* Tier 3 Label */}
        <div 
          style={{
            padding: '8px 12px',
            background: 'rgba(5, 8, 15, 0.75)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#38bdf8' }} />
            <span style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '10.5px', fontWeight: 700, color: '#38bdf8' }}>
              03 IN-KERNEL DROP
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cq-text-muted)', lineHeight: '1.3' }}>
            Netfilter Priority 0 (&lt; 38.4ms)
          </div>
        </div>
      </div>
    </div>
  );
}
