import { useEffect, useState } from 'react';

export default function ArduinoStatus() {
  const [status, setStatus] = useState({ level: 'off' });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://localhost:8001/api/arduino-status');
        const data = await res.json();
        setStatus(data);
      } catch (err) {}
    };
    fetchStatus();
    const int = setInterval(fetchStatus, 1500);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="panel" style={{marginTop: '1.5rem'}}>
      <h2>PHYSICAL ALERT</h2>
      <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
        <div style={{
          width: '12px', height: '12px',
          background: status.level === 'block' ? 'var(--danger-color)' : status.level === 'watch' ? 'var(--warning-color)' : 'var(--surface-border)',
          boxShadow: status.level !== 'off' ? `0 0 15px ${status.level === 'block' ? 'var(--danger-color)' : 'var(--warning-color)'}` : 'none',
          animation: status.level === 'block' ? 'pulse-ring 2s infinite' : 'none'
        }} />
        <span style={{fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: status.level === 'block' ? 'var(--danger-color)' : status.level === 'watch' ? 'var(--warning-color)' : 'var(--text-secondary)'}}>
          {status.level.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
