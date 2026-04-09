import { useEffect, useState } from 'react';
import styles from './ResultCard.module.css';

const STATUS_CONFIG = {
  VALID: {
    icon: '✓',
    label: 'VALID',
    color: 'valid',
    glow: 'var(--color-valid-glow)',
    message: 'Certificate is authentic and untampered.',
  },
  INVALID: {
    icon: '✕',
    label: 'INVALID',
    color: 'invalid',
    glow: 'var(--color-invalid-glow)',
    message: 'Certificate verification failed.',
  },
  EXPIRED: {
    icon: '⏰',
    label: 'EXPIRED',
    color: 'expired',
    glow: 'var(--color-expired-glow)',
    message: 'Certificate has expired.',
  },
  ERROR: {
    icon: '⚠',
    label: 'ERROR',
    color: 'error',
    glow: 'var(--color-error-glow)',
    message: 'An error occurred during verification.',
  },
};

function DetailRow({ icon, label, value, mono }) {
  if (!value) return null;
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailIcon}>{icon}</span>
      <div className={styles.detailContent}>
        <span className={styles.detailLabel}>{label}</span>
        <span className={`${styles.detailValue} ${mono ? styles.mono : ''}`}>{value}</span>
      </div>
    </div>
  );
}

function CheckItem({ passed, label }) {
  return (
    <div className={`${styles.checkItem} ${passed === true ? styles.passed : passed === false ? styles.failed : styles.unknown}`}>
      <span className={styles.checkIcon}>
        {passed === true ? '✓' : passed === false ? '✕' : '?'}
      </span>
      <span>{label}</span>
    </div>
  );
}

export default function ResultCard({ result, onReset }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (result) {
      setVisible(false);
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
  }, [result]);

  if (!result) return null;

  const config = STATUS_CONFIG[result.status] || STATUS_CONFIG.ERROR;

  return (
    <div className={`${styles.wrapper} ${visible ? styles.visible : ''}`}>
      {/* Status Badge */}
      <div className={`${styles.statusSection} ${styles[config.color]}`}
        style={{ '--glow': config.glow }}>
        <div className={styles.statusIcon}>{config.icon}</div>
        <div>
          <div className={styles.statusLabel}>{config.label}</div>
          <div className={styles.statusMsg}>{result.message || config.message}</div>
        </div>
      </div>

      {/* Checks Grid */}
      <div className={styles.checksGrid}>
        <CheckItem passed={result.issuerTrusted} label="Trusted Issuer" />
        <CheckItem passed={result.sigValid} label="Valid Signature" />
        <CheckItem
          passed={result.status !== 'EXPIRED' ? true : false}
          label="Within Validity Period"
        />
        <CheckItem
          passed={result.hash ? true : undefined}
          label="Integrity Hash Computed"
        />
      </div>

      {/* Details */}
      <div className={styles.details}>
        <DetailRow icon="🏛" label="Issuing Authority" value={result.issuer} />
        <DetailRow icon="👤" label="Issued To"         value={result.issuedTo} />
        <DetailRow icon="📅" label="Issue Date"        value={result.issuedDate} />
        <DetailRow icon="⏳" label="Expiry Date"       value={result.expiryDate} />
        <DetailRow icon="🔑" label="SHA-256 Hash"      value={result.hash} mono />
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className="btn btn-ghost" onClick={onReset}>
          ↑ Verify Another
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            const text = JSON.stringify(result, null, 2);
            const blob = new Blob([text], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `govcert_${result.status.toLowerCase()}_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          ↓ Download Report
        </button>
      </div>
    </div>
  );
}
