import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import './AadhaarCard.css';

/* ---------- SVG sub-components ---------- */

/** Ashoka Emblem (simplified SVG recreation) */
function AshokaEmblem({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Base circle */}
      <circle cx="50" cy="42" r="30" fill="none" stroke="#1a1a6e" strokeWidth="2.5" />
      {/* Wheel spokes (Ashoka Chakra style) */}
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i * 360) / 24;
        const rad = (angle * Math.PI) / 180;
        const x1 = 50 + 10 * Math.sin(rad);
        const y1 = 42 - 10 * Math.cos(rad);
        const x2 = 50 + 27 * Math.sin(rad);
        const y2 = 42 - 27 * Math.cos(rad);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1a1a6e" strokeWidth="1.2" />;
      })}
      <circle cx="50" cy="42" r="10" fill="none" stroke="#1a1a6e" strokeWidth="1.8" />
      <circle cx="50" cy="42" r="3.5" fill="#1a1a6e" />
      {/* Lions (very simplified abstraction) */}
      <ellipse cx="35" cy="72" rx="6" ry="4" fill="#8B6914" />
      <ellipse cx="50" cy="70" rx="7" ry="5" fill="#8B6914" />
      <ellipse cx="65" cy="72" rx="6" ry="4" fill="#8B6914" />
      {/* Base slab */}
      <rect x="28" y="76" width="44" height="5" rx="1" fill="#8B6914" />
      {/* Text below */}
      <text x="50" y="90" textAnchor="middle" fontSize="6.5" fontFamily="serif" fill="#1a1a6e" fontWeight="bold">
        सत्यमेव जयते
      </text>
    </svg>
  );
}

