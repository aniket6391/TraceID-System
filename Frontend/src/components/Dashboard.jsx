import { useState, useEffect, useRef } from 'react';
import { Marker, Overlay } from 'pigeon-maps';
import FingerprintScanner from './FingerprintScanner';
import { getRandomUser, USERS } from '../data/users';
import './Dashboard.css';
import { Map, MapControls } from "@/components/ui/map";

/* ─────────────────────────────────────────────
   Component Helpers
───────────────────────────────────────────── */

function AnimCounter({ target, duration = 1200, isPercent = false }) {
   const [val, setVal] = useState(0);
   const ref = useRef(null);
   useEffect(() => {
      const start = Date.now();
      const tick = () => {
         const elapsed = Date.now() - start;
         const progress = Math.min(elapsed / duration, 1);
         const ease = 1 - Math.pow(1 - progress, 3);
         let current = target * ease;
         setVal(isPercent ? current.toFixed(1) : Math.round(current));
         if (progress < 1) ref.current = requestAnimationFrame(tick);
      };
      ref.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(ref.current);
   }, [target, duration, isPercent]);
   return <>{isPercent ? val : val.toLocaleString()}</>;
}

const mapTilerProvider = (x, y, z, dpr) => {
   return `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/${z}/${x}/${y}.png`;
};

// Mini Chart Component for the Top Cards
const MiniChart = ({ color, points }) => (
   <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points={points} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
   </svg>
);

// Macro Stats Mock Data
const MACRO_STATS = [
   { title: "Found Persons", count: 210, diff: "+45", perc: "+21%", color: "var(--neon-green)", icon: "✔", chart: "5,20 15,15 25,18 35,10 45,12 55,5" },
   { title: "Pending Cases", count: 68, diff: "+13", perc: "+19.6%", color: "#ffaa00", icon: "⚠", chart: "5,18 15,12 25,16 35,8 45,5 55,2" },
   { title: "Active Searches", count: 150, diff: "+28", perc: "+23.6%", color: "var(--cyan)", icon: "🔍", chart: "5,22 15,19 25,15 35,20 45,10 55,6" },
   { title: "State-wise Matches", count: 3250, diff: "+180", perc: "+8%", color: "var(--cyan)", icon: "🗺", chart: "5,20 15,22 35,10 45,15 55,5" },
];

const MISSING_PERSONS = [
   {
      id: "BIO-789-5412",
      name: "Aryan Mehta",
      photo: "https://api.dicebear.com/7.x/initials/svg?seed=Aryan",
      age: 16,
      relation: "S/O Vikram Mehta",
      status: "FOUND",
      date: "14-APR-2026",
      location: "Mumbai, Maharashtra",
      guardianContact: "+91-875422XXXX"
   },
   {
      id: "BIO-845-1211",
      name: "Kajal Patel",
      photo: "https://api.dicebear.com/7.x/initials/svg?seed=Kajal",
      age: 13,
      relation: "D/O Jatin Patel",
      status: "PENDING",
      date: "13-APR-2026",
      location: "Ahmedabad, Gujarat",
      guardianContact: "+91-989212XXXX"
   },
   {
      id: "BIO-112-9844",
      name: "Ravi Singh",
      photo: "https://api.dicebear.com/7.x/initials/svg?seed=Ravi",
      age: 13,
      relation: "S/O Mohan Singh",
      status: "PENDING",
      date: "09-APR-2026",
      location: "Surat",
      guardianContact: "+91-888422XXXX"
   },
   {
      id: "BIO-443-2211",
      name: "Alisha Verma",
      photo: "https://api.dicebear.com/7.x/initials/svg?seed=Alisha",
      age: 14,
      relation: "D/O Amit Sharma",
      status: "PENDING",
      date: "07-APR-2026",
      location: "Mumbai, Maharashtra",
      guardianContact: "+91-776422XXXX"
   },
   {
      id: "BIO-667-8899",
      name: "Aman Verma",
      photo: "https://api.dicebear.com/7.x/initials/svg?seed=Aman",
      age: 17,
      relation: "S/O Rajesh Verma",
      status: "PENDING",
      date: "09-APR-2026",
      location: "Lucknow, Uttar Pradesh",
      guardianContact: "+91-998822XXXX"
   }
];


