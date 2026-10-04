import { useEffect, useRef, useState } from 'react';
import TopologyGraph from './components/TopologyGraph';
import AgentLoopVisualizer from './components/AgentLoopVisualizer';
import TrustScorePanel from './components/TrustScorePanel';
import FirewallState from './components/FirewallState';
import ScenarioControls from './components/ScenarioControls';
import LiveLog from './components/LiveLog';

/*
 CYBERTHORN — Zero-Trust Operations Center
 
 Layout (all in 100vh, no page scroll):
 ┌─────────────────────────────────────────────────────┐
 │ HEADER (52px fixed)                                 │
 ├─────────────────────────────────────────────────────┤
 │ STATS ROW (70px fixed)                              │
 ├──────────────────────────────────┬──────────────────┤
 │ LEFT COLUMN (flex 1)             │ EVENT LOG (320px) │
 │  ┌─ Topology (auto height) ──┐   │ (scrollable)     │
 │  └─ Agent Loop (flex 1) ────┘   │                  │
 ├──────────────────────────────────┴──────────────────┤
 │ BOTTOM ROW (250px fixed) — 3 columns                │
 │  Scenarios | Trust Scores | Firewall                │
 └─────────────────────────────────────────────────────┘
*/

function Stat({ value, label, color }) {
  return (
    <div className="stat">
      <div className="stat-val" style={{ color: color || 'var(--text-1)' }}>{value}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  );
}

export default function App() {
  const [stage, setStage] = useState(null);
  const [payload, setPayload] = useState(null);
  const [blockedIps, setBlockedIps] = useState([]);
  const [watchedIps] = useState([]);       // populated by trust scores <0.7 but >0 in future
  const [logs, setLogs] = useState([]);
  const [activeAttack, setActiveAttack] = useState(null);
  const [wsStatus, setWsStatus] = useState('connecting');
  const [eventCount, setEventCount] = useState(0);
  const [actionCounts, setActionCounts] = useState({ block: 0, watch: 0, ignore: 0 });
  const wsRef = useRef(null);

  const addLog = (entry) => {
    setLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      ...entry,
    }].slice(-150));
  };

  /* WebSocket — correct path: /api/agent-stream (NOT /ws/agent-stream) */
  useEffect(() => {
    let retry;
    const connect = () => {
      const ws = new WebSocket('ws://localhost:8001/api/agent-stream');
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('connected');
        addLog({ type: 'observe', text: 'Connected to Cyberthorn backend WebSocket.' });
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        retry = setTimeout(connect, 3000);
      };

      ws.onerror = () => setWsStatus('error');

      ws.onmessage = (e) => {
        const { stage: s, data: d } = JSON.parse(e.data);
        setStage(s);
        setPayload(d);

        if (s === 'OBSERVE') {
          setEventCount(n => n + 1);
          // Only log if there were actual alerts
          if (d?.message && d.message.includes('Found') && !d.message.includes('Found 0')) {
            addLog({ type: 'observe', text: d.message });
          }
        } else if (s === 'ORIENT') {
          addLog({
            type: 'orient',
            text: `IP ${d?.ip} — zone: ${d?.context?.zone || '?'}, GNN: ${d?.context?.gnn_score}, event: ${d?.context?.wazuh_event}`,
          });
        } else if (s === 'DECIDE') {
          const action = (d?.decision?.action || '?').toUpperCase();
          const conf = ((d?.decision?.confidence || 0) * 100).toFixed(0);
          addLog({
            type: 'decide',
            text: `${d?.ip} → ${action} (${conf}% conf): ${d?.decision?.justification}`,
          });
        } else if (s === 'ACT') {
          const action = (d?.action || '').toLowerCase();
          addLog({ type: 'act', text: `${d?.action?.toUpperCase()} executed on ${d?.ip}` });
          setActionCounts(prev => ({ ...prev, [action]: (prev[action] || 0) + 1 }));
        } else if (s === 'REFLECT') {
          const pct = ((d?.new_trust_score || 0) * 100).toFixed(0);
          addLog({ type: 'reflect', text: `Trust for ${d?.ip} updated → ${pct}%` });
        }
      };
    };

    connect();
    return () => { clearTimeout(retry); wsRef.current?.close(); };
  }, []);

  return (
    /* Full-viewport container — overflow hidden at every level */
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      padding: '0.875rem',
      gap: '0.75rem',
    }}>

      {/* ── HEADER ──────────────────────────────────── */}
      <header style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
              Cyberthorn
            </h1>
            <span style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Zero-Trust Operations Center
            </span>
          </div>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-2)', marginTop: '2px' }}>
            GNN Anomaly Detection · OODA Agentic Loop · nftables PEP Enforcement · Docker Sandbox
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className={`badge ${wsStatus === 'connected' ? 'badge-green' : wsStatus === 'connecting' ? 'badge-blue' : 'badge-red'}`}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
            {wsStatus === 'connected' ? 'Agent Live' : wsStatus === 'connecting' ? 'Connecting…' : 'Disconnected — retrying'}
          </span>
        </div>
      </header>

      {/* ── STATS ROW ───────────────────────────────── */}
      <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
        <Stat value={eventCount} label="Telemetry Events" />
        <Stat value={activeAttack ? 1 : 0} label="Active Scenarios" color={activeAttack ? "var(--amber)" : "var(--green)"} />
        <Stat value={blockedIps.length} label="Nodes Isolated" color="var(--red)" />
      </div>

      {/* ── MAIN AREA (fills remaining space) ──────── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: '0.75rem',
        minHeight: 0,  /* critical for flex children to shrink */
        overflow: 'hidden',
      }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ flex: '0 0 auto', display: 'flex', minHeight: 0, overflowX: 'auto' }}>
            <TopologyGraph blockedIps={blockedIps} watchedIps={watchedIps} activeAttack={activeAttack} />
          </div>
          <AgentLoopVisualizer stage={stage} payload={payload} />
        </div>

        {/* Right: event log — fills full height */}
        <LiveLog logs={logs} />
      </div>

      {/* ── BOTTOM ROW (fixed 220px) ─────────────── */}
      <div style={{
        flexShrink: 0,
        height: '220px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '0.75rem',
        overflow: 'hidden',
      }}>
        <ScenarioControls addLog={addLog} setActiveAttack={setActiveAttack} />
        <TrustScorePanel />
        <FirewallState setBlockedIps={setBlockedIps} addLog={addLog} />
      </div>
    </div>
  );
}