/** Aadhaar logo (concentric arcs + text) */
function AadhaarLogo({ size = 72 }) {
  const cx = size / 2;
  const cy = size / 2;
  const arcs = [
    { r: size * 0.44, sw: size * 0.055, color: '#8B0000' },
    { r: size * 0.33, sw: size * 0.055, color: '#8B0000' },
    { r: size * 0.22, sw: size * 0.055, color: '#8B0000' },
  ];
  const makeArc = (cx, cy, r, startDeg, endDeg) => {
    const toRad = d => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Sun-burst background */}
      {Array.from({ length: 16 }, (_, i) => {
        const angle = (i * 360) / 16;
        const rad = (angle * Math.PI) / 180;
        const x1 = cx + (size * 0.14) * Math.cos(rad);
        const y1 = cy + (size * 0.14) * Math.sin(rad);
        const x2 = cx + (size * 0.49) * Math.cos(rad);
        const y2 = cy + (size * 0.49) * Math.sin(rad);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFB800" strokeWidth={size * 0.035} opacity="0.85" />;
      })}
      {/* Concentric arc bands */}
      {arcs.map((a, i) => (
        <path key={i}
          d={makeArc(cx, cy - size * 0.04, a.r, 210, 330)}
          stroke={a.color}
          strokeWidth={a.sw}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      {/* Center dot */}
      <circle cx={cx} cy={cy - size * 0.04} r={size * 0.06} fill="#8B0000" />
      {/* AADHAAR text */}
      <text x={cx} y={size * 0.88} textAnchor="middle"
        fontSize={size * 0.155} fontFamily="Arial, sans-serif"
        fontWeight="900" fill="#8B0000" letterSpacing="1">
        AADHAAR
      </text>
    </svg>
  );
}

/** Indian flag color stripes */
function FlagStripes() {
  return (
    <svg width="120" height="28" viewBox="0 0 120 28">
      <rect x="0" y="0" width="120" height="9.3" rx="2" fill="url(#saffron-grad)" />
      <rect x="0" y="9.3" width="120" height="9.4" fill="url(#white-grad)" />
      <rect x="0" y="18.7" width="120" height="9.3" rx="2" fill="url(#green-grad)" />
      <defs>
        <linearGradient id="saffron-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF9933" />
          <stop offset="100%" stopColor="#FF7722" />
        </linearGradient>
        <linearGradient id="white-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e8e8e8" />
          <stop offset="100%" stopColor="#f5f5f5" />
        </linearGradient>
        <linearGradient id="green-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#138808" />
          <stop offset="100%" stopColor="#0d6b06" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Generate a fake Aadhaar number */
function generateAadhaarNo() {
  const groups = [];
  for (let i = 0; i < 3; i++) {
    groups.push(String(Math.floor(1000 + Math.random() * 9000)));
  }
  return groups.join(' ');
}

/** Format DOB from YYYY-MM-DD to DD-MM-YYYY */
function formatDOB(dob) {
  if (!dob) return '—';
  try {
    const [y, m, d] = dob.split('-');
    return `${d}-${m}-${y}`;
  } catch {
    return dob;
  }
}

/* ===== Main Component ===== */
export default function AadhaarCard({ userData, bioId }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  // Always generate a fallback (hooks must not be conditional)
  const fallbackNo = useRef(generateAadhaarNo()).current;
  // Use the real biometric UID from Windows Hello scan if available
  const aadhaarNo = bioId || fallbackNo;

  const handleDownload = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `aadhaar_${userData.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download error', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="aadhaar-wrapper">
      {/* ---- The card itself (captured by html2canvas) ---- */}
      <div className="aadhaar-card" ref={cardRef} id="aadhaar-card-render">
        {/* Top Header Row */}
        <div className="aadhaar-top-row">
          <div className="aadhaar-stripes-emblem">
            <FlagStripes />
            <AshokaEmblem size={54} />
          </div>
          <div className="aadhaar-logo-wrap">
            <AadhaarLogo size={80} />
          </div>
        </div>

        {/* GOI Title */}
        <div className="aadhaar-govt-title">
          GOVERNMENT OF INDIA
        </div>

        {/* Body Row: Photo + Details */}
        <div className="aadhaar-body-row">
          {/* Photo placeholder or uploaded photo */}
          <div className="aadhaar-photo">
            {userData.photo ? (
              <img src={userData.photo} alt="identity" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg viewBox="0 0 100 110" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="110" fill="#c8d8e8" />
                {/* Head */}
                <circle cx="50" cy="32" r="22" fill="#e8c9a0" />
                {/* Hair */}
                <ellipse cx="50" cy="14" rx="22" ry="12" fill="#2a1a0a" />
                <ellipse cx="28" cy="28" rx="10" ry="14" fill="#2a1a0a" />
                <ellipse cx="72" cy="28" rx="10" ry="14" fill="#2a1a0a" />
                {/* Face features */}
                <ellipse cx="42" cy="33" rx="3" ry="4" fill="#1a0a00" />
                <ellipse cx="58" cy="33" rx="3" ry="4" fill="#1a0a00" />
                <path d="M 42 44 Q 50 50 58 44" stroke="#c08060" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <ellipse cx="50" cy="40" rx="3" ry="2" fill="#c8a090" />
                {/* Neck */}
                <rect x="44" y="52" width="12" height="12" rx="2" fill="#e8c9a0" />
                {/* Shirt (blue like in real card) */}
                <path d="M 18 110 Q 20 68 44 64 L 56 64 Q 80 68 82 110 Z" fill="#3a78b0" />
                <path d="M 44 64 L 44 78 L 50 84 L 56 78 L 56 64" fill="#2a5890" />
                {/* Collar */}
                <path d="M 40 64 L 44 64 L 50 74 L 56 64 L 60 64 Q 52 80 50 84 Q 48 80 40 64Z" fill="#e8e8e8" opacity="0.7" />
              </svg>
            )}
          </div>

          {/* Details */}
          <div className="aadhaar-details">
            <div className="aadhaar-name">{userData.name?.toUpperCase() || 'FULL NAME'}</div>
            <div className="aadhaar-field-row">
              <span className="aadhaar-field-label">{userData.gender_prefix || 'S/O'}:</span>
              <span className="aadhaar-field-val">{userData.fathers_name || '—'}</span>
            </div>
            <div className="aadhaar-field-row">
              <span className="aadhaar-field-label">DOB:</span>
              <span className="aadhaar-field-val">{formatDOB(userData.dob)}</span>
            </div>
            <div className="aadhaar-field-row">
              <span className="aadhaar-field-label">Mobile:</span>
              <span className="aadhaar-field-val">{userData.phone || 'XXXXXXXX'}</span>
            </div>
            <div className="aadhaar-address-row" style={{ marginTop: 2, display: 'flex', gap: 4 }}>
              <span className="aadhaar-field-label">Address:</span>
              <span className="aadhaar-field-val aadhaar-address-text">
                {userData.address ? userData.address.substring(0, 55) + (userData.address.length > 55 ? '...' : '') : '—'}
              </span>
            </div>
            <div className="aadhaar-uid" style={{ marginTop: 'auto', paddingTop: 2 }}>{aadhaarNo}</div>
          </div>
        </div>

        {/* Separator */}
        <div className="aadhaar-separator" />

        {/* Footer */}
        <div className="aadhaar-footer">
          <div className="aadhaar-footer-left">
            {/* QR placeholder */}
            <div className="aadhaar-qr">
              <svg viewBox="0 0 60 60" width="60" height="60" xmlns="http://www.w3.org/2000/svg">
                {/* Simplified QR visual */}
                <rect width="60" height="60" fill="white" />
                {/* Top-left finder */}
                <rect x="4" y="4" width="18" height="18" rx="2" fill="none" stroke="#000" strokeWidth="2.5" />
                <rect x="8" y="8" width="10" height="10" rx="1" fill="#000" />
                {/* Top-right finder */}
                <rect x="38" y="4" width="18" height="18" rx="2" fill="none" stroke="#000" strokeWidth="2.5" />
                <rect x="42" y="8" width="10" height="10" rx="1" fill="#000" />
                {/* Bottom-left finder */}
                <rect x="4" y="38" width="18" height="18" rx="2" fill="none" stroke="#000" strokeWidth="2.5" />
                <rect x="8" y="42" width="10" height="10" rx="1" fill="#000" />
                {/* Random data modules */}
                {[
                  [28, 4], [30, 4], [32, 4], [28, 8], [32, 8], [28, 12], [30, 12],
                  [4, 28], [8, 28], [12, 28], [4, 30], [8, 30], [4, 32],
                  [28, 28], [32, 28], [30, 30], [28, 32], [32, 32],
                  [36, 28], [40, 28], [44, 28], [36, 32], [40, 32],
                  [28, 36], [30, 36], [28, 40], [32, 40], [28, 44], [32, 44],
                ].map(([x, y], i) => <rect key={i} x={x} y={y} width="3" height="3" fill="#000" />)}
              </svg>
            </div>
          </div>
          <div className="aadhaar-footer-right">
            <div className="aadhaar-my-aadhaar" style={{ fontSize: '13px' }}>MERA AADHAAR MERI PAHACHAN</div>
            <div className="aadhaar-website">www.uidai.gov.in</div>
          </div>
        </div>
      </div>

      {/* Download button below the card */}
      <button
        className="btn btn-cyan aadhaar-download-btn"
        onClick={handleDownload}
        disabled={downloading}
        id="btn-download-aadhaar"
      >
        {downloading ? (
          <>
            <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            Generating...
          </>
        ) : (
          <>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Aadhaar Card
          </>
        )}
      </button>
    </div>
  );
}
