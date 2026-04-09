import { useState, useEffect } from 'react'
import axios from 'axios'

function StatCard({ card }) {
  const [h, setH] = useState(false)
  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        ...s.card,
        borderTop: `3px solid ${card.color}`,
        ...(h ? { ...s.cardHover, boxShadow: `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${card.color}33` } : {}),
      }}
    >
      <div style={s.cardTop}>
        <span style={s.cardIcon}>{card.icon}</span>
        <span style={{ ...s.cardValue, color: card.color }}>{card.value}</span>
      </div>
      <div style={s.cardLabel}>{card.label}</div>
    </div>
  )
}

function StepItem({ item }) {
  const [h, setH] = useState(false)
  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ ...s.step, ...(h ? s.stepHover : {}) }}
    >
      <div style={s.stepNum}>{item.step}</div>
      <div>
        <div style={s.stepTitle}>{item.title}</div>
        <div style={s.stepDesc}>{item.desc}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    const fetchStats = () => {
      axios.get('/api/dashboard/stats/')
        .then(res => {
          setStats(res.data)
          setLastUpdated(new Date())
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const cards = stats ? [
    { label: 'Total Employees',       value: stats.total_employees,       icon: '👥', color: '#6366f1' },
    { label: 'Checked In Today',      value: stats.checked_in_today,      icon: '✅', color: '#10b981' },
    { label: 'Checked Out Today',     value: stats.checked_out_today,     icon: '🚪', color: '#06b6d4' },
    { label: 'Spoof Attempts Today',  value: stats.spoof_attempts_today,  icon: '🚨', color: '#ef4444' },
    { label: 'Total Records',         value: stats.total_records,         icon: '📋', color: '#8b5cf6' },
  ] : []

  const steps = [
    { step: '1', title: 'Register Employee', desc: 'Admin registers employee with guided 5-angle webcam capture' },
    { step: '2', title: 'Anti-Spoofing Check', desc: 'GPT-4o Vision verifies the face is live — not a photo, screen or AI-generated image' },
    { step: '3', title: 'Face Matching', desc: 'DeepFace matches the live face against all registered employee photos' },
    { step: '4', title: 'Check In / Check Out', desc: 'Attendance marked with timestamp and hours worked calculated automatically' },
  ]

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>Dashboard</h1>
        <p style={s.subtitle}>
          AI-powered attendance system overview
          {lastUpdated && (
            <span style={s.lastUpdated}>
              · Last updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <div style={s.loading}>Loading stats...</div>
      ) : (
        <>
          <div style={s.grid}>
            {cards.map((card, i) => <StatCard key={i} card={card} />)}
          </div>

          <div style={s.infoBox}>
            <h3 style={s.infoTitle}>🧠 How It Works</h3>
            <div style={s.steps}>
              {steps.map((item, i) => <StepItem key={i} item={item} />)}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const s = {
  header: { marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: '800', color: '#f1f5f9', margin: '0 0 8px' },
  subtitle: { color: '#64748b', fontSize: '14px', margin: 0 },
  lastUpdated: { marginLeft: '12px', fontSize: '12px', color: '#334155' },
  loading: { color: '#64748b', fontSize: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '32px' },
  card: {
    background: 'rgba(15,20,40,0.8)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px', padding: '24px',
    transition: 'all 0.18s ease', cursor: 'default',
  },
  cardHover: {
    transform: 'translateY(-3px)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  cardIcon: { fontSize: '24px' },
  cardValue: { fontSize: '36px', fontWeight: '800' },
  cardLabel: { color: '#64748b', fontSize: '13px', fontWeight: '500' },
  infoBox: {
    background: 'rgba(15,20,40,0.8)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px', padding: '28px',
  },
  infoTitle: { fontSize: '16px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 24px' },
  steps: { display: 'flex', flexDirection: 'column', gap: '8px' },
  step: {
    display: 'flex', alignItems: 'flex-start', gap: '16px',
    padding: '12px', borderRadius: '10px',
    transition: 'all 0.18s ease',
  },
  stepHover: {
    background: 'rgba(99,102,241,0.06)',
    transform: 'translateX(4px)',
  },
  stepNum: {
    width: '32px', height: '32px', borderRadius: '50%',
    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
    color: '#a5b4fc', fontSize: '13px', fontWeight: '700',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepTitle: { color: '#e2e8f0', fontSize: '14px', fontWeight: '600', marginBottom: '4px' },
  stepDesc: { color: '#64748b', fontSize: '13px', lineHeight: 1.5 },
}