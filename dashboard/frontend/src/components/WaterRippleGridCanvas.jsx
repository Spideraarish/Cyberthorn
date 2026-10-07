import React, { useEffect, useRef } from 'react';

/**
 * WaterRippleGridCanvas
 * Combines physical liquid water ripple simulation with an architectural box grid
 * (inspired by Geolava's precision dashed lines, diamond markers, and x-ray interactive cells).
 * 
 * Non-neon, refined industrial titanium/obsidian palette with subtle water caustics.
 */
export default function WaterRippleGridCanvas({ 
  className = '',
  cellSize = 76,
  damping = 0.962,        // Faster gentle dissipation
  rippleIntensity = 110,   // Gentler wave energy
  showCrosshair = true,
  onGridClick
}) {
  const canvasRef = useRef(null);
  const rippleEngineRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let animationFrameId;

    // Simulation resolution (downscaled for high FPS wave physics)
    const scale = 3;
    let simWidth = Math.floor(canvas.clientWidth / scale);
    let simHeight = Math.floor(canvas.clientHeight / scale);

    let bufferSize = simWidth * simHeight;
    let buffer1 = new Float32Array(bufferSize);
    let buffer2 = new Float32Array(bufferSize);

    // Mouse coordinates
    let mouse = { x: -1000, y: -1000, prevX: -1000, prevY: -1000, isOver: false, speed: 0 };
    let crosshairCoords = { x: 0, y: 0 };

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      simWidth = Math.floor(rect.width / scale);
      simHeight = Math.floor(rect.height / scale);
      bufferSize = simWidth * simHeight;

      buffer1 = new Float32Array(bufferSize);
      buffer2 = new Float32Array(bufferSize);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Disturbance injection
    function addRipple(x, y, radius, strength) {
      const simX = Math.floor(x / scale);
      const simY = Math.floor(y / scale);

      for (let j = -radius; j <= radius; j++) {
        for (let i = -radius; i <= radius; i++) {
          const px = simX + i;
          const py = simY + j;

          if (px > 0 && px < simWidth - 1 && py > 0 && py < simHeight - 1) {
            const distSq = i * i + j * j;
            if (distSq <= radius * radius) {
              const falloff = 1 - Math.sqrt(distSq) / radius;
              const idx = py * simWidth + px;
              buffer1[idx] += strength * falloff;
            }
          }
        }
      }
    }

    // Expose trigger globally through ref
    rippleEngineRef.current = {
      trigger: (x, y, r = 8, s = 450) => addRipple(x, y, r, s),
      triggerCenterShockwave: () => {
        const rect = canvas.getBoundingClientRect();
        addRipple(rect.width / 2, rect.height / 2, 14, 800);
      }
    };

    // Pointer move listener
    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      crosshairCoords.x = currentX;
      crosshairCoords.y = currentY;

      if (mouse.prevX !== -1000) {
        const dx = currentX - mouse.prevX;
        const dy = currentY - mouse.prevY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        mouse.speed = dist;

        if (dist > 7) {
          // Add subtle ripple based on cursor speed
          const intensity = Math.min(rippleIntensity, dist * 4.5);
          addRipple(currentX, currentY, 2, intensity);
        }
      }

      mouse.prevX = currentX;
      mouse.prevY = currentY;
      mouse.x = currentX;
      mouse.y = currentY;
      mouse.isOver = true;
    };

    const handlePointerLeave = () => {
      mouse.isOver = false;
      mouse.prevX = -1000;
      mouse.prevY = -1000;
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addRipple(x, y, 6, 320);

      if (onGridClick) {
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        onGridClick({ x, y, col, row });
      }
    };

    const parent = canvas.parentElement || canvas;
    parent.addEventListener('pointermove', handlePointerMove, { passive: true });
    parent.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    parent.addEventListener('click', handleClick);

    // Initial ambient gentle pulse
    setTimeout(() => {
      const rect = canvas.getBoundingClientRect();
      addRipple(rect.width * 0.5, rect.height * 0.35, 6, 220);
    }, 600);

    // ── MAIN RENDER LOOP ────────────────────────────────────
    let lastTime = performance.now();

    function render(currentTime) {
      animationFrameId = requestAnimationFrame(render);

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) return;

      // 1. Solve Wave Equation
      for (let y = 1; y < simHeight - 1; y++) {
        const rowIdx = y * simWidth;
        const topRowIdx = (y - 1) * simWidth;
        const btmRowIdx = (y + 1) * simWidth;

        for (let x = 1; x < simWidth - 1; x++) {
          const idx = rowIdx + x;

          // Wave propagation
          const wave = (
            buffer1[idx - 1] +
            buffer1[idx + 1] +
            buffer1[topRowIdx + x] +
            buffer1[btmRowIdx + x]
          ) * 0.5 - buffer2[idx];

          buffer2[idx] = wave * damping;
        }
      }

      // Swap wave buffers
      const temp = buffer1;
      buffer1 = buffer2;
      buffer2 = temp;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // 2. Draw Architectural Box Grid (Dashed lines & Diamond junctions)
      const cols = Math.ceil(width / cellSize) + 1;
      const rows = Math.ceil(height / cellSize) + 1;

      ctx.save();

      // Draw subtle grid lines with optical ripple displacement
      const refractionScale = 0.022;

      // Vertical lines
      for (let c = 0; c < cols; c++) {
        const baseX = c * cellSize;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]); // Geolava-style dashed line

        for (let r = 0; r < rows; r++) {
          const baseY = r * cellSize;
          const simX = Math.min(simWidth - 2, Math.max(1, Math.floor(baseX / scale)));
          const simY = Math.min(simHeight - 2, Math.max(1, Math.floor(baseY / scale)));
          const idx = simY * simWidth + simX;

          // Surface slope calculates wave refraction
          const dx = (buffer1[idx + 1] - buffer1[idx - 1]) * refractionScale;
          const dy = (buffer1[idx + simWidth] - buffer1[idx - simWidth]) * refractionScale;

          const px = baseX + dx;
          const py = baseY + dy;

          if (r === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }

      // Horizontal lines
      for (let r = 0; r < rows; r++) {
        const baseY = r * cellSize;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);

        for (let c = 0; c < cols; c++) {
          const baseX = c * cellSize;
          const simX = Math.min(simWidth - 2, Math.max(1, Math.floor(baseX / scale)));
          const simY = Math.min(simHeight - 2, Math.max(1, Math.floor(baseY / scale)));
          const idx = simY * simWidth + simX;

          const dx = (buffer1[idx + 1] - buffer1[idx - 1]) * refractionScale;
          const dy = (buffer1[idx + simWidth] - buffer1[idx - simWidth]) * refractionScale;

          const px = baseX + dx;
          const py = baseY + dy;

          if (c === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }

      ctx.setLineDash([]); // Reset dash

      // 3. Draw Rotated Diamond Junctions at Grid Intersections (Geolava signature motif)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const baseX = c * cellSize;
          const baseY = r * cellSize;
          const simX = Math.min(simWidth - 2, Math.max(1, Math.floor(baseX / scale)));
          const simY = Math.min(simHeight - 2, Math.max(1, Math.floor(baseY / scale)));
          const idx = simY * simWidth + simX;

          const waveVal = Math.abs(buffer1[idx]);
          const dx = (buffer1[idx + 1] - buffer1[idx - 1]) * refractionScale;
          const dy = (buffer1[idx + simWidth] - buffer1[idx - simWidth]) * refractionScale;

          const px = baseX + dx;
          const py = baseY + dy;

          // Subtle diamond size (3px idle, up to 6px under wave)
          const dSize = Math.min(6, 2.5 + waveVal * 0.04);
          const alpha = Math.min(0.7, 0.12 + waveVal * 0.008);

          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(Math.PI / 4); // 45 degree rotation
          ctx.fillStyle = `rgba(226, 232, 240, ${alpha})`;
          ctx.fillRect(-dSize / 2, -dSize / 2, dSize, dSize);
          ctx.restore();
        }
      }

      // 4. Liquid Caustics & Specular Water Highlights
      // Sample heightened waves and render organic luminous liquid sheen
      for (let y = 3; y < simHeight - 3; y += 2) {
        const rowIdx = y * simWidth;
        for (let x = 3; x < simWidth - 3; x += 2) {
          const idx = rowIdx + x;
          const val = buffer1[idx];

          if (val > 1.8) {
            const screenX = x * scale;
            const screenY = y * scale;
            const intensity = Math.min(0.28, (val - 1.8) * 0.02);

            // Subtle non-flashy platinum/calm pearl water caustics
            ctx.fillStyle = `rgba(186, 230, 253, ${intensity})`;
            ctx.beginPath();
            ctx.arc(screenX, screenY, Math.min(18, val * 0.35), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 5. Interactive Crosshair Lines (Geolava crosshair)
      if (showCrosshair && mouse.isOver) {
        const cx = crosshairCoords.x;
        const cy = crosshairCoords.y;

        // Horizontal crosshair dashed line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.setLineDash([6, 12]);
        ctx.moveTo(0, cy);
        ctx.lineTo(width, cy);
        ctx.stroke();

        // Vertical crosshair dashed line
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Crosshair Center Target Diamond
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-6, -6, 12, 12);

        // Center dot
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-1.5, -1.5, 3, 3);
        ctx.restore();

        // Corner telemetry readout badge
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.fillText(
          `X: ${cx.toFixed(1)}  Y: ${cy.toFixed(1)}  // KERNEL: ACTIVE`,
          cx + 14,
          cy - 12
        );
      }

      ctx.restore();
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      parent.removeEventListener('pointermove', handlePointerMove);
      parent.removeEventListener('pointerleave', handlePointerLeave);
      parent.removeEventListener('click', handleClick);
    };
  }, [cellSize, damping, rippleIntensity, showCrosshair, onGridClick]);

  return (
    <canvas
      ref={canvasRef}
      className={`water-ripple-grid-canvas ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        zIndex: 1
      }}
    />
  );
}
