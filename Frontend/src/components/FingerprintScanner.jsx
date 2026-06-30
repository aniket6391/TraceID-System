import { useState, useEffect, useRef } from 'react';
import './FingerprintScanner.css';

/** Derive a deterministic BIO-XXX-XXXX style UID from WebAuthn rawId bytes */
function deriveBioUID(rawId) {
  const bytes = new Uint8Array(rawId);
  // Use first 6 bytes to build three 3-digit groups
  const g1 = ((bytes[0] << 4) | (bytes[1] >> 4)) % 900 + 100;
  const g2 = ((bytes[2] << 4) | (bytes[3] >> 4)) % 900 + 100;
  const g3 = ((bytes[4] << 4) | (bytes[5] >> 4)) % 9000 + 1000;
  return `BIO-${g1}-${g2}-${g3}`;
}

export default function FingerprintScanner({ onCapture, mode = 'register', compact = false, autoStart = false, useWebAuthn = false }) {
  const [state, setState] = useState('idle'); // idle | scanning | captured | error
  const [progress, setProgress] = useState(0);
  const [template, setTemplate] = useState('');
  const [bioId, setBioId] = useState('');
  const intervalRef = useRef(null);
  const rafRef = useRef(null);

  const generateTemplate = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let raw = '';
    for (let i = 0; i < 48; i++) raw += chars[Math.floor(Math.random() * chars.length)];
    return `BIO:AES256:new_${Date.now()}:${btoa(raw).substring(0, 44)}`;
  };

  const startScan = async () => {
    if (state === 'scanning') return;
    setState('scanning');
    setProgress(0);
    setTemplate('');

    if (useWebAuthn && window.PublicKeyCredential) {
       // Animate progress bar while waiting for the hardware prompt
       let rawProgress = 0;
       const tick = () => {
          rawProgress += 1.2;
          if (rawProgress > 95) rawProgress = 15; // bounce loop
          setProgress(rawProgress);
          rafRef.current = requestAnimationFrame(tick);
       };
       rafRef.current = requestAnimationFrame(tick);

       try {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          const userId = new Uint8Array(16);
          window.crypto.getRandomValues(userId);

          const credential = await navigator.credentials.create({
             publicKey: {
                challenge,
                rp: { name: "BioLink Aadhaar System" },
                user: { id: userId, name: "biolink_user", displayName: "BioLink User" },
                pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
                authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
                timeout: 60000
             }
          });

          cancelAnimationFrame(rafRef.current);
          if (credential) {
             setProgress(100);
             const t = generateTemplate();
             // Derive a unique UID from the credential's rawId bytes
             const bioUID = deriveBioUID(credential.rawId);
             setBioId(bioUID);
             setTemplate(t);
             setState('captured');
             // Pass both template string and bioUID to parent
             if (onCapture) onCapture(t, bioUID);
          }
       } catch (err) {
          cancelAnimationFrame(rafRef.current);
          setState('idle');
          setProgress(0);
          console.warn("WebAuthn Error:", err);
       }
    } else {
       // Original fake animation fallback for browsers/modes without WebAuthn
       const startTime = Date.now();
       const duration = 3200;

       const tick = () => {
         const elapsed = Date.now() - startTime;
         const pct = Math.min((elapsed / duration) * 100, 100);
         setProgress(pct);
         if (pct < 100) {
           rafRef.current = requestAnimationFrame(tick);
         } else {
           const t = generateTemplate();
           setTemplate(t);
           setState('captured');
           if (onCapture) onCapture(t);
         }
       };
       rafRef.current = requestAnimationFrame(tick);
    }
  };

  const reset = () => {
    setBioId('');
    cancelAnimationFrame(rafRef.current);
    setState('idle');
    setProgress(0);
    setTemplate('');
    if (onCapture) onCapture('');
  };

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); }, []);

  // Auto-start when in identify mode
  useEffect(() => {
    if (autoStart && state === 'idle') {
      const t = setTimeout(startScan, 600);
      return () => clearTimeout(t);
    }
  }, [autoStart]);

  return (
    <div className={`fp-scanner ${compact ? 'fp-scanner--compact' : ''} fp-scanner--${state}`}>
      {/* Header label */}
      <div className="fp-scanner__label">
        <span className="fp-scanner__label-text font-mono">
          {mode === 'register' ? '// BIOMETRIC CAPTURE MODULE' : '// SCAN TO IDENTIFY'}
        </span>
        <span className={`badge badge-${state === 'captured' ? 'green' : state === 'scanning' ? 'cyan' : 'warning'}`}>
          <span className="badge-dot" />
          {state === 'idle' ? 'STANDBY' : state === 'scanning' ? 'SCANNING' : state === 'captured' ? 'CAPTURED' : 'ERROR'}
        </span>
      </div>

      {/* Sensor pad */}
      <div className="fp-pad-wrapper">
        <div className="fp-pad" id="fingerprint-sensor" onClick={state === 'idle' ? startScan : undefined}>
          {/* Corner brackets */}
          <div className="fp-corner fp-corner--tl" />
          <div className="fp-corner fp-corner--tr" />
          <div className="fp-corner fp-corner--bl" />
          <div className="fp-corner fp-corner--br" />

          {/* Fingerprint SVG */}
          <svg className="fp-svg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer rings */}
            <ellipse cx="100" cy="110" rx="72" ry="78" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 3" />
            <ellipse cx="100" cy="108" rx="58" ry="63" stroke="currentColor" strokeWidth="1.2" />
            <ellipse cx="100" cy="106" rx="44" ry="48" stroke="currentColor" strokeWidth="1.2" strokeDasharray="6 2" />
            <ellipse cx="100" cy="104" rx="30" ry="33" stroke="currentColor" strokeWidth="1.2" />
            <ellipse cx="100" cy="102" rx="17" ry="19" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />
            {/* Ridge lines */}
            <path d="M 100 50 Q 120 60 128 80 Q 135 100 125 120 Q 112 140 100 148" stroke="currentColor" strokeWidth="1" strokeDasharray="5 3" />
            <path d="M 100 50 Q 80 60 72 80 Q 65 100 75 120 Q 88 140 100 148" stroke="currentColor" strokeWidth="1" strokeDasharray="5 3" />
            {/* Center whorl */}
            <circle cx="100" cy="100" r="7" fill="currentColor" opacity="0.6" />
            <circle cx="100" cy="100" r="12" stroke="currentColor" strokeWidth="1.5" />
          </svg>

          {/* Laser scan line */}
          {state === 'scanning' && (
            <div className="fp-laser-wrap">
              <div className="fp-laser" />
              <div className="fp-laser-glow" />
            </div>
          )}

          {/* Captured overlay */}
          {state === 'captured' && (
            <div className="fp-captured-overlay">
              <div className="fp-captured-ring" />
              <div className="fp-captured-ring fp-captured-ring--2" />
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--neon-green)" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}

          {/* Idle prompt */}
          {state === 'idle' && (
            <div className="fp-idle-prompt">
              <span>{mode === 'register' ? 'TOUCH TO REGISTER' : 'TOUCH TO SCAN'}</span>
            </div>
          )}
        </div>

        {/* Expansion rings */}
        {state === 'scanning' && (
          <>
            <div className="fp-ring fp-ring--1" />
            <div className="fp-ring fp-ring--2" />
            <div className="fp-ring fp-ring--3" />
          </>
        )}
      </div>

      {/* Progress bar */}
      <div className="fp-progress-track">
        <div className="fp-progress-bar" style={{ width: `${progress}%` }} />
        <div className="fp-progress-glow" style={{ left: `${progress}%` }} />
      </div>

      {/* Stats row */}
      <div className="fp-stats">
        <div className="fp-stat">
          <span className="fp-stat__label font-mono">PROGRESS</span>
          <span className="fp-stat__val font-mono">{Math.round(progress)}%</span>
        </div>
        <div className="fp-stat">
          <span className="fp-stat__label font-mono">ALGORITHM</span>
          <span className="fp-stat__val font-mono">AES-256</span>
        </div>
        <div className="fp-stat">
          <span className="fp-stat__label font-mono">QUALITY</span>
          <span className="fp-stat__val font-mono">{state === 'captured' ? '98.4%' : '---'}</span>
        </div>
      </div>

      {/* BioID / Template output */}
      {state === 'captured' && mode === 'register' && bioId && (
        <div className="fp-template animate-fade-in-up" style={{ textAlign: 'center' }}>
          <span className="fp-template__label font-mono">BIOMETRIC UID ASSIGNED:</span>
          <code className="fp-template__code font-mono" style={{ fontSize: '1rem', color: 'var(--neon-green)', letterSpacing: '0.1em', fontWeight: 'bold' }}>{bioId}</code>
        </div>
      )}
      {state === 'captured' && mode !== 'register' && template && (
        <div className="fp-template animate-fade-in-up">
          <span className="fp-template__label font-mono">SCAN VERIFIED:</span>
          <code className="fp-template__code font-mono">{bioId || template.substring(0, 40) + '...'}</code>
        </div>
      )}

      {/* Actions */}
      <div className="fp-actions">
        {state === 'idle' && (
          <button className="btn btn-cyan btn-lg" onClick={startScan} id="btn-start-scan">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Initialize Scan
          </button>
        )}
        {state === 'scanning' && (
          <button className="btn btn-ghost" onClick={reset} id="btn-cancel-scan">Abort</button>
        )}
        {state === 'captured' && (
          <button className="btn btn-ghost btn-sm" onClick={reset} id="btn-rescan">Re-scan</button>
        )}
      </div>
    </div>
  );
}
