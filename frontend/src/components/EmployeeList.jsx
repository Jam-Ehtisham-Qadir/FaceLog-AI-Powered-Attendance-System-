import { useState, useEffect } from 'react'
import axios from 'axios'

function HoverBtn({ base, hover, children, onClick, disabled }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ transition: 'all 0.18s ease', cursor: disabled ? 'not-allowed' : 'pointer', ...base, ...(h && !disabled ? hover : {}) }}
    >
      {children}
    </button>
  )
}

// Lightbox component
function Lightbox({ photos, initialIndex, employeeName, onClose }) {
  const [current, setCurrent] = useState(initialIndex)
  const angleLabels = ['Straight', 'Left', 'Right', 'Up', 'Down']

  const prev = () => setCurrent(i => (i - 1 + photos.length) % photos.length)
  const next = () => setCurrent(i => (i + 1) % photos.length)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div style={lb.overlay} onClick={onClose}>
      <div style={lb.box} onClick={e => e.stopPropagation()}>
        <div style={lb.header}>
          <div style={lb.headerInfo}>
            <span style={lb.headerName}>{employeeName}</span>
            <span style={lb.headerLabel}>{angleLabels[current] || `Photo ${current + 1}`}</span>
          </div>
          <button style={lb.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={lb.imgWrap}>
          {photos.length > 1 && (
            <button style={{ ...lb.navBtn, left: '12px' }} onClick={prev}>‹</button>
          )}
          <img src={photos[current]} alt={`${employeeName} - ${angleLabels[current]}`} style={lb.img} />
          {photos.length > 1 && (
            <button style={{ ...lb.navBtn, right: '12px' }} onClick={next}>›</button>
          )}
        </div>
        {photos.length > 1 && (
          <div style={lb.thumbRow}>
            {photos.map((url, i) => (
              <div key={i} onClick={() => setCurrent(i)} style={{ ...lb.thumb, ...(i === current ? lb.thumbActive : {}) }}>
                <img src={url} alt={angleLabels[i]} style={lb.thumbImg} />
                <div style={lb.thumbLabel}>{angleLabels[i] || `#${i + 1}`}</div>
              </div>
            ))}
          </div>
        )}
        <div style={lb.counter}>{current + 1} / {photos.length}</div>
      </div>
    </div>
  )
}

