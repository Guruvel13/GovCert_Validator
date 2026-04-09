import { useCallback, useState } from 'react';
import styles from './UploadZone.module.css';

const ALLOWED_EXTS = ['.pdf', '.xml'];
const ALLOWED_MIME = ['application/pdf', 'text/xml', 'application/xml'];

function FileIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="4" width="24" height="32" rx="3" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5"/>
      <path d="M32 4L40 12H32V4Z" fill="rgba(59,130,246,0.3)" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5" strokeLinejoin="round"/>
      <line x1="14" y1="20" x2="30" y2="20" stroke="rgba(59,130,246,0.5)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="14" y1="26" x2="26" y2="26" stroke="rgba(59,130,246,0.5)" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="36" cy="36" r="10" fill="#3b82f6"/>
      <path d="M36 31v10M31 36l5-5 5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SelectedFileIcon({ type }) {
  const isPDF = type === 'application/pdf';
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="8" fill={isPDF ? 'rgba(239,68,68,0.15)' : 'rgba(6,182,212,0.15)'}/>
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle"
        fontSize="11" fontWeight="700" fill={isPDF ? '#ef4444' : '#06b6d4'} fontFamily="Inter,sans-serif">
        {isPDF ? 'PDF' : 'XML'}
      </text>
    </svg>
  );
}

export default function UploadZone({ onFile, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setError('Only PDF or XML certificate files are accepted.');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10 MB.');
      return false;
    }
    return true;
  };

  const handleFile = useCallback((file) => {
    setError('');
    if (!validateFile(file)) return;
    setSelectedFile(file);
    onFile(file);
  }, [onFile]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver  = (e) => { e.preventDefault(); setIsDragging(true);  };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };

  const onInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError('');
    onFile(null);
  };

  return (
    <div className={`${styles.zone} ${isDragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''}`}
      onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}>

      <input
        id="cert-file-input"
        type="file"
        accept=".pdf,.xml"
        className={styles.input}
        onChange={onInputChange}
        disabled={disabled}
      />

      {!selectedFile ? (
        <label htmlFor="cert-file-input" className={styles.label}>
          <div className={styles.iconWrap}>
            <FileIcon />
            <div className={styles.iconRing} />
          </div>
          <p className={styles.primary}>
            {isDragging ? 'Drop your certificate here' : 'Drag & drop your certificate'}
          </p>
          <p className={styles.secondary}>or <span className={styles.browse}>browse files</span></p>
          <p className={styles.hint}>Supports PDF and XML · Max 10 MB</p>
        </label>
      ) : (
        <div className={styles.filePreview}>
          <SelectedFileIcon type={selectedFile.type} />
          <div className={styles.fileInfo}>
            <p className={styles.fileName}>{selectedFile.name}</p>
            <p className={styles.fileSize}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
          </div>
          <button className={styles.clearBtn} onClick={clearFile} title="Remove file">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 011.414 0L8 6.586l2.293-2.293a1 1 0 111.414 1.414L9.414 8l2.293 2.293a1 1 0 01-1.414 1.414L8 9.414l-2.293 2.293a1 1 0 01-1.414-1.414L6.586 8 4.293 5.707a1 1 0 010-1.414z"/>
            </svg>
          </button>
        </div>
      )}

      {error && <p className={styles.error}>⚠ {error}</p>}
    </div>
  );
}
