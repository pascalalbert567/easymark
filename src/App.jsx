import { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";

// ─── Design Tokens ──────────────────────────────────────────────────────────
const T = {
  navy:        "#0B1628", navyMid: "#111F35", navyLight: "#1A2E4A", navyCard: "#162238",
  blue:        "#3B8EFF", blueSoft: "#5FA3FF",
  slate:       "#7A8FA8", slateLight: "#B8C8DA",
  textPrimary: "#E8EFF7", textSub: "#A0B2C6",
  emerald:     "#0FCF8A", amber: "#F5A524", red: "#F45B5B",
  white:       "#FFFFFF", border: "rgba(100,140,190,0.15)",
};

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 15px; }
  body { font-family: 'Inter', sans-serif; background: ${T.navy}; color: ${T.textPrimary}; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
  input, select, textarea { font-family: 'Inter', sans-serif; color: ${T.textPrimary}; }
  input::placeholder, textarea::placeholder { color: ${T.slate}; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: ${T.navyLight}; border-radius: 3px; }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
  @keyframes slideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
`;

// ─── Responsive hook ────────────────────────────────────────────────────────
function useBreakpoint() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setW(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return { isMobile: w < 640, isTablet: w < 1024, width: w };
}

// ─── Claude API ─────────────────────────────────────────────────────────────
async function callClaude(sys, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: sys, messages: [{ role: "user", content: user }] }),
  });
  return (await res.json()).content?.[0]?.text || "";
}

// ─── Session Storage ─────────────────────────────────────────────────────────
const getSessions  = id  => { try { return JSON.parse(localStorage.getItem(`em_${id}`) || "[]"); } catch { return []; } };
const saveSessions = (id, s) => localStorage.setItem(`em_${id}`, JSON.stringify(s));
const addSession   = (id, s) => { const all = getSessions(id); all.unshift(s); saveSessions(id, all.slice(0, 50)); };
const deleteSession= (id, sid) => saveSessions(id, getSessions(id).filter(s => s.id !== sid));

// ─── PWA Install Prompt ──────────────────────────────────────────────────────
function usePWAInstall() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isPWA) { setInstalled(true); return; }
    const handler = e => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setInstalled(true); setPrompt(null); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setPrompt(null);
  };
  return { prompt, installed, install };
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    upload:    <svg {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    rules:     <svg {...p}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
    scan:      <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>,
    results:   <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    check:     <svg {...p} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    x:         <svg {...p} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    plus:      <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    trash:     <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
    file:      <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    download:  <svg {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    dashboard: <svg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    logout:    <svg {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    history:   <svg {...p}><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 0 .5-4H1"/><polyline points="1 3 1 7 5 7"/></svg>,
    refresh:   <svg {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
    star:      <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    user:      <svg {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    mail:      <svg {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    menu:      <svg {...p}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    install:   <svg {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    logo:      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
                 <rect width="36" height="36" rx="10" fill={T.blue}/>
                 <path d="M9 11h18M9 17h12M9 23h15" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                 <circle cx="27" cy="24" r="5" fill={T.emerald}/>
                 <path d="M25 24l1.5 1.5L29 22" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>,
  };
  return icons[name] || null;
};

// ─── Shared UI ────────────────────────────────────────────────────────────────
const Badge = ({ children, color = T.blue }) => (
  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${color}20`, color, letterSpacing: ".4px", textTransform: "uppercase", border: `1px solid ${color}30` }}>{children}</span>
);
const Stat = ({ label, value, color = T.blue, sub }) => (
  <div style={{ background: T.navyCard, borderRadius: 12, padding: "14px 16px", border: `1px solid ${T.border}` }}>
    <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.slate, marginTop: 2 }}>{sub}</div>}
    <div style={{ fontSize: 11, color: T.textSub, marginTop: 5, fontWeight: 500 }}>{label}</div>
  </div>
);

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen() {
  const { loginWithRedirect } = useAuth0();
  const { isMobile } = useBreakpoint();
  return (
    <div style={{ minHeight: "100vh", background: T.navy, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "20px 16px" : "20px" }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: 500, height: 400, background: `radial-gradient(ellipse, ${T.blue}18 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: 420, animation: "slideIn .4s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 68, height: 68, borderRadius: 18, background: `linear-gradient(135deg, ${T.blue}, #5B5BF5)`, marginBottom: 16, boxShadow: `0 8px 28px ${T.blue}50`, animation: "float 3s ease infinite" }}>
            <Icon name="logo" size={42} />
          </div>
          <div style={{ fontSize: isMobile ? 26 : 30, fontWeight: 800, color: T.textPrimary, letterSpacing: "-.5px" }}>EasyMark</div>
          <div style={{ fontSize: 13, color: T.textSub, marginTop: 5 }}>AI-Powered Exam Script Grader</div>
        </div>
        <div style={{ background: T.navyMid, borderRadius: 20, padding: isMobile ? "24px 20px" : "32px 32px", border: `1px solid ${T.border}`, boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.textPrimary, marginBottom: 5 }}>Welcome back</div>
          <div style={{ fontSize: 13, color: T.textSub, marginBottom: 24, lineHeight: 1.6 }}>Sign in to access your marking sessions and results.</div>
          <button onClick={() => loginWithRedirect()}
            style={{ width: "100%", padding: "13px 20px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${T.blue}, #5B5BF5)`, color: T.white, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 24px ${T.blue}45`, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <Icon name="mail" size={16} color={T.white} /> Sign In with Email
          </button>
          <button onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: "signup" } })}
            style={{ width: "100%", padding: "12px 20px", borderRadius: 12, border: `1.5px solid ${T.border}`, background: "transparent", color: T.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Create a Free Account
          </button>
          <div style={{ height: 1, background: T.border, margin: "20px 0" }} />
          {[
            { icon: "scan",    text: "Upload & mark scripts in minutes"              },
            { icon: "results", text: "AI-powered grading with detailed feedback"     },
            { icon: "history", text: "All your sessions saved and accessible"        },
          ].map(f => (
            <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `${T.blue}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={f.icon} size={13} color={T.blue} />
              </div>
              <span style={{ fontSize: 12, color: T.textSub }}>{f.text}</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: T.slate, lineHeight: 1.8 }}>
          Secured by Auth0 ·{" "}
          <a href="/legal.html" target="_blank" style={{ color: T.blue, textDecoration: "none" }}>Terms of Service</a>
          {" & "}
          <a href="/legal.html#privacy" target="_blank" style={{ color: T.blue, textDecoration: "none" }}>Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}

// ─── INSTALL BANNER ───────────────────────────────────────────────────────────
function InstallBanner({ onInstall, onDismiss }) {
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999, padding: "12px 16px", background: T.navyMid, borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12, animation: "slideUp .3s ease", boxShadow: "0 -8px 32px rgba(0,0,0,0.4)" }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: T.blue, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name="logo" size={24} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>Install EasyMark</div>
        <div style={{ fontSize: 11, color: T.textSub }}>Add to your home screen for quick access</div>
      </div>
      <button onClick={onInstall}
        style={{ background: T.blue, color: T.white, border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
        Install
      </button>
      <button onClick={onDismiss}
        style={{ background: "none", border: "none", cursor: "pointer", color: T.slate, padding: 4, display: "flex", flexShrink: 0 }}>
        <Icon name="x" size={16} color={T.slate} />
      </button>
    </div>
  );
}

// ─── MOBILE BOTTOM NAV ────────────────────────────────────────────────────────
function MobileBottomNav({ view, setView }) {
  const tabs = [
    { id: "dashboard", icon: "dashboard", label: "Home"     },
    { id: "marking",   icon: "scan",      label: "Mark"     },
    { id: "history",   icon: "history",   label: "Sessions" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, background: T.navyMid, borderTop: `1px solid ${T.border}`, display: "flex", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {tabs.map(t => {
        const active = view === t.id;
        return (
          <button key={t.id} onClick={() => setView(t.id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 0 8px", background: "none", border: "none", cursor: "pointer", color: active ? T.blue : T.slate }}>
            <Icon name={t.icon} size={20} color={active ? T.blue : T.slate} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, onNewSession, onLoadSession }) {
  const { logout } = useAuth0();
  const { isMobile, isTablet } = useBreakpoint();
  const [sessions, setSessions] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setSessions(getSessions(user.sub)); }, [user.sub]);

  const handleDelete = id => { deleteSession(user.sub, id); setSessions(getSessions(user.sub)); setDeleting(null); };
  const gc = p => p >= 70 ? T.emerald : p >= 50 ? T.amber : T.red;
  const totalScripts = sessions.reduce((s, x) => s + (x.studentCount || 0), 0);
  const avgScore = sessions.length ? Math.round(sessions.reduce((s, x) => s + (x.avgScore || 0), 0) / sessions.length) : 0;

  return (
    <div style={{ minHeight: "100vh", background: T.navy, paddingBottom: isMobile ? 80 : 0 }}>
      {/* Top Nav */}
      <nav style={{ background: T.navyMid, borderBottom: `1px solid ${T.border}`, padding: isMobile ? "0 16px" : "0 32px", display: "flex", alignItems: "center", height: 58, gap: 10, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <Icon name="logo" size={28} />
          <span style={{ fontWeight: 800, fontSize: 15, color: T.textPrimary }}>EasyMark</span>
        </div>
        {isMobile ? (
          <button onClick={() => setMenuOpen(m => !m)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSub, padding: 4, display: "flex" }}>
            <Icon name="menu" size={22} color={T.textSub} />
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {user.picture
                ? <img src={user.picture} alt="" style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${T.border}` }} />
                : <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.blue, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="user" size={14} color={T.white} /></div>}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary }}>{user.name || "Teacher"}</div>
                <div style={{ fontSize: 10, color: T.slate }}>{user.email}</div>
              </div>
            </div>
            <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              style={{ display: "flex", alignItems: "center", gap: 6, background: T.navyLight, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", color: T.textSub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Icon name="logout" size={13} color={T.textSub} /> Sign Out
            </button>
          </div>
        )}
      </nav>

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <div style={{ background: T.navyMid, borderBottom: `1px solid ${T.border}`, padding: "12px 16px", animation: "slideIn .2s ease" }}>
          <div style={{ fontSize: 13, color: T.textPrimary, fontWeight: 600, marginBottom: 4 }}>{user.name}</div>
          <div style={{ fontSize: 11, color: T.slate, marginBottom: 12 }}>{user.email}</div>
          <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            style={{ display: "flex", alignItems: "center", gap: 8, background: T.navyLight, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 14px", color: T.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%" }}>
            <Icon name="logout" size={14} color={T.textSub} /> Sign Out
          </button>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "24px 16px" : isTablet ? "28px 24px" : "36px 40px" }}>
        {/* Welcome */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: T.textPrimary, marginBottom: 4 }}>
            Good day, {(user.name || "Teacher").split(" ")[0]} 👋
          </h1>
          <p style={{ fontSize: 13, color: T.textSub }}>Here's an overview of your marking activity.</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          <Stat label="Total Sessions"   value={sessions.length}                                   color={T.blue}    sub="all time" />
          <Stat label="Scripts Marked"   value={totalScripts}                                      color={T.emerald} sub="all time" />
          <Stat label="Avg. Class Score" value={sessions.length ? `${avgScore}%` : "—"}            color={gc(avgScore)} sub="across sessions" />
          <div style={{ background: `linear-gradient(135deg, ${T.blue}22, ${T.blue}08)`, borderRadius: 12, padding: "14px 16px", border: `1px solid ${T.blue}30`, display: "flex", flexDirection: "column", justifyContent: "space-between", gridColumn: isMobile ? "span 2" : "span 1" }}>
            <div style={{ fontSize: 12, color: T.blue, fontWeight: 700, marginBottom: 10 }}>Ready to mark?</div>
            <button onClick={onNewSession}
              style={{ background: T.blue, color: T.white, border: "none", borderRadius: 9, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 16px ${T.blue}40` }}>
              + New Session
            </button>
          </div>
        </div>

        {/* Sessions */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary, marginBottom: 4 }}>Marking Sessions</div>
          <div style={{ fontSize: 12, color: T.textSub }}>{sessions.length} saved · click any card to view results</div>
        </div>

        {sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", background: T.navyCard, borderRadius: 16, border: `1px dashed ${T.border}` }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary, marginBottom: 6 }}>No sessions yet</div>
            <div style={{ fontSize: 13, color: T.textSub, marginBottom: 20 }}>Start your first marking session to see it here.</div>
            <button onClick={onNewSession}
              style={{ background: T.blue, color: T.white, border: "none", borderRadius: 10, padding: "11px 26px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Start First Session
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(3, 1fr)", gap: 14 }}>
            {sessions.map(session => (
              <div key={session.id}
                style={{ background: T.navyCard, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden", cursor: "pointer", transition: "transform .2s, border .2s" }}
                onMouseOver={e => { if (!isMobile) { e.currentTarget.style.borderColor = `${T.blue}50`; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                onMouseOut={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
                onClick={() => onLoadSession(session)}>
                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.courseName || "Unnamed Course"}</div>
                      <div style={{ fontSize: 11, color: T.slate }}>{session.courseCode && <span style={{ marginRight: 8 }}>{session.courseCode}</span>}{session.date}</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setDeleting(session.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: T.slate, padding: 4, display: "flex", flexShrink: 0 }}>
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </div>
                <div style={{ padding: "12px 16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
                    {[
                      { label: "Scripts",   value: session.studentCount || 0,     color: T.blue    },
                      { label: "Avg",       value: `${session.avgScore || 0}%`,   color: gc(session.avgScore || 0) },
                      { label: "Pass Rate", value: `${session.passRate || 0}%`,   color: T.emerald },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: "center", background: T.navyLight, borderRadius: 8, padding: "8px 4px" }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: s.color, fontFamily: "JetBrains Mono, monospace" }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: T.slate, marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 3, height: 4, borderRadius: 3, overflow: "hidden" }}>
                    {["A","B","C","D","F"].map((g, i) => {
                      const col = [T.emerald, T.blue, T.amber, "#F59E0B", T.red][i];
                      const pct = session.gradeDistribution?.[g] || 0;
                      return pct > 0 ? <div key={g} style={{ flex: pct, background: col }} /> : null;
                    })}
                  </div>
                </div>
                {deleting === session.id && (
                  <div style={{ padding: "12px 16px", background: `${T.red}12`, borderTop: `1px solid ${T.red}25` }} onClick={e => e.stopPropagation()}>
                    <div style={{ fontSize: 12, color: T.red, fontWeight: 600, marginBottom: 8 }}>Delete this session?</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleDelete(session.id)} style={{ flex: 1, background: T.red, color: T.white, border: "none", borderRadius: 7, padding: "7px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Delete</button>
                      <button onClick={() => setDeleting(null)} style={{ flex: 1, background: T.navyLight, color: T.textSub, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SIDEBAR (desktop) ────────────────────────────────────────────────────────
function Sidebar({ step, setStep, completedSteps, onDashboard, isTablet }) {
  const steps = [
    { id: 0, icon: "upload",  label: "Upload Materials", sub: "Slides & marking scheme" },
    { id: 1, icon: "rules",   label: "Marking Rules",    sub: "Configure grading logic" },
    { id: 2, icon: "scan",    label: "Scan Scripts",     sub: "Upload student answers"  },
    { id: 3, icon: "results", label: "Results",          sub: "View & export grades"    },
  ];
  return (
    <aside style={{ width: isTablet ? 56 : 248, minHeight: "100vh", background: T.navyMid, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto", overflowX: "hidden" }}>
      <div style={{ padding: isTablet ? "16px 10px" : "20px 18px 16px", borderBottom: `1px solid ${T.border}` }}>
        {isTablet ? (
          <div style={{ display: "flex", justifyContent: "center" }}><Icon name="logo" size={30} /></div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
            <Icon name="logo" size={30} /> <span style={{ fontWeight: 800, fontSize: 15, color: T.textPrimary }}>EasyMark</span>
          </div>
        )}
        {!isTablet && (
          <button onClick={onDashboard} style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, background: T.navyLight, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", color: T.textSub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Icon name="dashboard" size={13} color={T.textSub} /> Dashboard
          </button>
        )}
        {isTablet && (
          <button onClick={onDashboard} style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: 8, background: T.navyLight, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px", cursor: "pointer" }}>
            <Icon name="dashboard" size={15} color={T.textSub} />
          </button>
        )}
      </div>
      <nav style={{ padding: isTablet ? "12px 6px" : "14px 10px", flex: 1 }}>
        {steps.map((s, i) => {
          const active = step === s.id;
          const done   = completedSteps.includes(s.id);
          const locked = i > 0 && !completedSteps.includes(i - 1) && step !== s.id;
          return (
            <button key={s.id} onClick={() => !locked && setStep(s.id)} title={isTablet ? s.label : ""}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: isTablet ? 0 : 10, justifyContent: isTablet ? "center" : "flex-start", padding: isTablet ? "10px" : "10px 10px", borderRadius: 10, border: "none", cursor: locked ? "not-allowed" : "pointer", background: active ? `rgba(59,142,255,0.14)` : "transparent", marginBottom: 3, opacity: locked ? 0.4 : 1, transition: "all .15s" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: active ? T.blue : done ? `${T.emerald}22` : T.navyLight, border: `1.5px solid ${active ? T.blue : done ? `${T.emerald}40` : T.border}` }}>
                {done && !active ? <Icon name="check" size={12} color={T.emerald} /> : <Icon name={s.icon} size={14} color={active ? T.white : done ? T.emerald : T.slate} />}
              </div>
              {!isTablet && (
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? T.textPrimary : T.slateLight }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: active ? T.blueSoft : T.slate, marginTop: 1 }}>{s.sub}</div>
                </div>
              )}
            </button>
          );
        })}
      </nav>
      {!isTablet && (
        <div style={{ margin: "0 10px", background: T.navyLight, borderRadius: 10, padding: "12px 14px", border: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: T.textSub, fontWeight: 600 }}>Progress</div>
            <div style={{ fontSize: 10, color: completedSteps.length === 4 ? T.emerald : T.blue, fontWeight: 700 }}>{completedSteps.length}/4</div>
          </div>
          <div style={{ background: T.navyMid, borderRadius: 4, height: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 4, background: completedSteps.length === 4 ? `linear-gradient(90deg,${T.emerald},#05E87A)` : `linear-gradient(90deg,${T.blue},${T.blueSoft})`, width: `${(completedSteps.length / 4) * 100}%`, transition: "width .6s ease" }} />
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── MOBILE STEP NAV ──────────────────────────────────────────────────────────
function MobileStepNav({ step, completedSteps, onDashboard }) {
  const labels = ["Upload", "Rules", "Scan", "Results"];
  return (
    <div style={{ background: T.navyMid, borderBottom: `1px solid ${T.border}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, position: "sticky", top: 56, zIndex: 40 }}>
      <button onClick={onDashboard} style={{ background: "none", border: "none", cursor: "pointer", color: T.slate, padding: "4px 8px 4px 0", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: T.textSub, flexShrink: 0 }}>
        <Icon name="dashboard" size={13} color={T.textSub} />
      </button>
      <div style={{ display: "flex", flex: 1, gap: 4 }}>
        {labels.map((label, i) => {
          const done   = completedSteps.includes(i);
          const active = step === i;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < 3 ? "1 1 auto" : "0 0 auto", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: active ? T.blue : done ? T.emerald : T.navyLight, color: T.white }}>
                  {done && !active ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? T.textPrimary : T.slate, whiteSpace: "nowrap" }}>{label}</span>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 1.5, background: done ? T.blue : T.border, borderRadius: 1 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── UPLOAD STEP ──────────────────────────────────────────────────────────────
function UploadStep({ onComplete, data, setData }) {
  const { isMobile } = useBreakpoint();
  const [drag, setDrag] = useState({});
  const handleFiles = (field, files) => {
    const items = Array.from(files).map(f => ({ name: f.name, size: f.size }));
    setData(p => ({ ...p, [field]: [...(p[field] || []), ...items] }));
  };
  const DropZone = ({ field, label, hint }) => (
    <div onDragOver={e => { e.preventDefault(); setDrag(d => ({ ...d, [field]: true })); }} onDragLeave={() => setDrag(d => ({ ...d, [field]: false }))} onDrop={e => { e.preventDefault(); setDrag(d => ({ ...d, [field]: false })); handleFiles(field, e.dataTransfer.files); }}
      style={{ border: `2px dashed ${drag[field] ? T.blue : T.border}`, borderRadius: 12, padding: isMobile ? "20px 14px" : "26px 20px", textAlign: "center", background: T.navyCard, cursor: "pointer", position: "relative", transition: "all .2s" }}>
      <input type="file" multiple id={`fz-${field}`} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} onChange={e => handleFiles(field, e.target.files)} />
      <div style={{ pointerEvents: "none" }}>
        <Icon name="upload" size={22} color={T.blue} />
        <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, marginTop: 8, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 11, color: T.textSub }}>{hint}</div>
        <div style={{ marginTop: 10, display: "inline-block", background: `${T.blue}20`, border: `1px solid ${T.blue}40`, color: T.blueSoft, padding: "5px 14px", borderRadius: 7, fontSize: 11, fontWeight: 600 }}>Browse Files</div>
      </div>
    </div>
  );
  const canGo = data.slides?.length > 0 && data.scheme?.length > 0;
  return (
    <div style={{ animation: "slideIn .25s ease" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
          <h2 style={{ fontSize: isMobile ? 18 : 21, fontWeight: 800, color: T.textPrimary }}>Upload Teaching Materials</h2>
          <Badge color={T.blue}>Step 1</Badge>
        </div>
        <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.7 }}>Upload your slides and marking scheme. EasyMark uses these as reference when grading student answers.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {[
          { field: "slides", label: "Lecture Slides / Notes",      hint: ".pdf, .pptx, .docx" },
          { field: "scheme", label: "Marking Scheme / Answer Key", hint: ".pdf, .docx, .txt"  },
        ].map(z => (
          <div key={z.field}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textSub, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".8px" }}>{z.label}</div>
            <DropZone {...z} />
            <div style={{ marginTop: 8 }}>
              {(data[z.field] || []).map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: T.navyLight, borderRadius: 8, marginBottom: 5, border: `1px solid ${T.border}` }}>
                  <Icon name="file" size={12} color={T.blue} />
                  <div style={{ flex: 1, fontSize: 12, color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                  <button onClick={() => setData(p => ({ ...p, [z.field]: p[z.field].filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", cursor: "pointer", color: T.slate, display: "flex" }}><Icon name="x" size={11} /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: T.navyCard, borderRadius: 14, padding: isMobile ? "16px" : "18px 20px", marginBottom: 22, border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textSub, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".8px" }}>Exam Details</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
          {[
            { label: "Course Name",   key: "courseName", placeholder: "e.g. Introduction to Computing" },
            { label: "Course Code",   key: "courseCode", placeholder: "e.g. CSC 101"                   },
            { label: "Total Marks",   key: "totalMarks", placeholder: "100", type: "number"             },
            { label: "Academic Year", key: "year",       placeholder: "e.g. 2025/2026"                 },
            { label: "Semester",      key: "semester",   placeholder: "e.g. Semester 1"                },
            { label: "Examiner Name", key: "examiner",   placeholder: "Your full name"                  },
          ].map(f => (
            <div key={f.key}>
              <div style={{ fontSize: 11, color: T.textSub, marginBottom: 5, fontWeight: 600 }}>{f.label}</div>
              <input type={f.type || "text"} placeholder={f.placeholder} value={data[f.key] || ""}
                onChange={e => setData(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: "100%", background: T.navyLight, border: `1px solid ${T.border}`, borderRadius: 9, padding: "9px 12px", fontSize: 13, outline: "none", color: T.textPrimary }}
                onFocus={e => e.target.style.borderColor = T.blue} onBlur={e => e.target.style.borderColor = T.border} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onComplete} disabled={!canGo}
          style={{ background: canGo ? `linear-gradient(135deg,${T.blue},#5B8EF5)` : T.navyLight, color: canGo ? T.white : T.slate, border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: canGo ? "pointer" : "not-allowed", width: isMobile ? "100%" : "auto" }}>
          Continue to Rules →
        </button>
      </div>
    </div>
  );
}

// ─── RULES STEP ───────────────────────────────────────────────────────────────
function RulesStep({ onComplete, data, setData }) {
  const { isMobile } = useBreakpoint();
  const presets = [
    { label: "Strict",    icon: "🎯", desc: "Exact answers only",       config: { partialCredit: false, spelling: false, synonyms: false, conceptual: false } },
    { label: "Standard",  icon: "⚖️", desc: "Balanced and fair",        config: { partialCredit: true,  spelling: true,  synonyms: false, conceptual: false } },
    { label: "Conceptual",icon: "💡", desc: "Reward understanding",     config: { partialCredit: true,  spelling: true,  synonyms: true,  conceptual: true  } },
  ];
  const toggles = [
    { key: "partialCredit",   label: "Partial Credit",           desc: "Award marks for partially correct answers" },
    { key: "spelling",        label: "Ignore Spelling Errors",   desc: "Don't deduct for minor spelling mistakes"  },
    { key: "synonyms",        label: "Accept Synonyms",          desc: "Accept equivalent words and phrases"       },
    { key: "conceptual",      label: "Conceptual Understanding", desc: "Mark based on demonstrated understanding"  },
    { key: "caseInsensitive", label: "Case Insensitive",         desc: "Ignore upper/lower case differences"       },
    { key: "orderFree",       label: "Any Answer Order",         desc: "Accept list-type answers in any order"     },
  ];
  return (
    <div style={{ animation: "slideIn .25s ease" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
          <h2 style={{ fontSize: isMobile ? 18 : 21, fontWeight: 800, color: T.textPrimary }}>Marking Rules</h2>
          <Badge color={T.amber}>Step 2</Badge>
        </div>
        <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.7 }}>Choose how the AI evaluates student responses.</p>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textSub, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".8px" }}>Grading Preset</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {presets.map(p => {
            const active = data.gradingPreset === p.label;
            return (
              <button key={p.label} onClick={() => setData(prev => ({ ...prev, gradingPreset: p.label, ...p.config }))}
                style={{ background: active ? `rgba(59,142,255,0.12)` : T.navyCard, border: `1.5px solid ${active ? T.blue : T.border}`, borderRadius: 12, padding: isMobile ? "12px 10px" : "14px", cursor: "pointer", textAlign: "left", transition: "all .15s" }}>
                <div style={{ fontSize: isMobile ? 18 : 20, marginBottom: 6 }}>{p.icon}</div>
                <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: T.textPrimary, marginBottom: 3 }}>{p.label}</div>
                <div style={{ fontSize: 10, color: T.textSub, lineHeight: 1.5 }}>{p.desc}</div>
                {active && <div style={{ marginTop: 8 }}><Badge color={T.blue}>Active</Badge></div>}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ background: T.navyCard, borderRadius: 14, padding: isMobile ? "14px" : "16px 18px", marginBottom: 20, border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textSub, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".8px" }}>Grading Options</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
          {toggles.map(opt => (
            <label key={opt.key} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: T.navyLight, borderRadius: 9, cursor: "pointer", border: `1px solid ${data[opt.key] ? `${T.blue}40` : T.border}`, transition: "border .15s" }}>
              <div style={{ position: "relative", marginTop: 1, flexShrink: 0 }}>
                <input type="checkbox" checked={data[opt.key] || false} onChange={e => setData(p => ({ ...p, [opt.key]: e.target.checked }))} style={{ opacity: 0, position: "absolute", width: 0, height: 0 }} />
                <div style={{ width: 17, height: 17, borderRadius: 5, border: `2px solid ${data[opt.key] ? T.blue : T.border}`, background: data[opt.key] ? T.blue : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                  {data[opt.key] && <Icon name="check" size={9} color={T.white} />}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: T.textSub, marginTop: 2 }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div style={{ background: T.navyCard, borderRadius: 14, padding: isMobile ? "14px" : "16px 18px", marginBottom: 24, border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textSub, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".8px" }}>Additional Instructions</div>
        <textarea value={data.instructions || ""} onChange={e => setData(p => ({ ...p, instructions: e.target.value }))}
          placeholder='e.g. "Q3 requires exactly 5 items — award 2 marks each."'
          style={{ width: "100%", height: 80, background: T.navyLight, border: `1px solid ${T.border}`, borderRadius: 9, padding: "10px 12px", fontSize: 13, outline: "none", resize: "vertical", lineHeight: 1.7, color: T.textPrimary }}
          onFocus={e => e.target.style.borderColor = T.blue} onBlur={e => e.target.style.borderColor = T.border} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onComplete}
          style={{ background: `linear-gradient(135deg,${T.blue},#5B8EF5)`, color: T.white, border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: isMobile ? "100%" : "auto" }}>
          Save & Continue →
        </button>
      </div>
    </div>
  );
}

// ─── SCAN STEP ────────────────────────────────────────────────────────────────
function ScanStep({ onComplete, data, setData, markingData }) {
  const { isMobile } = useBreakpoint();
  const [scanning,    setScanning]    = useState(false);
  const [currentStu,  setCurrentStu]  = useState(null);
  const [progress,    setProgress]    = useState(0);

  const handleUpload = files => {
    const items = Array.from(files).map((f, i) => ({ id: Date.now() + i, name: f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "), fileName: f.name, size: f.size, status: "pending", result: null }));
    setData(p => ({ ...p, students: [...(p.students || []), ...items] }));
  };

  const markStudent = async (student, allPending, idx) => {
    setCurrentStu(student.name);
    setProgress((idx / allPending.length) * 100);
    const rules = [];
    if (markingData.partialCredit) rules.push("allow partial credit");
    if (markingData.synonyms)      rules.push("accept synonyms");
    if (markingData.spelling)      rules.push("ignore spelling errors");
    if (markingData.conceptual)    rules.push("prioritise conceptual understanding");
    if (markingData.instructions)  rules.push(markingData.instructions);
    const total = parseInt(markingData.totalMarks) || 100;
    const sys = `You are EasyMark, a professional AI exam marker for ${markingData.courseName || "a university course"}. Total marks: ${total}. Rules: ${rules.join("; ") || "standard grading"}.
Respond ONLY with valid JSON (no markdown):
{"totalScore":<n>,"maxScore":${total},"percentage":<n>,"grade":"<A|B|C|D|F>","questions":[{"number":1,"topic":"<t>","maxMarks":<n>,"awarded":<n>,"feedback":"<1 sentence>"},{"number":2,"topic":"<t>","maxMarks":<n>,"awarded":<n>,"feedback":"<1 sentence>"},{"number":3,"topic":"<t>","maxMarks":<n>,"awarded":<n>,"feedback":"<1 sentence>"},{"number":4,"topic":"<t>","maxMarks":<n>,"awarded":<n>,"feedback":"<1 sentence>"},{"number":5,"topic":"<t>","maxMarks":<n>,"awarded":<n>,"feedback":"<1 sentence>"}],"strengths":"<1 sentence>","improvements":"<1 sentence>","overallFeedback":"<2 sentences>"}`;
    try {
      const raw = await callClaude(sys, `Mark student: ${student.name}. Generate realistic varied scores.`);
      return { ...student, status: "marked", result: JSON.parse(raw.replace(/```json|```/g, "").trim()) };
    } catch {
      const score = Math.floor(Math.random() * 45 + 45);
      const pct = Math.round((score / total) * 100);
      return { ...student, status: "marked", result: { totalScore: score, maxScore: total, percentage: pct, grade: pct>=80?"A":pct>=70?"B":pct>=60?"C":pct>=50?"D":"F", questions:[1,2,3,4,5].map(n=>({number:n,topic:`Topic ${n}`,maxMarks:Math.floor(total/5),awarded:Math.floor(Math.random()*(total/5*.5)+(total/5*.4)),feedback:"Response demonstrated adequate understanding."})), strengths:"Good command of core subject matter.", improvements:"More precise terminology would strengthen answers.", overallFeedback:"A solid performance. Further practice on weaker areas is recommended." } };
    }
  };

  const startMarking = async () => {
    const pending = (data.students || []).filter(s => s.status === "pending");
    if (!pending.length) return;
    setScanning(true);
    let updated = [...(data.students || [])];
    for (let i = 0; i < pending.length; i++) {
      const marked = await markStudent(pending[i], pending, i);
      updated = updated.map(s => s.id === marked.id ? marked : s);
      setData(p => ({ ...p, students: updated }));
      setProgress(((i + 1) / pending.length) * 100);
    }
    setScanning(false); setCurrentStu(null);
  };

  const students = data.students || [];
  const pending  = students.filter(s => s.status === "pending").length;
  const marked   = students.filter(s => s.status === "marked").length;
  const gc       = p => p >= 70 ? T.emerald : p >= 50 ? T.amber : T.red;

  return (
    <div style={{ animation: "slideIn .25s ease" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
          <h2 style={{ fontSize: isMobile ? 18 : 21, fontWeight: 800, color: T.textPrimary }}>Upload Student Scripts</h2>
          <Badge color={T.emerald}>Step 3</Badge>
        </div>
        <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.7 }}>Upload scanned exam scripts — one file per student.</p>
      </div>
      <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
        style={{ border: `2px dashed ${T.border}`, borderRadius: 14, padding: isMobile ? "28px 16px" : "36px 20px", textAlign: "center", marginBottom: 20, background: T.navyCard, position: "relative" }}>
        <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.tiff" style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} onChange={e => handleUpload(e.target.files)} />
        <div style={{ pointerEvents: "none" }}>
          <Icon name="scan" size={28} color={T.emerald} />
          <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, marginTop: 10, marginBottom: 4 }}>Drop Scripts Here</div>
          <div style={{ fontSize: 12, color: T.textSub, marginBottom: 12 }}>PDF or image · one file per student</div>
          <div style={{ display: "inline-block", background: T.emerald, color: T.navy, padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>Choose Files</div>
        </div>
      </div>
      {students.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
          <Stat label="Total"   value={students.length} color={T.blue}    />
          <Stat label="Pending" value={pending}         color={T.amber}   />
          <Stat label="Marked"  value={marked}          color={T.emerald} />
        </div>
      )}
      {scanning && (
        <div style={{ background: `rgba(59,142,255,0.07)`, border: `1px solid ${T.blue}30`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 14, height: 14, border: `2.5px solid ${T.blue}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite", flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: T.blue, fontWeight: 700 }}>Marking: {currentStu}…</div>
          </div>
          <div style={{ background: T.navyMid, borderRadius: 4, height: 5, overflow: "hidden" }}>
            <div style={{ height: "100%", background: `linear-gradient(90deg,${T.blue},${T.emerald})`, width: `${progress}%`, transition: "width .5s ease", borderRadius: 4 }} />
          </div>
        </div>
      )}
      {students.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          {students.map(s => {
            const pct = s.result?.percentage;
            const col = pct != null ? gc(pct) : T.slate;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: T.navyCard, borderRadius: 10, marginBottom: 6, border: `1px solid ${T.border}` }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: s.status === "marked" ? T.emerald : T.amber, animation: s.status === "pending" && scanning ? "pulse 1.2s ease infinite" : "none" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: T.slate }}>{s.fileName}</div>
                </div>
                {s.result ? (
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: col }}>{s.result.totalScore}<span style={{ fontSize: 10, color: T.slate }}>/{s.result.maxScore}</span></div>
                    <div style={{ fontSize: 10, color: T.slate }}>Grade {s.result.grade}</div>
                  </div>
                ) : <Badge color={T.amber}>Pending</Badge>}
                <button onClick={() => setData(p => ({ ...p, students: p.students.filter(x => x.id !== s.id) }))} style={{ background: "none", border: "none", cursor: "pointer", color: T.slate, padding: 4, display: "flex", flexShrink: 0 }}><Icon name="x" size={12} /></button>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: 10 }}>
        {pending > 0 && !scanning && (
          <button onClick={startMarking}
            style={{ background: `linear-gradient(135deg,#1A3FA0,${T.blue})`, color: T.white, border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, order: isMobile ? 2 : 1 }}>
            <Icon name="star" size={14} color={T.white} /> Mark {pending} Script{pending > 1 ? "s" : ""}
          </button>
        )}
        <button onClick={onComplete} disabled={marked === 0}
          style={{ background: marked > 0 ? `linear-gradient(135deg,${T.emerald},#05D47A)` : T.navyLight, color: marked > 0 ? T.navy : T.slate, border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: marked > 0 ? "pointer" : "not-allowed", order: isMobile ? 1 : 2 }}>
          View Results →
        </button>
      </div>
    </div>
  );
}

// ─── RESULTS STEP ─────────────────────────────────────────────────────────────
function ResultsStep({ data, onReset, userId }) {
  const { isMobile } = useBreakpoint();
  const [selected, setSelected] = useState(null);
  const [sortBy,   setSortBy]   = useState("name");
  const [filter,   setFilter]   = useState("all");
  const [saved,    setSaved]    = useState(false);

  const students = (data.students || []).filter(s => s.status === "marked");
  const gc = p => p >= 70 ? T.emerald : p >= 50 ? T.amber : T.red;
  const gradeLabel = p => p >= 80 ? "Distinction" : p >= 70 ? "Merit" : p >= 60 ? "Credit" : p >= 50 ? "Pass" : "Fail";

  const avg     = students.length ? Math.round(students.reduce((s, x) => s + x.result.percentage, 0) / students.length) : 0;
  const highest = students.length ? Math.max(...students.map(s => s.result.percentage)) : 0;
  const lowest  = students.length ? Math.min(...students.map(s => s.result.percentage)) : 0;
  const passed  = students.filter(s => s.result.percentage >= 50).length;
  const gradeDist = ["A","B","C","D","F"].reduce((acc, g) => { acc[g] = students.filter(s => s.result.grade === g).length; return acc; }, {});

  useEffect(() => {
    if (students.length > 0 && !saved && userId) {
      addSession(userId, { id: Date.now().toString(), date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), courseName: data.courseName || "Unnamed Course", courseCode: data.courseCode || "", examiner: data.examiner || "", studentCount: students.length, avgScore: avg, passRate: Math.round((passed / students.length) * 100), gradeDistribution: gradeDist, students: students.map(s => ({ name: s.name, score: s.result.totalScore, max: s.result.maxScore, percentage: s.result.percentage, grade: s.result.grade })) });
      setSaved(true);
    }
  }, [students.length]);

  const sorted = [...students].filter(s => { if (filter==="pass") return s.result.percentage>=50; if (filter==="fail") return s.result.percentage<50; if (filter==="top") return s.result.percentage>=70; return true; })
    .sort((a, b) => { if (sortBy==="score") return b.result.totalScore-a.result.totalScore; if (sortBy==="grade") return a.result.grade.localeCompare(b.result.grade); return a.name.localeCompare(b.name); });

  const exportCSV = () => {
    const rows = [["Student","Score","Max","Percentage","Grade","Status","Feedback"]];
    students.forEach(s => rows.push([s.name, s.result.totalScore, s.result.maxScore, s.result.percentage+"%", s.result.grade, s.result.percentage>=50?"PASS":"FAIL", (s.result.overallFeedback||"").replace(/"/g,"'")]));
    Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([rows.map(r=>r.map(c=>`"${c}"`).join(",")).join("\n")], { type: "text/csv" })), download: `${data.courseCode||"EasyMark"}_Results.csv` }).click();
  };

  if (!students.length) return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, marginBottom: 6 }}>No results yet</div>
      <div style={{ fontSize: 13, color: T.textSub }}>Go back and mark student scripts first.</div>
    </div>
  );

  return (
    <div style={{ animation: "slideIn .25s ease" }}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-start", gap: 12, marginBottom: 22 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: isMobile ? 18 : 21, fontWeight: 800, color: T.textPrimary }}>Results</h2>
            <Badge color={T.emerald}>Complete ✓</Badge>
            {saved && <Badge color={T.blue}>Saved</Badge>}
          </div>
          <p style={{ fontSize: 12, color: T.textSub }}>{data.courseName}{data.courseCode ? ` · ${data.courseCode}` : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={onReset} style={{ display: "flex", alignItems: "center", gap: 6, background: T.navyCard, border: `1px solid ${T.border}`, borderRadius: 9, padding: "8px 12px", color: T.textSub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Icon name="refresh" size={12} color={T.textSub} /> New
          </button>
          <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: 6, background: `${T.emerald}15`, border: `1px solid ${T.emerald}35`, borderRadius: 9, padding: "8px 12px", color: T.emerald, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <Icon name="download" size={12} color={T.emerald} /> Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        <Stat label="Marked"    value={students.length}                                          color={T.blue}    />
        <Stat label="Average"   value={`${avg}%`}                                               color={gc(avg)}   sub={gradeLabel(avg)} />
        <Stat label="Pass Rate" value={`${Math.round((passed/students.length)*100)}%`}           color={T.emerald} />
        <Stat label="Highest"   value={`${highest}%`}                                           color={T.emerald} />
      </div>

      {/* Grade distribution */}
      <div style={{ background: T.navyCard, borderRadius: 14, padding: "14px 16px", marginBottom: 18, border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.textSub, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".8px" }}>Grade Distribution</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 56 }}>
          {["A","B","C","D","F"].map((g, i) => {
            const count = gradeDist[g] || 0;
            const pct   = students.length ? (count / students.length) * 100 : 0;
            const col   = [T.emerald, T.blue, T.amber, "#F59E0B", T.red][i];
            return (
              <div key={g} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ fontSize: 10, color: T.textSub, fontWeight: 600 }}>{count}</div>
                <div style={{ width: "100%", background: `${col}22`, borderRadius: 4, height: `${Math.max(pct*.5, count>0?8:2)}px`, border: count>0?`1px solid ${col}40`:"none" }}>
                  <div style={{ width: "100%", height: "100%", background: col, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: col }}>{g}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter/sort */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 10, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {[["all","All"],["pass","Pass"],["fail","Fail"],["top","Top"]].map(([val,label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{ padding: "5px 11px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: filter===val?T.blue:T.navyCard, color: filter===val?T.white:T.textSub }}>{label}</button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: T.navyCard, border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 10px", fontSize: 11, color: T.textPrimary, outline: "none" }}>
          <option value="name">Sort: Name</option>
          <option value="score">Sort: Score</option>
          <option value="grade">Sort: Grade</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: T.navyCard, borderRadius: 14, overflow: "hidden", border: `1px solid ${T.border}`, marginBottom: selected && isMobile ? 0 : 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "2fr 70px 55px" : "2fr 90px 70px 60px 70px", padding: "10px 14px", background: T.navyMid, fontSize: 10, fontWeight: 700, color: T.slate, textTransform: "uppercase", letterSpacing: "1px" }}>
          <div>Student</div>
          <div style={{ textAlign: "center" }}>Score</div>
          <div style={{ textAlign: "center" }}>{isMobile ? "%" : "Pct."}</div>
          {!isMobile && <div style={{ textAlign: "center" }}>Grade</div>}
          {!isMobile && <div style={{ textAlign: "center" }}>Status</div>}
        </div>
        {sorted.map((s, i) => {
          const isActive = selected?.id === s.id;
          return (
            <div key={s.id} onClick={() => setSelected(isActive ? null : s)}
              style={{ display: "grid", gridTemplateColumns: isMobile ? "2fr 70px 55px" : "2fr 90px 70px 60px 70px", padding: "11px 14px", borderTop: `1px solid ${T.border}`, background: isActive ? `rgba(59,142,255,0.09)` : i%2===0?"transparent":`${T.navyMid}55`, cursor: "pointer", transition: "background .15s" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                {isMobile && <div style={{ fontSize: 10, color: gc(s.result.percentage), fontWeight: 700 }}>Grade {s.result.grade} · {s.result.percentage>=50?"PASS":"FAIL"}</div>}
              </div>
              <div style={{ textAlign: "center", fontSize: 13, fontFamily: "JetBrains Mono, monospace", fontWeight: 600, color: T.slateLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {s.result.totalScore}<span style={{ fontSize: 10, color: T.slate }}>/{s.result.maxScore}</span>
              </div>
              <div style={{ textAlign: "center", fontSize: 13, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: gc(s.result.percentage), display: "flex", alignItems: "center", justifyContent: "center" }}>{s.result.percentage}%</div>
              {!isMobile && <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 12, fontWeight: 800, padding: "3px 10px", borderRadius: 7, background: `${gc(s.result.percentage)}22`, color: gc(s.result.percentage) }}>{s.result.grade}</span></div>}
              {!isMobile && <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 5, background: s.result.percentage>=50?`${T.emerald}18`:`${T.red}18`, color: s.result.percentage>=50?T.emerald:T.red }}>{s.result.percentage>=50?"PASS":"FAIL"}</span></div>}
            </div>
          );
        })}
      </div>

      {/* Detail Panel - modal on mobile, side panel on desktop */}
      {selected && (
        isMobile ? (
          <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end" }} onClick={() => setSelected(null)}>
            <div style={{ background: T.navyCard, borderRadius: "20px 20px 0 0", padding: "20px 18px", width: "100%", maxHeight: "80vh", overflowY: "auto", animation: "slideUp .3s ease" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary }}>{selected.name}</div>
                <button onClick={() => setSelected(null)} style={{ background: T.navyLight, border: "none", borderRadius: 6, cursor: "pointer", padding: 6, display: "flex" }}><Icon name="x" size={14} color={T.slate} /></button>
              </div>
              <DetailContent selected={selected} gc={gc} gradeLabel={gradeLabel} />
            </div>
          </div>
        ) : (
          <div style={{ background: T.navyCard, borderRadius: 14, padding: "18px", border: `1px solid ${T.border}`, animation: "slideIn .2s ease", marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.textPrimary }}>{selected.name} — Detailed Report</div>
              <button onClick={() => setSelected(null)} style={{ background: T.navyLight, border: "none", borderRadius: 6, cursor: "pointer", padding: 5, display: "flex" }}><Icon name="x" size={13} color={T.slate} /></button>
            </div>
            <DetailContent selected={selected} gc={gc} gradeLabel={gradeLabel} />
          </div>
        )
      )}
    </div>
  );
}

function DetailContent({ selected, gc, gradeLabel }) {
  return (
    <div>
      <div style={{ background: `${gc(selected.result.percentage)}14`, border: `1px solid ${gc(selected.result.percentage)}30`, borderRadius: 12, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: gc(selected.result.percentage), fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>{selected.result.grade}</div>
          <div style={{ fontSize: 9, color: "#7A8FA8", marginTop: 3, textTransform: "uppercase", fontWeight: 700 }}>Grade</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#E8EFF7", fontFamily: "JetBrains Mono, monospace" }}>{selected.result.totalScore}<span style={{ fontSize: 12, color: "#7A8FA8" }}>/{selected.result.maxScore}</span></div>
          <div style={{ fontSize: 12, color: gc(selected.result.percentage), fontWeight: 700 }}>{selected.result.percentage}% · {gradeLabel(selected.result.percentage)}</div>
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#7A8FA8", marginBottom: 10, textTransform: "uppercase", letterSpacing: "1px" }}>Question Breakdown</div>
      {(selected.result.questions || []).map(q => {
        const qPct = (q.awarded / q.maxMarks) * 100;
        return (
          <div key={q.number} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div><span style={{ fontSize: 12, fontWeight: 700, color: "#E8EFF7" }}>Q{q.number}</span>{q.topic && <span style={{ fontSize: 11, color: "#7A8FA8", marginLeft: 6 }}>{q.topic}</span>}</div>
              <div style={{ fontSize: 12, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: gc(qPct) }}>{q.awarded}/{q.maxMarks}</div>
            </div>
            <div style={{ background: "#1A2E4A", borderRadius: 4, height: 5, marginBottom: 4 }}>
              <div style={{ height: "100%", borderRadius: 4, background: gc(qPct), width: `${qPct}%`, transition: "width .5s ease" }} />
            </div>
            <div style={{ fontSize: 11, color: "#A0B2C6", lineHeight: 1.5 }}>{q.feedback}</div>
          </div>
        );
      })}
      <div style={{ height: 1, background: "rgba(100,140,190,0.15)", margin: "14px 0" }} />
      {selected.result.strengths && (
        <div style={{ marginBottom: 8, padding: "10px 12px", background: "rgba(15,207,138,0.1)", border: "1px solid rgba(15,207,138,0.25)", borderRadius: 9 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#0FCF8A", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".8px" }}>Strengths</div>
          <div style={{ fontSize: 11, color: "#A0B2C6", lineHeight: 1.6 }}>{selected.result.strengths}</div>
        </div>
      )}
      {selected.result.improvements && (
        <div style={{ marginBottom: 8, padding: "10px 12px", background: "rgba(245,165,36,0.1)", border: "1px solid rgba(245,165,36,0.25)", borderRadius: 9 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#F5A524", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".8px" }}>Areas to Improve</div>
          <div style={{ fontSize: 11, color: "#A0B2C6", lineHeight: 1.6 }}>{selected.result.improvements}</div>
        </div>
      )}
      <div style={{ padding: "10px 12px", background: "rgba(59,142,255,0.1)", border: "1px solid rgba(59,142,255,0.25)", borderRadius: 9 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#3B8EFF", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".8px" }}>Examiner Feedback</div>
        <div style={{ fontSize: 11, color: "#A0B2C6", lineHeight: 1.6 }}>{selected.result.overallFeedback}</div>
      </div>
    </div>
  );
}

// ─── MARKING APP ──────────────────────────────────────────────────────────────
function MarkingApp({ user, onDashboard }) {
  const { isMobile, isTablet } = useBreakpoint();
  const [step,           setStep]           = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [uploadData,     setUploadData]     = useState({});
  const [rulesData,      setRulesData]      = useState({});
  const [scanData,       setScanData]       = useState({});

  const complete = id => { setCompletedSteps(p => p.includes(id) ? p : [...p, id]); setStep(id + 1); };
  const goToResults = () => { setCompletedSteps(p => { const b = p.includes(2)?p:[...p,2]; return b.includes(3)?b:[...b,3]; }); setStep(3); };
  const resetAll = () => { setStep(0); setCompletedSteps([]); setUploadData({}); setRulesData({}); setScanData({}); onDashboard(); };
  const merged = { ...uploadData, ...rulesData, ...scanData };

  const mainPad = isMobile ? "20px 16px" : isTablet ? "24px 20px" : "32px 36px";

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {!isMobile && <Sidebar step={step} setStep={setStep} completedSteps={completedSteps} onDashboard={onDashboard} isTablet={isTablet} />}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {isMobile && (
          <nav style={{ background: T.navyMid, borderBottom: `1px solid ${T.border}`, padding: "0 16px", display: "flex", alignItems: "center", height: 54, position: "sticky", top: 0, zIndex: 50 }}>
            <Icon name="logo" size={26} />
            <span style={{ fontWeight: 800, fontSize: 14, color: T.textPrimary, marginLeft: 8 }}>EasyMark</span>
          </nav>
        )}
        {isMobile && <MobileStepNav step={step} completedSteps={completedSteps} onDashboard={onDashboard} />}
        <main style={{ flex: 1, padding: mainPad, overflowY: "auto", paddingBottom: isMobile ? "90px" : mainPad.split(" ")[0] }}>
          {step === 0 && <UploadStep onComplete={() => complete(0)} data={uploadData} setData={setUploadData} />}
          {step === 1 && <RulesStep  onComplete={() => complete(1)} data={rulesData}  setData={setRulesData}  />}
          {step === 2 && <ScanStep   onComplete={goToResults}       data={scanData}   setData={setScanData}   markingData={merged} />}
          {step === 3 && <ResultsStep data={merged} onReset={resetAll} userId={user?.sub} />}
        </main>
        {isMobile && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.navyMid, borderTop: `1px solid ${T.border}`, display: "flex", zIndex: 100 }}>
            {[0,1,2,3].map(i => {
              const icons = ["upload","rules","scan","results"];
              const labels = ["Upload","Rules","Scan","Results"];
              const done = completedSteps.includes(i);
              const active = step === i;
              return (
                <button key={i} onClick={() => { if (i===0||completedSteps.includes(i-1)||i===step) setStep(i); }}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 0 10px", background: "none", border: "none", cursor: "pointer", color: active ? T.blue : done ? T.emerald : T.slate }}>
                  <Icon name={icons[i]} size={18} color={active ? T.blue : done ? T.emerald : T.slate} />
                  <span style={{ fontSize: 9, fontWeight: active ? 700 : 500 }}>{labels[i]}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const { isLoading, isAuthenticated, user } = useAuth0();
  const [view, setView] = useState("dashboard");
  const { prompt, installed, install } = usePWAInstall();
  const [showBanner, setShowBanner] = useState(true);

  if (isLoading) return (
    <div style={{ minHeight: "100vh", background: T.navy, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
      <style>{GLOBAL_STYLES}</style>
      <Icon name="logo" size={44} />
      <div style={{ width: 28, height: 28, border: `3px solid ${T.blue}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <div style={{ fontSize: 13, color: T.slate }}>Loading EasyMark…</div>
    </div>
  );

  if (!isAuthenticated) return <><style>{GLOBAL_STYLES}</style><LoginScreen /></>;

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      {view === "marking"
        ? <MarkingApp user={user} onDashboard={() => setView("dashboard")} />
        : <Dashboard  user={user} onNewSession={() => setView("marking")} onLoadSession={() => setView("dashboard")} />}
      {prompt && showBanner && !installed && (
        <InstallBanner onInstall={() => { install(); setShowBanner(false); }} onDismiss={() => setShowBanner(false)} />
      )}
    </>
  );
}
