import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from './AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [focusField, setFocusField] = useState(null)

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      setError('Please enter both username and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await axios.post('/api/auth/login/', form)
      if (res.data.success) {
        login()
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div style={s.page}>
      <div style={s.bgGrid} />
      <div style={{ ...s.blob, top: '20%', left: '20%', background: 'rgba(99,102,241,0.1)' }} />
      <div style={{ ...s.blob, bottom: '20%', right: '15%', background: 'rgba(16,185,129,0.08)' }} />

      <div style={s.box}>
        {/* Back link */}
        <button onClick={() => navigate('/')} style={s.backBtn}>
          ← Back
        </button>

        {/* Header */}
        <div style={s.header}>
          <div style={s.logoIcon}>🔐</div>
          <h1 style={s.title}>Admin Login</h1>
          <p style={s.subtitle}>Access the FaceLog admin portal</p>
        </div>

        {/* Error */}
        {error && (
          <div style={s.errorBox}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Form */}
        <div style={s.form}>
          <div style={s.fieldWrap}>
            <label style={s.label}>Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocusField('username')}
              onBlur={() => setFocusField(null)}
              placeholder="Enter username"
              autoComplete="username"
              style={{
                ...s.input,
                ...(focusField === 'username' ? s.inputFocus : {}),
              }}
            />
          </div>

          <div style={s.fieldWrap}>
            <label style={s.label}>Password</label>
            <div style={s.passWrap}>
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocusField('password')}
                onBlur={() => setFocusField(null)}
                placeholder="Enter password"
                autoComplete="current-password"
                style={{
                  ...s.input,
                  ...(focusField === 'password' ? s.inputFocus : {}),
                  paddingRight: '44px',
                }}
              />
              <button
                onClick={() => setShowPass(p => !p)}
                style={s.eyeBtn}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <LoginBtn onClick={handleSubmit} loading={loading} />
        </div>
      </div>
    </div>
  )
}

function LoginBtn({ onClick, loading }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        ...s.submitBtn,
        ...(h && !loading ? s.submitBtnHover : {}),
        opacity: loading ? 0.7 : 1,
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? '⏳ Logging in...' : '🔐 Login to Dashboard'}
    </button>
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
    width: '350px', height: '350px',
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  },
  box: {
    position: 'relative', zIndex: 1,
    background: 'rgba(13,18,30,0.95)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px', padding: '40px',
    width: '100%', maxWidth: '420px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
    display: 'flex', flexDirection: 'column', gap: '24px',
  },
  backBtn: {
    background: 'none', border: 'none',
    color: '#475569', fontSize: '13px',
    cursor: 'pointer', padding: 0, textAlign: 'left',
    fontWeight: '600', width: 'fit-content',
  },
  header: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '10px', textAlign: 'center',
  },
  logoIcon: { fontSize: '40px' },
  title: { fontSize: '24px', fontWeight: '800', color: '#f1f5f9', margin: 0 },
  subtitle: { fontSize: '13px', color: '#475569', margin: 0 },
  errorBox: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '10px', padding: '12px 16px',
    color: '#fca5a5', fontSize: '13px',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input: {
    width: '100%', padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#f1f5f9', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box',
    transition: 'all 0.18s ease',
  },
  inputFocus: {
    borderColor: 'rgba(99,102,241,0.5)',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.1)',
    background: 'rgba(99,102,241,0.05)',
  },
  passWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: '12px', top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none',
    fontSize: '16px', cursor: 'pointer',
    padding: '2px',
  },
  submitBtn: {
    width: '100%', padding: '14px',
    borderRadius: '12px',
    border: '1px solid rgba(99,102,241,0.4)',
    background: 'rgba(99,102,241,0.15)',
    color: '#a5b4fc', fontSize: '14px', fontWeight: '700',
    transition: 'all 0.2s ease', marginTop: '4px',
  },
  submitBtnHover: {
    background: 'rgba(99,102,241,0.28)',
    borderColor: 'rgba(99,102,241,0.6)',
    color: '#c7d2fe',
    boxShadow: '0 0 20px rgba(99,102,241,0.25)',
    transform: 'translateY(-1px)',
  },
}