import { useState, useEffect } from 'react';
import './Navbar.css';

const NavIcon = ({ view }) => {
  if (view === 'dashboard') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
  if (view === 'analytics') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
};

export default function Navbar({ activeView, setActiveView }) {
  const [scrolled, setScrolled] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d) =>
    d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatDate = (d) =>
    d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).toUpperCase();

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} role="navigation" aria-label="Main navigation">
      <div className="navbar__inner">
        {/* Logo */}
        <div className="navbar__brand">
          <div className="brand-icon" aria-hidden="true">
            <div className="brand-icon__ring" />
            <div className="brand-icon__ring brand-icon__ring--2" />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2a10 10 0 0 0-7.07 2.93" />
              <path d="M2.93 7.07A10 10 0 0 0 2 12" />
              <path d="M2 12a10 10 0 0 0 2.93 7.07" />
              <path d="M7.07 21.07A10 10 0 0 0 12 22a10 10 0 0 0 7.07-2.93" />
              <path d="M21.07 16.93A10 10 0 0 0 22 12" />
              <path d="M22 12a10 10 0 0 0-2.93-7.07" />
              <path d="M16.93 2.93A10 10 0 0 0 12 2" />
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="2" fill="var(--cyan)" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">BioLink</span>
            <span className="brand-sub">Biometric ID System v2.4</span>
          </div>
        </div>

        {/* Nav links */}
        <div className="navbar__links" role="tablist">
          {['dashboard', 'register'].map((view) => (
            <button
              key={view}
              className={`nav-btn ${activeView === view ? 'nav-btn--active' : ''}`}
              onClick={() => setActiveView(view)}
              role="tab"
              aria-selected={activeView === view}
              id={`nav-${view}`}
            >
              <NavIcon view={view} />
              <span>{view === 'dashboard' ? 'Dashboard' : view === 'analytics' ? 'Analytics' : 'Register'}</span>
              {activeView === view && <div className="nav-btn__indicator" />}
            </button>
          ))}
        </div>

        {/* Status panel */}
        <div className="navbar__status">
          <div className="status-clock">
            <div className="status-clock__time font-mono">{formatTime(time)}</div>
            <div className="status-clock__date font-mono">{formatDate(time)}</div>
          </div>
          <div className="status-dot-group">
            <div className="status-item">
              <span className="badge badge-green"><span className="badge-dot" />ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom glow bar */}
      <div className="navbar__glow-bar" />
    </nav>
  );
}
