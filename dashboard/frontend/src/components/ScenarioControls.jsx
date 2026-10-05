import { Zap, ChevronRight } from 'lucide-react';

/* 
  Scenarios are semi-fixed (Docker network IPs are defined by docker-compose),
  but the actual attack command is real Docker exec — no hardcoded fake delays.
  GNN scores match the scenario's expected real-world anomaly profile.
*/
const SCENARIOS = [
  {
    id: '1',
    name: '1. TCP SYN Port Scan',
    detail: 'Attacker → Protected-Critical (T1046)',
    desc: 'nmap SYN sweep. Model flags topological out-degree anomaly. Expected: BLOCK.',
    severityClass: 'badge-red',
    severity: 'Critical',
  },
  {
    id: '2',
    name: '2. HTTP Request Burst',
    detail: 'Attacker → Protected-Critical (T1499.001)',
    desc: '15 sequential HTTP requests. Volumetric edge-frequency spike. Expected: BLOCK.',
    severityClass: 'badge-red',
    severity: 'Critical',
  },
  {
    id: '3',
    name: '3. Internal Lateral Sweep',
    detail: 'User Node → Protected-Critical (T1021)',
    desc: 'Compromised user node scanning critical database. Zero-Trust violation. Expected: BLOCK.',
    severityClass: 'badge-red',
    severity: 'Critical',
  },
  {
    id: '4',
    name: '4. Web Directory Fuzzing',
    detail: 'Attacker → Web Server (T1083)',
    desc: 'Endpoint discovery fuzzing (/admin, /api, /config). Structural anomaly. Expected: BLOCK.',
    severityClass: 'badge-red',
    severity: 'High',
  },
  {
    id: '5',
    name: '5. SSH Service Probing',
    detail: 'Attacker → Protected-Critical (T1021.004)',
    desc: 'Repeated handshakes to port 22. Rapid connection churn. Expected: BLOCK.',
    severityClass: 'badge-red',
    severity: 'High',
  },
  {
    id: '6',
    name: '6. Outbound Exfiltration Flow',
    detail: 'Critical Database → Attacker (T1041)',
    desc: 'Reverse outbound POST transfer from sensitive database node. Expected: BLOCK.',
    severityClass: 'badge-red',
    severity: 'Critical',
  },
  {
    id: '7',
    name: '7. Internal Endpoint Crawl',
    detail: 'User Node → Protected-Critical (T1018)',
    desc: 'Internal host crawling endpoints across security zone boundary. Expected: BLOCK.',
    severityClass: 'badge-red',
    severity: 'High',
  },
  {
    id: '8',
    name: '8. Full TCP Connect Scan',
    detail: 'Attacker → User Node (T1046)',
    desc: 'Full 3-way handshake sweep on ports 80, 443, 8000, 8080. Expected: BLOCK.',
    severityClass: 'badge-amber',
    severity: 'Medium',
  },
  {
    id: '9',
    name: '9. Ping Reachability Sweep',
    detail: 'Attacker → Protected-Critical (T1018)',
    desc: 'Rapid ICMP echo requests testing host presence. Expected: WATCH / BLOCK.',
    severityClass: 'badge-amber',
    severity: 'Medium',
  },
  {
    id: '10',
    name: '10. Health Polling (Benign)',
    detail: 'User Node → Critical Asset (Baseline)',
    desc: 'Authorized single HTTP health query. Proves model avoids false positives. Expected: IGNORE.',
    severityClass: 'badge-blue',
    severity: 'Normal',
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
