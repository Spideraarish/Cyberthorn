import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Cpu, 
  Lock, 
  Radio, 
  Activity, 
  Zap,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

/* ── ARCHITECTURAL LAYERS DATA (CONFLICT-FREE & ULTRA-CLEAN) ── */
const ARCH_LAYERS = [
  {
    id: 'kernel',
    num: '01',
    badge: 'LAYER 01',
    title: 'Kernel Defense',
    subtitle: 'Netfilter Priority 0 Hook',
    color: '#2dd4bf', // Mint
    glow: 'rgba(45, 212, 191, 0.28)',
    borderGlow: 'rgba(45, 212, 191, 0.45)',
    bgGradient: 'linear-gradient(180deg, rgba(45, 212, 191, 0.12) 0%, rgba(13, 22, 35, 0.65) 45%, rgba(6, 10, 18, 0.9) 100%)',
    metrics: { primary: '< 38.4MS', secondary: 'WIRE DROP', tag: 'ZERO LATERAL BLEED' },
    desc: 'Autonomous inline socket severing at packet zero before userland exposure.',
    specs: ['nftables inline drop', 'Pre-routing hook', '0.00% packet bleed']
  },
  {
    id: 'neural',
    num: '02',
    badge: 'LAYER 02',
    title: 'Neural Cognition',
    subtitle: 'GraphSAGE GNN + 1D-CNN',
    color: '#a855f7', // Electric Violet
    glow: 'rgba(168, 85, 247, 0.28)',
    borderGlow: 'rgba(168, 85, 247, 0.45)',
    bgGradient: 'linear-gradient(180deg, rgba(168, 85, 247, 0.12) 0%, rgba(22, 15, 38, 0.65) 45%, rgba(8, 6, 18, 0.9) 100%)',
    metrics: { primary: '0.00% DRIFT', secondary: 'AI ADJACENCY', tag: 'DUAL-ENGINE CORE' },
    desc: 'Continuous spatial topology reasoning combined with microsecond temporal burst analysis.',
    specs: ['Spatial GNN clustering', '1D-CNN waveforms', '10 Zero-Day vectors']
  },
  {
    id: 'airgap',
    num: '03',
    badge: 'LAYER 03',
    title: 'Physical Airgap',
    subtitle: 'Galvanic Hardware Relay',
    color: '#f59e0b', // Solar Amber
    glow: 'rgba(245, 158, 11, 0.28)',
    borderGlow: 'rgba(245, 158, 11, 0.45)',
    bgGradient: 'linear-gradient(180deg, rgba(245, 158, 11, 0.12) 0%, rgba(32, 22, 10, 0.65) 45%, rgba(12, 8, 4, 0.9) 100%)',
    metrics: { primary: '/dev/ttyACM0', secondary: 'SERIAL RELAY', tag: 'GALVANIC LOCK' },
    desc: 'Arduino Uno R3 optocoupled relays provide true physical electrical circuit severance.',
    specs: ['Hardware optocouplers', 'PIN 09/10/11 actuator', 'Fail-safe galvanic isolation']
  }
];

