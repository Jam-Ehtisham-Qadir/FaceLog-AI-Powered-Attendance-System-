import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import RegisterEmployee from './components/RegisterEmployee'
import EmployeeList from './components/EmployeeList'
import AttendanceRecords from './components/AttendanceRecords'
import Kiosk from './components/Kiosk'
import Landing from './Landing'
import Login from './Login'
import { AuthProvider, useAuth } from './AuthContext'

function NavItem({ to, icon, label }) {
  const [h, setH] = useState(false)
  return (
    <NavLink
      to={to}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px', borderRadius: '10px',
        textDecoration: 'none', fontSize: '14px', fontWeight: '500',
        transition: 'all 0.18s ease',
        color: isActive ? '#f1f5f9' : h ? '#94a3b8' : '#64748b',
        background: isActive
          ? 'rgba(99,102,241,0.15)'
          : h ? 'rgba(255,255,255,0.04)' : 'transparent',
        borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
      })}
    >
      <span style={{ fontSize: '16px' }}>{icon}</span>
      {label}
    </NavLink>
  )
}


function LogoutBtn() {
  const [h, setH] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <button
      onClick={handleLogout}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: '100%', padding: '9px 14px',
        borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)',
        background: h ? 'rgba(239,68,68,0.12)' : 'transparent',
        color: h ? '#fca5a5' : '#64748b',
        fontSize: '12px', fontWeight: '600',
        cursor: 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: '8px',
        transition: 'all 0.18s ease',
      }}
    >
      🚪 Logout
    </button>
  )
}

function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080c18', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <div style={{
        width: '240px', flexShrink: 0,
        background: 'rgba(10,14,26,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 16px', gap: '6px',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <img src="/src/assets/logo.png" style={{ width: '150px', height: '150px', objectFit: 'contain' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#f1f5f9' }}>FaceLog</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Admin Portal</div>
          </div>
        </div>

        <NavItem to="/dashboard"  icon="📊" label="Dashboard" />
        <NavItem to="/register"   icon="👤" label="Register Employee" />
        <NavItem to="/employees"  icon="👥" label="Employees" />
        <NavItem to="/records"    icon="📋" label="Records" />

        <div style={{ flex: 1 }} />

        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <LogoutBtn />
        </div>

        <div style={{ marginTop: '12px', paddingLeft: '4px' }}>
          <div style={{ fontSize: '10px', color: '#ffffff' }}>Built by</div>
          <a
            href="https://linkedin.com/in/jam-ehtisham-qadir-aaa691243"
            target="_blank" rel="noreferrer"
            style={{ fontSize: '12px', color: '#6366f1', fontWeight: '600', textDecoration: 'none' }}
          >
            Jam Ehtisham Qadir
          </a>
          <div style={{ fontSize: '10px', color: '#ffffff' }}>Python Developer & AI/ML Engineer</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/register"  element={<RegisterEmployee />} />
          <Route path="/employees" element={<EmployeeList />} />
          <Route path="/records"   element={<AttendanceRecords />} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  )
}

// Protect admin routes
function ProtectedLayout() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <AdminLayout />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"      element={<Landing />} />
          <Route path="/login" element={<LoginGuard />} />
          <Route path="/kiosk" element={<Kiosk />} />
          <Route path="/*"     element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

// Redirect already-logged-in admins away from login page
function LoginGuard() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Login />
}