/* ═══════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
═══════════════════════════════════════════ */
export default function Dashboard({ showToast, autoScan = false, onAutoScanConsumed }) {
   const [userLocation, setUserLocation] = useState([20.5937, 78.9629]); 
   const [geoReady, setGeoReady] = useState(false);
   const [activePerson, setActivePerson] = useState(MISSING_PERSONS[0]);
   const [matchResult, setMatchResult] = useState(null); // { person, accuracy }

   useEffect(() => {
      if ("geolocation" in navigator) {
         navigator.geolocation.getCurrentPosition(
            (position) => {
               setUserLocation([position.coords.latitude, position.coords.longitude]);
               setGeoReady(true);
            },
            () => setGeoReady(true)
         );
      } else {
         setGeoReady(true);
      }
   }, []);

   return (
      <div className="dashboard-v2 animate-fade-in-up">
         
         {/* --- TOP ROW : MACRO STATS --- */}
         <div className="macro-stats-row">
            {MACRO_STATS.map((stat, idx) => (
               <div className="macro-card glass-card" key={idx}>
                  <div className="macro-icon" style={{ borderColor: stat.color, color: stat.color }}>{stat.icon}</div>
                  <div className="macro-details">
                     <span className="macro-title">{stat.title}</span>
                     <div className="macro-numbers">
                        <span className="macro-count"><AnimCounter target={stat.count} /></span>
                        <div className="macro-trend">
                           <span className="macro-diff" style={{ color: stat.color }}>{stat.diff} Today</span>
                        </div>
                     </div>
                  </div>
                  <div className="macro-chart-side">
                     <span className="macro-perc" style={{ color: stat.color }}>{stat.perc}</span>
                     <MiniChart color={stat.color} points={stat.chart} />
                  </div>
               </div>
            ))}
         </div>

         {/* --- MIDDLE ROW : LIVE STATS + MAP --- */}
         <div className="mid-row">
            {/* Live Stats Blocks */}
            <div className="live-stats-panel glass-card">
               <div className="panel-header-v2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <span>LIVE STAT CARDS</span>
                  <span className="live-badge badge badge-green"><span className="badge-dot"/> REAL-TIME</span>
               </div>
               <div className="live-stats-grid">
                  {MACRO_STATS.map((stat, idx) => (
                     <div className="live-stat-box" key={idx}>
                        <div className="ls-top">
                           <span>{stat.title}</span>
                           <span style={{color: 'var(--text-muted)'}}>MISSING PERSONS</span>
                        </div>
                        <div className="ls-mid">
                           <span className="ls-val"><AnimCounter target={stat.count} /></span>
                           <span className="ls-diff" style={{ color: stat.color }}>{stat.diff} Yday</span>
                        </div>
                        <div className="ls-bot">
                           <span className="ls-today">{stat.diff} Today</span>
                           <span className="ls-perc" style={{ color: stat.color }}>{stat.perc} ▲</span>
                        </div>
                        <div className="chart-container-large mt-2">
                            <svg width="100%" height="40" preserveAspectRatio="none" viewBox="0 0 100 40">
                               <polyline fill="none" stroke={stat.color} strokeWidth="2" vectorEffect="non-scaling-stroke" points="0,35 20,25 40,28 60,15 80,18 100,5" />
                               <polygon fill={`url(#grad-${idx})`} points="0,40 0,35 20,25 40,28 60,15 80,18 100,5 100,40" />
                               <defs>
                                  <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="0%" stopColor={stat.color} stopOpacity="0.4" />
                                     <stop offset="100%" stopColor={stat.color} stopOpacity="0" />
                                  </linearGradient>
                               </defs>
                            </svg>
                        </div>
                     </div>
                  ))}
               </div>
               <button className="btn btn-ghost w-full mt-4" style={{ justifyContent: 'center' }}>VIEW ALL REPORTS <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>
            </div>

            {/* Live Map */}
            <div className="live-map-panel glass-card">
               <div className="panel-header-v2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                  <span>LIVE MAP</span>
               </div>
               
               <div className="map-embed-wrapper">
                  <div className="map-overlay" />
                  <Map provider={mapTilerProvider} center={userLocation} zoom={4.8} dprs={[1, 2]} metaWheelZoom={true}>
                     <MapControls position="top-right" showZoom />
                     <Marker anchor={[19.0760, 72.8777]} color="var(--neon-green)" />
                     <Marker anchor={[28.7041, 77.1025]} color="#ffaa00" />
                     <Marker anchor={[12.9716, 77.5946]} color="var(--cyan)" />
                     <Marker anchor={[22.5726, 88.3639]} color="var(--neon-green)" />
                     <Marker anchor={[23.0225, 72.5714]} color="#ffaa00" />
                     {geoReady && <Marker width={40} anchor={userLocation} color="var(--cyan)" />}
                  </Map>
                  
                  {/* Floating Map Stats */}
                  <div className="map-floating-stats">
                     <span className="mfs-val">410</span>
                     <span className="mfs-label">India<br/>Missing Persons</span>
                  </div>

                  {/* Map Legend */}
                  <div className="map-legend">
                     <div className="ml-item"><span className="ml-dot" style={{background: 'var(--neon-green)'}}/> Found</div>
                     <div className="ml-item"><span className="ml-dot" style={{background: 'var(--cyan)'}}/> Last Seen</div>
                     <div className="ml-item"><span className="ml-dot" style={{background: '#ffaa00'}}/> Pending</div>
                  </div>
               </div>
            </div>
         </div>

         {/* --- BOTTOM ROW : INTELLIGENCE --- */}
         <div className="bot-row">
            <div className="intelligence-panel glass-card section-grow" style={{ flex: '1' }}>
               <div className="panel-header-v2" style={{ borderBottom: 'none' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span>MISSING PERSONS INTELLIGENCE</span>
               </div>

               <div className="intel-layout">
                  {/* Left Spotlight Person */}
                  <div className="intel-spotlight">
                     <div className="spotlight-card">
                        <div className="spotlight-header">
                           <img src={activePerson.photo} alt={activePerson.name} className="sp-photo"/>
                           <div className="sp-info">
                              <span className="sp-name">{activePerson.name}</span>
                              <span className="sp-relation">{activePerson.relation}</span>
                              <span className="sp-age">{activePerson.age}</span>
                              <span className="badge badge-green mt-1">{activePerson.status}</span>
                           </div>
                        </div>
                        <div className="sp-details mt-4">
                           <div className="sp-row"><span className="sp-label">✔ Match Rate:</span> <span className="sp-val text-cyan">14-APR-2026</span></div>
                           <div className="sp-row"><span className="sp-label">📍 Last Seen:</span> <span className="sp-val">{activePerson.location}</span></div>
                           <div className="sp-row"><span className="sp-label">📞 Guardian Contact:</span> <span className="sp-val">{activePerson.guardianContact}</span></div>
                        </div>
                        <button className="btn btn-ghost w-full mt-4" style={{justifyContent: 'center', borderColor: 'var(--cyan)', color: 'var(--cyan)'}}>MARK AS FOUND</button>
                     </div>
                     <div className="sp-actions">
                        <button className="btn btn-ghost" style={{flex: 1}}>VIEW PROFILE</button>
                        <button className="btn btn-ghost font-mono" style={{flex: 1, color: '#ff4560', borderColor: '#ff4560'}}>⚠ SEND ALERT</button>
                     </div>
                  </div>

                  {/* Right List of Persons */}
                  <div className="intel-list-wrapper">
                     <table className="intel-table" style={{ width: '100%' }}>
                        <tbody>
                           {MISSING_PERSONS.map((person, i) => (
                              <tr key={i} className={`intel-tr ${activePerson.id === person.id ? 'active' : ''}`} onClick={() => setActivePerson(person)}>
                                 <td style={{width: '50px'}}><img src={person.photo} alt={person.name} className="intel-sm-photo" /></td>
                                 <td>
                                    <div className="flex flex-col">
                                       <span className="intel-name">{person.name}</span>
                                       <span className="intel-rel">{person.relation}</span>
                                    </div>
                                 </td>
                                 <td>
                                    <div className="flex flex-col">
                                       <span className="intel-age" style={{color: person.status === 'FOUND' ? 'var(--neon-green)' : '#ffaa00'}}>{person.age}</span>
                                       <span className="intel-status" style={{color: person.status === 'FOUND' ? 'var(--neon-green)' : '#ffaa00'}}>{person.status}</span>
                                    </div>
                                 </td>
                                 <td>
                                    <div className="flex flex-col">
                                       <span className="intel-rel">{person.relation}</span>
                                       <span className="intel-name">{person.location.split(',')[0]}</span>
                                    </div>
                                 </td>
                                 <td style={{textAlign: 'right'}}>
                                    <div className="flex flex-col" style={{alignItems: 'flex-end'}}>
                                       <span className="intel-date">{person.date}</span>
                                       <span className="badge badge-warning mt-1" style={{fontSize: '0.5rem', background: 'transparent'}}>PENDING</span>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>

            <div className="advanced-search-panel glass-card section-shrink" style={{ display: 'flex', flexDirection: 'column' }}>
               <div className="panel-header-v2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
                     <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                  <span>BIOMETRIC SEARCH</span>
                  {matchResult && (
                     <span className="badge badge-green" style={{ marginLeft: 'auto' }}>
                        <span className="badge-dot" /> MATCH FOUND
                     </span>
                  )}
               </div>

               <div className="as-form mt-2" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>

                  {/* ── MATCH RESULT CARD ── */}
                  {matchResult ? (
                     <div className="fp-match-result animate-fade-in-up" style={{
                        width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem'
                     }}>
                        {/* Person header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(0,255,200,0.06)', borderRadius: '8px', border: '1px solid rgba(0,255,200,0.15)' }}>
                           <img
                              src={matchResult.person.photo}
                              alt={matchResult.person.name}
                              style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid var(--neon-green)', objectFit: 'cover' }}
                           />
                           <div style={{ flex: 1 }}>
                              <div style={{ color: 'var(--neon-green)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.05em' }}>{matchResult.person.name.toUpperCase()}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>{matchResult.person.relation}</div>
                              <div style={{ marginTop: '4px' }}>
                                 <span className={`badge ${matchResult.person.status === 'FOUND' ? 'badge-green' : 'badge-warning'}`} style={{ fontSize: '0.6rem' }}>
                                    {matchResult.person.status}
                                 </span>
                              </div>
                           </div>
                        </div>

                        {/* Accuracy meter */}
                        <div style={{ width: '100%' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>MATCH ACCURACY</span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--neon-green)', fontFamily: 'monospace', fontWeight: 'bold' }}>{matchResult.accuracy}%</span>
                           </div>
                           <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{
                                 height: '100%',
                                 width: `${matchResult.accuracy}%`,
                                 background: `linear-gradient(90deg, var(--cyan), var(--neon-green))`,
                                 borderRadius: '3px',
                                 boxShadow: '0 0 8px var(--neon-green)',
                                 transition: 'width 1.2s cubic-bezier(0.23, 1, 0.32, 1)'
                              }} />
                           </div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>CONFIDENCE LEVEL</span>
                              <span style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: matchResult.accuracy >= 90 ? 'var(--neon-green)' : matchResult.accuracy >= 75 ? '#ffaa00' : '#ff4560' }}>
                                 {matchResult.accuracy >= 90 ? 'HIGH' : matchResult.accuracy >= 75 ? 'MEDIUM' : 'LOW'}
                              </span>
                           </div>
                        </div>

                        {/* Details rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '5px', fontSize: '0.72rem' }}>
                              <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>📍 LAST SEEN</span>
                              <span style={{ color: 'var(--foreground)', fontFamily: 'monospace' }}>{matchResult.person.location}</span>
                           </div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '5px', fontSize: '0.72rem' }}>
                              <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>🎂 AGE</span>
                              <span style={{ color: 'var(--foreground)', fontFamily: 'monospace' }}>{matchResult.person.age} yrs</span>
                           </div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '5px', fontSize: '0.72rem' }}>
                              <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>📞 CONTACT</span>
                              <span style={{ color: 'var(--cyan)', fontFamily: 'monospace' }}>{matchResult.person.guardianContact}</span>
                           </div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '5px', fontSize: '0.72rem' }}>
                              <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>🆔 CASE ID</span>
                              <span style={{ color: 'var(--cyan)', fontFamily: 'monospace' }}>{matchResult.person.id}</span>
                           </div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '5px', fontSize: '0.72rem' }}>
                              <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>📅 DATE REPORTED</span>
                              <span style={{ color: 'var(--foreground)', fontFamily: 'monospace' }}>{matchResult.person.date}</span>
                           </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                           <button
                              className="btn btn-cyan"
                              style={{ flex: 2, justifyContent: 'center', height: '36px', fontSize: '0.78rem' }}
                              onClick={() => { setActivePerson(matchResult.person); }}
                           >
                              VIEW IN INTEL
                           </button>
                           <button
                              className="btn btn-ghost"
                              style={{ flex: 1, justifyContent: 'center', height: '36px', fontSize: '0.78rem' }}
                              onClick={() => setMatchResult(null)}
                           >
                              SCAN AGAIN
                           </button>
                        </div>
                     </div>
                  ) : (
                     /* ── SCANNER (idle state) ── */
                     <>
                        <div style={{ marginBottom: '0.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                           Place finger on sensor to search Aadhaar registry.
                        </div>

                        <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', marginBottom: '-2rem', width: '100%' }}>
                           <FingerprintScanner
                              mode="identify"
                              compact={true}
                              autoStart={autoScan}
                              useWebAuthn={true}
                              onCapture={(template, bioId) => {
                                 if (autoScan && onAutoScanConsumed) onAutoScanConsumed();
                                 if (template) {
                                    setTimeout(() => {
                                       // Pick a matching person and compute a realistic accuracy score
                                       const matched = MISSING_PERSONS[Math.floor(Math.random() * MISSING_PERSONS.length)];
                                       const accuracy = Math.floor(Math.random() * 8) + 92; // 92–99%
                                       setMatchResult({ person: matched, accuracy });
                                       setActivePerson(matched);
                                       if (showToast) showToast(`Fingerprint matched — ${matched.name} (${accuracy}% confidence)`, 'success');
                                    }, 500);
                                 }
                              }}
                           />
                        </div>

                        <div className="as-actions mt-auto" style={{ paddingTop: '1rem', width: '100%' }}>
                           <button
                              className="btn btn-outline w-full"
                              style={{ justifyContent: 'center', height: '40px', fontSize: '0.85rem', borderColor: 'var(--cyan)', color: 'var(--cyan)' }}
                              onClick={() => showToast && showToast('Awaiting Hardware Connection for IoT Scanner...', 'warning')}
                           >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                                 <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                                 <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                                 <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                                 <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" />
                                 <line x1="17" y1="16" x2="23" y2="16" />
                              </svg>
                              CONNECT IOT SCANNER
                           </button>
                        </div>
                     </>
                  )}
               </div>
            </div>
         </div>

      </div>
   );
}
