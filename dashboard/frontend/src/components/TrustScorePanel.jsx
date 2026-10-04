import { Shield, Lock, Eye, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrustScorePanel() {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch('http://localhost:8001/api/trust-scores');
        const data = await res.json();
        setScores(data.scores || []);
      } catch {}
    };
    fetch_();
    const t = setInterval(fetch_, 2000);
    return () => clearInterval(t);
  }, []);

  const colorFor = (score) => score >= 0.7 ? 'var(--green)' : score >= 0.35 ? 'var(--amber)' : 'var(--red)';

  const badgeFor = (score) => {
    if (score >= 0.7) return <span className="badge badge-green"><CheckCircle size={8} /> Trusted</span>;
    if (score >= 0.35) return <span className="badge badge-amber"><Eye size={8} /> Watch</span>;
    return <span className="badge badge-red"><Lock size={8} /> Blocked</span>;
  };

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-head">
        <Shield size={13} color="var(--blue)" />
        <span className="card-head-label">Node Trust Scores</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: 'var(--text-2)' }}>{scores.length} nodes</span>
      </div>

      <div className="card-body scroll" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {scores.length === 0 && (
          <div style={{ color: 'var(--text-2)', fontSize: '0.75rem' }}>
            No data yet — trigger a scenario.
          </div>
        )}
        <AnimatePresence>
          {scores.map(s => (
            <motion.div layout key={s.ip} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span className="mono" style={{ fontSize: '0.72rem', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.ip}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                  <span className="mono" style={{ fontSize: '0.68rem', color: colorFor(s.score), fontWeight: 600 }}>
                    {(s.score * 100).toFixed(0)}%
                  </span>
                  {badgeFor(s.score)}
                </div>
              </div>
              <div className="trust-track">
                <motion.div
                  className="trust-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${s.score * 100}%` }}
                  style={{ background: colorFor(s.score) }}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
