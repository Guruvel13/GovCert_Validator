import styles from './LogTable.module.css';

const STATUS_COLORS = {
  VALID:   { bg: 'rgba(16,185,129,0.15)',  color: '#10b981' },
  INVALID: { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
  EXPIRED: { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  ERROR:   { bg: 'rgba(139,92,246,0.15)',  color: '#8b5cf6' },
};

function StatusPill({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.ERROR;
  return (
    <span className={styles.pill}
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}40` }}>
      {status}
    </span>
  );
}

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function LogTable({ logs, loading }) {
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner"></div>
        <span>Loading history…</span>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📋</span>
        <p>No verification history yet.</p>
        <p className={styles.emptyHint}>Upload a certificate to get started.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>File</th>
            <th>Status</th>
            <th>Issuer</th>
            <th>Issued To</th>
            <th>Verified At</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log._id}>
              <td className={styles.filename}>{log.originalName || log.filename}</td>
              <td><StatusPill status={log.status} /></td>
              <td className={styles.muted}>{log.issuer || '—'}</td>
              <td className={styles.muted}>{log.issuedTo || '—'}</td>
              <td className={`${styles.muted} ${styles.mono}`}>{formatDate(log.verifiedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
