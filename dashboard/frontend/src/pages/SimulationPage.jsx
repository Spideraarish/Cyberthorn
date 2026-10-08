import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Cpu, 
  Terminal, 
  Zap, 
  Play, 
  RotateCcw, 
  Layers, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  ArrowRight, 
  ArrowUpRight, 
  Code2, 
  Activity, 
  Server,
  Network,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import ShaderGradientBackground from '../components/ShaderGradientBackground';
import WaterRippleGridCanvas from '../components/WaterRippleGridCanvas';
import WokwiCyberPhysicalSystem from '../components/WokwiCyberPhysicalSystem';
import './SimulationPage.css';

/* ── "WHAT HAPPENS WHEN WE DO THIS OR THAT" DETAILED SCENARIOS ── */
const SIMULATION_SCENARIOS = [
  {
    id: 'syn_flood',
    title: 'Adversary Launches TCP SYN Flood (T1046)',
    type: 'attack',
    severity: 'CRITICAL',
    anomalyScore: '0.988',
    action: 'block',
    trigger: 'Inundation SYN scan from 10.0.1.10 targeting ports 1-1024',
    chronology: [
      { step: 1, title: 'Layer 2/3 Wire Ingestion', latency: '0.2ms', desc: 'AF_PACKET raw ring buffer catches 5,000 SYN frames with 0 socket copy overhead.' },
      { step: 2, title: 'Dual Neural Reasoning', latency: '32.1ms', desc: 'GraphSAGE flags fan-out degree anomaly (>85). 1D-CNN flags arrival delta-t spike (<1.2ms).' },
      { step: 3, title: 'Linux Kernel PEP Drop', latency: '5.8ms', desc: 'PEP inserts Priority 0 rule: nft add rule filter ip saddr 10.0.1.10 drop. Hostile socket severed.' },
      { step: 4, title: 'USB Cable & Wokwi Arduino Uno', latency: '0.3ms', desc: 'Daemon sends "block\\n" over /dev/ttyACM0. PIN 13 LED blinks 3x, buzzer sounds 1000Hz, relay trips open (AIRGAP).' }
    ],
    expectedHardware: '3x Yellow LED Flash + 1000Hz Acoustic Tone + Physical Galvanic Relay Breaker Severed'
  },
  {
    id: 'lateral_movement',
    title: 'Internal Host Attempts Lateral Movement (T1021)',
    type: 'attack',
    severity: 'HIGH',
    anomalyScore: '0.965',
    action: 'block',
    trigger: 'Compromised host 10.0.5.10 attempts lateral SMB/RDP sweep targeting 10.0.4.10:445,3389',
    chronology: [
      { step: 1, title: 'Layer 2/3 Wire Ingestion', latency: '0.2ms', desc: 'Kernel intercepts unauthorized cross-namespace lateral probing packets.' },
      { step: 2, title: 'Dual Neural Reasoning', latency: '32.1ms', desc: 'GraphSAGE detects abnormal bipartite link traversal between isolated subnets.' },
      { step: 3, title: 'Linux Kernel PEP Drop', latency: '5.8ms', desc: 'PEP severs forward routing table: nft add rule filter forward ip saddr 10.0.5.10 drop.' },
      { step: 4, title: 'USB Cable & Wokwi Arduino Uno', latency: '0.3ms', desc: 'Serial command "block\\n" transmitted. Optocoupled relay mechanically disconnects sensitive enclave.' }
    ],
    expectedHardware: '3x Yellow LED Flash + 1000Hz Acoustic Tone + Physical Galvanic Relay Breaker Severed'
  },
  {
    id: 'ssh_probe',
    title: 'Suspicious SSH Brute-Force Probing (T1021.004)',
    type: 'warning',
    severity: 'SUSPICIOUS',
    anomalyScore: '0.740',
    action: 'watch',
    trigger: 'External IP 10.0.2.14 attempts rapid sequential credential attempts on port 22',
    chronology: [
      { step: 1, title: 'Layer 2/3 Wire Ingestion', latency: '0.2ms', desc: 'Raw socket captures rapid sequence of SSH key exchange handshakes.' },
      { step: 2, title: 'Dual Neural Reasoning', latency: '32.1ms', desc: '1D-CNN detects rhythmic auth cadence. Trust score drops to 0.42 (Decides "watch").' },
      { step: 3, title: 'Linux Kernel PEP Drop', latency: '5.8ms', desc: 'Hostile IP placed into strict rate-limiting queue while telemetry captures deeper payloads.' },
      { step: 4, title: 'USB Cable & Wokwi Arduino Uno', latency: '0.3ms', desc: 'Serial command "watch\\n" sent. PIN 13 LED remains solid steady (1000ms), relay stays closed.' }
    ],
    expectedHardware: 'PIN 13 LED Solid Steady (1000ms) + Continuous Socket Telemetry (Relay Closed)'
  },
  {
    id: 'benign_sync',
    title: 'Verified Enterprise Database Replication (Benign)',
    type: 'benign',
    severity: 'NORMAL',
    anomalyScore: '0.032',
    action: 'ignore',
    trigger: 'Authorized node 10.0.3.15 streams 1.2GB encrypted database volume over TLS 1.3',
    chronology: [
      { step: 1, title: 'Layer 2/3 Wire Ingestion', latency: '0.2ms', desc: 'AF_PACKET ring buffer processes 940 Mbps jumbo frames cleanly with zero jitter.' },
      { step: 2, title: 'Dual Neural Reasoning', latency: '32.1ms', desc: 'GraphSAGE verifies legitimate cluster topology. Trust score verified at 0.98 (Decides "ignore").' },
      { step: 3, title: 'Linux Kernel PEP Drop', latency: '5.8ms', desc: 'Deterministic packet pass. Zero latency overhead introduced into production stream.' },
      { step: 4, title: 'USB Cable & Wokwi Arduino Uno', latency: '0.3ms', desc: 'Serial command "ignore\\n" sent. LED stays off, buzzer silent, relay closed (normal transmission).' }
    ],
    expectedHardware: 'Normal Conduction Pass + LED Low + Relay Closed (Conductive)'
  }
];

