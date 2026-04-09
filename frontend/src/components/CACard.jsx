import styles from './CACard.module.css';

const ICONS = {
  anna_university: '🎓',
  iit_madras:      '🔬',
  cbse:            '📚',
  nic:             '💻',
  ugc:             '🏛',
};

export default function CACard({ ca }) {
  const icon = ICONS[ca.shortCode] || '🔐';
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon}>{icon}</span>
        <div>
          <h4 className={styles.name}>{ca.name}</h4>
          <span className={styles.code}>{ca.shortCode}</span>
        </div>
        <span className={`${styles.badge} ${ca.isActive ? styles.active : styles.inactive}`}>
          {ca.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      {ca.description && (
        <p className={styles.desc}>{ca.description}</p>
      )}
      <div className={styles.meta}>
        {ca.validFrom && <span>From: {ca.validFrom}</span>}
        {ca.validUntil && <span>Until: {ca.validUntil}</span>}
        {ca.country && <span>🌏 {ca.country}</span>}
      </div>
    </div>
  );
}
