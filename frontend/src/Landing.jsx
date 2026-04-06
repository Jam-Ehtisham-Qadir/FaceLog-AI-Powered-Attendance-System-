import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function HoverCard({ onClick, icon, title, desc, accent }) {
  const [h, setH] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        ...s.card,
        borderColor: h ? accent : 'rgba(255,255,255,0.08)',
        boxShadow: h ? `0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px ${accent}44` : '0 4px 16px rgba(0,0,0,0.2)',
        transform: h ? 'translateY(-6px) scale(1.02)' : 'none',
      }}
    >
      <div style={{ ...s.iconWrap, background: `${accent}18`, border: `1px solid ${accent}33` }}>
        <span style={s.icon}>{icon}</span>
      </div>
      <div style={{ ...s.cardTitle, color: h ? '#f1f5f9' : '#e2e8f0' }}>{title}</div>
      <div style={s.cardDesc}>{desc}</div>
      <div style={{ ...s.arrow, color: accent, opacity: h ? 1 : 0, transform: h ? 'translateX(0)' : 'translateX(-8px)' }}>
        → Enter
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={s.page}>
      {/* Background grid */}
      <div style={s.bgGrid} />

      {/* Glow blobs */}
      <div style={{ ...s.blob, top: '10%', left: '15%', background: 'rgba(99,102,241,0.12)' }} />
      <div style={{ ...s.blob, bottom: '15%', right: '10%', background: 'rgba(16,185,129,0.10)' }} />

      <div style={s.content}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <img src="/src/assets/logo.png" style={{ width: '250px', height: '250px', objectFit: 'contain' }} />
          <div>
            <div style={s.logoName}>FaceLog</div>
            <div style={s.logoTagline}>AI-Powered Attendance System</div>
          </div>
        </div>

        {/* Headline */}
        <h1 style={s.headline}>
          Smart Attendance,<br />
          <span style={s.headlineAccent}>Zero Friction</span>
        </h1>
        <p style={s.subheadline}>
          Face recognition · Anti-spoofing · Automated payroll
        </p>

        {/* Cards */}
        <div style={s.cards}>
          <HoverCard
            onClick={() => navigate('/kiosk')}
            icon="✅"
            title="Mark Attendance"
            desc="Employees check in and out using face recognition"
            accent="#10b981"
          />
          <HoverCard
            onClick={() => navigate('/login')}
            icon="🔐"
            title="Admin Login"
            desc="Access dashboard, reports, and employee management"
            accent="#6366f1"
          />
        </div>

        {/* Footer */}
        <div style={s.footer}>
          Built by{' '}
          <a
            href="https://linkedin.com/in/jam-ehtisham-qadir-aaa691243"
            target="_blank"
            rel="noreferrer"
            style={s.footerLink}
          >
            Jam Ehtisham Qadir
          </a>
          {' '}- Python Developer & AI/ML Engineer
        </div>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh', width: '100%',
    background: '#080c18',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
    fontFamily: 'system-ui, sans-serif',
  },
  bgGrid: {
    position: 'absolute', inset: 0,
    backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
    backgroundSize: '48px 48px',
    pointerEvents: 'none',
  },
  blob: {
    position: 'absolute',
    width: '400px', height: '400px',
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  },
  content: {
    position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '20px',
    padding: '24px', maxWidth: '700px', width: '100%',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  logoIcon: { fontSize: '40px' },
  logoName: {
    fontSize: '26px', fontWeight: '800',
    color: '#f1f5f9', letterSpacing: '-0.02em',
  },
  logoTagline: { fontSize: '12px', color: '#475569', fontWeight: '500' },
  headline: {
    fontSize: '38px', fontWeight: '800',
    color: '#f1f5f9', textAlign: 'center',
    margin: 0, lineHeight: 1.15, letterSpacing: '-0.03em',
  },
  headlineAccent: {
    background: 'linear-gradient(135deg, #6366f1, #10b981)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subheadline: {
    fontSize: '13px', color: '#475569',
    margin: 0, textAlign: 'center', letterSpacing: '0.02em',
  },
  cards: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '20px', width: '100%', marginTop: '8px',
  },
  card: {
    background: 'rgba(15,20,40,0.85)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px', padding: '22px 20px',
    display: 'flex', flexDirection: 'column', gap: '12px',
    cursor: 'pointer',
    transition: 'all 0.22s ease',
  },
  iconWrap: {
    width: '44px', height: '44px', borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: '24px' },
  cardTitle: {
    fontSize: '17px', fontWeight: '700',
    transition: 'color 0.18s ease',
  },
  cardDesc: { fontSize: '13px', color: '#64748b', lineHeight: 1.55 },
  arrow: {
    fontSize: '13px', fontWeight: '700',
    transition: 'all 0.22s ease',
    marginTop: '4px',
  },
  footer: {
    fontSize: '12px', color: '#ffffff',
    textAlign: 'center', marginTop: '8px',
  },
  footerLink: {
    color: '#6366f1', textDecoration: 'none', fontWeight: '600',
  },
}