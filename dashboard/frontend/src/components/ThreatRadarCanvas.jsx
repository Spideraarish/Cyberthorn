import React, { useEffect, useRef, useState } from 'react';

/**
 * ThreatRadarCanvas
 * Interactive Zero-Trust Cyber Warfare Radar.
 * Displays concentric range rings, rotating radar sweep beam, and real-time network nodes.
 * Visually illustrates packet interception at the Kernel PEP boundary within < 42ms.
 */
export default function ThreatRadarCanvas({ className = '', isAttacking = false }) {
  const canvasRef = useRef(null);
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let angle = 0;

    // Responsive canvas sizing
    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Radar nodes
    const nodes = [
      { id: 'att', label: '10.0.1.10 [PROBE]', rRatio: 0.72, theta: 0.85, type: 'hostile' },
      { id: 'pep', label: 'PEP HOOK [PRIO 0]', rRatio: 0.42, theta: 1.15, type: 'shield' },
      { id: 'gcn', label: 'GCN ENGINE', rRatio: 0.42, theta: 2.8, type: 'neural' },
      { id: 'tgt', label: '10.0.4.10 [ASSET]', rRatio: 0.22, theta: 4.2, type: 'protected' }
    ];

    // Shockwaves
    let shockwaves = [];

    // Trigger shockwave
    function addShockwave(x, y, color) {
      shockwaves.push({ x, y, r: 2, maxR: 45, alpha: 0.9, color });
    }

    // Interval to create gentle baseline probe packets
    const probeInterval = setInterval(() => {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const r = Math.min(cx, cy) * 0.42;
      const px = cx + Math.cos(1.15) * r;
      const py = cy + Math.sin(1.15) * r;
      addShockwave(px, py, '#2dd4bf');
    }, 2800);

    function render() {
      animationId = requestAnimationFrame(render);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;

      const cx = width / 2;
      const cy = height / 2;
      const maxRadius = Math.min(cx, cy) * 0.88;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Concentric Radar Rings
      const rings = [0.22, 0.45, 0.68, 0.92];
      rings.forEach((rRatio, idx) => {
        const radius = maxRadius * rRatio;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = idx === 1 ? 'rgba(45, 212, 191, 0.25)' : 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = idx === 1 ? 1.5 : 1;
        if (idx === 1) {
          ctx.setLineDash([4, 6]); // Kernel PEP boundary ring
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();

        // Range ring label
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.fillText(`${(rRatio * 42).toFixed(0)}ms`, cx + radius + 4, cy - 4);
      });

      ctx.setLineDash([]);

      // 2. Crosshair Axis Lines
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.moveTo(cx - maxRadius, cy);
      ctx.lineTo(cx + maxRadius, cy);
      ctx.moveTo(cx, cy - maxRadius);
      ctx.lineTo(cx, cy + maxRadius);
      ctx.stroke();

      // 3. Rotating Radar Sweep Beam
      angle += 0.022;
      const sweepGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
      sweepGradient.addColorStop(0, 'rgba(45, 212, 191, 0.15)');
      sweepGradient.addColorStop(1, 'rgba(45, 212, 191, 0.0)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxRadius, angle - 0.4, angle);
      ctx.closePath();
      ctx.fillStyle = sweepGradient;
      ctx.fill();

      // Leading edge line of sweep
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * maxRadius, cy + Math.sin(angle) * maxRadius);
      ctx.strokeStyle = 'rgba(94, 234, 212, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      // 4. Render Shockwaves
      shockwaves.forEach((sw, i) => {
        sw.r += 0.85;
        sw.alpha *= 0.94;

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        if (sw.alpha < 0.05) {
          shockwaves.splice(i, 1);
        }
      });

      // 5. Render Network Nodes
      nodes.forEach((node) => {
        const nr = maxRadius * node.rRatio;
        const nx = cx + Math.cos(node.theta) * nr;
        const ny = cy + Math.sin(node.theta) * nr;

        // Node circle
        ctx.beginPath();
        ctx.arc(nx, ny, 4, 0, Math.PI * 2);

        if (node.type === 'hostile') {
          ctx.fillStyle = isAttacking ? '#f43f5e' : '#f59e0b';
        } else if (node.type === 'shield') {
          ctx.fillStyle = '#2dd4bf';
        } else if (node.type === 'neural') {
          ctx.fillStyle = '#38bdf8';
        } else {
          ctx.fillStyle = '#f8fafc';
        }
        ctx.fill();

        // Node outer ring
        ctx.beginPath();
        ctx.arc(nx, ny, 8, 0, Math.PI * 2);
        ctx.strokeStyle = ctx.fillStyle;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Label
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
        ctx.fillText(node.label, nx + 12, ny + 3);
      });

      // 6. Draw Interception Perimeter Badge
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#2dd4bf';
      ctx.fillText('PEP BOUNDARY: PRIORITY 0', cx - 70, cy + maxRadius + 18);
    }

    render();

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(probeInterval);
      window.removeEventListener('resize', resize);
    };
  }, [isAttacking]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  );
}
