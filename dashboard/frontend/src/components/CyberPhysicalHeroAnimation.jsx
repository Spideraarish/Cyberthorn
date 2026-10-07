import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Cpu, 
  Terminal, 
  Zap, 
  Radio, 
  Volume2, 
  VolumeX, 
  Lock, 
  Unlock, 
  ShieldAlert, 
  Layers, 
  ArrowUpRight,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

/* ── WebAudio Synthesizer for 1000Hz Buzzer Tone (matches tone(12, 1000, 200) in alert_listener.ino) ── */
function playTone(freq = 1000, durationMs = 200) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square'; // Classic piezo buzzer waveform
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (err) {
    // Ignore audio autostart restrictions
  }
}

export default function CyberPhysicalHeroAnimation() {
  const [activeAction, setActiveAction] = useState('block'); // 'block' | 'watch' | 'ignore'
  const [pin13Led, setPin13Led] = useState(false);
  const [buzzerWave, setBuzzerWave] = useState(false);
  const [relayStatus, setRelayStatus] = useState('AIRGAP_SEVERED'); // 'AIRGAP_SEVERED' | 'MONITORING' | 'CLOSED_PASS'
  const [txRxFlash, setTxRxFlash] = useState(false);
  const [audioMuted, setAudioMuted] = useState(true);
  const [pulsePosition, setPulsePosition] = useState(0);
  const [serialFeed, setSerialFeed] = useState([
    { id: 1, text: 'UART: /dev/ttyACM0 connected (9600 baud)' },
    { id: 2, text: 'INODE: Netfilter hook attached @ Priority 0' },
    { id: 3, text: 'CPS: Physical airgap relay armed' }
  ]);

  // Execute Arduino logic based on command
  const triggerCpsAction = (action) => {
    setActiveAction(action);
    setTxRxFlash(true);
    setTimeout(() => setTxRxFlash(false), 260);

    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });

    if (action === 'block') {
      setRelayStatus('AIRGAP_SEVERED');
      setSerialFeed(prev => [
        ...prev.slice(-3),
        { id: Date.now(), text: `[${time}] TX: "block\\n" -> PIN 13 3x BLINK + BUZZER 1000Hz` },
        { id: Date.now() + 1, text: `[${time}] RELAY: OPTOCOUPLER OPEN -> GALVANIC AIRGAP` }
      ]);

      // 3 cycles of blink + buzzer matching alert_listener.ino
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          setPin13Led(true);
          setBuzzerWave(true);
          if (!audioMuted) playTone(1000, 200);
        }, i * 360);

        setTimeout(() => {
          setPin13Led(false);
          setBuzzerWave(false);
        }, i * 360 + 180);
      }
    } else if (action === 'watch') {
      setRelayStatus('MONITORING');
      setSerialFeed(prev => [
        ...prev.slice(-3),
        { id: Date.now(), text: `[${time}] TX: "watch\\n" -> PIN 13 STEADY (1000ms)` }
      ]);
      setPin13Led(true);
      setTimeout(() => setPin13Led(false), 1000);
    } else {
      setRelayStatus('CLOSED_PASS');
      setSerialFeed(prev => [
        ...prev.slice(-3),
        { id: Date.now(), text: `[${time}] TX: "ignore\\n" -> NORMAL PASS (RELAY RESTORED)` }
      ]);
      setPin13Led(false);
      setBuzzerWave(false);
    }
  };

  // Continuous subtle pulse animation loop across cyber-physical bridge
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePosition(p => (p + 1) % 100);
    }, 45);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="cq-cps-hero-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '560px',
        margin: '0 auto',
        borderRadius: '20px',
        background: 'rgba(7, 11, 20, 0.85)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(0, 242, 254, 0.16)',
        boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 242, 254, 0.08)',
        padding: '20px',
        overflow: 'hidden',
        color: '#f8fafc'
      }}
    >
      {/* ── TOP HEADER / DOMAIN STATUS BAR ── */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '14px',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div 
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(0, 242, 254, 0.12)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00f2fe'
            }}
          >
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: '#ffffff' }}>
              CYBER-PHYSICAL SYSTEM (CPS)
            </div>
            <div style={{ fontSize: '9px', fontFamily: 'var(--cq-font-mono)', color: 'rgba(255, 255, 255, 0.45)' }}>
              KERNEL PEP &harr; ARDUINO UNO HARDWARE ENCLAVE
            </div>
          </div>
        </div>

        {/* Link to Full Simulation */}
        <Link 
          to="/simulation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(0, 242, 254, 0.08)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            padding: '5px 10px',
            borderRadius: '9999px',
            color: '#00f2fe',
            fontFamily: 'var(--cq-font-mono)',
            fontSize: '9.5px',
            fontWeight: 700,
            textDecoration: 'none',
            transition: 'all 0.2s ease'
          }}
          title="Open complete architecture and hardware simulation"
        >
          <span>/simulation</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* ── CORE ANIMATION CANVAS: CYBER DOMAIN &harr; PHYSICAL ACTUATOR ── */}
      <div 
        style={{
          position: 'relative',
          background: 'linear-gradient(180deg, rgba(4, 9, 16, 0.8) 0%, rgba(2, 6, 12, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1.25fr', gap: '8px', alignItems: 'center' }}>
          
          {/* 1. CYBER DOMAIN (LINUX KERNEL & GNN) */}
          <div 
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '12px',
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '9px', fontFamily: 'var(--cq-font-mono)', color: '#38bdf8', fontWeight: 700 }}>
                CYBER DOMAIN
              </span>
              <span style={{ fontSize: '7.5px', fontFamily: 'var(--cq-font-mono)', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '1px 5px', borderRadius: '4px' }}>
                PRIORITY 0
              </span>
            </div>

            <div style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 }}>
              Linux Netfilter &amp; GNN Inode
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '9px', fontFamily: 'var(--cq-font-mono)', color: 'rgba(255, 255, 255, 0.55)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ring Buffer:</span>
                <span style={{ color: '#00f2fe' }}>64MB Raw</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GraphSAGE:</span>
                <span style={{ color: '#2dd4bf' }}>0.988 Anomaly</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Kernel Latency:</span>
                <span style={{ color: '#f43f5e', fontWeight: 700 }}>38.4ms</span>
              </div>
            </div>

            {/* Simulated Inode Packet Wave */}
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
              <div 
                style={{
                  height: '100%',
                  width: '40%',
                  background: 'linear-gradient(90deg, #00f2fe, #38bdf8)',
                  borderRadius: '2px',
                  animation: 'cqPulseWave 1.4s ease-in-out infinite'
                }} 
              />
            </div>
          </div>

          {/* 2. BRIDGE: UART SERIAL CONNECTION (9600 BAUD) */}
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            {/* Glowing Wire Connector */}
            <div 
              style={{
                width: '100%',
                height: '3px',
                background: 'rgba(255, 255, 255, 0.1)',
                position: 'relative',
                borderRadius: '2px'
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  top: '-2px',
                  left: `${pulsePosition}%`,
                  width: '10px',
                  height: '7px',
                  background: activeAction === 'block' ? '#f43f5e' : '#00f2fe',
                  borderRadius: '3px',
                  boxShadow: activeAction === 'block' ? '0 0 10px #f43f5e' : '0 0 8px #00f2fe'
                }}
              />
            </div>

            <div style={{ marginTop: '6px', fontSize: '7.5px', fontFamily: 'var(--cq-font-mono)', color: txRxFlash ? '#fbbf24' : 'rgba(255, 255, 255, 0.4)', textAlign: 'center', fontWeight: 700 }}>
              UART TX/RX
            </div>
            <div style={{ fontSize: '7px', fontFamily: 'var(--cq-font-mono)', color: 'rgba(255,255,255,0.3)' }}>
              9600 BAUD
            </div>
          </div>

          {/* 3. PHYSICAL DOMAIN (ARDUINO UNO R3 + ACTUATORS) */}
          <div 
            style={{
              background: 'linear-gradient(135deg, rgba(8, 20, 32, 0.9) 0%, rgba(3, 10, 18, 0.95) 100%)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              borderRadius: '12px',
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '9px', fontFamily: 'var(--cq-font-mono)', color: '#00f2fe', fontWeight: 800 }}>
                ARDUINO UNO R3
              </span>
              <span style={{ fontSize: '7.5px', fontFamily: 'var(--cq-font-mono)', color: 'rgba(255,255,255,0.4)' }}>
                ATmega328P
              </span>
            </div>

            {/* Actuators row: PIN 13 LED, PIN 12 Buzzer, Optocoupler Relay */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              
              {/* Actuator A: PIN 13 LED (L) */}
              <div 
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: `1px solid ${pin13Led ? '#f59e0b' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '6px',
                  padding: '6px 4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <div 
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: pin13Led ? '#f59e0b' : '#334155',
                    boxShadow: pin13Led ? '0 0 14px #f59e0b, 0 0 24px #f59e0b' : 'none',
                    transition: 'all 0.08s ease'
                  }} 
                />
                <span style={{ fontSize: '7.5px', fontFamily: 'var(--cq-font-mono)', color: pin13Led ? '#fbbf24' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                  PIN 13 [L]
                </span>
              </div>

              {/* Actuator B: PIN 12 BUZZER */}
              <div 
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: `1px solid ${buzzerWave ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '6px',
                  padding: '6px 4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <div 
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: buzzerWave ? '#ef4444' : '#1e293b',
                    boxShadow: buzzerWave ? '0 0 14px #ef4444' : 'none',
                    animation: buzzerWave ? 'cqBuzzerPulse 0.18s infinite' : 'none'
                  }} 
                />
                <span style={{ fontSize: '7.5px', fontFamily: 'var(--cq-font-mono)', color: buzzerWave ? '#ef4444' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                  PIN 12 1kHz
                </span>
              </div>

              {/* Actuator C: OPTOCOUPLED RELAY */}
              <div 
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: `1px solid ${relayStatus === 'AIRGAP_SEVERED' ? '#f43f5e' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '6px',
                  padding: '6px 4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {relayStatus === 'AIRGAP_SEVERED' ? (
                  <Lock className="w-3 h-3 text-rose-400" />
                ) : (
                  <Unlock className="w-3 h-3 text-emerald-400" />
                )}
                <span style={{ fontSize: '7.5px', fontFamily: 'var(--cq-font-mono)', color: relayStatus === 'AIRGAP_SEVERED' ? '#f43f5e' : '#10b981', fontWeight: 700 }}>
                  {relayStatus === 'AIRGAP_SEVERED' ? 'AIRGAP' : 'LNK PASS'}
                </span>
              </div>

            </div>

            {/* Status summary pill */}
            <div 
              style={{
                fontSize: '8px',
                fontFamily: 'var(--cq-font-mono)',
                color: relayStatus === 'AIRGAP_SEVERED' ? '#f43f5e' : '#10b981',
                background: relayStatus === 'AIRGAP_SEVERED' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                padding: '3px 6px',
                borderRadius: '4px',
                textAlign: 'center',
                fontWeight: 700
              }}
            >
              {relayStatus === 'AIRGAP_SEVERED' ? 'PHYSICAL BREAKER DISCONNECTED' : 'CIRCUIT NORMAL CONDUCTION'}
            </div>
          </div>

        </div>
      </div>

      {/* ── INTERACTIVE ARDUINO TRIGGER CONTROLS ── */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '9px', fontFamily: 'var(--cq-font-mono)', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}>
            TEST ARDUINO SERIAL TRIGGER (alert_listener.ino):
          </span>
          <button
            onClick={() => setAudioMuted(!audioMuted)}
            title={audioMuted ? 'Unmute 1000Hz buzzer tone' : 'Mute buzzer sound'}
            style={{
              background: 'none',
              border: 'none',
              color: audioMuted ? 'rgba(255,255,255,0.4)' : '#00f2fe',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '8.5px',
              fontFamily: 'var(--cq-font-mono)',
              padding: 0
            }}
          >
            {audioMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            <span>{audioMuted ? 'TONE MUTED' : '1000Hz ON'}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <button
            onClick={() => triggerCpsAction('block')}
            style={{
              padding: '8px 6px',
              borderRadius: '8px',
              border: activeAction === 'block' ? '1.5px solid #f43f5e' : '1px solid rgba(244, 63, 94, 0.3)',
              background: activeAction === 'block' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(244, 63, 94, 0.08)',
              color: '#f43f5e',
              fontFamily: 'var(--cq-font-mono)',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            "block" &rarr; AIRGAP
          </button>

          <button
            onClick={() => triggerCpsAction('watch')}
            style={{
              padding: '8px 6px',
              borderRadius: '8px',
              border: activeAction === 'watch' ? '1.5px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.3)',
              background: activeAction === 'watch' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.08)',
              color: '#f59e0b',
              fontFamily: 'var(--cq-font-mono)',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            "watch" &rarr; STEADY
          </button>

          <button
            onClick={() => triggerCpsAction('ignore')}
            style={{
              padding: '8px 6px',
              borderRadius: '8px',
              border: activeAction === 'ignore' ? '1.5px solid #10b981' : '1px solid rgba(16, 185, 129, 0.3)',
              background: activeAction === 'ignore' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.08)',
              color: '#10b981',
              fontFamily: 'var(--cq-font-mono)',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            "ignore" &rarr; PASS
          </button>
        </div>
      </div>

      {/* ── COMPACT LIVE SERIAL TELEMETRY FEED ── */}
      <div 
        style={{
          background: 'rgba(3, 7, 14, 0.85)',
          borderRadius: '8px',
          padding: '8px 12px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          fontFamily: 'var(--cq-font-mono)',
          fontSize: '9px',
          color: 'rgba(255, 255, 255, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px'
        }}
      >
        {serialFeed.map(item => (
          <div key={item.id} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ color: item.text.includes('AIRGAP') || item.text.includes('block') ? '#f43f5e' : item.text.includes('STEADY') ? '#f59e0b' : '#00f2fe' }}>
              &gt;&nbsp;
            </span>
            {item.text}
          </div>
        ))}
      </div>

      {/* Embedded CSS animations */}
      <style>{`
        @keyframes cqBuzzerPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        @keyframes cqPulseWave {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
}