// Inline salary editor
function SalaryEditor({ empId, currentSalary, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentSalary || '')
  const [saving, setSaving] = useState(false)
  const [h, setH] = useState(false)

  const handleSave = async () => {
    if (!value || isNaN(value) || Number(value) < 0) return
    setSaving(true)
    try {
      await axios.patch(`http://127.0.0.1:8000/api/employees/${empId}/salary/`, { salary: Number(value) })
      onSaved(Number(value))
      setEditing(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setValue(currentSalary || '')
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={se.row} onClick={e => e.stopPropagation()}>
        <span style={se.prefix}>PKR</span>
        <input
          type="number"
          value={value}
          onChange={e => setValue(e.target.value)}
          style={se.input}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
          placeholder="e.g. 50000"
        />
        <button onClick={handleSave} disabled={saving} style={se.saveBtn}>
          {saving ? '...' : '✓'}
        </button>
        <button onClick={handleCancel} style={se.cancelBtn}>✕</button>
      </div>
    )
  }

  return (
    <div
      style={{ ...se.display, ...(h ? se.displayHover : {}) }}
      onClick={e => { e.stopPropagation(); setEditing(true) }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      title="Click to edit salary"
    >
      <span style={se.salaryIcon}>💰</span>
      <span style={se.salaryVal}>
        {currentSalary ? `PKR ${Number(currentSalary).toLocaleString()}` : 'Set salary'}
      </span>
      <span style={se.editHint}>{h ? '✏️ edit' : ''}</span>
    </div>
  )
}

const se = {
  row: {
    display: 'flex', alignItems: 'center', gap: '6px',
    marginTop: '4px',
  },
  prefix: { fontSize: '11px', color: '#64748b', fontWeight: '600' },
  input: {
    flex: 1, padding: '4px 8px', borderRadius: '6px',
    border: '1px solid rgba(99,102,241,0.5)',
    background: 'rgba(99,102,241,0.08)',
    color: '#f1f5f9', fontSize: '12px', outline: 'none',
    maxWidth: '110px',
  },
  saveBtn: {
    padding: '3px 8px', borderRadius: '5px',
    border: '1px solid rgba(16,185,129,0.4)',
    background: 'rgba(16,185,129,0.12)',
    color: '#6ee7b7', fontSize: '12px', cursor: 'pointer', fontWeight: '700',
  },
  cancelBtn: {
    padding: '3px 8px', borderRadius: '5px',
    border: '1px solid rgba(239,68,68,0.3)',
    background: 'rgba(239,68,68,0.08)',
    color: '#fca5a5', fontSize: '12px', cursor: 'pointer',
  },
  display: {
    display: 'flex', alignItems: 'center', gap: '5px',
    marginTop: '4px', cursor: 'pointer',
    padding: '3px 6px', borderRadius: '6px',
    border: '1px solid transparent',
    transition: 'all 0.15s ease',
    width: 'fit-content',
  },
  displayHover: {
    border: '1px solid rgba(99,102,241,0.3)',
    background: 'rgba(99,102,241,0.07)',
  },
  salaryIcon: { fontSize: '11px' },
  salaryVal: { fontSize: '12px', color: '#a5b4fc', fontWeight: '600' },
  editHint: { fontSize: '10px', color: '#6366f1', minWidth: '36px' },
}

export default function EmployeeList() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [employeePhotos, setEmployeePhotos] = useState({})
  const [photosLoading, setPhotosLoading] = useState(false)
  const [cardHover, setCardHover] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [search, setSearch] = useState('')
  const [searchFocus, setSearchFocus] = useState(false)

  const fetchEmployees = () => {
    axios.get('http://127.0.0.1:8000/api/employees/')
      .then(res => setEmployees(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchEmployees() }, [])

  // Filter employees based on search
  const filtered = employees.filter(emp => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      emp.name?.toLowerCase().includes(q) ||
      emp.employee_id?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q)
    )
  })

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return
    try {
      await axios.delete(`http://127.0.0.1:8000/api/employees/${id}/`)
      fetchEmployees()
      if (expandedId === id) setExpandedId(null)
    } catch (err) { console.error(err) }
  }

  const handleSalaryUpdate = (empId, newSalary) => {
    setEmployees(prev => prev.map(e => e.id === empId ? { ...e, salary: newSalary } : e))
  }

  const handleCardClick = async (emp) => {
    if (expandedId === emp.id) { setExpandedId(null); return }
    setExpandedId(emp.id)
    if (employeePhotos[emp.id]) return
    setPhotosLoading(true)
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/employees/')
      const found = res.data.find(e => e.id === emp.id)
      if (found) {
        const allPhotos = []
        if (found.photo_url) allPhotos.push(getPhotoUrl(found.photo_url))
        if (found.extra_photos) found.extra_photos.forEach(p => { if (p.photo_url) allPhotos.push(getPhotoUrl(p.photo_url)) })
        setEmployeePhotos(prev => ({ ...prev, [emp.id]: allPhotos }))
      }
    } catch (err) { console.error(err) }
    finally { setPhotosLoading(false) }
  }

  const getPhotoUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return `http://127.0.0.1:8000${url}`
  }

  const angleLabels = ['Straight', 'Left', 'Right', 'Up', 'Down']

  return (
    <>
      {lightbox && (
        <Lightbox
          photos={lightbox.photos}
          initialIndex={lightbox.index}
          employeeName={lightbox.name}
          onClose={() => setLightbox(null)}
        />
      )}

      <div>
        {/* Header + Search */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Employees</h1>
            <p style={s.subtitle}>
              {search.trim()
                ? `${filtered.length} of ${employees.length} employee${employees.length !== 1 ? 's' : ''} matched`
                : `${employees.length} registered employee${employees.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Search bar */}
          <div style={{ ...s.searchWrap, ...(searchFocus ? s.searchWrapFocus : {}) }}>
            <span style={s.searchIcon}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              placeholder="Search by name, ID or department..."
              style={s.searchInput}
            />
            {search && (
              <button onClick={() => setSearch('')} style={s.searchClear}>✕</button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={s.empty}>Loading employees...</div>
        ) : filtered.length === 0 ? (
          <div style={s.emptyCard}>
            <div style={s.emptyIcon}>{search ? '🔍' : '👤'}</div>
            <div style={s.emptyText}>
              {search ? `No employees found for "${search}"` : 'No employees registered yet'}
            </div>
            {search && (
              <button onClick={() => setSearch('')} style={s.clearSearchBtn}>Clear search</button>
            )}
          </div>
        ) : (
          <div style={s.grid}>
            {filtered.map(emp => {
              const isExpanded = expandedId === emp.id
              const photos = employeePhotos[emp.id] || []
              const isCardHovered = cardHover === emp.id && !isExpanded

              return (
                <div
                  key={emp.id}
                  style={{ ...s.card, ...(isExpanded ? s.cardExpanded : {}), ...(isCardHovered ? s.cardHover : {}) }}
                >
                  {/* Clickable header */}
                  <div
                    style={s.cardTop}
                    onClick={() => handleCardClick(emp)}
                    onMouseEnter={() => setCardHover(emp.id)}
                    onMouseLeave={() => setCardHover(null)}
                  >
                    <img
                      src={getPhotoUrl(emp.photo_url)}
                      alt={emp.name}
                      style={s.avatar}
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                    />
                    <div style={{ ...s.avatarFallback, display: 'none' }}>
                      {emp.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={s.cardInfo}>
                      <div style={s.empName}>{emp.name}</div>
                      <div style={s.empId}>ID: {emp.employee_id}</div>
                      <div style={s.empDept}>{emp.department || 'No Department'}</div>
                      <div style={s.photoCount}>📷 {emp.total_photos} photo{emp.total_photos !== 1 ? 's' : ''}</div>
                      {/* Salary editor — stops card click propagation internally */}
                      <SalaryEditor
                        empId={emp.id}
                        currentSalary={emp.salary}
                        onSaved={(val) => handleSalaryUpdate(emp.id, val)}
                      />
                    </div>
                    <div style={s.chevron}>{isExpanded ? '▲' : '▼'}</div>
                  </div>

                  {/* Expanded photos */}
                  {isExpanded && (
                    <div style={s.photoSection}>
                      <div style={s.photoSectionTitle}>📸 Registration Photos — click to enlarge</div>
                      {photosLoading && photos.length === 0 ? (
                        <div style={s.photoLoading}>Loading photos...</div>
                      ) : photos.length === 0 ? (
                        <div style={s.photoLoading}>No photos found.</div>
                      ) : (
                        <div style={s.photoGrid}>
                          {photos.map((url, i) => (
                            <PhotoThumb
                              key={i}
                              url={url}
                              label={angleLabels[i] || `#${i + 1}`}
                              name={emp.name}
                              onClick={() => setLightbox({ photos, index: i, name: emp.name })}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <HoverBtn
                    base={s.btnDelete}
                    hover={s.btnDeleteHover}
                    onClick={(e) => { e.stopPropagation(); handleDelete(emp.id, emp.name) }}
                  >
                    🗑 Delete Employee
                  </HoverBtn>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

function PhotoThumb({ url, label, name, onClick }) {
  const [h, setH] = useState(false)
  return (
    <div
      style={{ ...pt.wrap, ...(h ? pt.wrapHover : {}) }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      onClick={onClick}
    >
      <img
        src={url}
        alt={`${name} - ${label}`}
        style={{ ...pt.photo, ...(h ? pt.photoHover : {}) }}
        onError={e => { e.target.style.opacity = '0.2' }}
      />
      <div style={pt.label}>{label}</div>
      {h && <div style={pt.enlargeHint}>🔍</div>}
    </div>
  )
}

const pt = {
  wrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
    transition: 'transform 0.18s ease', cursor: 'pointer', position: 'relative',
  },
  wrapHover: { transform: 'scale(1.08)' },
  photo: {
    width: '100%', aspectRatio: '1 / 1', objectFit: 'cover',
    borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)',
    transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
  },
  photoHover: {
    borderColor: 'rgba(99,102,241,0.6)',
    boxShadow: '0 0 12px rgba(99,102,241,0.3)',
  },
  label: { fontSize: '9px', color: '#475569', fontWeight: '600', textTransform: 'uppercase' },
  enlargeHint: {
    position: 'absolute', top: '4px', right: '4px',
    fontSize: '12px', background: 'rgba(0,0,0,0.6)',
    borderRadius: '4px', padding: '1px 4px',
  },
}

const lb = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.88)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(6px)',
  },
  box: {
    background: 'rgba(13,18,30,0.98)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px', padding: '24px',
    display: 'flex', flexDirection: 'column', gap: '16px',
    maxWidth: '520px', width: '90vw',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  headerName: { fontSize: '15px', fontWeight: '700', color: '#f1f5f9' },
  headerLabel: { fontSize: '12px', color: '#6366f1', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' },
  closeBtn: {
    width: '32px', height: '32px', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#94a3b8', fontSize: '14px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  imgWrap: {
    position: 'relative', borderRadius: '12px', overflow: 'hidden',
    background: '#000', aspectRatio: '1 / 1',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  navBtn: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff', fontSize: '28px', fontWeight: '300',
    width: '40px', height: '40px', borderRadius: '50%',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  thumbRow: { display: 'flex', gap: '8px', justifyContent: 'center' },
  thumb: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    cursor: 'pointer', opacity: 0.5, transition: 'opacity 0.15s ease', width: '64px',
  },
  thumbActive: { opacity: 1 },
  thumbImg: { width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', border: '2px solid rgba(99,102,241,0.0)' },
  thumbLabel: { fontSize: '9px', color: '#475569', fontWeight: '600', textTransform: 'uppercase' },
  counter: { textAlign: 'center', fontSize: '12px', color: '#475569' },
}

const s = {
  header: {
    marginBottom: '32px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'flex-start',
    gap: '20px', flexWrap: 'wrap',
  },
  title: { fontSize: '28px', fontWeight: '800', color: '#f1f5f9', margin: '0 0 8px' },
  subtitle: { color: '#64748b', fontSize: '14px', margin: 0 },
  // Search
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'rgba(15,20,40,0.8)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', padding: '10px 14px',
    minWidth: '280px', transition: 'all 0.18s ease',
  },
  searchWrapFocus: {
    borderColor: 'rgba(99,102,241,0.5)',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.1)',
  },
  searchIcon: { fontSize: '14px', flexShrink: 0 },
  searchInput: {
    background: 'transparent', border: 'none', outline: 'none',
    color: '#f1f5f9', fontSize: '13px', flex: 1, minWidth: 0,
  },
  searchClear: {
    background: 'none', border: 'none', color: '#475569',
    fontSize: '12px', cursor: 'pointer', padding: '0 2px',
    flexShrink: 0,
  },
  empty: { color: '#64748b', fontSize: '14px' },
  emptyCard: {
    background: 'rgba(15,20,40,0.8)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px', padding: '60px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
  },
  emptyIcon: { fontSize: '48px' },
  emptyText: { color: '#334155', fontSize: '14px' },
  clearSearchBtn: {
    marginTop: '4px', padding: '6px 16px', borderRadius: '8px',
    border: '1px solid rgba(99,102,241,0.3)',
    background: 'rgba(99,102,241,0.08)',
    color: '#a5b4fc', fontSize: '12px', cursor: 'pointer',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  card: {
    background: 'rgba(15,20,40,0.8)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px', padding: '20px',
    display: 'flex', flexDirection: 'column', gap: '16px',
    transition: 'all 0.18s ease',
  },
  cardHover: {
    borderColor: 'rgba(255,255,255,0.12)',
    boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
    transform: 'translateY(-2px)',
  },
  cardExpanded: { borderColor: 'rgba(99,102,241,0.4)' },
  cardTop: { display: 'flex', gap: '16px', alignItems: 'center', cursor: 'pointer', userSelect: 'none' },
  avatar: {
    width: '72px', height: '72px', borderRadius: '12px',
    objectFit: 'cover', border: '2px solid rgba(255,255,255,0.08)', flexShrink: 0,
  },
  avatarFallback: {
    width: '72px', height: '72px', borderRadius: '12px',
    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
    color: '#fff', fontSize: '28px', fontWeight: '800',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
  empName: { fontSize: '15px', fontWeight: '700', color: '#f1f5f9' },
  empId: { fontSize: '12px', color: '#6366f1', fontWeight: '600' },
  empDept: { fontSize: '12px', color: '#64748b' },
  photoCount: { fontSize: '11px', color: '#475569', marginTop: '2px' },
  chevron: { color: '#475569', fontSize: '11px', flexShrink: 0 },
  photoSection: {
    borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  photoSectionTitle: {
    fontSize: '11px', fontWeight: '700', color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  photoLoading: { color: '#475569', fontSize: '13px' },
  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' },
  btnDelete: {
    width: '100%', padding: '9px 12px', borderRadius: '8px',
    border: '1px solid rgba(239,68,68,0.3)',
    background: 'rgba(239,68,68,0.08)',
    color: '#fca5a5', fontSize: '12px', fontWeight: '600',
  },
  btnDeleteHover: {
    background: 'rgba(239,68,68,0.18)', borderColor: 'rgba(239,68,68,0.5)',
    color: '#fecaca', boxShadow: '0 0 12px rgba(239,68,68,0.2)',
  },
}