import { motion } from 'framer-motion';
import { Brain, Check } from 'lucide-react';

const STAGES = [
  { id: 'OBSERVE', label: 'Observe', desc: 'Poll telemetry from Wazuh / network sensors' },
  { id: 'ORIENT', label: 'Orient',  desc: 'GNN scores anomaly; builds context' },
  { id: 'DECIDE', label: 'Decide',  desc: 'Zero-Trust rules engine evaluates threat' },
  { id: 'ACT',    label: 'Act',     desc: 'PEP enforces nftables block or watch rule' },
  { id: 'REFLECT',label: 'Reflect', desc: 'Update trust.db, broadcast to dashboard' },
];

export default function AgentLoopVisualizer({ stage, payload }) {
  const activeIdx = STAGES.findIndex(s => s.id === stage);
  const activeStage = STAGES[activeIdx];

  return (
    <div className="card" style={{ flex: 1, minHeight: 0 }}>
      <div className="card-head">
        <Brain size={13} color="var(--blue)" />
        <span className="card-head-label">OODA Agentic Loop</span>
        {stage && <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>{stage}</span>}
      </div>

      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'hidden' }}>
        {/* Pipeline row */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {STAGES.map((s, i) => {
            const isDone = activeIdx > i;
            const isActive = activeIdx === i;
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STAGES.length - 1 ? 1 : 'none' }}>
                <div className="pipe-step">
                  <motion.div
                    className={`pipe-dot ${isActive ? 'active' : isDone ? 'done' : ''}`}
                    animate={isActive ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                    transition={{ duration: 1.2, repeat: isActive ? Infinity : 0 }}
                  >
                    {isDone ? <Check size={13} /> : i + 1}
                  </motion.div>
                  <span className={`pipe-label ${isActive ? 'active' : isDone ? 'done' : ''}`}>{s.label}</span>
                </div>
                {i < STAGES.length - 1 && (
                  <div className={`pipe-line ${isDone ? 'done' : isActive ? 'active' : ''}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Stage description */}
        {activeStage && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', flexShrink: 0 }}>
            {activeStage.desc}
          </div>
        )}

        {/* Payload */}
        <motion.div
          key={stage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            flex: 1, minHeight: 0, overflow: 'auto',
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            padding: '0.75rem',
            fontFamily: 'var(--mono)',
            fontSize: '0.72rem',
            lineHeight: 1.6,
            color: 'var(--text-1)'
          }}
        >
          {payload ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--blue)', marginBottom: '0.2rem', letterSpacing: '0.04em' }}>
                // AGENT REASONING ENGINE — {stage}
              </div>
              
              {stage === 'OBSERVE' && (
                <div>
                  <span style={{ color: 'var(--text-2)' }}>&gt; Polling Wazuh telemetry...</span><br/>
                  <span style={{ color: 'var(--green)' }}>✓ {payload.message}</span>
                </div>
              )}
              
              {stage === 'ORIENT' && (
                <div>
                  <span style={{ color: 'var(--text-2)' }}>&gt; Analyzing anomaly pattern...</span><br/>
                  Target IP: <span style={{ color: 'var(--blue)' }}>{payload.ip}</span><br/>
                  Network Zone: <span style={{ color: 'var(--amber)' }}>{payload.context?.zone}</span><br/>
                  Event Type: <span>{payload.context?.wazuh_event}</span><br/>
                  Neural Network Confidence Score: <span style={{ color: payload.context?.gnn_score > 0.7 ? 'var(--red)' : 'var(--amber)' }}>{payload.context?.gnn_score}</span>
                </div>
              )}
              
              {stage === 'DECIDE' && (
                <div>
                  <span style={{ color: 'var(--text-2)' }}>&gt; Evaluating Zero-Trust Policies...</span><br/>
                  Target IP: <span style={{ color: 'var(--blue)' }}>{payload.ip}</span><br/>
                  Calculated Action: <span style={{ color: payload.decision?.action === 'block' ? 'var(--red)' : 'var(--amber)', fontWeight: 700 }}>[{payload.decision?.action?.toUpperCase()}]</span><br/>
                  Policy Justification: <span style={{ color: 'var(--text-2)' }}>{payload.decision?.justification}</span><br/>
                  Engine Confidence: <span>{(payload.decision?.confidence * 100).toFixed(0)}%</span>
                </div>
              )}
              
              {stage === 'ACT' && (
                <div>
                  <span style={{ color: 'var(--text-2)' }}>&gt; Enforcing decision via PEP firewall...</span><br/>
                  Command sent: <span style={{ color: 'var(--blue)' }}>nftables {payload.action} {payload.ip}</span><br/>
                  <span style={{ color: 'var(--green)' }}>✓ Network isolation confirmed.</span>
                </div>
              )}
              
              {stage === 'REFLECT' && (
                <div>
                  <span style={{ color: 'var(--text-2)' }}>&gt; Updating global trust matrix...</span><br/>
                  Node <span style={{ color: 'var(--blue)' }}>{payload.ip}</span> trust score adjusted to: <span style={{ color: 'var(--red)' }}>{(payload.new_trust_score * 100).toFixed(0)}%</span><br/>
                  <span style={{ color: 'var(--green)' }}>✓ Broadcasted state to dashboard.</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--text-2)', fontSize: '0.75rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Agent is idling. Trigger a scenario to trace reasoning.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
