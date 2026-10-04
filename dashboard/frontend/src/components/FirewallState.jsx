import { ShieldOff, Unlock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FirewallState({ setBlockedIps, addLog }) {
  const [blocked, setBlocked] = useState([]);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch('http://localhost:8001/api/rules');
        const data = await res.json();
        let ips = [];
        const nft = data?.rules?.nftables;
        if (Array.isArray(nft)) {
          const setObj = nft.find(item => item.set?.name === 'blocked_ips');
          ips = setObj?.set?.elem || [];
        }
        setBlocked(ips);
        setBlockedIps(ips);
      } catch {}
    };
    fetch_();
    const t = setInterval(fetch_, 2000);
    return () => clearInterval(t);
  }, [setBlockedIps]);

  const unblock = async (ip) => {
    addLog({ type: 'admin', text: `Admin manually unblocked ${ip} from nftables.` });
    await fetch('http://localhost:8001/api/unblock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip }),
    });
  };

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-head">
        <ShieldOff size={13} style={{ color: blocked.length > 0 ? 'var(--red)' : 'var(--text-2)' }} />
        <span className="card-head-label">PEP Firewall</span>
        {blocked.length > 0
          ? <span className="badge badge-red" style={{ marginLeft: 'auto' }}>{blocked.length} blocked</span>
          : <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Clear</span>
        }
      </div>

      <div className="card-body scroll" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {blocked.length === 0 ? (
          <div style={{ color: 'var(--text-2)', fontSize: '0.75rem' }}>
            No IPs in nftables blocked_ips set.
          </div>
        ) : (
          <AnimatePresence>
            {blocked.map(ip => (
              <motion.div key={ip} layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 0.65rem',
                  background: 'rgba(239,68,68,0.07)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 'var(--r-sm)',
                  gap: '0.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                  <div className="dot-red" />
                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--red)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    DROP {ip}
                  </span>
                </div>
                <button onClick={() => unblock(ip)} style={{
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                  background: 'transparent', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '4px', padding: '3px 8px',
                  color: 'var(--red)', cursor: 'pointer',
                  fontSize: '0.63rem', fontWeight: 600, flexShrink: 0,
                  transition: 'background 0.15s',
                }}>
                  <Unlock size={10} /> Unblock
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
