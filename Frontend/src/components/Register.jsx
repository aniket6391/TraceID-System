import { useState, useRef, useEffect } from 'react';
import FingerprintScanner from './FingerprintScanner';
import AadhaarCard from './AadhaarCard';
import { USERS } from '../data/users';
import './Register.css';

const INITIAL = {
  name: '',
  fathers_name: '',
  gender_prefix: 'S/O',
  dob: '',
  phone: '',
  address: '',
  photo: '',
};

export default function Register({ showToast, onFindClick }) {
  const [form, setForm] = useState(INITIAL);
  const [template, setTemplate] = useState('');
  const [bioId, setBioId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCamera, setShowCamera] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play(); // ensure video plays
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      showToast("Could not access camera", "error");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      // the video is flipped via CSS so we flip it in canvas too for a non-mirrored image? actually we can just draw it as is
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setForm(prev => ({ ...prev, photo: dataUrl }));
      setErrors(prev => ({ ...prev, photo: undefined }));
      stopCamera();
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.fathers_name.trim()) e.fathers_name = "Father's name is required";
    if (!form.dob) e.dob = 'Date of birth is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.photo) e.photo = 'Identity photo is required';
    if (!template) e.template = 'Biometric capture is required';
    return e;
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, photo: reader.result }));
        setErrors(prev => ({ ...prev, photo: undefined }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showToast('Please resolve validation errors before submitting.', 'error');
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1800));
    setSubmitting(false);
    setSubmitted(true);
    showToast(`Identity registered: ${form.name}`, 'success');
  };

  const reset = () => {
    setForm(INITIAL);
    setTemplate('');
    setBioId('');
    setErrors({});
    setSubmitted(false);
  };

  const age = form.dob
    ? Math.floor((Date.now() - new Date(form.dob)) / (365.25 * 24 * 3600 * 1000))
    : null;

  /* ============ SUCCESS / POST-REGISTRATION SCREEN ============ */
  if (submitted) {
    return (
      <div className="register-page">
        <div className="register-success-wide animate-fade-in-up">

          {/* Left column: status + find button */}
          <div className="success-left glass-card">
            <div className="success-icon">
              <div className="success-ring" />
              <div className="success-ring success-ring--2" />
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--neon-green)" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2 className="success-title font-display">IDENTITY<br />REGISTERED</h2>
            <p className="success-sub font-mono">
              Biometric profile successfully enrolled into the BioLink database.
            </p>

            <div className="success-details">
              <div className="detail-row">
                <span className="font-mono text-muted">SUBJECT</span>
                <span className="font-mono text-cyan">{form.name.toUpperCase()}</span>
              </div>
              <div className="detail-row">
                <span className="font-mono text-muted">DOB</span>
                <span className="font-mono">{form.dob}</span>
              </div>
              <div className="detail-row">
                <span className="font-mono text-muted">BIOMETRIC UID</span>
                <span className="font-mono" style={{ color: 'var(--neon-green)', fontSize: '0.9rem', letterSpacing: '0.05em', fontWeight: 'bold' }}>
                  {bioId || '—'}
                </span>
              </div>
            </div>

            {/* ---- ACTION BUTTONS ---- */}
            <div className="success-actions">
              {/* FIND button → Dashboard auto-scan */}
              <button
                className="btn btn-cyan btn-lg find-btn"
                onClick={onFindClick}
                id="btn-find-identity"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Find / Identify
              </button>

              <button
                className="btn btn-ghost"
                onClick={reset}
                id="btn-register-new"
              >
                Register Another
              </button>
            </div>

            <p className="find-hint font-mono">
              Clicking <strong>Find</strong> opens the Dashboard and auto-starts the biometric scan.
            </p>
          </div>

          {/* Right column: Aadhaar card */}
          <div className="success-right">
            <div className="aadhaar-section-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <span className="font-mono" style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--cyan)' }}>
                YOUR AADHAAR CARD
              </span>
            </div>
            <AadhaarCard userData={form} bioId={bioId} />
          </div>

        </div>
      </div>
    );
  }

  /* ============ REGISTRATION FORM ============ */
  return (
    <div className="register-page">
      {/* Header */}
      <div className="register-header animate-fade-in-up">
        <div className="register-header__badge">
          <span className="badge badge-cyan"><span className="badge-dot" />ENROLLMENT MODULE</span>
        </div>
        <h1 className="register-title font-display">Identity Registration</h1>
        <p className="register-subtitle">Enroll a new biometric identity into the BioLink database.</p>
      </div>

      <div className="register-grid">
        {/* Left: Form */}
        <form className="register-form glass-card animate-slide-left" onSubmit={handleSubmit} id="registration-form" noValidate>
          <div className="form-section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <span className="font-mono" style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--cyan)' }}>
              IDENTITY FIELDS
            </span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="field-name">Full Name</label>
              <input
                id="field-name"
                type="text"
                className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                placeholder="e.g. Aryan Mehta"
                value={form.name}
                onChange={handleChange('name')}
                autoComplete="name"
              />
              {errors.name && <span className="form-error font-mono">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="field-gender-prefix">Relation Prefix</label>
              <select
                id="field-gender-prefix"
                className="form-input form-select"
                value={form.gender_prefix}
                onChange={handleChange('gender_prefix')}
              >
                <option value="S/O">S/O — Son of</option>
                <option value="D/O">D/O — Daughter of</option>
                <option value="W/O">W/O — Wife of</option>
                <option value="H/O">H/O — Husband of</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="field-fathers-name">Father's / Guardian's Name</label>
              <input
                id="field-fathers-name"
                type="text"
                className={`form-input ${errors.fathers_name ? 'form-input--error' : ''}`}
                placeholder="e.g. Vikram Mehta"
                value={form.fathers_name}
                onChange={handleChange('fathers_name')}
              />
              {errors.fathers_name && <span className="form-error font-mono">{errors.fathers_name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="field-dob">Date of Birth</label>
              <input
                id="field-dob"
                type="date"
                className={`form-input ${errors.dob ? 'form-input--error' : ''}`}
                value={form.dob}
                onChange={handleChange('dob')}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.dob && <span className="form-error font-mono">{errors.dob}</span>}
              {age !== null && age > 0 && (
                <span className="form-hint font-mono">Computed Age: <span className="text-cyan">{age} years</span></span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="field-phone">Phone Number</label>
            <input
              id="field-phone"
              type="tel"
              className={`form-input ${errors.phone ? 'form-input--error' : ''}`}
              placeholder="+91-XXXXX-XXXXX"
              value={form.phone}
              onChange={handleChange('phone')}
              autoComplete="tel"
            />
            {errors.phone && <span className="form-error font-mono">{errors.phone}</span>}
                  <div className="form-group">
            <label className="form-label" htmlFor="field-address">Address</label>
            <textarea
              id="field-address"
              className={`form-input form-textarea ${errors.address ? 'form-input--error' : ''}`}
              placeholder="Full residential address including city, state, PIN..."
              value={form.address}
              onChange={handleChange('address')}
              rows={3}
              autoComplete="street-address"
            />
            {errors.address && <span className="form-error font-mono">{errors.address}</span>}
          </div>

          {/* Photo Capture Section after Address */}
          <div className="form-group">
            <label className="form-label">Identity Photo</label>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginTop: '4px', flexDirection: showCamera ? 'column' : 'row' }}>
              {showCamera ? (
                <div style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ width: '100%', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--cyan)', background: '#000', aspectRatio: '4/3', position: 'relative' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                    ></video>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="btn btn-cyan" onClick={capturePhoto} style={{ flex: 1, padding: '6px', fontSize: '0.85rem' }}>Capture</button>
                    <button type="button" className="btn btn-ghost" onClick={stopCamera} style={{ flex: 1, padding: '6px', fontSize: '0.85rem' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {form.photo ? (
                    <div style={{ width: '80px', height: '90px', borderRadius: '6px', overflow: 'hidden', border: '2px solid var(--cyan)' }}>
                      <img src={form.photo} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: '80px', height: '90px', borderRadius: '6px', border: '2px dashed var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)' }}>
                      <svg width="24" height="24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" viewBox="0 0 24 24">
                         <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <label className="btn btn-ghost" style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '0.85rem' }}>
                        {form.photo ? 'Change File' : 'Upload File'}
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                      </label>
                      <button type="button" className="btn btn-ghost" onClick={startCamera} style={{ padding: '6px 12px', fontSize: '0.85rem', borderColor: 'var(--cyan)', color: 'var(--cyan)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle', marginTop: '-2px' }}>
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
                        </svg>
                        Live Camera
                      </button>
                    </div>
                    {errors.photo && <span className="form-error font-mono" style={{ marginTop: 0 }}>{errors.photo}</span>}
                  </div>
                </>
              )}
            </div>
          </div>    </div>

          {errors.template && (
            <div className="form-error font-mono" style={{ textAlign: 'center' }}>
              ⚠ {errors.template}
            </div>
          )}

          {/* Preview card */}
          {(form.name || form.dob) && (
            <div className="preview-card glass-card-sm animate-fade-in">
              <span className="font-mono" style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
                PREVIEW — ENROLLMENT RECORD
              </span>
              <div className="preview-row">
                <span className="text-muted font-mono" style={{ fontSize: '0.72rem' }}>NAME</span>
                <span className="text-cyan font-mono" style={{ fontSize: '0.8rem' }}>{form.name || '—'}</span>
              </div>
              <div className="preview-row">
                <span className="text-muted font-mono" style={{ fontSize: '0.72rem' }}>FATHER</span>
                <span className="font-mono" style={{ fontSize: '0.8rem' }}>{form.fathers_name || '—'}</span>
              </div>
              <div className="preview-row">
                <span className="text-muted font-mono" style={{ fontSize: '0.72rem' }}>AGE</span>
                <span className="font-mono" style={{ fontSize: '0.8rem' }}>{age || '—'}</span>
              </div>
              <div className="preview-row">
                <span className="text-muted font-mono" style={{ fontSize: '0.72rem' }}>BIO_READY</span>
                <span className={`font-mono ${template ? 'text-cyan' : ''}`} style={{ fontSize: '0.8rem' }}>
                  {template ? 'TRUE' : 'FALSE'}
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            className={`btn btn-blue btn-lg submit-btn ${submitting ? 'btn-loading' : ''}`}
            id="btn-submit-registration"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="spinner" />
                Enrolling Identity...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Enroll into BioLink
              </>
            )}
          </button>
        </form>

        {/* Right: Biometric Capture */}
        <div className="register-bio animate-slide-right">
          <div className="glass-card bio-card">
            <div className="form-section-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="font-mono" style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--cyan)' }}>
                BIOMETRIC CAPTURE
              </span>
            </div>

            <FingerprintScanner
              onCapture={(tmpl, uid) => {
                setTemplate(tmpl);
                if (uid) setBioId(uid);
                setErrors(prev => ({ ...prev, template: undefined }));
              }}
              mode="register"
              useWebAuthn={true}
            />
          </div>

          {/* Existing records count */}
          <div className="glass-card-sm stat-mini">
            <div className="stat-mini__row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-dim)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
              </svg>
              <span className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>CURRENTLY ENROLLED</span>
              <span className="font-mono text-cyan" style={{ fontSize: '0.88rem', marginLeft: 'auto' }}>
                {USERS.length} identities
              </span>
            </div>
            <div className="stat-mini__row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-dim)" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="2" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" />
              </svg>
              <span className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>ENCRYPTION</span>
              <span className="font-mono" style={{ fontSize: '0.88rem', marginLeft: 'auto', color: 'var(--neon-green)' }}>
                AES-256
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
