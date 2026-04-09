import { useState, useEffect, useCallback } from 'react';
import './index.css';
import styles from './App.module.css';
import UploadZone from './components/UploadZone';
import ResultCard from './components/ResultCard';
import LogTable from './components/LogTable';
import CACard from './components/CACard';

// ── API helpers ───────────────────────────────────────────────────────────────
async function apiVerify(file) {
  const form = new FormData();
  form.append('certificate', file);
  const res = await fetch('/api/verify', { method: 'POST', body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Verification failed');
  return json.result;
}

async function apiFetchLogs() {
  const res = await fetch('/api/logs?limit=20');
  const json = await res.json();
  return json.logs || [];
}

async function apiFetchAuthorities() {
  const res = await fetch('/api/authorities');
  const json = await res.json();
  return json.data || [];
}

// ── Logo SVG ──────────────────────────────────────────────────────────────────
function GovCertLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect width="36" height="36" rx="10" fill="url(#logoGrad)"/>
      <path d="M18 8C13 8 9 12 9 17v2c0 .6.4 1 1 1h2v3c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-3h4v3c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-3h2c.6 0 1-.4 1-1v-2c0-5-4-9-9-9z" fill="white" opacity="0.9"/>
      <path d="M15 17l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36">
          <stop offset="0%" stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#1d4ed8"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ value, label, color }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statValue} style={{ color }}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [file, setFile]         = useState(null);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [logs, setLogs]         = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [cas, setCas]           = useState([]);
  const [activeTab, setActiveTab] = useState('verify');   // verify | history | authorities
  const [stats, setStats]       = useState({ total: 0, valid: 0, invalid: 0, expired: 0 });

  const refreshLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await apiFetchLogs();
      setLogs(data);
      setStats({
        total:   data.length,
        valid:   data.filter(l => l.status === 'VALID').length,
        invalid: data.filter(l => l.status === 'INVALID').length,
        expired: data.filter(l => l.status === 'EXPIRED').length,
      });
    } catch { /* silently ignore if backend offline */ }
    finally { setLogsLoading(false); }
  }, []);

  useEffect(() => {
    refreshLogs();
    apiFetchAuthorities().then(setCas).catch(() => {});
  }, [refreshLogs]);

  const handleVerify = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await apiVerify(file);
      setResult(res);
      refreshLogs();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError('');
  };

  return (
    <div className={styles.app} id="app">
      {/* ── Background blobs ── */}
      <div className={styles.blob1} aria-hidden="true"/>
      <div className={styles.blob2} aria-hidden="true"/>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <GovCertLogo />
            <div>
              <span className={styles.logoName}>GovCert</span>
              <span className={styles.logoSub}>Validator</span>
            </div>
          </div>
          <nav className={styles.nav}>
            <button
              className={`${styles.navBtn} ${activeTab === 'verify' ? styles.navActive : ''}`}
              onClick={() => setActiveTab('verify')}>
              🔍 Verify
            </button>
            <button
              className={`${styles.navBtn} ${activeTab === 'history' ? styles.navActive : ''}`}
              onClick={() => setActiveTab('history')}>
              📋 History
            </button>
            <button
              className={`${styles.navBtn} ${activeTab === 'authorities' ? styles.navActive : ''}`}
              onClick={() => setActiveTab('authorities')}>
              🏛 Trusted CAs
            </button>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        {/* ── Hero ── */}
        <section className={styles.hero} id="hero">
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot}/>
              Cryptographic Certificate Verification
            </div>
            <h1 className={styles.heroTitle}>
              Verify Digital Certificates<br/>
              <span className="gradient-text">Instantly & Securely</span>
            </h1>
            <p className={styles.heroDesc}>
              Upload any government or academic certificate. Our engine verifies
              the digital signature, checks issuer authenticity, and confirms validity —
              all in seconds.
            </p>
          </div>

          {/* Stats row */}
          <div className={styles.statsRow}>
            <StatCard value={stats.total}   label="Total Verified"     color="var(--color-primary)" />
            <StatCard value={stats.valid}   label="Valid"              color="var(--color-valid)" />
            <StatCard value={stats.invalid} label="Invalid / Tampered" color="var(--color-invalid)" />
            <StatCard value={stats.expired} label="Expired"            color="var(--color-expired)" />
          </div>
        </section>

        {/* ── Tab content ── */}
        {activeTab === 'verify' && (
          <section className={styles.section} id="verify-section">
            <div className={styles.verifyGrid}>
              {/* Left — upload + verify */}
              <div className={styles.uploadPanel}>
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>Upload Certificate</h2>
                  <p className={styles.panelDesc}>PDF or XML format · Max 10 MB</p>
                </div>

                {!result ? (
                  <>
                    <UploadZone onFile={setFile} disabled={loading} />

                    {error && (
                      <div className={styles.errorBanner}>
                        <span>⚠</span>
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      id="verify-btn"
                      className={`btn btn-primary ${styles.verifyBtn}`}
                      onClick={handleVerify}
                      disabled={!file || loading}>
                      {loading ? (
                        <><div className="spinner" /> Verifying…</>
                      ) : (
                        <>🔐 Verify Certificate</>
                      )}
                    </button>

                    {/* Pipeline steps */}
                    <div className={styles.pipeline}>
                      {[
                        { step: '01', label: 'Upload',     icon: '📁', desc: 'PDF or XML certificate' },
                        { step: '02', label: 'Hash',        icon: '🔢', desc: 'SHA-256 integrity check' },
                        { step: '03', label: 'Signature',   icon: '✍', desc: 'RSA signature verification' },
                        { step: '04', label: 'Issuer',      icon: '🏛', desc: 'Trusted CA lookup' },
                        { step: '05', label: 'Expiry',      icon: '📅', desc: 'Validity period check' },
                        { step: '06', label: 'Result',      icon: '✅', desc: 'VALID / INVALID / EXPIRED' },
                      ].map(s => (
                        <div key={s.step} className={styles.pipeStep}>
                          <div className={styles.pipeIcon}>{s.icon}</div>
                          <div className={styles.pipeLabel}>{s.label}</div>
                          <div className={styles.pipeDesc}>{s.desc}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <ResultCard result={result} onReset={handleReset} />
                )}
              </div>

              {/* Right — info panel */}
              <div className={styles.infoPanel}>
                <div className={styles.card}>
                  <h3 className={styles.infoTitle}>How It Works</h3>
                  <div className={styles.infoSteps}>
                    {[
                      { icon: '🔒', title: 'Integrity', desc: 'SHA-256 hash detects any modification to the certificate file.' },
                      { icon: '🔑', title: 'Authenticity', desc: 'RSA signature verified against the issuer\'s stored public key.' },
                      { icon: '⏱', title: 'Validity', desc: 'Expiry date checked against current date and time.' },
                      { icon: '🏛', title: 'Trust Chain', desc: 'Issuer verified against our trusted CA database.' },
                    ].map(s => (
                      <div key={s.title} className={styles.infoStep}>
                        <span className={styles.infoIcon}>{s.icon}</span>
                        <div>
                          <p className={styles.infoStepTitle}>{s.title}</p>
                          <p className={styles.infoStepDesc}>{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.card}>
                  <h3 className={styles.infoTitle}>Supported Formats</h3>
                  <div className={styles.formatList}>
                    <div className={styles.formatItem}>
                      <span className={styles.formatBadge} style={{color:'#ef4444',background:'rgba(239,68,68,0.1)'}}>PDF</span>
                      <span className={styles.formatDesc}>Government & Academic Certificates</span>
                    </div>
                    <div className={styles.formatItem}>
                      <span className={styles.formatBadge} style={{color:'#06b6d4',background:'rgba(6,182,212,0.1)'}}>XML</span>
                      <span className={styles.formatDesc}>Digital Signed XML Documents</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'history' && (
          <section className={styles.section} id="history-section">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Verification History</h2>
              <button className="btn btn-ghost" onClick={refreshLogs}>↻ Refresh</button>
            </div>
            <div className={styles.card}>
              <LogTable logs={logs} loading={logsLoading} />
            </div>
          </section>
        )}

        {activeTab === 'authorities' && (
          <section className={styles.section} id="authorities-section">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Trusted Certificate Authorities</h2>
              <span className={styles.sectionBadge}>{cas.length} registered</span>
            </div>
            {cas.length === 0 ? (
              <div className={`${styles.card} ${styles.emptyPanel}`}>
                <p>No certificate authorities found.</p>
                <p className={styles.emptyHint}>Run <code>node database/seed.js</code> to populate the database.</p>
              </div>
            ) : (
              <div className={styles.caGrid}>
                {cas.map(ca => <CACard key={ca._id} ca={ca} />)}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <p>GovCert Validator · Secure cryptographic certificate verification</p>
        <p>Node.js + Python + MongoDB · RSA-SHA256 signatures</p>
      </footer>
    </div>
  );
}
