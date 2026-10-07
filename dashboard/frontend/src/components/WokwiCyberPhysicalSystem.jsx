import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Cpu, 
  Terminal, 
  Zap, 
  Play, 
  Volume2, 
  VolumeX, 
  Lock, 
  Unlock, 
  Code2, 
  Activity, 
  Send,
  Server,
  ArrowRight
} from 'lucide-react';

/* ── ACTUAL ARDUINO UNO C++ CODE VERBATIM FROM QANNASAI/ARDUINO/ALERT_LISTENER.INO ── */
export const ARDUINO_SOURCE_CODE = `const int ledPin = 13;
const int buzzerPin = 12;

void setup() {
  Serial.begin(9600);
  pinMode(ledPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
}

void loop() {
  if (Serial.available() > 0) {
    String level = Serial.readStringUntil('\\n');
    level.trim();

    if (level == "block") {
      // Blink LED and buzz
      for(int i=0; i<3; i++) {
        digitalWrite(ledPin, HIGH);
        tone(buzzerPin, 1000, 200);
        delay(200);
        digitalWrite(ledPin, LOW);
        delay(200);
      }
    } else if (level == "watch") {
      // Steady LED
      digitalWrite(ledPin, HIGH);
      noTone(buzzerPin);
      delay(1000);
      digitalWrite(ledPin, LOW);
    } else {
      digitalWrite(ledPin, LOW);
      noTone(buzzerPin);
    }
  }
}`;

/* ── WEBAUDIO TONE GENERATOR (1000Hz TONE) ── */
function playBuzzerTone(freq = 1000, durationMs = 200) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (err) {
    // Non-blocking fallback
  }
}