export default function SimulationPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState('syn_flood');
  const scenario = SIMULATION_SCENARIOS.find(s => s.id === selectedScenarioId) || SIMULATION_SCENARIOS[0];

  const [simStage, setSimStage] = useState(0); // 0: Idle, 1: Wire, 2: Neural, 3: Kernel, 4: Arduino
  const [isSimulating, setIsSimulating] = useState(false);

  // Run the full 4-stage pipeline simulation
  const handleRunSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStage(1); // Stage 1: Wire Ingest

    // Stage 1 -> Stage 2: Neural Reasoning
    setTimeout(() => {
      setSimStage(2);
    }, 850);

    // Stage 2 -> Stage 3: Linux Kernel Netfilter Drop
    setTimeout(() => {
      setSimStage(3);
    }, 1750);

    // Stage 3 -> Stage 4: Physical USB Cable -> Wokwi Arduino Uno
    setTimeout(() => {
      setSimStage(4);
    }, 2650);

    // Reset simulation active state
    setTimeout(() => {
      setIsSimulating(false);
    }, 4400);
  };

  return (
    <div className="cq-sim-page">
      {/* Three.js WebGL Fluid Wave Plane */}
      <ShaderGradientBackground 
        opacity={0.3}
        color1="#040711"
        color2="#0f172a"
        color3="#0a2540"
        uSpeed={0.12}
        uStrength={1.5}
      />

      {/* Grid crosshair backdrop */}
      <WaterRippleGridCanvas 
        cellSize={76}
        damping={0.962}
        rippleIntensity={75}
        showCrosshair={true}
      />

      <div className="cq-sim-container">
        
        {/* ── HEADER NAVIGATION BAR ── */}
        <header className="cq-sim-header">
          <div className="cq-sim-brand">
            <Link to="/home" className="cq-sim-brand-link">
              <div className="cq-sim-logo-box">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="cq-sim-title">QANNASAI</span>
                <span className="cq-sim-subtitle">CYBER-PHYSICAL SYSTEM (CPS) &amp; WOKWI ARDUINO UNO TESTBED</span>
              </div>
            </Link>
          </div>

          <div className="cq-sim-nav-actions">
            <Link to="/home" className="cq-sim-btn-glass">
              <span>Overview</span>
            </Link>
            <Link to="/quantum" className="cq-sim-btn-glass" style={{ borderColor: 'rgba(192, 132, 252, 0.35)', color: '#c084fc' }}>
              <span>Quantum (PQC)</span>
            </Link>
            <Link to="/" className="cq-sim-btn-primary">
              <span>Operations Center</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </header>

        {/* ── "WHAT HAPPENS WHEN WE DO THIS OR THAT" SCENARIO SELECTOR ── */}
        <div className="cq-sim-scenario-bar">
          <div className="cq-scenario-select-wrap">
            <span className="cq-scenario-label">SIMULATE "WHAT HAPPENS WHEN":</span>
            <div className="cq-scenario-pills">
              {SIMULATION_SCENARIOS.map(sc => (
                <button
                  key={sc.id}
                  disabled={isSimulating}
                  className={`cq-scenario-pill ${selectedScenarioId === sc.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedScenarioId(sc.id);
                    setSimStage(0);
                  }}
                >
                  <span 
                    className="cq-pill-dot" 
                    style={{ background: sc.type === 'attack' ? '#f43f5e' : sc.type === 'warning' ? '#f59e0b' : '#10b981' }} 
                  />
                  <span className="cq-pill-name">{sc.title.split(' (')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="cq-scenario-action-wrap">
            <button
              disabled={isSimulating}
              onClick={handleRunSimulation}
              className="cq-pipeline-run-btn"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'SIMULATING ACROSS TIERS...' : 'EXECUTE SYSTEM SIMULATION'}</span>
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════════
            PRIMARY CONNECTED DIAGRAM: CYBER HOST &harr; USB CABLE &harr; WOKWI ARDUINO UNO
           ════════════════════════════════════════════════════════════════════════ */}
        <WokwiCyberPhysicalSystem 
          activeScenario={scenario}
          isSimulating={isSimulating}
          simStage={simStage}
          onSimulationComplete={() => setIsSimulating(false)}
        />

        {/* ── EXECUTION CHRONOLOGY SUMMARY ── */}
        <div className="cq-chronology-bottom-card">
          <div className="cq-chrono-header">
            <div className="cq-chrono-title">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h4>CHRONOLOGY OF EVENTS: {scenario.title}</h4>
            </div>
            <div className="cq-chrono-expected">
              <span>EXPECTED HARDWARE ACTUATION:</span>
              <strong>{scenario.expectedHardware}</strong>
            </div>
          </div>

          <div className="cq-chrono-steps-row">
            {scenario.chronology.map((c, i) => (
              <div 
                key={i} 
                className={`cq-step-block ${simStage === c.step ? 'step-running' : simStage > c.step ? 'step-passed' : ''}`}
              >
                <div className="cq-step-top">
                  <span className="cq-step-num">STAGE 0{c.step}</span>
                  <span className="cq-step-lat">{c.latency}</span>
                </div>
                <h5>{c.title}</h5>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
