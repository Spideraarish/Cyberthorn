import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  ArrowUpRight, 
  Play, 
  RotateCcw, 
  Cpu, 
  Database, 
  Laptop, 
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  ArrowRight
} from 'lucide-react';
import './QuantumPage.css';

export default function QuantumPage() {
  // ── MINIMALIST SIMULATION STATE ──
  const [protectionMode, setProtectionMode] = useState('qannasai'); // 'qannasai' | 'classical'
  const [payloadText, setPayloadText] = useState('Bank Wire Transfer: $5,000,000');
  const [simState, setSimState] = useState('idle'); // 'idle' | 'sending' | 'protecting' | 'intercepting' | 'completed'
  const [attackOutcome, setAttackOutcome] = useState(null); // 'blocked' | 'intercepted' | null

  const presets = [
    'Bank Wire Transfer: $5,000,000',
    'Confidential Medical File: Patient 402',
    'Power Grid SCADA Admin Key'
  ];

  // ── TRIGGER SIMULATION ──
  const handleSendData = () => {
    if (simState !== 'idle' && simState !== 'completed') return;

    // Step 1: Sending from client
    setSimState('sending');
    setAttackOutcome(null);

    // Step 2: Passing through our tool (QannasAi)
    setTimeout(() => {
      setSimState('protecting');
    }, 750);

    // Step 3: Traveling across network & Quantum Attacker strikes in the middle
    setTimeout(() => {
      setSimState('intercepting');
    }, 1500);

    // Step 4: Reaching Database and outcome
    setTimeout(() => {
      setSimState('completed');
      if (protectionMode === 'qannasai') {
        setAttackOutcome('blocked');
      } else {
        setAttackOutcome('intercepted');
      }
    }, 2450);
  };

  const handleReset = () => {
    setSimState('idle');
    setAttackOutcome(null);
  };

  return (
    <div className="cq-quantum-page">
      {/* Subtle Ambient Background Gradients */}
      <div className="cq-ambient-mesh" />
      <div className="cq-ambient-glow-left" />
      <div className="cq-ambient-glow-right" />

      <div className="cq-quantum-container">

        {/* ── MINIMALIST HEADER ── */}
        <header className="cq-glass-header">
          <div className="cq-brand">
            <Link to="/home" className="cq-brand-link">
              <div className="cq-logo-box">
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <span className="cq-brand-title">QANNASAI</span>
                <span className="cq-brand-subtitle">POST-QUANTUM CRYPTOGRAPHIC ENCLAVE</span>
              </div>
            </Link>
          </div>

          <nav className="cq-nav-links">
            <Link to="/home">Overview</Link>
            <Link to="/simulation">CPS Simulation</Link>
            <Link to="/quantum" className="active">Quantum Shield</Link>
            <Link to="/" className="cq-btn-nav-primary">
              <span>Operations Center</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1 inline-block" />
            </Link>
          </nav>
        </header>

        {/* ── HERO BANNER (CLEAN & MINIMALIST) ── */}
        <div className="cq-sim-hero">
          <div className="cq-hero-pill">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>INTERACTIVE QUANTUM SECURITY SIMULATOR</span>
          </div>
          <h1 className="cq-hero-title">Data Transmission Under Quantum Attack</h1>
          <p className="cq-hero-subtitle">
            Send confidential data through <strong>QannasAi</strong> towards the database. 
            In the middle, a hacker uses a <strong>Quantum Computer</strong> to intercept and decrypt it.
          </p>
        </div>

        {/* ── GLASS CONTROLS PANEL ── */}
        <div className="cq-glass-controls">
          
          {/* Control 1: Protection Toggle */}
          <div className="cq-control-group">
            <span className="cq-control-label">1. CHOOSE SECURITY MODE</span>
            <div className="cq-toggle-pill-wrap">
              <button 
                className={`cq-toggle-pill ${protectionMode === 'qannasai' ? 'active-qannas' : ''}`}
                onClick={() => { setProtectionMode('qannasai'); handleReset(); }}
                disabled={simState !== 'idle' && simState !== 'completed'}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Protected by QannasAi (ML-KEM)</span>
              </button>

              <button 
                className={`cq-toggle-pill ${protectionMode === 'classical' ? 'active-classical' : ''}`}
                onClick={() => { setProtectionMode('classical'); handleReset(); }}
                disabled={simState !== 'idle' && simState !== 'completed'}
              >
                <Unlock className="w-4 h-4 text-rose-400" />
                <span>Unprotected (Old RSA / ECC)</span>
              </button>
            </div>
          </div>

          {/* Control 2: Data Payload */}
          <div className="cq-control-group">
            <span className="cq-control-label">2. SELECT DATA TO SEND</span>
            <div className="cq-payload-presets">
              {presets.map((item, idx) => (
                <button
                  key={idx}
                  className={`cq-preset-chip ${payloadText === item ? 'selected' : ''}`}
                  onClick={() => { setPayloadText(item); handleReset(); }}
                  disabled={simState !== 'idle' && simState !== 'completed'}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Control 3: Send Action Button */}
          <div className="cq-control-action">
            <button 
              className={`cq-btn-send-data ${protectionMode === 'qannasai' ? 'qannas-send' : 'classical-send'}`}
              onClick={handleSendData}
              disabled={simState !== 'idle' && simState !== 'completed'}
            >
              {simState === 'idle' || simState === 'completed' ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>▶ SEND DATA TO DATABASE</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-yellow-300 animate-spin" />
                  <span>TRANSMITTING IN PROGRESS...</span>
                </>
              )}
            </button>

            {simState === 'completed' && (
              <button className="cq-btn-reset" onClick={handleReset}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>

        {/* ── THE GLASS ARENA SIMULATION ── */}
        <div className="cq-glass-arena">
          
          {/* Top Pipeline: Sender ➔ Our Tool ➔ Database */}
          <div className="cq-pipeline-track">

            {/* ── NODE 1: SENDER (YOU) ── */}
            <div className={`cq-glass-node sender ${simState === 'sending' ? 'active-node' : ''}`}>
              <div className="cq-node-top-bar">
                <span className="cq-node-number">01</span>
                <span className="cq-node-tag blue">YOU (CLIENT)</span>
              </div>

              <div className="cq-node-icon-wrap sender-icon">
                <Laptop className="w-7 h-7 text-sky-400" />
                <div className="cq-node-glow blue" />
              </div>

              <h3 className="cq-node-title">Data Sender</h3>
              <div className="cq-node-payload-box" title={payloadText}>
                "{payloadText}"
              </div>

              <div className="cq-node-status-pill">
                {simState === 'idle' && '🟢 Ready to send'}
                {simState === 'sending' && '⚡ Transmitting data...'}
                {simState !== 'idle' && simState !== 'sending' && '✅ Data dispatched'}
              </div>
            </div>

            {/* ── CABLE 1: SENDER TO OUR TOOL ── */}
            <div className="cq-glass-cable">
              <div className="cq-cable-line" />
              {simState === 'sending' && (
                <div className="cq-data-packet packet-1">
                  <span className="cq-packet-dot blue" />
                  <span className="cq-packet-text">PAYLOAD</span>
                </div>
              )}
            </div>

            {/* ── NODE 2: OUR TOOL (QANNASAI) ── */}
            <div className={`cq-glass-node tool ${simState === 'protecting' ? 'active-node' : ''} ${protectionMode === 'qannasai' ? 'mode-pqc' : 'mode-rsa'}`}>
              <div className="cq-node-top-bar">
                <span className="cq-node-number">02</span>
                <span className={`cq-node-tag ${protectionMode === 'qannasai' ? 'green' : 'red'}`}>
                  {protectionMode === 'qannasai' ? 'OUR TOOL (ACTIVE)' : 'NO SHIELD'}
                </span>
              </div>

              <div className="cq-node-icon-wrap tool-icon">
                {protectionMode === 'qannasai' ? (
                  <ShieldCheck className="w-7 h-7 text-emerald-400" />
                ) : (
                  <Unlock className="w-7 h-7 text-rose-400" />
                )}
                <div className={`cq-node-glow ${protectionMode === 'qannasai' ? 'green' : 'red'}`} />
              </div>

              <h3 className="cq-node-title">QannasAi Tool</h3>
              <div className="cq-node-shield-info">
                {protectionMode === 'qannasai' ? '🛡️ 768-D Lattice Shield' : '⚠️ Old Classical Math'}
              </div>

              <div className="cq-node-status-pill">
                {simState === 'idle' && 'Standing by'}
                {simState === 'sending' && 'Awaiting packet...'}
                {simState === 'protecting' && (protectionMode === 'qannasai' ? '🛡️ Applying Lattice Shield...' : '⚠️ Passing Unprotected...')}
                {simState === 'intercepting' && 'In Transit'}
                {simState === 'completed' && (protectionMode === 'qannasai' ? '🛡️ Shield Held Firm' : '⚠️ Bypassed')}
              </div>
            </div>

            {/* ── CABLE 2: OUR TOOL TO DATABASE (ATTACK INTERCEPT ZONE) ── */}
            <div className={`cq-glass-cable cable-2 ${simState === 'intercepting' ? 'targeted' : ''}`}>
              <div className="cq-cable-line" />

              {/* Data packet traveling towards database */}
              {(simState === 'protecting' || simState === 'intercepting') && (
                <div className={`cq-data-packet packet-2 ${protectionMode === 'qannasai' ? 'shielded' : 'unshielded'}`}>
                  <span className={`cq-packet-dot ${protectionMode === 'qannasai' ? 'green' : 'red'}`} />
                  <span className="cq-packet-text">
                    {protectionMode === 'qannasai' ? '🛡️ ENCRYPTED' : '⚠️ RAW DATA'}
                  </span>
                </div>
              )}

              {/* Quantum Laser Beam firing into cable */}
              {simState === 'intercepting' && (
                <div className={`cq-laser-strike ${protectionMode === 'qannasai' ? 'deflected' : 'breached'}`}>
                  <div className="cq-laser-vertical-beam" />
                  {protectionMode === 'qannasai' ? (
                    <div className="cq-impact-bubble bounce">
                      <ShieldCheck className="w-4 h-4 text-emerald-300 inline mr-1" />
                      <span>DEFLECTED!</span>
                    </div>
                  ) : (
                    <div className="cq-impact-bubble crack">
                      <Unlock className="w-4 h-4 text-rose-300 inline mr-1" />
                      <span>CRACKED!</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── NODE 3: DATABASE (DESTINATION) ── */}
            <div className={`cq-glass-node database ${simState === 'completed' ? (attackOutcome === 'blocked' ? 'secure' : 'breached') : ''}`}>
              <div className="cq-node-top-bar">
                <span className="cq-node-number">03</span>
                <span className="cq-node-tag purple">DATABASE</span>
              </div>

              <div className="cq-node-icon-wrap db-icon">
                {simState === 'completed' && attackOutcome === 'intercepted' ? (
                  <Unlock className="w-7 h-7 text-rose-400 animate-bounce" />
                ) : (
                  <Database className="w-7 h-7 text-purple-400" />
                )}
                <div className={`cq-node-glow ${simState === 'completed' && attackOutcome === 'intercepted' ? 'red' : 'purple'}`} />
              </div>

              <h3 className="cq-node-title">Destination DB</h3>
              <div className="cq-node-shield-info">
                {simState === 'completed' 
                  ? (attackOutcome === 'blocked' ? '🔒 100% Intact & Secure' : '💥 Breached in Transit')
                  : 'Awaiting Storage'}
              </div>

              <div className="cq-node-status-pill">
                {simState === 'idle' && '🔒 Normal Locked'}
                {simState === 'completed' && (attackOutcome === 'blocked' ? '🏆 Stored Safely' : '⚠️ Compromised Payload')}
                {simState !== 'idle' && simState !== 'completed' && 'Receiving...'}
              </div>
            </div>

          </div>

          {/* ── IN THE MIDDLE: QUANTUM ATTACKER ── */}
          <div className="cq-middle-attacker-dock">
            <div className={`cq-glass-attacker-card ${simState === 'intercepting' ? 'firing-attack' : ''} ${simState === 'completed' ? (attackOutcome === 'blocked' ? 'attack-failed' : 'attack-won') : ''}`}>
              
              <div className="cq-attacker-left">
                <div className="cq-attacker-avatar">
                  <Cpu className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <div className="cq-attacker-badge-row">
                    <span className="cq-node-tag red">ATTACKER IN THE MIDDLE</span>
                    <span className="cq-attacker-qubits">4,096 QUBITS ACTIVE</span>
                  </div>
                  <h4 className="cq-attacker-title">Quantum Computer (Hacker)</h4>
                  <p className="cq-attacker-sub">
                    Monitors network stream and runs Shor’s Quantum Algorithm to break encryption in transit.
                  </p>
                </div>
              </div>

              <div className="cq-attacker-status-box">
                {simState === 'idle' && (
                  <span className="cq-state-idle">⚪ Line Scanned: Waiting for Data</span>
                )}
                {simState === 'sending' && (
                  <span className="cq-state-idle">⚪ Packet Detected: Locking Targets</span>
                )}
                {simState === 'protecting' && (
                  <span className="cq-state-firing">⚠️ Arming Quantum Laser Beam...</span>
                )}
                {simState === 'intercepting' && (
                  <span className="cq-state-firing pulse">⚡ FIRING SHOR'S QUANTUM BEAM...</span>
                )}
                {simState === 'completed' && attackOutcome === 'blocked' && (
                  <span className="cq-state-blocked">❌ SHIELD DEFLECTED ATTACK: 140 TRILLION YEARS NEEDED</span>
                )}
                {simState === 'completed' && attackOutcome === 'intercepted' && (
                  <span className="cq-state-won">💥 CRACKED IN 0.4s: STOLE PLAIN DATA</span>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* ── SIMPLE PLAIN-ENGLISH OUTCOME CARD ── */}
        {simState === 'completed' && attackOutcome === 'blocked' && (
          <div className="cq-glass-outcome-card safe">
            <div className="cq-outcome-icon-wrap green">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="cq-outcome-text">
              <h3>🏆 DATA SAFELY DELIVERED — QUANTUM ATTACK BLOCKED!</h3>
              <p>
                <strong>What happened:</strong> As the data passed through our tool, QannasAi wrapped it inside a <strong>768-layer lattice maze</strong>. 
                When the quantum hacker attacked in the middle, their quantum computer could not solve the maze. 
                The attack was completely deflected, and the database received your data safely.
              </p>
              <div className="cq-outcome-pills">
                <span className="cq-pill green">Status: 100% Safe</span>
                <span className="cq-pill green">Lattice Protection: Active</span>
                <span className="cq-pill green">Time Needed to Crack: 140 Trillion Years</span>
              </div>
            </div>
          </div>
        )}

        {simState === 'completed' && attackOutcome === 'intercepted' && (
          <div className="cq-glass-outcome-card danger">
            <div className="cq-outcome-icon-wrap red">
              <XCircle className="w-6 h-6 text-rose-400" />
            </div>
            <div className="cq-outcome-text">
              <h3>💥 DATA STOLEN IN TRANSIT — QUANTUM HACK SUCCESSFUL!</h3>
              <p>
                <strong>What happened:</strong> Without QannasAi, the data was protected only by old classical encryption (RSA). 
                The quantum computer in the middle ran Shor’s algorithm and cracked the secret password in <strong>0.4 seconds</strong>. 
                The hacker intercepted your message: <em>"{payloadText}"</em> before it reached the database.
              </p>
              <div className="cq-outcome-pills">
                <span className="cq-pill red">Status: Compromised</span>
                <span className="cq-pill red">Time to Crack: 0.4 Seconds</span>
                <span className="cq-pill red">Protection: None</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