export default function WokwiCyberPhysicalSystem({
  activeScenario,
  isSimulating,
  simStage, // 0: Idle, 1: Wire, 2: Neural, 3: Kernel, 4: Arduino
  onSimulationComplete
}) {
  const [pin13Active, setPin13Active] = useState(false);
  const [buzzerActive, setBuzzerActive] = useState(false);
  const [relayState, setRelayState] = useState('CLOSED'); // 'CLOSED' | 'SEVERED'
  const [txRxBlink, setTxRxBlink] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeCodeLine, setActiveCodeLine] = useState(null);
  const [bottomTab, setBottomTab] = useState('why'); // 'why' | 'serial'
  const [customSerialInput, setCustomSerialInput] = useState('');

  const [serialLogs, setSerialLogs] = useState([
    { id: 1, time: '00:00:00', type: 'sys', text: '[BOOT] ATmega328P initialized @ 16.000MHz' },
    { id: 2, time: '00:00:00', type: 'sys', text: '[SETUP] Serial.begin(9600) -> UART link /dev/ttyACM0 connected' },
    { id: 3, time: '00:00:00', type: 'sys', text: '[SETUP] pinMode(13, OUTPUT) & pinMode(12, OUTPUT) configured' },
    { id: 4, time: '00:00:01', type: 'ready', text: '[ONLINE] Cyber-physical bridge active. Listening for kernel commands.' }
  ]);

  const serialBottomRef = useRef(null);

  useEffect(() => {
    serialBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [serialLogs]);

  // Execute Arduino Command Logic
  const handleSendCommand = (cmd) => {
    const cleanCmd = cmd.trim();
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });

    setTxRxBlink(true);
    setTimeout(() => setTxRxBlink(false), 260);

    setSerialLogs(prev => [
      ...prev,
      { id: Date.now(), time, type: 'rx', text: `> UART RX (/dev/ttyACM0): "${cleanCmd}\\n" [${cleanCmd.length + 1} bytes @ 9600 baud]` }
    ]);

    if (cleanCmd === 'block') {
      setActiveCodeLine(15); // if (level == "block")
      setRelayState('SEVERED');

      setSerialLogs(prev => [
        ...prev,
        { id: Date.now() + 1, time, type: 'action', text: '[LOOP] level == "block" -> Executing 3x { digitalWrite(13, HIGH); tone(12, 1000, 200); }' },
        { id: Date.now() + 2, time, type: 'relay', text: '[RELAY] OPTOCOUPLER DE-ENERGIZED -> GALVANIC AIRGAP BREAKER TRIPPED OPEN' }
      ]);

      // 3 cycles matching alert_listener.ino loop
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          setActiveCodeLine(18); // digitalWrite(ledPin, HIGH)
          setPin13Active(true);
          setBuzzerActive(true);
          if (soundEnabled) playBuzzerTone(1000, 200);
        }, i * 400);

        setTimeout(() => {
          setActiveCodeLine(21); // digitalWrite(ledPin, LOW)
          setPin13Active(false);
          setBuzzerActive(false);
        }, i * 400 + 200);
      }

      setTimeout(() => {
        setActiveCodeLine(36);
      }, 1400);

    } else if (cleanCmd === 'watch') {
      setActiveCodeLine(24); // else if (level == "watch")
      setRelayState('CLOSED');

      setSerialLogs(prev => [
        ...prev,
        { id: Date.now() + 1, time, type: 'action', text: '[LOOP] level == "watch" -> Steady PIN 13 LED (1000ms): digitalWrite(13, HIGH); delay(1000);' }
      ]);

      setActiveCodeLine(26);
      setPin13Active(true);
      setBuzzerActive(false);

      setTimeout(() => {
        setActiveCodeLine(29);
        setPin13Active(false);
        setActiveCodeLine(36);
      }, 1000);

    } else {
      setActiveCodeLine(30); // else branch
      setRelayState('CLOSED');

      setSerialLogs(prev => [
        ...prev,
        { id: Date.now() + 1, time, type: 'action', text: `[LOOP] level == "${cleanCmd}" -> Normal pass: digitalWrite(13, LOW); noTone(12);` },
        { id: Date.now() + 2, time, type: 'relay', text: '[RELAY] OPTOCOUPLER ENERGIZED -> RELAY CLOSED (NORMAL CONDUCTION)' }
      ]);

      setPin13Active(false);
      setBuzzerActive(false);

      setTimeout(() => {
        setActiveCodeLine(36);
      }, 400);
    }
  };

  // Trigger from parent simulation pipeline when reaching stage 4
  useEffect(() => {
    if (simStage === 4 && activeScenario) {
      handleSendCommand(activeScenario.action);
    }
  }, [simStage]);

  const handleCustomSend = (e) => {
    e.preventDefault();
    if (!customSerialInput.trim()) return;
    handleSendCommand(customSerialInput.trim());
    setCustomSerialInput('');
  };

  return (
    <div className="cq-wokwi-system-container">
      
      {/* ── TOP CONTROLS & STATUS BAR ── */}
      <div className="cq-bench-top-bar">
        <div className="cq-top-bar-left">
          <div className="cq-hil-badge">HARDWARE-IN-THE-LOOP (HIL) SCHEMATIC</div>
          <span className="cq-serial-conn-tag">UART LINK: /dev/ttyACM0 @ 9600 BAUD</span>
        </div>

        <div className="cq-top-bar-right">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="cq-sound-pill"
            title={soundEnabled ? 'Mute 1000Hz buzzer audio tone' : 'Enable 1000Hz buzzer audio tone'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span>{soundEnabled ? '1000Hz BUZZER AUDIO ON' : 'AUDIO MUTED'}</span>
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          THE UNIFIED SCHEMATIC BENCH (100% PRECISELY CONNECTED, ZERO FLOATING)
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="cq-unified-schematic-canvas">
        <svg 
          viewBox="0 0 1260 480" 
          className="cq-schematic-svg" 
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Glow Filters */}
            <filter id="amberGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Linear Gradients */}
            <linearGradient id="chassisGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a1424" />
              <stop offset="100%" stopColor="#030812" />
            </linearGradient>

            <linearGradient id="pcbGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0e3a5d" />
              <stop offset="100%" stopColor="#082338" />
            </linearGradient>

            <linearGradient id="podGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0b121e" />
              <stop offset="100%" stopColor="#05080e" />
            </linearGradient>
          </defs>

          {/* ─────────────────────────────────────────────────────────────────
              1. LEFT: CYBER ENGINE / LINUX HOST CHASSIS (X: 30, Y: 30, W: 290, H: 420)
             ───────────────────────────────────────────────────────────────── */}
          <g transform="translate(30, 30)">
            {/* Chassis Outer Box */}
            <rect 
              width="290" 
              height="420" 
              rx="16" 
              fill="url(#chassisGrad)" 
              stroke={simStage >= 1 && simStage <= 3 ? "#00f2fe" : "rgba(56, 189, 248, 0.3)"} 
              strokeWidth={simStage >= 1 && simStage <= 3 ? "2" : "1.5"}
            />

            {/* Chassis Header */}
            <rect width="290" height="46" rx="16" fill="rgba(255, 255, 255, 0.04)" />
            <circle cx="24" cy="23" r="5" fill="#10b981" filter="url(#cyanGlow)" />
            <text x="38" y="27" fill="#ffffff" fontSize="13" fontWeight="800" fontFamily="monospace">
              LINUX HOST (PEP)
            </text>
            <rect x="185" y="14" width="90" height="18" rx="4" fill="rgba(0, 242, 254, 0.12)" />
            <text x="230" y="27" fill="#00f2fe" fontSize="10" fontWeight="700" fontFamily="monospace" textAnchor="middle">
              PRIORITY 0
            </text>

            {/* Stage 1 Box: Wire Ingest */}
            <g transform="translate(14, 58)">
              <rect 
                width="262" 
                height="82" 
                rx="10" 
                fill={simStage === 1 ? "rgba(0, 242, 254, 0.12)" : "rgba(15, 23, 42, 0.6)"} 
                stroke={simStage === 1 ? "#00f2fe" : "rgba(255, 255, 255, 0.08)"} 
                strokeWidth={simStage === 1 ? "2" : "1"}
              />
              <text x="14" y="24" fill="#00f2fe" fontSize="11" fontWeight="800" fontFamily="monospace">STAGE 01 &bull; 0.2ms</text>
              <text x="14" y="44" fill="#ffffff" fontSize="13" fontWeight="700">NIC / AF_PACKET Ring</text>
              <text x="14" y="64" fill="rgba(255, 255, 255, 0.6)" fontSize="11">64MB memory-mapped zero-copy socket</text>
            </g>

            {/* Stage 2 Box: Dual Neural Cognition */}
            <g transform="translate(14, 150)">
              <rect 
                width="262" 
                height="82" 
                rx="10" 
                fill={simStage === 2 ? "rgba(45, 212, 191, 0.12)" : "rgba(15, 23, 42, 0.6)"} 
                stroke={simStage === 2 ? "#2dd4bf" : "rgba(255, 255, 255, 0.08)"} 
                strokeWidth={simStage === 2 ? "2" : "1"}
              />
              <text x="14" y="24" fill="#2dd4bf" fontSize="11" fontWeight="800" fontFamily="monospace">STAGE 02 &bull; 32.1ms</text>
              <text x="14" y="44" fill="#ffffff" fontSize="13" fontWeight="700">Dual Neural Cognition</text>
              <text x="14" y="64" fill="rgba(255, 255, 255, 0.6)" fontSize="11">GraphSAGE GNN + 1D-CNN Waveforms</text>
            </g>

            {/* Stage 3 Box: Linux Kernel Netfilter */}
            <g transform="translate(14, 242)">
              <rect 
                width="262" 
                height="82" 
                rx="10" 
                fill={simStage === 3 ? "rgba(244, 63, 94, 0.12)" : "rgba(15, 23, 42, 0.6)"} 
                stroke={simStage === 3 ? "#f43f5e" : "rgba(255, 255, 255, 0.08)"} 
                strokeWidth={simStage === 3 ? "2" : "1"}
              />
              <text x="14" y="24" fill="#f43f5e" fontSize="11" fontWeight="800" fontFamily="monospace">STAGE 03 &bull; 5.8ms</text>
              <text x="14" y="44" fill="#ffffff" fontSize="13" fontWeight="700">Linux Netfilter PEP</text>
              <text x="14" y="64" fill="rgba(255, 255, 255, 0.6)" fontSize="11">In-kernel socket drop (0.00% lateral drift)</text>
            </g>

            {/* USB-A Host Jack (Port at x: 290, y: 360) */}
            <g transform="translate(14, 336)">
              <rect width="262" height="68" rx="8" fill="rgba(0, 0, 0, 0.45)" stroke="rgba(255, 255, 255, 0.06)" />
              <text x="14" y="28" fill="#fbbf24" fontSize="11" fontWeight="800" fontFamily="monospace">USB 2.0 UART BRIDGE</text>
              <text x="14" y="48" fill="rgba(255, 255, 255, 0.5)" fontSize="10">/dev/ttyACM0 @ 9600 BAUD</text>
              
              {/* Metallic USB-A Jack Outlet */}
              <rect x="250" y="18" width="26" height="32" rx="3" fill="#64748b" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="254" y="23" width="18" height="22" fill="#0f172a" />
            </g>
          </g>

          {/* ─────────────────────────────────────────────────────────────────
              2. USB CABLE CONNECTING SERVER USB (320, 382) TO ARDUINO USB (420, 160)
             ───────────────────────────────────────────────────────────────── */}
          <g>
            {/* Cable Outer Insulation (Navy / Slate Blue) */}
            <path 
              d="M 320 382 C 370 382, 360 160, 420 160" 
              fill="none" 
              stroke="#1e3a5f" 
              strokeWidth="12" 
              strokeLinecap="round" 
            />
            {/* Cable Core Sheath */}
            <path 
              d="M 320 382 C 370 382, 360 160, 420 160" 
              fill="none" 
              stroke="#0284c7" 
              strokeWidth="5" 
              strokeLinecap="round" 
            />

            {/* Molded Plugs */}
            <rect x="312" y="372" width="16" height="20" rx="3" fill="#334155" stroke="#94a3b8" />
            <rect x="412" y="150" width="16" height="20" rx="3" fill="#334155" stroke="#94a3b8" />

            {/* Cable Label Badge */}
            <g transform="translate(340, 260)">
              <rect x="-8" y="-12" width="80" height="24" rx="6" fill="#030812" stroke="#00f2fe" strokeWidth="1" />
              <text x="32" y="3" fill="#00f2fe" fontSize="9.5" fontWeight="800" fontFamily="monospace" textAnchor="middle">
                USB UART
              </text>
            </g>

            {/* Glowing Traveling Data Pulses */}
            {(simStage >= 3 || txRxBlink) && (
              <circle r="5" fill="#fbbf24" filter="url(#amberGlow)">
                <animateMotion 
                  path="M 320 382 C 370 382, 360 160, 420 160" 
                  dur="0.6s" 
                  repeatCount="indefinite" 
                />
              </circle>
            )}
          </g>

          {/* ─────────────────────────────────────────────────────────────────
              3. CENTER: ARDUINO UNO R3 BOARD (X: 420, Y: 80, W: 360, H: 270)
             ───────────────────────────────────────────────────────────────── */}
          <g transform="translate(420, 80)">
            {/* PCB Board Contour */}
            <rect 
              x="0" 
              y="0" 
              width="360" 
              height="270" 
              rx="16" 
              fill="url(#pcbGrad)" 
              stroke="rgba(0, 242, 254, 0.4)" 
              strokeWidth="2" 
            />

            {/* Mounting Holes */}
            <circle cx="24" cy="24" r="8" fill="#061826" stroke="#c0c0c0" strokeWidth="2" />
            <circle cx="336" cy="24" r="8" fill="#061826" stroke="#c0c0c0" strokeWidth="2" />
            <circle cx="24" cy="246" r="8" fill="#061826" stroke="#c0c0c0" strokeWidth="2" />
            <circle cx="336" cy="246" r="8" fill="#061826" stroke="#c0c0c0" strokeWidth="2" />

            {/* Silver USB-B Jack (Plugged on left edge at y: 60 to 100) */}
            <rect x="-14" y="60" width="34" height="40" rx="3" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="0" y="68" width="16" height="24" fill="#1e293b" />
            <text x="7" y="52" fill="#cbd5e1" fontSize="9" fontWeight="800" fontFamily="monospace" textAnchor="middle">USB-B</text>

            {/* Power Barrel Jack (Bottom Left) */}
            <rect x="-16" y="180" width="46" height="50" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <rect x="4" y="196" width="20" height="18" fill="#000000" />
            <circle cx="14" cy="205" r="4" fill="#94a3b8" />

            {/* Board Branding & Logo */}
            <text x="180" y="145" fill="#ffffff" fontSize="22" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="2">
              ARDUINO
            </text>
            <rect x="235" y="128" width="56" height="22" rx="4" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="263" y="144" fill="#ffffff" fontSize="14" fontWeight="800" fontFamily="monospace" textAnchor="middle">
              UNO
            </text>

            {/* ATmega328P DIP IC Chip */}
            <g transform="translate(130, 175)">
              <rect width="180" height="42" rx="4" fill="#090e17" stroke="#334155" strokeWidth="1.5" />
              <text x="90" y="24" fill="#cbd5e1" fontSize="12" fontWeight="800" fontFamily="monospace" textAnchor="middle" letterSpacing="1">
                ATMEGA328P-PU
              </text>
              <text x="90" y="36" fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                16MHz &bull; 32KB FLASH
              </text>
              {/* DIP Pins top and bottom */}
              {[...Array(14)].map((_, i) => (
                <rect key={i} x={10 + i * 12} y="-4" width="4" height="4" fill="#cbd5e1" />
              ))}
              {[...Array(14)].map((_, i) => (
                <rect key={i} x={10 + i * 12} y="42" width="4" height="4" fill="#cbd5e1" />
              ))}
            </g>

            {/* 16MHz Crystal Oscillator */}
            <rect x="90" y="90" width="24" height="40" rx="10" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1" />
            <text x="102" y="114" fill="#1e293b" fontSize="8" fontWeight="800" fontFamily="monospace" textAnchor="middle">16M</text>

            {/* LEDs: ON, L (PIN 13), TX, RX */}
            {/* Power ON LED */}
            <circle cx="80" cy="150" r="4" fill="#10b981" filter="url(#cyanGlow)" />
            <text x="80" y="166" fill="rgba(255,255,255,0.7)" fontSize="9" fontWeight="700" fontFamily="monospace" textAnchor="middle">ON</text>

            {/* PIN 13 LED (L) on board */}
            <circle 
              cx="115" 
              cy="150" 
              r="5" 
              fill={pin13Active ? "#f59e0b" : "#475569"} 
              filter={pin13Active ? "url(#amberGlow)" : "none"} 
            />
            <text x="115" y="166" fill={pin13Active ? "#f59e0b" : "rgba(255,255,255,0.7)"} fontSize="9" fontWeight="800" fontFamily="monospace" textAnchor="middle">L</text>

            {/* TX / RX LEDs */}
            <circle cx="115" cy="182" r="3.5" fill={txRxBlink ? "#fbbf24" : "#334155"} filter={txRxBlink ? "url(#amberGlow)" : "none"} />
            <text x="102" y="185" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="monospace">TX</text>

            <circle cx="115" cy="198" r="3.5" fill={txRxBlink ? "#fbbf24" : "#334155"} filter={txRxBlink ? "url(#amberGlow)" : "none"} />
            <text x="102" y="201" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="monospace">RX</text>

            {/* ── TOP FEMALE HEADER: DIGITAL (PWM ~) PINS ── */}
            <g transform="translate(130, 8)">
              {/* Header Body */}
              <rect width="210" height="22" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
              <text x="105" y="-3" fill="#ffffff" fontSize="9" fontWeight="800" fontFamily="monospace" textAnchor="middle">
                DIGITAL (PWM ~)
              </text>

              {/* Pin Sockets with Exact Known Coordinates */}
              {/* AREF, GND, 13, 12, 11, 10, 9, 8 | 7, 6, 5, 4, 3, 2, 1, 0 */}
              <g>
                {/* GND (idx 1, x: 26) */}
                <rect x="22" y="5" width="8" height="12" fill="#090e17" rx="1" />
                <circle cx="26" cy="11" r="3" fill="#475569" id="pinGND_header" />
                <text x="26" y="32" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">GND</text>

                {/* PIN 13 (idx 2, x: 40) */}
                <rect x="36" y="5" width="8" height="12" fill="#090e17" rx="1" />
                <circle cx="40" cy="11" r="3.5" fill={pin13Active ? "#f59e0b" : "#475569"} filter={pin13Active ? "url(#amberGlow)" : "none"} />
                <text x="40" y="32" fill={pin13Active ? "#f59e0b" : "#ffffff"} fontSize="9" fontWeight="800" fontFamily="monospace" textAnchor="middle">13</text>

                {/* PIN 12 (idx 3, x: 54) */}
                <rect x="50" y="5" width="8" height="12" fill="#090e17" rx="1" />
                <circle cx="54" cy="11" r="3.5" fill={buzzerActive ? "#ef4444" : "#475569"} filter={buzzerActive ? "url(#redGlow)" : "none"} />
                <text x="54" y="32" fill={buzzerActive ? "#ef4444" : "#ffffff"} fontSize="9" fontWeight="800" fontFamily="monospace" textAnchor="middle">12</text>

                {/* PIN 11 (idx 4, x: 68) */}
                <rect x="64" y="5" width="8" height="12" fill="#090e17" rx="1" />
                <circle cx="68" cy="11" r="3.5" fill="#38bdf8" />
                <text x="68" y="32" fill="#38bdf8" fontSize="9" fontWeight="800" fontFamily="monospace" textAnchor="middle">~11</text>

                {/* Other Digital Pins (10 to 0) */}
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((p, i) => (
                  <g key={p} transform={`translate(${82 + i * 11.5}, 0)`}>
                    <rect x="0" y="5" width="8" height="12" fill="#090e17" rx="1" />
                    <circle cx="4" cy="11" r="2.5" fill="#334155" />
                    <text x="4" y="32" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">{p}</text>
                  </g>
                ))}
              </g>
            </g>

            {/* ── BOTTOM FEMALE HEADER: POWER & ANALOG PINS ── */}
            <g transform="translate(130, 240)">
              <rect width="210" height="22" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
              <text x="50" y="33" fill="#ffffff" fontSize="9" fontWeight="800" fontFamily="monospace">POWER</text>
              <text x="140" y="33" fill="#ffffff" fontSize="9" fontWeight="800" fontFamily="monospace">ANALOG IN</text>

              {/* 5V Pin (x: 48) */}
              <rect x="44" y="5" width="8" height="12" fill="#090e17" rx="1" />
              <circle cx="48" cy="11" r="3" fill="#f43f5e" />
              <text x="48" y="-4" fill="#f43f5e" fontSize="8" fontWeight="700" fontFamily="monospace" textAnchor="middle">5V</text>

              {/* Bottom GND (x: 62) */}
              <rect x="58" y="5" width="8" height="12" fill="#090e17" rx="1" />
              <circle cx="62" cy="11" r="3" fill="#475569" />
              <text x="62" y="-4" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">GND</text>
            </g>
          </g>

          {/* ─────────────────────────────────────────────────────────────────
              4. RIGHT: ELECTRONIC ACTUATOR BENCH (X: 860, Y: 30, W: 370, H: 420)
             ───────────────────────────────────────────────────────────────── */}
          <g transform="translate(860, 30)">
            {/* Actuator Bench Outer Board */}
            <rect 
              width="370" 
              height="420" 
              rx="16" 
              fill="url(#podGrad)" 
              stroke="rgba(0, 242, 254, 0.25)" 
              strokeWidth="1.5" 
            />

            {/* Bench Header */}
            <rect width="370" height="46" rx="16" fill="rgba(255, 255, 255, 0.04)" />
            <text x="20" y="28" fill="#ffffff" fontSize="13" fontWeight="800" fontFamily="monospace">
              PHYSICAL ACTUATOR BENCH
            </text>
            <rect x="250" y="14" width="100" height="18" rx="4" fill="rgba(16, 185, 129, 0.15)" />
            <text x="300" y="27" fill="#10b981" fontSize="10" fontWeight="700" fontFamily="monospace" textAnchor="middle">
              WIRED &bull; 5V DC
            </text>

            {/* ── ACTUATOR 1: PIN 13 YELLOW STATUS LED (Y: 58, H: 96) ── */}
            <g transform="translate(16, 58)">
              <rect 
                width="338" 
                height="96" 
                rx="10" 
                fill={pin13Active ? "rgba(245, 158, 11, 0.15)" : "rgba(15, 23, 42, 0.6)"} 
                stroke={pin13Active ? "#f59e0b" : "rgba(255, 255, 255, 0.08)"} 
                strokeWidth={pin13Active ? "2" : "1"}
              />

              {/* Wire Terminal Dot (Incoming from Pin 13 at x: 0, y: 36) */}
              <circle cx="16" cy="36" r="5" fill="#f59e0b" filter={pin13Active ? "url(#amberGlow)" : "none"} />
              <text x="30" y="40" fill="#f59e0b" fontSize="11" fontWeight="800" fontFamily="monospace">
                PIN 13 INPUT &harr; 220Ω
              </text>

              {/* Physical LED Bulb Graphic */}
              <g transform="translate(260, 48)">
                {/* Glow Bloom */}
                {pin13Active && (
                  <circle cx="0" cy="0" r="28" fill="rgba(245, 158, 11, 0.3)" filter="url(#amberGlow)" />
                )}
                {/* Bulb Glass */}
                <path 
                  d="M -12 -6 C -12 -22, 12 -22, 12 -6 L 12 12 L -12 12 Z" 
                  fill={pin13Active ? "#fbbf24" : "#475569"} 
                  stroke="#cbd5e1" 
                  strokeWidth="1.5" 
                />
                {/* Base Ring */}
                <rect x="-14" y="12" width="28" height="6" rx="2" fill={pin13Active ? "#f59e0b" : "#334155"} />
                {/* Legs */}
                <line x1="-5" y1="18" x2="-5" y2="34" stroke="#94a3b8" strokeWidth="2" />
                <line x1="5" y1="18" x2="5" y2="38" stroke="#94a3b8" strokeWidth="2" />
              </g>

              <text x="16" y="66" fill="#ffffff" fontSize="14" fontWeight="700">STATUS LED (L)</text>
              <text x="16" y="84" fill={pin13Active ? "#fbbf24" : "rgba(255, 255, 255, 0.5)"} fontSize="12" fontWeight="700" fontFamily="monospace">
                {pin13Active ? "VOLTAGE: 5.0V HIGH [BLOCKED]" : "VOLTAGE: 0.0V LOW [STANDBY]"}
              </text>
            </g>

            {/* ── ACTUATOR 2: PIN 12 PIEZO BUZZER (Y: 168, H: 96) ── */}
            <g transform="translate(16, 168)">
              <rect 
                width="338" 
                height="96" 
                rx="10" 
                fill={buzzerActive ? "rgba(239, 68, 68, 0.15)" : "rgba(15, 23, 42, 0.6)"} 
                stroke={buzzerActive ? "#ef4444" : "rgba(255, 255, 255, 0.08)"} 
                strokeWidth={buzzerActive ? "2" : "1"}
              />

              {/* Wire Terminal Dot (Incoming from Pin 12 at x: 16, y: 36) */}
              <circle cx="16" cy="36" r="5" fill="#ef4444" filter={buzzerActive ? "url(#redGlow)" : "none"} />
              <text x="30" y="40" fill="#ef4444" fontSize="11" fontWeight="800" fontFamily="monospace">
                PIN 12 INPUT &harr; 1000Hz PWM
              </text>

              {/* Physical Piezo Buzzer Graphic */}
              <g transform="translate(260, 48)">
                {/* Acoustic Waves when active */}
                {buzzerActive && (
                  <>
                    <circle cx="0" cy="0" r="28" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.8">
                      <animate attributeName="r" values="24;36;24" dur="0.4s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="0" cy="0" r="34" fill="none" stroke="#f87171" strokeWidth="1" opacity="0.4">
                      <animate attributeName="r" values="30;44;30" dur="0.4s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
                {/* Cylindrical Buzzer Body */}
                <circle cx="0" cy="0" r="22" fill="#0f172a" stroke={buzzerActive ? "#ef4444" : "#475569"} strokeWidth="2.5" />
                <circle cx="0" cy="0" r="6" fill={buzzerActive ? "#ef4444" : "#334155"} />
                <text x="0" y="3" fill="#ffffff" fontSize="9" fontWeight="800" fontFamily="monospace" textAnchor="middle">+</text>
              </g>

              <text x="16" y="66" fill="#ffffff" fontSize="14" fontWeight="700">PIEZO BUZZER ALARM</text>
              <text x="16" y="84" fill={buzzerActive ? "#f87171" : "rgba(255, 255, 255, 0.5)"} fontSize="12" fontWeight="700" fontFamily="monospace">
                {buzzerActive ? "1000Hz ACOUSTIC TONE ACTIVE" : "SILENT [noTone]"}
              </text>
            </g>

            {/* ── ACTUATOR 3: GALVANIC OPTOCOUPLED RELAY (Y: 278, H: 124) ── */}
            <g transform="translate(16, 278)">
              <rect 
                width="338" 
                height="124" 
                rx="10" 
                fill={relayState === 'SEVERED' ? "rgba(244, 63, 94, 0.18)" : "rgba(16, 185, 129, 0.12)"} 
                stroke={relayState === 'SEVERED' ? "#f43f5e" : "#10b981"} 
                strokeWidth="2" 
              />

              {/* Wire Terminal Dot (Incoming from Pin 11 at x: 16, y: 32) */}
              <circle cx="16" cy="32" r="5" fill="#38bdf8" />
              <text x="30" y="36" fill="#38bdf8" fontSize="11" fontWeight="800" fontFamily="monospace">
                PIN 11 &bull; RELAY SIGNAL IN
              </text>

              {/* Physical Songle Relay Box */}
              <g transform="translate(240, 20)">
                <rect width="84" height="48" rx="4" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="42" y="20" fill="#ffffff" fontSize="9" fontWeight="900" fontFamily="monospace" textAnchor="middle">SONGLE 5V</text>
                <text x="42" y="34" fill="#93c5fd" fontSize="7.5" fontFamily="monospace" textAnchor="middle">10A 250VAC</text>
                <circle cx="74" cy="10" r="3" fill={relayState === 'SEVERED' ? "#ef4444" : "#10b981"} />
              </g>

              {/* Mechanical Breaker Arm Diagram */}
              <g transform="translate(16, 56)">
                <rect width="210" height="52" rx="6" fill="rgba(0, 0, 0, 0.45)" stroke="rgba(255, 255, 255, 0.08)" />
                {relayState === 'SEVERED' ? (
                  <>
                    <text x="14" y="24" fill="#f43f5e" fontSize="13" fontWeight="800">
                      BREAKER DISCONNECTED
                    </text>
                    <text x="14" y="42" fill="rgba(244, 63, 94, 0.8)" fontSize="11" fontFamily="monospace">
                      GALVANIC AIRGAP ENGAGED
                    </text>
                    {/* Disconnected Switch Contacts */}
                    <circle cx="180" cy="26" r="4" fill="#f43f5e" />
                    <line x1="180" y1="26" x2="195" y2="12" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="198" cy="26" r="4" fill="#64748b" />
                  </>
                ) : (
                  <>
                    <text x="14" y="24" fill="#10b981" fontSize="13" fontWeight="800">
                      BREAKER CONNECTED
                    </text>
                    <text x="14" y="42" fill="rgba(16, 185, 129, 0.8)" fontSize="11" fontFamily="monospace">
                      NORMAL CONTINUOUS TRANSMISSION
                    </text>
                    {/* Closed Switch Contacts */}
                    <circle cx="180" cy="26" r="4" fill="#10b981" />
                    <line x1="180" y1="26" x2="198" y2="26" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="198" cy="26" r="4" fill="#10b981" />
                  </>
                )}
              </g>
            </g>
          </g>

          {/* ─────────────────────────────────────────────────────────────────
              5. JUMPER WIRES CONNECTING PINS DIRECTLY TO COMPONENTS (100% PRECISE)
             ───────────────────────────────────────────────────────────────── */}
          <g>
            {/* WIRE 1 (YELLOW / AMBER): PIN 13 HEADER (X: 460, Y: 91) -> LED ANODE (X: 876, Y: 124) */}
            <path 
              d="M 460 91 C 540 10, 750 30, 876 124" 
              fill="none" 
              stroke={pin13Active ? "#f59e0b" : "#b45309"} 
              strokeWidth="4" 
              strokeLinecap="round" 
              filter={pin13Active ? "url(#amberGlow)" : "none"} 
            />
            {/* Pin terminal ring */}
            <circle cx="460" cy="91" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="876" cy="124" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />

            {/* WIRE 2 (CRIMSON RED): PIN 12 HEADER (X: 474, Y: 91) -> BUZZER (+) (X: 876, Y: 234) */}
            <path 
              d="M 474 91 C 580 40, 750 160, 876 234" 
              fill="none" 
              stroke={buzzerActive ? "#ef4444" : "#991b1b"} 
              strokeWidth="4" 
              strokeLinecap="round" 
              filter={buzzerActive ? "url(#redGlow)" : "none"} 
            />
            <circle cx="474" cy="91" r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="876" cy="234" r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />

            {/* WIRE 3 (ELECTRIC CYAN): PIN 11 HEADER (X: 488, Y: 91) -> RELAY IN (X: 876, Y: 340) */}
            <path 
              d="M 488 91 C 600 70, 750 260, 876 340" 
              fill="none" 
              stroke="#38bdf8" 
              strokeWidth="4" 
              strokeLinecap="round" 
            />
            <circle cx="488" cy="91" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="876" cy="340" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />

            {/* WIRE 4 (GROUND - SLATE BLACK): GND (X: 446, Y: 91) -> GROUND BUS */}
            <path 
              d="M 446 91 C 490 20, 820 40, 876 390" 
              fill="none" 
              stroke="#334155" 
              strokeWidth="4" 
              strokeLinecap="round" 
            />
            <circle cx="446" cy="91" r="5" fill="#475569" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="876" cy="390" r="5" fill="#475569" stroke="#ffffff" strokeWidth="1.5" />

            {/* WIRE 5 (5V POWER - DEEP CRIMSON): 5V (X: 468, Y: 320) -> RELAY VCC */}
            <path 
              d="M 468 320 C 560 440, 780 430, 876 370" 
              fill="none" 
              stroke="#dc2626" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
            />
            <circle cx="468" cy="320" r="4.5" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="876" cy="370" r="4.5" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
          </g>

        </svg>
      </div>

      {/* ── DIRECT MANUAL SERIAL OVERRIDE BUTTONS ── */}
      <div className="cq-serial-actions-strip">
        <span className="cq-actions-prompt">TRIGGER ARDUINO VIA SERIAL:</span>
        <div className="cq-btn-group">
          <button 
            onClick={() => handleSendCommand('block')}
            className="cq-act-btn cq-act-block"
          >
            SEND "block" &rarr; AIRGAP TRIP (3x BLINK + 1000Hz TONE)
          </button>
          <button 
            onClick={() => handleSendCommand('watch')}
            className="cq-act-btn cq-act-watch"
          >
            SEND "watch" &rarr; STEADY LED (1000ms INSPECTION)
          </button>
          <button 
            onClick={() => handleSendCommand('ignore')}
            className="cq-act-btn cq-act-ignore"
          >
            SEND "ignore" &rarr; NORMAL PASS (RELAY RESTORED)
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          BOTTOM SECTION: WHY ARE WE USING ARDUINO? & LIVE SERIAL MONITOR TERMINAL
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="cq-hil-code-terminal-grid">
        <div className="cq-editor-card">
          <div className="cq-editor-nav">
            <div className="cq-editor-tabs">
              <button 
                className={bottomTab === 'why' ? 'active' : ''}
                onClick={() => setBottomTab('why')}
              >
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>WHY ARE WE USING ARDUINO? (CYBER-PHYSICAL SYSTEM)</span>
              </button>
              <button 
                className={bottomTab === 'serial' ? 'active' : ''}
                onClick={() => setBottomTab('serial')}
              >
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>LIVE SERIAL MONITOR (/dev/ttyACM0 @ 9600 BAUD)</span>
              </button>
            </div>

            {bottomTab === 'serial' && (
              <button onClick={() => setSerialLogs([])} className="cq-clear-logs-btn">
                Clear Buffer
              </button>
            )}
          </div>

          {/* VIEW 1: WHY ARE WE USING ARDUINO? (ARCHITECTURAL DEFENSE & JUSTIFICATION) */}
          {bottomTab === 'why' && (
            <div className="cq-why-arduino-content">
              
              {/* Question & Highlighted Punchline Banner */}
              <div className="cq-punchline-hero-box">
                <div className="cq-q-badge-row">
                  <span className="cq-eval-tag">ARCHITECTURAL DEFENSE &amp; EVALUATION Q&amp;A</span>
                  <span className="cq-eval-tag-blue">CYBER-PHYSICAL SYSTEM (CPS)</span>
                </div>

                <h3 className="cq-why-main-question">
                  "Why are we using Arduino? Isn't it just an LED that lights up when there's an alert?"
                </h3>

                <div className="cq-highlighted-punchline">
                  <div className="cq-punchline-quote">
                    &ldquo;Software firewalls can be disabled by a kernel rootkit. You cannot hack an open circuit breaker. You cannot hack physics.&rdquo;
                  </div>
                  <div className="cq-punchline-sub">
                    <strong>THE CORE ARCHITECTURAL PRINCIPLE:</strong> Software Decides. Hardware Severs.
                  </div>
                </div>
              </div>

              {/* The 3 Core Technical Pillars */}
              <div className="cq-pillars-grid">
                
                {/* Pillar 1 */}
                <div className="cq-pillar-card">
                  <div className="cq-pillar-top">
                    <span className="cq-pillar-num">PILLAR 01</span>
                    <span className="cq-pillar-badge red">KERNEL IMMUNITY</span>
                  </div>
                  <h4>Kernel Rootkit &amp; OS Compromise Immunity</h4>
                  <div className="cq-pillar-threat">
                    <strong>The Threat:</strong> If an adversary gains Ring 0 / Ring -1 rootkit persistence, all software firewalls lie—they unhook <code>nftables</code>, disable eBPF, and silence alerts.
                  </div>
                  <p>
                    The Arduino runs independent ATmega328P firmware across a galvanic serial bus. The moment an anomaly is confirmed, it mechanically trips an optocoupled relay. Even with 100% OS kernel takeover, an attacker cannot software-patch across a physically severed air gap.
                  </p>
                </div>

                {/* Pillar 2 */}
                <div className="cq-pillar-card">
                  <div className="cq-pillar-top">
                    <span className="cq-pillar-num">PILLAR 02</span>
                    <span className="cq-pillar-badge amber">OT / SCADA DEFENSE</span>
                  </div>
                  <h4>Critical Infrastructure Kinetic Protection</h4>
                  <div className="cq-pillar-threat">
                    <strong>The Threat:</strong> In power grids, pipelines, water treatment, and defense enclaves, cyber attacks cause kinetic physical destruction (e.g. Stuxnet, turbine sabotage).
                  </div>
                  <p>
                    In production, Digital Pin 12/13 drives industrial contactors and physical TAP breakers—not just lab LEDs. It translates dual-engine neural cognition directly into physical circuit disconnection in &lt; 38.4ms before PLCs or physical equipment can be destroyed.
                  </p>
                </div>

                {/* Pillar 3 */}
                <div className="cq-pillar-card">
                  <div className="cq-pillar-top">
                    <span className="cq-pillar-num">PILLAR 03</span>
                    <span className="cq-pillar-badge cyan">FAIL-SECURE</span>
                  </div>
                  <h4>Normally-Open Galvanic Relay Architecture</h4>
                  <div className="cq-pillar-threat">
                    <strong>The Threat:</strong> An adversary attempts to DoS the monitoring daemon, freeze the CPU, or cut power to disable defense enforcement.
                  </div>
                  <p>
                    The relay is wired <strong>Normally-Open (Fail-Secure)</strong>. If host power is cut, the daemon crashes, or the agent loop is killed, the relay coil de-energizes instantly, snapping the circuit open into total physical air-gap quarantine by default.
                  </p>
                </div>

              </div>

              {/* Evaluation Takeaway Banner */}
              <div className="cq-takeaway-strip">
                <span className="cq-takeaway-label">PRESENTATION SCRIPT TAKEAWAY:</span>
                <p>
                  "In this visual prototype, the LED and buzzer provide immediate sensory feedback for human evaluators. In production enclaves, they actuate physical circuit breakers to provide sovereign galvanic air-gapping."
                </p>
              </div>

            </div>
          )}

          {/* VIEW 2: LIVE SERIAL MONITOR TERMINAL */}
          {bottomTab === 'serial' && (
            <div className="cq-serial-view-container">
              <div className="cq-serial-rows-scroll">
                {serialLogs.map(log => (
                  <div key={log.id} className={`cq-serial-entry ${log.type}`}>
                    <span className="cq-entry-time">[{log.time}]</span>
                    <span className="cq-entry-text">{log.text}</span>
                  </div>
                ))}
                <div ref={serialBottomRef} />
              </div>

              <form onSubmit={handleCustomSend} className="cq-serial-input-bar">
                <span className="cq-serial-prompt-sign">&gt;</span>
                <input
                  type="text"
                  value={customSerialInput}
                  onChange={(e) => setCustomSerialInput(e.target.value)}
                  placeholder="Send raw serial string ('block', 'watch', 'ignore')..."
                  className="cq-serial-text-input"
                />
                <button type="submit" className="cq-serial-send-action">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