export default function ArchitectureLayersDiagram() {
  const [activeLayer, setActiveLayer] = useState(null);
  const [mouseTilt, setMouseTilt] = useState({ rotateX: 0, rotateY: 0 });
  const stageRef = useRef(null);

  // Smooth mouse tilt parallax
  const handleMouseMove = (e) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseTilt({
      rotateY: nx * 9,  // -4.5 to +4.5 deg
      rotateX: -ny * 7  // -3.5 to +3.5 deg
    });
  };

  const handleMouseLeave = () => {
    setMouseTilt({ rotateX: 0, rotateY: 0 });
    setActiveLayer(null);
  };

  return (
    <div 
      className="cq-arch-perspective-stage"
      ref={stageRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '700px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1400px',
        userSelect: 'none'
      }}
    >
      {/* ── ATMOSPHERIC MULTI-COLOR AMBIENT BACKDROP GLOW ── */}
      <div 
        style={{
          position: 'absolute',
          top: '15%',
          left: '10%',
          right: '10%',
          bottom: '15%',
          background: 'radial-gradient(ellipse at 25% 40%, rgba(45, 212, 191, 0.14) 0%, transparent 60%), radial-gradient(ellipse at 50% 50%, rgba(168, 85, 247, 0.11) 0%, transparent 60%), radial-gradient(ellipse at 75% 60%, rgba(245, 158, 11, 0.08) 0%, transparent 60%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* ── TOP ARCHITECTURAL STATUS BUS STRIP ── */}
      <div 
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 18px',
          marginBottom: '16px',
          background: 'rgba(9, 14, 23, 0.65)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          borderRadius: '9999px',
          zIndex: 2
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2dd4bf', boxShadow: '0 0 10px #2dd4bf' }} />
          <span style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--cq-text-main)' }}>
            SOVEREIGN WIRE ENCLAVE
          </span>
          <span style={{ fontSize: '10px', color: 'var(--cq-text-dim)', fontFamily: 'var(--cq-font-mono)' }}>//</span>
          <span style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '10px', color: 'var(--cq-cobalt)' }}>
            AF_PACKET 64MB RING
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', animation: 'cqPing 2s infinite' }} />
          <span style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '10px', fontWeight: 600, color: 'var(--cq-mint)' }}>
            ALL 3 LAYERS ACTIVE
          </span>
        </div>
      </div>

      {/* ── 3D PERSPECTIVE ASSEMBLY (3 FREESTANDING STANDING SLABS) ── */}
      <motion.div
        animate={{
          rotateY: mouseTilt.rotateY,
          rotateX: mouseTilt.rotateX
        }}
        transition={{ type: 'spring', stiffness: 140, damping: 22 }}
        style={{
          position: 'relative',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '18px',
          transformStyle: 'preserve-3d',
          zIndex: 2
        }}
      >
        {ARCH_LAYERS.map((layer, index) => {
          const isHovered = activeLayer === layer.id;
          return (
            <motion.div
              key={layer.id}
              onMouseEnter={() => setActiveLayer(layer.id)}
              onMouseLeave={() => setActiveLayer(null)}
              animate={{
                y: isHovered ? -12 : (index === 0 ? [0, -6, 0] : index === 1 ? [0, -8, 0] : [0, -5, 0]),
                z: isHovered ? 40 : 0
              }}
              transition={
                isHovered 
                  ? { type: 'spring', stiffness: 300, damping: 24 } 
                  : { 
                      y: { 
                        repeat: Infinity, 
                        duration: index === 0 ? 4.2 : index === 1 ? 4.8 : 5.4, 
                        ease: 'easeInOut',
                        delay: index * 0.4
                      }
                    }
              }
              style={{
                position: 'relative',
                height: '380px',
                borderRadius: '18px',
                background: layer.bgGradient,
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                border: `1.5px solid ${isHovered ? layer.color : layer.borderGlow}`,
                boxShadow: isHovered 
                  ? `0 24px 50px -10px rgba(0, 0, 0, 0.85), 0 0 35px -5px ${layer.color}` 
                  : `0 18px 40px -12px rgba(0, 0, 0, 0.7), 0 0 20px -8px ${layer.glow}`,
                padding: '22px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'border-color 0.25s ease, box-shadow 0.25s ease'
              }}
            >
              {/* Top Luminous Neon Edge Tracer */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: `linear-gradient(90deg, transparent, ${layer.color}, transparent)`,
                  boxShadow: `0 0 10px ${layer.color}`
                }}
              />

              {/* Specular Glint Across the Face */}
              <div 
                style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  right: '-50%',
                  bottom: '-50%',
                  background: 'linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.05) 50%, transparent 60%)',
                  pointerEvents: 'none',
                  transform: isHovered ? 'translateY(20%)' : 'translateY(0%)',
                  transition: 'transform 0.6s ease'
                }}
              />

              {/* ── CARD HEADER ── */}
              <div style={{ position: 'relative', zIndex: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span 
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: `${layer.color}18`,
                      border: `1px solid ${layer.color}40`,
                      fontFamily: 'var(--cq-font-mono)',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: layer.color,
                      letterSpacing: '0.06em'
                    }}
                  >
                    {layer.badge}
                  </span>

                  <div 
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: layer.color,
                      boxShadow: `0 0 8px ${layer.color}`
                    }}
                  />
                </div>

                <h3 
                  style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    marginBottom: '4px',
                    fontFamily: 'var(--cq-font-sans)',
                    lineHeight: '1.2'
                  }}
                >
                  {layer.title}
                </h3>

                <p 
                  style={{
                    fontSize: '11px',
                    color: 'var(--cq-text-muted)',
                    fontFamily: 'var(--cq-font-mono)',
                    margin: 0,
                    lineHeight: '1.3'
                  }}
                >
                  {layer.subtitle}
                </p>
              </div>

              {/* ── ANIMATED VISUAL CENTERPIECE (BESPOKE PER LAYER) ── */}
              <div 
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '130px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '10px 0',
                  zIndex: 3
                }}
              >
                {/* ── LAYER 01: DEFENSIVE RADAR SWEEP WITH SHIELD CORE ── */}
                {layer.id === 'kernel' && (
                  <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Concentric radar ripples */}
                    <div className="cq-radar-pulse cq-radar-pulse-1" style={{ borderColor: layer.color }} />
                    <div className="cq-radar-pulse cq-radar-pulse-2" style={{ borderColor: layer.color }} />

                    {/* Shield Glyph */}
                    <div 
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '14px',
                        background: 'rgba(45, 212, 191, 0.15)',
                        border: '1.5px solid #2dd4bf',
                        boxShadow: '0 0 20px rgba(45, 212, 191, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2
                      }}
                    >
                      <ShieldCheck className="w-7 h-7 text-[#2dd4bf]" />
                    </div>
                  </div>
                )}

                {/* ── LAYER 02: ACTIVE GNN SYNAPTIC CONSTELLATION ── */}
                {layer.id === 'neural' && (
                  <svg viewBox="0 0 120 110" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {/* Connecting Synaptic Edges */}
                    <line x1="25" y1="55" x2="60" y2="25" stroke="rgba(168, 85, 247, 0.45)" strokeWidth="1.5" />
                    <line x1="60" y1="25" x2="95" y2="55" stroke="rgba(168, 85, 247, 0.45)" strokeWidth="1.5" />
                    <line x1="25" y1="55" x2="45" y2="90" stroke="rgba(168, 85, 247, 0.45)" strokeWidth="1.5" />
                    <line x1="45" y1="90" x2="75" y2="90" stroke="rgba(168, 85, 247, 0.45)" strokeWidth="1.5" />
                    <line x1="95" y1="55" x2="75" y2="90" stroke="rgba(168, 85, 247, 0.45)" strokeWidth="1.5" />
                    <line x1="60" y1="25" x2="60" y2="62" stroke="rgba(168, 85, 247, 0.45)" strokeWidth="1.5" />
                    <line x1="25" y1="55" x2="60" y2="62" stroke="rgba(168, 85, 247, 0.45)" strokeWidth="1.5" />
                    <line x1="95" y1="55" x2="60" y2="62" stroke="rgba(168, 85, 247, 0.45)" strokeWidth="1.5" />

                    {/* Nodes */}
                    <circle cx="60" cy="25" r="7" fill="#a855f7" filter="drop-shadow(0 0 8px #a855f7)" />
                    <circle cx="25" cy="55" r="6" fill="#c084fc" />
                    <circle cx="95" cy="55" r="6" fill="#c084fc" />
                    <circle cx="45" cy="90" r="5.5" fill="#818cf8" />
                    <circle cx="75" cy="90" r="5.5" fill="#818cf8" />
                    <circle cx="60" cy="62" r="8" fill="#e879f9" filter="drop-shadow(0 0 10px #e879f9)" />

                    {/* Traveling Synaptic Signal Bead */}
                    <circle cx="0" cy="0" r="3.5" fill="#ffffff">
                      <animateMotion path="M 25 55 L 60 25 L 95 55 L 60 62 L 45 90 Z" dur="2.8s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                )}

                {/* ── LAYER 03: HARDWARE OPTOCOUPLED RELAY SWITCH ── */}
                {layer.id === 'airgap' && (
                  <svg viewBox="0 0 120 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {/* Galvanic Terminal Posts */}
                    <circle cx="25" cy="50" r="7" fill="#f59e0b" filter="drop-shadow(0 0 6px #f59e0b)" />
                    <circle cx="95" cy="50" r="7" fill="#f59e0b" filter="drop-shadow(0 0 6px #f59e0b)" />

                    {/* In-lead / Out-lead circuit traces */}
                    <line x1="5" y1="50" x2="25" y2="50" stroke="#f59e0b" strokeWidth="2.5" />
                    <line x1="95" y1="50" x2="115" y2="50" stroke="#f59e0b" strokeWidth="2.5" />

                    {/* Contact Blade Armature */}
                    <line 
                      x1="25" y1="50" x2="88" y2="34" 
                      stroke="#fbbf24" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                      className="cq-relay-blade" 
                    />

                    {/* Optocoupled Galvanic Isolation Arc */}
                    <path 
                      d="M 45 30 Q 60 20 75 30" 
                      fill="none" 
                      stroke="rgba(245, 158, 11, 0.5)" 
                      strokeWidth="1.5" 
                      strokeDasharray="3 3" 
                    />

                    {/* Discharge Spark Pulse */}
                    <circle cx="88" cy="35" r="4" fill="#ffffff" className="cq-spark-burst" filter="drop-shadow(0 0 10px #fbbf24)" />
                  </svg>
                )}
              </div>

              {/* ── CARD FOOTER TELEMETRY CHIP ── */}
              <div 
                style={{
                  position: 'relative',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: 'rgba(5, 8, 15, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  zIndex: 3
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '11px', fontWeight: 800, color: layer.color }}>
                    {layer.metrics.primary}
                  </span>
                  <span 
                    style={{
                      fontSize: '8.5px',
                      fontFamily: 'var(--cq-font-mono)',
                      fontWeight: 700,
                      color: layer.color,
                      background: `${layer.color}15`,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {layer.metrics.tag}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '9px', color: 'var(--cq-text-dim)', letterSpacing: '0.03em' }}>
                  {layer.metrics.secondary}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── INTERCONNECTING BOTTOM CIRCUIT BUS RAIL (CONNECTS THE 3 LAYERS) ── */}
      <div 
        style={{
          width: '92%',
          marginTop: '16px',
          position: 'relative',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1
        }}
      >
        {/* Glow Line Track */}
        <div 
          style={{
            position: 'absolute',
            left: '10%',
            right: '10%',
            height: '2px',
            background: 'linear-gradient(90deg, #2dd4bf 0%, #a855f7 50%, #f59e0b 100%)',
            opacity: 0.5,
            boxShadow: '0 0 12px rgba(45, 212, 191, 0.4)'
          }}
        />

        {/* Moving Bus Photon Packet */}
        <div className="cq-bus-photon" />

        {/* 3 Alignment Node Markers */}
        <div style={{ position: 'absolute', left: '16%', width: '8px', height: '8px', borderRadius: '50%', background: '#2dd4bf', boxShadow: '0 0 8px #2dd4bf' }} />
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 8px #a855f7' }} />
        <div style={{ position: 'absolute', right: '16%', width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
      </div>

      {/* ── EMBEDDED KEYFRAME CSS ANIMATIONS ── */}
      <style>{`
        @keyframes cqPing {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.4); }
        }

        /* Radar Waves */
        @keyframes cqRadarWave {
          0% { width: 30px; height: 30px; opacity: 0.8; }
          100% { width: 90px; height: 90px; opacity: 0; }
        }
        .cq-radar-pulse {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid;
          animation: cqRadarWave 2.6s ease-out infinite;
        }
        .cq-radar-pulse-2 {
          animation-delay: 1.3s;
        }

        /* Relay Arm Snap */
        @keyframes cqRelaySnap {
          0%, 100% { stroke: #fbbf24; }
          48% { stroke: #fbbf24; }
          50% { stroke: #ffffff; }
          52% { stroke: #fbbf24; }
        }
        .cq-relay-blade {
          animation: cqRelaySnap 3.4s ease-in-out infinite;
        }

        /* Spark Burst */
        @keyframes cqSpark {
          0%, 48%, 56%, 100% { opacity: 0; transform: scale(0.6); }
          50% { opacity: 1; transform: scale(1.6); }
        }
        .cq-spark-burst {
          animation: cqSpark 3.4s ease-in-out infinite;
          transform-origin: 88px 35px;
        }

        /* Bus Photon */
        @keyframes cqBusTravel {
          0% { left: 12%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 86%; opacity: 0; }
        }
        .cq-bus-photon {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 12px #2dd4bf, 0 0 20px #a855f7;
          animation: cqBusTravel 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
