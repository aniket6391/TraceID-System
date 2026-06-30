import { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Register from './components/Register';
import ToastManager from './components/ToastManager';
import './App.css';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  // When truthy, Dashboard will auto-start the scan on mount
  const [autoScan, setAutoScan] = useState(false);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  /** Called from Register's "Find" button */
  const goToDashboardAndScan = () => {
    setAutoScan(true);
    setActiveView('dashboard');
  };

  const handleDashboardAutoScanConsumed = () => setAutoScan(false);

  return (
    <div className="app-shell">
      {/* Ambient orbs */}
      <div className="ambient-orb orb-1" />
      <div className="ambient-orb orb-2" />
      <div className="ambient-orb orb-3" />

      <Navbar activeView={activeView} setActiveView={setActiveView} />

      <main className="main-content">
        {activeView === 'dashboard' ? (
          <Dashboard
            key={`dashboard-${autoScan}`}
            showToast={showToast}
            autoScan={autoScan}
            onAutoScanConsumed={handleDashboardAutoScanConsumed}
          />
        ) : (
          <Register
            key="register"
            showToast={showToast}
            onFindClick={goToDashboardAndScan}
          />
        )}
      </main>

      <ToastManager toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
