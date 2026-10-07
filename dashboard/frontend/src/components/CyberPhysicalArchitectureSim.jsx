import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Terminal, 
  ShieldAlert, 
  Zap, 
  Radio, 
  Volume2, 
  VolumeX, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Lock, 
  Unlock,
  AlertTriangle,
  Code2,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';

/* ── ACTUAL ARDUINO UNO CODE FROM QANNASAI/ARDUINO/ALERT_LISTENER.INO ── */
const ARDUINO_SOURCE_CODE = `// QannasAi Cyber-Physical Enclave Actuator
// Hardware: Arduino Uno R3 (/dev/ttyACM0)
const int ledPin = 13;
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

/* ── SOUND SYNTHESIS USING BROWSER WEBAUDIO (1000HZ BUZZER TONE) ── */
function playBuzzerTone(freq = 1000, duration = 200) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square'; // Piezo buzzer characteristic square wave
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (e) {
    // Handled gracefully if browser audio is locked until interaction
  }
}

export default function CyberPhysicalArchitectureSim() {
  // Navigation: 'arduino' (Hardware CPS Simulator) vs 'architecture' (Full Architecture Pipeline)
  const [activeTab, setActiveTab] = useState('arduino');
  
  // ── ARDUINO CPS SIMULATOR STATE ──
  const [pin13State, setPin13State] = useState(false);
  const [buzzerActive, setBuzzerActive] = useState(false);
  const [relayState, setRelayState] = useState('CLOSED'); // CLOSED (pass) or OPEN (airgap lock)
  const [txRxBlink, setTxRxBlink] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeCodeTab, setActiveCodeTab] = useState('terminal'); // 'terminal' | 'code'
  const [serialLogs, setSerialLogs] = useState([
    { id: 1, type: 'sys', text: '[BOOT] ATmega328P initialized at 16MHz' },
    { id: 2, type: 'sys', text: '[SERIAL] UART /dev/ttyACM0 listening @ 9600 baud' },
    { id: 3, type: 'sys', text: '[PINS] PIN 13 (LED) & PIN 12 (Buzzer) configured as OUTPUT' },
    { id: 4, type: 'ready', text: '[CPS ENCLAVE] Ready for autonomous cyber triggers' }
  ]);
  const [isExecuting, setIsExecuting] = useState(false);

  // ── ARCHITECTURE SIMULATION STATE ──
  const [simScenario, setSimScenario] = useState('syn_sweep');
  const [simStep, setSimStep] = useState(0); // 0: Idle, 1: Ingestion, 2: GNN, 3: Netfilter, 4: Hardware Airgap
  const [isSimRunning, setIsSimRunning] = useState(false);

  // Trigger Arduino Uno code execution routines
  const sendSerialCommand = async (command) => {
    if (isExecuting) return;
    setIsExecuting(true);
    setTxRxBlink(true);

    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);

    setSerialLogs(prev => [
      ...prev,
      { id: Date.now(), type: 'input', text: `> /dev/ttyACM0: WRITE "${command}\\n"` }
    ]);

    setTimeout(() => setTxRxBlink(false), 250);

    if (command === 'block') {
      // Execute alert_listener.ino block branch: 3x blink and buzz
      setSerialLogs(prev => [
        ...prev,
        { id: Date.now() + 1, type: 'action', text: '[LOOP] level == "block" -> Executing 3x LED blink + 1000Hz tone' },
        { id: Date.now() + 2, type: 'relay', text: '[RELAY] OPTOCOUPLER DE-ENERGIZED -> GALVANIC AIRGAP ACTIVATED' }
      ]);

      setRelayState('OPEN (AIRGAP SEVERED)');

      // Loop 3 times matching:
      // for(int i=0; i<3; i++) { digitalWrite(ledPin, HIGH); tone(buzzerPin, 1000, 200); delay(200); ... }
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          setPin13State(true);
          setBuzzerActive(true);
          if (soundEnabled) playBuzzerTone(1000, 200);
        }, i * 400);

        setTimeout(() => {
          setPin13State(false);
          setBuzzerActive(false);
        }, i * 400 + 200);
      }

      setTimeout(() => {
        setIsExecuting(false);
      }, 1400);

    } else if (command === 'watch') {
      // Execute alert_listener.ino watch branch: Steady LED 1000ms
      setSerialLogs(prev => [
        ...prev,
        { id: Date.now() + 1, type: 'action', text: '[LOOP] level == "watch" -> Steady PIN 13 LED (1000ms)' }
      ]);
      setPin13State(true);
      setTimeout(() => {
        setPin13State(false);
        setIsExecuting(false);
      }, 1000);

    } else {
      // Ignore / Normal
      setSerialLogs(prev => [
        ...prev,
        { id: Date.now() + 1, type: 'action', text: '[LOOP] level == "ignore" -> Normal wire pass, relay restored' }
      ]);
      setPin13State(false);
      setBuzzerActive(false);
      setRelayState('CLOSED (NORMAL PASS)');
      setIsExecuting(false);
    }
  };

  // Run the full 4-stage architecture simulation
  const runFullArchitectureSim = () => {
    if (isSimRunning) return;
    setIsSimRunning(true);
    setSimStep(1); // Stage 1: Ingestion

    // Stage 1 -> Stage 2: Neural
    setTimeout(() => {
      setSimStep(2);
    }, 900);

    // Stage 2 -> Stage 3: Kernel PEP
    setTimeout(() => {
      setSimStep(3);
    }, 1800);

    // Stage 3 -> Stage 4: Hardware Airgap Relay
    setTimeout(() => {
      setSimStep(4);
      sendSerialCommand(simScenario === 'benign' ? 'ignore' : 'block');
    }, 2700);

    // Completion
    setTimeout(() => {
      setIsSimRunning(false);
    }, 4200);
  };

  return (
    <div 
      className="cq-cps-container"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '740px',
        margin: '0 auto',
        borderRadius: '20px',
        background: 'rgba(7, 11, 18, 0.88)',
        backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.75), 0 0 30px rgba(0, 242, 254, 0.06)',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* ── TOP PRIMARY NAVIGATION TABS ── */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: 'rgba(5, 8, 14, 0.7)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        {/* Mode Switcher Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('arduino')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: activeTab === 'arduino' ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
              background: activeTab === 'arduino' ? 'rgba(0, 242, 254, 0.14)' : 'transparent',
              color: activeTab === 'arduino' ? '#00f2fe' : 'var(--cq-text-muted)',
              fontFamily: 'var(--cq-font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>ARDUINO UNO CPS ACTUATOR</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: activeTab === 'architecture' ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.08)',
              background: activeTab === 'architecture' ? 'rgba(45, 212, 191, 0.14)' : 'transparent',
              color: activeTab === 'architecture' ? '#2dd4bf' : 'var(--cq-text-muted)',
              fontFamily: 'var(--cq-font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>FULL ARCHITECTURE PIPELINE</span>
          </button>
        </div>

        {/* Live Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '10px', color: 'var(--cq-mint)', fontWeight: 600 }}>
            SERIAL LIVE
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: ARDUINO UNO CYBER-PHYSICAL SYSTEM SIMULATION
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'arduino' && (
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '18px' }}>
            
            {/* ── LEFT COLUMN: REALISTIC VIRTUAL ARDUINO UNO R3 BOARD ── */}
            <div 
              style={{
                position: 'relative',
                background: 'linear-gradient(145deg, #071926 0%, #030e18 100%)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '350px'
              }}
            >
              {/* Board Header Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f2fe' }} />
                  <span style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.05em' }}>
                    ARDUINO UNO R3
                  </span>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--cq-font-mono)' }}>
                    ATmega328P
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    title={soundEnabled ? 'Mute buzzer tone' : 'Enable 1000Hz buzzer tone'}
                    style={{ background: 'none', border: 'none', color: soundEnabled ? '#00f2fe' : 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0 }}
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                  <span style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '9px', color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                    9600 BAUD
                  </span>
                </div>
              </div>

              {/* Physical Circuit Visual Area */}
              <div style={{ position: 'relative', width: '100%', height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', margin: '10px 0' }}>
                
                {/* 1. USB Connection & ATmega Microchip */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  {/* USB-B Port */}
                  <div style={{ width: '38px', height: '24px', background: '#334155', borderRadius: '3px', border: '1px solid #64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '7px', fontFamily: 'var(--cq-font-mono)', color: '#94a3b8' }}>USB</span>
                  </div>

                  {/* TX / RX Indicator LEDs */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: txRxBlink ? '#fbbf24' : '#1e293b', boxShadow: txRxBlink ? '0 0 6px #fbbf24' : 'none' }} />
                      <span style={{ fontSize: '7px', fontFamily: 'var(--cq-font-mono)', color: 'rgba(255,255,255,0.4)' }}>TX</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: txRxBlink ? '#fbbf24' : '#1e293b', boxShadow: txRxBlink ? '0 0 6px #fbbf24' : 'none' }} />
                      <span style={{ fontSize: '7px', fontFamily: 'var(--cq-font-mono)', color: 'rgba(255,255,255,0.4)' }}>RX</span>
                    </div>
                  </div>

                  {/* ATmega328P DIP IC Chip */}
                  <div style={{ width: '90px', height: '36px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <span style={{ fontSize: '8px', fontFamily: 'var(--cq-font-mono)', color: '#64748b', letterSpacing: '0.05em' }}>
                      ATMEGA328P-PU
                    </span>
                  </div>
                </div>

                {/* 2. Actuator Modules: PIN 13 LED + PIN 12 Buzzer */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
                  
                  {/* PIN 13 DIGITAL LED ("L") */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div 
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: pin13State ? '#f59e0b' : '#1e293b',
                        boxShadow: pin13State ? '0 0 16px #f59e0b, 0 0 30px #f59e0b' : 'none',
                        transition: 'all 0.08s ease'
                      }} 
                    />
                    <div>
                      <div style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '10px', fontWeight: 700, color: pin13State ? '#fbbf24' : '#94a3b8' }}>
                        PIN 13 LED (L)
                      </div>
                      <div style={{ fontSize: '8px', fontFamily: 'var(--cq-font-mono)', color: pin13State ? '#f59e0b' : 'rgba(255,255,255,0.4)' }}>
                        {pin13State ? 'HIGH [ON]' : 'LOW [OFF]'}
                      </div>
                    </div>
                  </div>

                  {/* PIN 12 PIEZO BUZZER */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div 
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#090d16',
                        border: buzzerActive ? '2px solid #ef4444' : '1px solid #334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: buzzerActive ? 'cqBuzzerPulse 0.2s infinite' : 'none'
                      }}
                    >
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: buzzerActive ? '#ef4444' : '#475569' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '10px', fontWeight: 700, color: buzzerActive ? '#ef4444' : '#94a3b8' }}>
                        PIN 12 BUZZER
                      </div>
                      <div style={{ fontSize: '8px', fontFamily: 'var(--cq-font-mono)', color: buzzerActive ? '#ef4444' : 'rgba(255,255,255,0.4)' }}>
                        {buzzerActive ? '1000Hz ACTIVE' : 'SILENT'}
                      </div>
                    </div>
                  </div>

                  {/* OPTOCOUPLED RELAY STATE */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {relayState.startsWith('OPEN') ? (
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <div>
                      <div style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '9px', fontWeight: 700, color: relayState.startsWith('OPEN') ? '#f43f5e' : '#10b981' }}>
                        {relayState}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Hardware Actions Trigger Bar */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  disabled={isExecuting}
                  onClick={() => sendSerialCommand('block')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    background: 'rgba(244, 63, 94, 0.15)',
                    color: '#f43f5e',
                    fontFamily: 'var(--cq-font-mono)',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: isExecuting ? 'not-allowed' : 'pointer'
                  }}
                >
                  TRIGGER "block"
                </button>

                <button
                  disabled={isExecuting}
                  onClick={() => sendSerialCommand('watch')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    fontFamily: 'var(--cq-font-mono)',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: isExecuting ? 'not-allowed' : 'pointer'
                  }}
                >
                  TRIGGER "watch"
                </button>

                <button
                  disabled={isExecuting}
                  onClick={() => sendSerialCommand('ignore')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(45, 212, 191, 0.4)',
                    background: 'rgba(45, 212, 191, 0.15)',
                    color: '#2dd4bf',
                    fontFamily: 'var(--cq-font-mono)',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: isExecuting ? 'not-allowed' : 'pointer'
                  }}
                >
                  RESET "ignore"
                </button>
              </div>
            </div>

            {/* ── RIGHT COLUMN: CODE TAB & LIVE SERIAL MONITOR ── */}
            <div 
              style={{
                background: 'rgba(5, 8, 14, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                height: '350px'
              }}
            >
              {/* Tab Selector between Code & Serial Monitor */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                <button
                  onClick={() => setActiveCodeTab('terminal')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeCodeTab === 'terminal' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                    color: activeCodeTab === 'terminal' ? '#00f2fe' : 'var(--cq-text-muted)',
                    fontFamily: 'var(--cq-font-mono)',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Terminal className="w-3 h-3" />
                  <span>SERIAL MONITOR</span>
                </button>

                <button
                  onClick={() => setActiveCodeTab('code')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeCodeTab === 'code' ? 'rgba(45, 212, 191, 0.15)' : 'transparent',
                    color: activeCodeTab === 'code' ? '#2dd4bf' : 'var(--cq-text-muted)',
                    fontFamily: 'var(--cq-font-mono)',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Code2 className="w-3 h-3" />
                  <span>ALERT_LISTENER.INO</span>
                </button>
              </div>

              {/* View 1: Real Serial Terminal Logs */}
              {activeCodeTab === 'terminal' && (
                <div 
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    fontFamily: 'var(--cq-font-mono)',
                    fontSize: '10px',
                    lineHeight: '1.5',
                    color: '#94a3b8',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    paddingRight: '6px'
                  }}
                >
                  {serialLogs.map((log) => (
                    <div 
                      key={log.id} 
                      style={{
                        color: log.type === 'input' ? '#00f2fe' : log.type === 'relay' ? '#f43f5e' : log.type === 'action' ? '#fbbf24' : log.type === 'ready' ? '#10b981' : '#64748b'
                      }}
                    >
                      {log.text}
                    </div>
                  ))}
                </div>
              )}

              {/* View 2: Actual Arduino C++ Source Code */}
              {activeCodeTab === 'code' && (
                <pre 
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    fontFamily: 'var(--cq-font-mono)',
                    fontSize: '9.5px',
                    lineHeight: '1.4',
                    color: '#38bdf8',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    padding: '4px'
                  }}
                >
                  {ARDUINO_SOURCE_CODE}
                </pre>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: WHOLE ZERO-TRUST ARCHITECTURE END-TO-END SIMULATION
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'architecture' && (
        <div style={{ padding: '20px' }}>
          
          {/* Simulation Header & Scenario Trigger */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '11px', color: 'var(--cq-text-muted)' }}>
                ATTACK SCENARIO:
              </span>
              <select
                value={simScenario}
                onChange={(e) => setSimScenario(e.target.value)}
                disabled={isSimRunning}
                style={{
                  background: 'rgba(5, 8, 14, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontFamily: 'var(--cq-font-mono)',
                  fontSize: '11px',
                  padding: '4px 8px'
                }}
              >
                <option value="syn_sweep">TCP SYN Inundation (T1046)</option>
                <option value="lateral_smb">Internal Lateral Movement (T1021)</option>
                <option value="benign">Legitimate API Health Check (Benign)</option>
              </select>
            </div>

            <button
              onClick={runFullArchitectureSim}
              disabled={isSimRunning}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: isSimRunning ? 'rgba(255,255,255,0.1)' : '#00f2fe',
                color: isSimRunning ? 'var(--cq-text-muted)' : '#05070c',
                fontFamily: 'var(--cq-font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: isSimRunning ? 'not-allowed' : 'pointer'
              }}
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isSimRunning ? 'SIMULATING PIPELINE...' : 'EXECUTE SIMULATION'}</span>
            </button>
          </div>

          {/* 4 Architecture Stages Flowchart Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            
            {/* Stage 1: Wire Ingestion */}
            <div 
              style={{
                background: simStep >= 1 ? 'rgba(0, 242, 254, 0.1)' : 'rgba(5, 8, 14, 0.6)',
                border: `1.5px solid ${simStep >= 1 ? '#00f2fe' : 'rgba(255, 255, 255, 0.06)'}`,
                borderRadius: '12px',
                padding: '12px',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '9px', color: '#00f2fe', fontWeight: 700, marginBottom: '4px' }}>
                STAGE 01
              </div>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>
                Wire Ingestion
              </h4>
              <p style={{ fontSize: '10px', color: 'var(--cq-text-muted)', margin: 0, lineHeight: '1.3' }}>
                AF_PACKET 64MB ring intercepts Ethernet frames
              </p>
              {simStep === 1 && (
                <div style={{ marginTop: '8px', fontSize: '9px', color: '#00f2fe', fontFamily: 'var(--cq-font-mono)' }}>
                  [PULSING 1.2μs]
                </div>
              )}
            </div>

            {/* Stage 2: Neural Reasoning */}
            <div 
              style={{
                background: simStep >= 2 ? 'rgba(45, 212, 191, 0.1)' : 'rgba(5, 8, 14, 0.6)',
                border: `1.5px solid ${simStep >= 2 ? '#2dd4bf' : 'rgba(255, 255, 255, 0.06)'}`,
                borderRadius: '12px',
                padding: '12px',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '9px', color: '#2dd4bf', fontWeight: 700, marginBottom: '4px' }}>
                STAGE 02
              </div>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>
                Neural Cognition
              </h4>
              <p style={{ fontSize: '10px', color: 'var(--cq-text-muted)', margin: 0, lineHeight: '1.3' }}>
                GraphSAGE GNN & 1D-CNN temporal wave analysis
              </p>
              {simStep === 2 && (
                <div style={{ marginTop: '8px', fontSize: '9px', color: '#2dd4bf', fontFamily: 'var(--cq-font-mono)' }}>
                  [ANOMALY 0.988]
                </div>
              )}
            </div>

            {/* Stage 3: Kernel PEP Enforcement */}
            <div 
              style={{
                background: simStep >= 3 ? (simScenario === 'benign' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)') : 'rgba(5, 8, 14, 0.6)',
                border: `1.5px solid ${simStep >= 3 ? (simScenario === 'benign' ? '#10b981' : '#f43f5e') : 'rgba(255, 255, 255, 0.06)'}`,
                borderRadius: '12px',
                padding: '12px',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '9px', color: simScenario === 'benign' ? '#10b981' : '#f43f5e', fontWeight: 700, marginBottom: '4px' }}>
                STAGE 03
              </div>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>
                Kernel Netfilter
              </h4>
              <p style={{ fontSize: '10px', color: 'var(--cq-text-muted)', margin: 0, lineHeight: '1.3' }}>
                Priority 0 hook drops malicious socket in &lt; 38.4ms
              </p>
              {simStep === 3 && (
                <div style={{ marginTop: '8px', fontSize: '9px', color: simScenario === 'benign' ? '#10b981' : '#f43f5e', fontFamily: 'var(--cq-font-mono)' }}>
                  {simScenario === 'benign' ? '[PASS RULE]' : '[NFT DROP 38.4ms]'}
                </div>
              )}
            </div>

            {/* Stage 4: Hardware Airgap Actuator */}
            <div 
              style={{
                background: simStep >= 4 ? (simScenario === 'benign' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)') : 'rgba(5, 8, 14, 0.6)',
                border: `1.5px solid ${simStep >= 4 ? (simScenario === 'benign' ? '#10b981' : '#f59e0b') : 'rgba(255, 255, 255, 0.06)'}`,
                borderRadius: '12px',
                padding: '12px',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '9px', color: '#f59e0b', fontWeight: 700, marginBottom: '4px' }}>
                STAGE 04
              </div>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>
                Arduino Uno CPS
              </h4>
              <p style={{ fontSize: '10px', color: 'var(--cq-text-muted)', margin: 0, lineHeight: '1.3' }}>
                Serial bridge actuates physical optocoupled relay
              </p>
              {simStep === 4 && (
                <div style={{ marginTop: '8px', fontSize: '9px', color: '#f59e0b', fontFamily: 'var(--cq-font-mono)' }}>
                  {simScenario === 'benign' ? '[RELAY CLOSED]' : '[AIRGAP DISCONNECTED]'}
                </div>
              )}
            </div>

          </div>

          {/* Architecture Status Footer */}
          <div 
            style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(5, 8, 14, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--cq-font-mono)',
              fontSize: '10.5px'
            }}
          >
            <span style={{ color: 'var(--cq-text-dim)' }}>
              CLOSED-LOOP TELEMETRY: <strong style={{ color: '#00f2fe' }}>AF_PACKET &rarr; GNN &rarr; NFTABLES &rarr; /dev/ttyACM0</strong>
            </span>
            <span style={{ color: simStep === 4 ? (simScenario === 'benign' ? '#10b981' : '#f43f5e') : 'var(--cq-text-muted)', fontWeight: 700 }}>
              {simStep === 4 ? (simScenario === 'benign' ? 'BENIGN PASS: ZERO LATENCY OVERHEAD' : 'CONTAINED: 0.00% LATERAL BLEED') : 'READY'}
            </span>
          </div>

        </div>
      )}

      {/* Embedded CSS for Buzzer Animation */}
      <style>{`
        @keyframes cqBuzzerPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
