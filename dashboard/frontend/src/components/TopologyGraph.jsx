import { useEffect, useState } from 'react';
import { Network, Shield, Skull, Server, Laptop, Activity, Lock, Eye, CheckCircle, Cpu, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/*
  HIGH-END SOC TOPOLOGY
  Zone-based architecture with simulated hardware telemetry.
*/

const NODE_META = {
  attacker:        { icon: Skull,  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Threat Actor', os: 'Kali Linux', subnet: '10.0.1.0/24' },
  pep:             { icon: Shield, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  label: 'Policy Enforcement Point', os: 'Alpine / nftables', subnet: '10.0.2.0/24' },
  'victim-critical':{ icon: Server, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Critical Database', os: 'Ubuntu 22.04 LTS', subnet: '10.0.4.0/24' },
  'victim-user':   { icon: Laptop, color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   label: 'Employee Endpoint', os: 'Windows 11', subnet: '10.0.5.0/24' },
};

function getZone(node) {
  if (!node.zones || node.zones.length === 0) return 'unknown';
  if (node.id === 'pep' || node.id.includes('pep')) return 'enforcement';
  if (node.zones.includes('untrusted')) return 'untrusted';
  return 'protected';
}

function MiniSparkline({ color }) {
  // Fake sparkline for visual density
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '14px', opacity: 0.7 }}>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ height: ['40%', `${Math.random() * 60 + 40}%`, '40%'] }}
          transition={{ duration: 1.5 + Math.random(), repeat: Infinity }}
          style={{ width: '3px', background: color, borderRadius: '1px' }}
        />
      ))}
    </div>
  );
}

