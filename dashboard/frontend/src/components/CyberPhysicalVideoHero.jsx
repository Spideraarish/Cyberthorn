import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CyberPhysicalVideoHero() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [activeLayer, setActiveLayer] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let animId = null;
    let gl = null;

    try {
      gl = canvas.getContext('webgl', { 
        alpha: true, 
        premultipliedAlpha: true,
        antialias: true 
      }) || canvas.getContext('experimental-webgl', { 
        alpha: true, 
        premultipliedAlpha: true 
      });
    } catch (e) {
      console.warn('WebGL init error:', e);
    }

    if (!gl) {
      console.warn('WebGL not available; falling back to direct video');
      return;
    }

    canvas.width = 1080;
    canvas.height = 1920;

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = vec2((a_position.x + 1.0) * 0.5, 1.0 - (a_position.y + 1.0) * 0.5);
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment Shader: Clean Luma Key + Premultiplied Alpha + Perimeter Box Decay
    // Zero dark haze, seamless background blend, vibrant layer colors
    const fsSource = `
      precision mediump float;
      uniform sampler2D u_video;
      varying vec2 v_uv;

      void main() {
        vec4 color = texture2D(u_video, v_uv);
        float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));

        vec2 centeredUv = (v_uv - vec2(0.5)) * 2.0;

        // Smooth isometric diamond & boundary decay to remove background shadows
        float isoDist = abs(centeredUv.x * 0.95) + abs(centeredUv.y * 0.55);
        float edgeMask = clamp((1.28 - isoDist) / 0.32, 0.0, 1.0);
        edgeMask = edgeMask * edgeMask * (3.0 - 2.0 * edgeMask);

        float boxX = 1.0 - clamp(abs(centeredUv.x) * 1.25 - 0.18, 0.0, 1.0);
        float boxY = 1.0 - clamp(abs(centeredUv.y) * 1.15 - 0.10, 0.0, 1.0);
        float boxFade = boxX * boxY;

        // Clean luma threshold: dissolves dark background into zero alpha
        float alpha = clamp((luma - 0.065) / 0.09, 0.0, 1.0);
        alpha = alpha * alpha * (3.0 - 2.0 * alpha) * edgeMask * boxFade;

        // Color boost for cyber neon traces and physical machinery
        vec3 rgb = color.rgb;
        if (color.b > color.r * 1.15) {
          rgb.b = min(1.0, rgb.b * 1.14);
          rgb.g = min(1.0, rgb.g * 1.08);
        } else if (luma > 0.30) {
          rgb = rgb * 1.08;
        }

        // Premultiplied alpha for clean WebGL page compositing
        gl_FragColor = vec4(rgb * alpha, alpha);
      }
    `;

    function createShader(glCtx, type, source) {
      const shader = glCtx.createShader(type);
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.error('Shader compile error:', glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    function render() {
      if (video.readyState >= 2) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      animId = requestAnimationFrame(render);
    }

    video.muted = true;
    video.defaultMuted = true;
    video.play().then(() => {
      animId = requestAnimationFrame(render);
    }).catch((err) => {
      console.warn('Video autoplay defer:', err);
      animId = requestAnimationFrame(render);
    });

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (gl) {
        gl.deleteTexture(texture);
        gl.deleteBuffer(positionBuffer);
        gl.deleteProgram(program);
      }
    };
  }, []);

  return (
    <div className="cq-cps-video-hero-wrap">
      {/* ── ATMOSPHERIC MULTI-TIER GLOW ── */}
      <div className="cq-cps-video-glow-cyber" />
      <div className="cq-cps-video-glow-network" />
      <div className="cq-cps-video-glow-physical" />

      {/* Hidden source video */}
      <video
        ref={videoRef}
        src="/assets/cyber_physical_system_3d.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0.01, pointerEvents: 'none' }}
      />

      {/* ── MAIN 3D HOLOGRAM STACK WITH LEAN CALLOUT BADGES ── */}
      <motion.div 
        className="cq-cps-stage-container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Transparent WebGL Canvas */}
        <canvas
          ref={canvasRef}
          className="cq-cps-hero-canvas"
          aria-label="3D Cyber-Physical System Layered Architecture Hologram"
        />

        {/* ── THREE LEAN & CRISP FLOATING LAYER CALLOUT BADGES ── */}
        {/* Layer 01: Cyber Layer */}
        <motion.div 
          className={`cq-cps-layer-callout layer-cyber ${activeLayer === 'cyber' ? 'active' : ''}`}
          onMouseEnter={() => setActiveLayer('cyber')}
          onMouseLeave={() => setActiveLayer(null)}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <div className="cq-cps-callout-line" />
          <div className="cq-cps-callout-pill">
            <span className="cq-cps-callout-dot cyber" />
            <div className="cq-cps-callout-body">
              <div className="cq-cps-callout-header">
                <span className="cq-cps-callout-num">01</span>
                <span className="cq-cps-callout-title">CYBER LAYER</span>
              </div>
              <span className="cq-cps-callout-desc">Neural Cognition &amp; Kernel AI</span>
            </div>
          </div>
        </motion.div>

        {/* Layer 02: Network Layer */}
        <motion.div 
          className={`cq-cps-layer-callout layer-network ${activeLayer === 'network' ? 'active' : ''}`}
          onMouseEnter={() => setActiveLayer('network')}
          onMouseLeave={() => setActiveLayer(null)}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="cq-cps-callout-line" />
          <div className="cq-cps-callout-pill">
            <span className="cq-cps-callout-dot network" />
            <div className="cq-cps-callout-body">
              <div className="cq-cps-callout-header">
                <span className="cq-cps-callout-num">02</span>
                <span className="cq-cps-callout-title">NETWORK LAYER</span>
              </div>
              <span className="cq-cps-callout-desc">Zero-Trust Graph Topology</span>
            </div>
          </div>
        </motion.div>

        {/* Layer 03: Physical Layer */}
        <motion.div 
          className={`cq-cps-layer-callout layer-physical ${activeLayer === 'physical' ? 'active' : ''}`}
          onMouseEnter={() => setActiveLayer('physical')}
          onMouseLeave={() => setActiveLayer(null)}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
        >
          <div className="cq-cps-callout-line" />
          <div className="cq-cps-callout-pill">
            <span className="cq-cps-callout-dot physical" />
            <div className="cq-cps-callout-body">
              <div className="cq-cps-callout-header">
                <span className="cq-cps-callout-num">03</span>
                <span className="cq-cps-callout-title">PHYSICAL LAYER</span>
              </div>
              <span className="cq-cps-callout-desc">Optocoupled Galvanic Airgap</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
