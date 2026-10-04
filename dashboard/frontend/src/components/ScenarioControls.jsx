import { Zap, ChevronRight } from 'lucide-react';

/* 
  Scenarios are semi-fixed (Docker network IPs are defined by docker-compose),
  but the actual attack command is real Docker exec — no hardcoded fake delays.
  GNN scores match the scenario's expected real-world anomaly profile.
*/
const SCENARIOS = [
  {
    id: '1',
    name: 'Port Scan',
    detail: 'Attacker → Protected-Critical',
    desc: 'nmap SYN scan. High GNN score (0.95). Expected: BLOCK.',
    severityClass: 'badge-red',
    severity: 'Critical',
  },
  {
    id: '2',
    name: 'Traffic Burst',
    detail: 'User Node → Web Services',
    desc: 'Unusual HTTP burst. Moderate GNN score (0.45). Expected: WATCH.',
    severityClass: 'badge-amber',
    severity: 'Medium',
  },
  {
    id: '3',
    name: 'Lateral Movement',
    detail: 'User Node → Protected-Critical',
    desc: 'Internal pivot attempt. High GNN score (0.88). Expected: BLOCK.',
    severityClass: 'badge-red',
    severity: 'High',
  },
];

export default function ScenarioControls({ addLog, setActiveAttack }) {
  const trigger = async (s) => {
    setActiveAttack(s.id);
    addLog({ type: 'attack', text: `Scenario "${s.name}" triggered — ${s.detail}` });

    try {
      const res = await fetch('http://localhost:8001/api/trigger-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: s.id }),
      });
      const data = await res.json();
      if (data.status !== 'started') {
        addLog({ type: 'error', text: `Scenario ${s.id} rejected by backend.` });
      }
    } catch (err) {
      addLog({ type: 'error', text: `Backend unreachable: ${err.message}` });
    }

    setTimeout(() => setActiveAttack(null), 6000);
  };

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={13} color="var(--blue)" />
          <span className="card-head-label">Attack Scenarios</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <button onClick={async () => {
            try {
              addLog({ type: 'observe', text: 'Resetting SOC environment...' });
              const res = await fetch('http://localhost:8001/api/reset', { method: 'POST' });
              const data = await res.json();
              if (data.status === 'error') {
                addLog({ type: 'error', text: 'Reset SOC partially failed: ' + data.errors.join(', ') });
              } else {
                window.location.reload();
              }
            } catch (err) {
              addLog({ type: 'error', text: 'Network Error during Reset SOC: ' + err.message });
            }
          }} style={{ background: 'var(--red)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            RESET SOC
          </button>
          <span className="badge badge-blue">Live Docker</span>
        </div>
      </div>

      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflow: 'hidden' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-2)', lineHeight: 1.5, flexShrink: 0 }}>
          Each scenario runs a real Docker exec command and feeds telemetry into the agent pipeline.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', overflowY: 'auto' }}>
          {SCENARIOS.map(s => (
            <button key={s.id} className="scenario-btn" onClick={() => trigger(s)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{s.name}</span>
                  <span className={`badge ${s.severityClass}`}>{s.severity}</span>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-2)', whiteSpace: 'normal' }}>{s.desc}</span>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-2)', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
