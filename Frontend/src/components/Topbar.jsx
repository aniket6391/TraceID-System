import React, { useState, useEffect } from 'react';
import './Topbar.css';

export default function Topbar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d) =>
    d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatDate = (d) =>
    d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="topbar-btn topbar-btn--active">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
          DASHBOARD
        </button>
        <button className="topbar-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
          REPORTS
        </button>

        <div className="topbar-filter ml-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff4560" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <select className="topbar-select">
            <option>All States</option>
            <option>Maharashtra</option>
            <option>Delhi</option>
            <option>Karnataka</option>
          </select>
        </div>
      </div>

      <div className="topbar__right">
        <div className="topbar-clock">
          <div className="topbar-clock__time font-mono">{formatTime(time)}</div>
          <div className="topbar-clock__date font-mono text-muted">{formatDate(time)}</div>
        </div>
        
        <div className="topbar-status badge badge-green">
          <span className="badge-dot" /> ONLINE
        </div>

        <div className="topbar-profile">
          <img src="https://api.dicebear.com/7.x/initials/svg?seed=Admin" alt="Admin" className="profile-img" />
          <div className="profile-info">
            <span className="profile-name">Admin ▾</span>
            <span className="profile-role">Root</span>
          </div>
        </div>
      </div>
    </header>
  );
}
