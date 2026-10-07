import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  Terminal, 
  Activity, 
  Radio, 
  Cpu, 
  Lock, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Sliders,
  Layers,
  Flame
} from 'lucide-react';

/* ── WIRE ENCLAVE COCKPIT (INTERACTIVE HERO HUD) ──
   High-precision telemetry HUD replacing the 3D shield.
   Features live packet stream, GraphSAGE node anomaly gauge,
   1D-CNN temporal waveform, and interactive attack simulations.
*/
export default function WireEnclaveCockpit({ mode = 'gcn', onSimulateAttack }) {
  const [packetLog, setPacketLog] = useState([
    { id: 1, src: '10.0.1.10', dst: '10.0.4.10:443', proto: 'TCP', state: 'ESTABLISHED', action: 'PASS', time: '19:42:01.02' },
    { id: 2, src: '10.0.2.14', dst: '10.0.4.10:80', proto: 'HTTP', state: 'VERIFIED', action: 'PASS', time: '19:42:01.18' },
    { id: 3, src: '10.0.5.10', dst: '10.0.4.10:22', proto: 'SSH', state: 'MONITORED', action: 'PASS', time: '19:42:01.34' }
  ]);
  
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [anomalyScore, setAnomalyScore] = useState(0.04);
  const [isolationCount, setIsolationCount] = useState(148);
  const [isIntercepting, setIsIntercepting] = useState(false);
  const [lastVerdict, setLastVerdict] = useState(null);

  // Background subtle telemetry pulse
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isIntercepting) {
        setAnomalyScore(prev => +(0.03 + Math.random() * 0.05).toFixed(3));
      }
    }, 2400);
    return () => clearInterval(timer);
  }, [isIntercepting]);

  // Run interactive hero simulation
  const triggerSimulation = (type) => {
    if (isIntercepting) return;
    setIsIntercepting(true);
    setActiveSimulation(type);

    let simMeta = {};
    if (type === 'syn') {
      simMeta = {
        name: 'TCP SYN Port Sweep (T1046)',
        src: '10.0.1.10',
        dst: '10.0.4.10:1-1024',
        anomaly: 0.962,
        action: 'nft drop ip saddr 10.0.1.10',
        latency: '38.4ms'
      };
    } else if (type === 'lateral') {
      simMeta = {
        name: 'Internal Lateral Movement (T1021)',
        src: '10.0.5.10',
        dst: '10.0.4.10:445',
        anomaly: 0.988,
        action: 'nft drop ip saddr 10.0.5.10 ip daddr 10.0.4.10',
        latency: '41.2ms'
      };
    } else {
      simMeta = {
        name: 'Egress Data Exfiltration (T1041)',
        src: '10.0.4.10',
        dst: '198.51.100.24:9000',
        anomaly: 0.945,
        action: 'nft drop ip saddr 10.0.4.10 ip daddr 198.51.100.24',
        latency: '39.8ms'
      };
    }

    setAnomalyScore(simMeta.anomaly);

    // Prepend hostile packet
    setPacketLog(prev => [
      {
        id: Date.now(),
        src: simMeta.src,
        dst: simMeta.dst,
        proto: type === 'syn' ? 'TCP SYN' : type === 'lateral' ? 'SMB' : 'RAW TCP',
        state: 'ANOMALY DETECTED',
        action: 'DROPPING...',
        time: 'JUST NOW',
        isHostile: true
      },
      ...prev.slice(0, 3)
    ]);

    // Sever after simulated wire latency (800ms visual duration)
    setTimeout(() => {
      setIsolationCount(prev => prev + 1);
      setLastVerdict(simMeta);
      setPacketLog(prev => [
        {
          id: Date.now() + 1,
          src: simMeta.src,
          dst: 'NETFILTER PRIORITY 0',
          proto: 'SEVERED',
          state: 'ISOLATED IN ' + simMeta.latency,
          action: 'DROPPED',
          time: 'RESOLVED',
          isIsolated: true
        },
        ...prev.slice(0, 3)
      ]);
      setIsIntercepting(false);

      if (onSimulateAttack) {
        onSimulateAttack(simMeta);
      }
    }, 900);
  };

  return (
    <div className="we-cockpit-container">
      {/* Liquid Glass Glow Backing */}
      <div className="we-cockpit-glow" />

      {/* Main Liquid Glass Cockpit Panel */}
      <div className="we-cockpit-frame">
        
        {/* Cockpit Header Bar */}
        <div className="we-cockpit-header">
          <div className="we-cockpit-title-group">
            <span className="we-live-beacon" />
            <span className="we-header-title">Autonomous Netfilter Hook</span>
          </div>

          <div className="we-header-stats">
            <span className="we-stat-tag">SLA: <strong>&lt; 38.4ms</strong></span>
          </div>
        </div>

        {/* Visual Telemetry Grid: GraphSAGE + 1D-CNN + Kernel State */}
        <div className="we-telemetry-cluster">
          
          {/* Tile A: Neural Anomaly Metric */}
          <div className={`we-cluster-tile ${anomalyScore > 0.6 ? 'alert' : ''}`}>
            <div className="we-tile-header">
              <span className="we-tile-label">
                {mode === 'gcn' ? 'GRAPHSAGE ADJACENCY' : mode === 'cnn' ? '1D-CNN TEMPORAL ENTROPY' : 'KERNEL DROP PROBABILITY'}
              </span>
              <span className="we-tile-metric" style={{ color: anomalyScore > 0.6 ? 'var(--cq-ruby)' : 'var(--cq-mint)' }}>
                {(anomalyScore * 100).toFixed(1)}%
              </span>
            </div>
            
            {/* Visual Progress Bar Gauge */}
            <div className="we-gauge-track">
              <div 
                className="we-gauge-fill" 
                style={{ 
                  width: `${Math.min(100, anomalyScore * 100)}%`,
                  background: anomalyScore > 0.6 ? 'var(--cq-ruby)' : 'var(--cq-mint)',
                  boxShadow: anomalyScore > 0.6 ? '0 0 12px var(--cq-ruby-glow)' : '0 0 12px var(--cq-mint-glow)'
                }} 
              />
            </div>
            <div className="we-gauge-meta">
              <span>0.00 THRESHOLD</span>
              <span>0.75 DROP TRIGGER</span>
              <span>1.00 LOCK</span>
            </div>
          </div>

          {/* Tile B: Wire Enforcement Counters */}
          <div className="we-cluster-tile">
            <div className="we-tile-header">
              <span className="we-tile-label">AUTONOMOUS ISOLATIONS</span>
              <span className="we-tile-metric" style={{ color: 'var(--cq-amber)' }}>
                {isolationCount} SEVERED
              </span>
            </div>
            <div className="we-micro-tags-row">
              <span className="we-pill-tag">DRIFT: 0.00%</span>
              <span className="we-pill-tag">LATERAL BLEED: 0</span>
              <span className="we-pill-tag">HOOK: NETFILTER</span>
            </div>
          </div>

        </div>

        {/* Live Packet Ingestion Stream */}
        <div className="we-packet-stream-block">
          <div className="we-stream-header">
            <span>Live Socket Traffic</span>
            <span>64MB Ring Buffer</span>
          </div>

          <div className="we-packet-list">
            {packetLog.map((pkt) => (
              <div 
                key={pkt.id} 
                className={`we-packet-row ${pkt.isHostile ? 'hostile' : ''} ${pkt.isIsolated ? 'isolated' : ''}`}
              >
                <div className="we-pkt-col-route">
                  <span className="we-pkt-dot" />
                  <span className="we-pkt-text">{pkt.src} → {pkt.dst}</span>
                </div>
                <div className="we-pkt-col-proto">
                  <span className="we-proto-badge">{pkt.proto}</span>
                </div>
                <div className="we-pkt-col-verdict">
                  <span className={`we-action-badge ${pkt.action === 'PASS' ? 'pass' : pkt.action === 'DROPPED' ? 'dropped' : 'dropping'}`}>
                    {pkt.action}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Simulation Sandbox Trigger Deck */}
        <div className="we-sim-trigger-deck">
          <div className="we-sim-deck-title">
            <span>Test Wire Interception</span>
          </div>

          <div className="we-sim-btn-grid">
            <button 
              onClick={() => triggerSimulation('syn')}
              disabled={isIntercepting}
              className={`we-sim-action-btn ${activeSimulation === 'syn' && isIntercepting ? 'active' : ''}`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate SYN Flood</span>
            </button>

            <button 
              onClick={() => triggerSimulation('lateral')}
              disabled={isIntercepting}
              className={`we-sim-action-btn ${activeSimulation === 'lateral' && isIntercepting ? 'active' : ''}`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Simulate Lateral Crawl</span>
            </button>

            <button 
              onClick={() => triggerSimulation('exfil')}
              disabled={isIntercepting}
              className={`we-sim-action-btn ${activeSimulation === 'exfil' && isIntercepting ? 'active' : ''}`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulate Data Exfil</span>
            </button>
          </div>
        </div>

        {/* Dynamic Verdict Flash Notification */}
        <AnimatePresence>
          {lastVerdict && !isIntercepting && (
            <motion.div 
              className="we-verdict-banner"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="we-verdict-left">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span><strong>{lastVerdict.name}</strong> severed at wire in <strong>{lastVerdict.latency}</strong></span>
              </div>
              <code className="we-verdict-code">{lastVerdict.action}</code>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