function DetailedNodeCard({ node, status }) {
  const meta = NODE_META[node.id] || { icon: Laptop, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: node.id, os: 'Unknown' };
  const IconComp = meta.icon;
  const isIsolated = status === 'blocked';
  const isWatched = status === 'watching';
  
  // Hardware metrics simulation based on status
  const cpuLoad = isIsolated ? '2%' : (node.id === 'attacker' ? '89%' : '14%');
  const netIops = isIsolated ? '0 KB/s' : (node.id === 'attacker' ? '45 MB/s' : '1.2 MB/s');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(0,0,0,0.4)',
        border: `1px solid ${isIsolated ? 'rgba(239,68,68,0.4)' : isWatched ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 'var(--r-sm)',
        padding: '0.65rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background status glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: isIsolated ? 'var(--red)' : isWatched ? 'var(--amber)' : 'var(--border)'
      }} />

      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 28, height: 28, borderRadius: '6px', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconComp size={14} color={isIsolated ? '#ef4444' : isWatched ? '#f59e0b' : meta.color} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-1)', lineHeight: 1 }}>{meta.label}</div>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-2)', marginTop: '2px', fontFamily: 'var(--mono)' }}>{node.id}</div>
          </div>
        </div>
        
        {/* Status Badge */}
        <div style={{ flexShrink: 0 }}>
          {isIsolated ? <span className="badge badge-red"><Lock size={9} /> ISOLATED</span> :
           isWatched ? <span className="badge badge-amber"><Eye size={9} /> WATCHING</span> :
           <span className="badge badge-green"><CheckCircle size={9} /> SECURE</span>}
        </div>
      </div>

      <hr style={{ borderColor: 'rgba(255,255,255,0.04)', margin: '0.2rem 0' }} />

      {/* Data Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.55rem', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>IP Address</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-1)', fontFamily: 'var(--mono)' }}>{node.ips?.[0] || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.55rem', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>OS Fingerprint</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-2)' }}>{meta.os}</div>
        </div>
      </div>

      {/* Telemetry Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.35rem', borderRadius: '4px', marginTop: '0.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.6rem', color: 'var(--text-2)', fontFamily: 'var(--mono)' }}>
            <Cpu size={10} color="var(--text-3)" /> {cpuLoad}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.6rem', color: 'var(--text-2)', fontFamily: 'var(--mono)' }}>
            <Activity size={10} color="var(--text-3)" /> {netIops}
          </div>
        </div>
        {!isIsolated && <MiniSparkline color={meta.color} />}
      </div>
    </motion.div>
  );
}

function ConnectionLine({ status }) {
  const isBlocked = status === 'blocked';
  const isActive = status === 'active';
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '0 0.5rem', position: 'relative' }}>
      <div style={{ fontSize: '0.55rem', color: isBlocked ? 'var(--red)' : 'var(--text-3)', fontFamily: 'var(--mono)', marginBottom: '4px', fontWeight: 700 }}>
        {isBlocked ? 'DENY_ALL' : 'ALLOW_EST'}
      </div>
      
      {/* The Line */}
      <div style={{ width: '40px', height: '2px', background: isBlocked ? 'var(--red)' : isActive ? 'var(--amber)' : 'rgba(255,255,255,0.1)', position: 'relative' }}>
        {isActive && !isBlocked && (
          <motion.div
            animate={{ left: ['0%', '100%'] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', top: '-2px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--amber)', boxShadow: '0 0 8px var(--amber)' }}
          />
        )}
        {isBlocked && (
          <div style={{ position: 'absolute', top: '-4px', left: '50%', transform: 'translateX(-50%)', color: 'var(--red)' }}>
            <Lock size={10} fill="var(--bg)" />
          </div>
        )}
      </div>
      
      <div style={{ fontSize: '0.55rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: '4px' }}>eth0</div>
    </div>
  );
}

export default function TopologyGraph({ blockedIps, watchedIps, activeAttack }) {
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch('http://localhost:8001/api/topology');
        const data = await res.json();
        setNodes(data.nodes || []);
      } catch {}
    };
    fetch_();
    const t = setInterval(fetch_, 3000);
    return () => clearInterval(t);
  }, []);

  const getStatus = (node) => {
    const ips = node.ips || [];
    if (ips.some(ip => (blockedIps || []).includes(ip))) return 'blocked';
    if (ips.some(ip => (watchedIps || []).includes(ip))) return 'watching';
    return 'ok';
  };

  const pepNode = nodes.find(n => n.id === 'pep' || n.id.includes('pep'));
  const untrustedNodes = nodes.filter(n => getZone(n) === 'untrusted');
  const protectedNodes = nodes.filter(n => getZone(n) === 'protected');

  const attackerStatus = untrustedNodes.length > 0 ? getStatus(untrustedNodes[0]) : 'ok';
  const attackArrowStatus = attackerStatus === 'blocked' ? 'blocked' : activeAttack ? 'active' : '';

  if (nodes.length === 0) {
    return (
      <div className="card" style={{ flex: '0 0 auto', width: '100%' }}>
        <div className="card-head">
          <Network size={13} color="var(--blue)" />
          <span className="card-head-label">Zero-Trust Network Topology</span>
        </div>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', fontSize: '0.78rem' }}>
          Initializing Hardware Telemetry...
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ flex: '0 0 auto', width: '100%' }}>
      <div className="card-head">
        <Network size={13} color="var(--blue)" />
        <span className="card-head-label">Zero-Trust Architecture Map</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span className="badge badge-green">{nodes.length} ENDPOINTS</span>
          <span className="badge" style={{ background: 'transparent', border: '1px solid var(--border)' }}>{blockedIps?.length || 0} BLOCKED</span>
        </div>
      </div>

      <div className="card-body scroll" style={{ padding: '1rem', background: 'radial-gradient(ellipse at top left, rgba(59,130,246,0.03), transparent 70%)' }}>
        
        {/* Main flow layout */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.25rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>

          {/* UNTRUSTED ZONE */}
          <div style={{ flex: '1 1 280px', minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px dashed rgba(239,68,68,0.2)', borderRadius: 'var(--r-sm)', padding: '0.75rem', background: 'rgba(239,68,68,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(239,68,68,0.1)', paddingBottom: '0.4rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--red)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>External / Untrusted</div>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: '2px' }}>CIDR: 10.0.1.0/24 (WAN Simulation)</div>
              </div>
              <Activity size={12} color="var(--red)" style={{ opacity: 0.5 }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {untrustedNodes.map(n => <DetailedNodeCard key={n.id} node={n} status={getStatus(n)} />)}
            </div>
          </div>

          {/* CONNECTION TO PEP */}
          <ConnectionLine status={attackArrowStatus} />

          {/* PEP ZONE */}
          <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 'var(--r-sm)', padding: '0.75rem', background: 'rgba(59,130,246,0.04)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(59,130,246,0.2)', paddingBottom: '0.4rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--blue)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Enforcement Layer</div>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: '2px' }}>Zero-Trust Boundary</div>
              </div>
              <Shield size={12} color="var(--blue)" style={{ opacity: 0.5 }} />
            </div>
            
            {pepNode && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '0.5rem' }}>
                <motion.div
                  animate={{ boxShadow: blockedIps?.length > 0 ? '0 0 0 8px rgba(59,130,246,0.1)' : '0 0 0 0 rgba(59,130,246,0)' }}
                  transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                  style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Shield size={28} color="var(--blue)" />
                </motion.div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--blue)' }}>nftables PEP</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-2)', fontFamily: 'var(--mono)', marginTop: '2px' }}>{pepNode.ips?.[0]}</div>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.4rem', width: '100%', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '2px' }}>Active Ruleset</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--green)', fontFamily: 'var(--mono)' }}>ESTABLISHED: ACCEPT</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--red)', fontFamily: 'var(--mono)' }}>BLOCKED_SET: DROP ({blockedIps?.length || 0})</div>
                </div>
              </div>
            )}
          </div>

          {/* CONNECTION FROM PEP */}
          <ConnectionLine status={attackArrowStatus === 'blocked' ? 'blocked' : ''} />

          {/* PROTECTED ZONE */}
          <div style={{ flex: '1 1 280px', minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px dashed rgba(34,197,94,0.2)', borderRadius: 'var(--r-sm)', padding: '0.75rem', background: 'rgba(34,197,94,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(34,197,94,0.1)', paddingBottom: '0.4rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Protected Intranet</div>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: '2px' }}>CIDR: 10.0.4.0/24, 10.0.5.0/24</div>
              </div>
              <HardDrive size={12} color="var(--green)" style={{ opacity: 0.5 }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {protectedNodes.map(n => <DetailedNodeCard key={n.id} node={n} status={getStatus(n)} />)}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
