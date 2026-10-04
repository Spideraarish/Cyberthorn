import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { useEffect, useRef } from 'react';

const LOG_STYLE = {
  attack:  { border: 'var(--red)',    prefix: 'ATTACK',  prefixColor: 'var(--red)' },
  observe: { border: 'rgba(255,255,255,0.06)', prefix: 'OBSERVE', prefixColor: 'var(--text-2)' },
  orient:  { border: 'var(--purple)', prefix: 'ORIENT',  prefixColor: 'var(--purple)' },
  decide:  { border: 'var(--blue)',   prefix: 'DECIDE',  prefixColor: 'var(--blue)' },
  act:     { border: 'var(--amber)',  prefix: 'ACT',     prefixColor: 'var(--amber)' },
  reflect: { border: 'var(--green)',  prefix: 'REFLECT', prefixColor: 'var(--green)' },
  admin:   { border: 'rgba(255,255,255,0.2)', prefix: 'ADMIN', prefixColor: 'var(--text-2)' },
  error:   { border: 'var(--red)',    prefix: 'ERROR',   prefixColor: 'var(--red)' },
};

export default function LiveLog({ logs }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-head">
        <Terminal size={13} color="var(--blue)" />
        <span className="card-head-label">Event Log</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: 'var(--text-2)' }}>
          {logs.length} events
        </span>
      </div>

      <div className="card-body scroll" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {logs.length === 0 && (
          <div style={{ color: 'var(--text-2)', fontSize: '0.75rem', paddingTop: '1rem', textAlign: 'center' }}>
            Standing by…
          </div>
        )}
        <AnimatePresence initial={false}>
          {logs.map(log => {
            const s = LOG_STYLE[log.type] || LOG_STYLE.observe;
            return (
              <motion.div
                key={log.id}
                layout
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className={`log-row type-${log.type}`}
              >
                <div style={{ fontSize: '0.58rem', color: 'var(--text-2)', marginBottom: '1px' }}>{log.time}</div>
                <span style={{ color: s.prefixColor, fontWeight: 700, marginRight: '0.4rem' }}>[{s.prefix}]</span>
                <span style={{ color: '#cbd5e1' }}>{log.text}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
