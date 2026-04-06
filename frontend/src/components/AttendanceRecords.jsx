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

function TabBtn({ label, count, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ ...s.tab, ...(active ? s.tabActive : {}), ...(h && !active ? s.tabHover : {}) }}
    >
      {label}
      <span style={s.tabCount}>{count}</span>
    </button>
  )
}

function getMonthOptions() {
  const options = []
  const now = new Date()
  const start = new Date(2026, 0, 1)
  let cursor = new Date(start)
  while (cursor <= now) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const label = cursor.toLocaleString('default', { month: 'long', year: 'numeric' })
    options.push({ value: `${y}-${m}`, label })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return options.reverse()
}

export default function AttendanceRecords() {
  const monthOptions = getMonthOptions()
  const currentMonth = monthOptions[0]?.value || ''

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(new Set())
  const [deleting, setDeleting] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [searchFocus, setSearchFocus] = useState(false)

  const fetchRecords = (month, pg) => {
    setLoading(true)
    const params = { page: pg }
    if (month) params.month = month
    axios.get('http://127.0.0.1:8000/api/attendance/records/', { params })
      .then(res => {
        setRecords(res.data.records)
        setTotal(res.data.total)
        setTotalPages(res.data.total_pages)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setPage(1)
    setSelected(new Set())
    setSearch('')
    fetchRecords(selectedMonth, 1)
  }, [selectedMonth])

  useEffect(() => {
    setSelected(new Set())
    fetchRecords(selectedMonth, page)
  }, [page])

  useEffect(() => { setSelected(new Set()) }, [filter])

  // Filter by status tab first, then by search query
  const byTab = filter === 'all' ? records : records.filter(r => r.status === filter)
  const filtered = search.trim()
    ? byTab.filter(r => {
        const q = search.toLowerCase()
        return (
          r.employee_name?.toLowerCase().includes(q) ||
          r.employee_id?.toLowerCase().includes(q) ||
          r.department?.toLowerCase().includes(q)
        )
      })
    : byTab

  const getStatusStyle = (status) => {
    if (status === 'checked_in')  return { bg: 'rgba(16,185,129,0.12)',  color: '#6ee7b7', label: '✅ Checked In' }
    if (status === 'checked_out') return { bg: 'rgba(6,182,212,0.12)',   color: '#67e8f9', label: '🚪 Checked Out' }
    if (status === 'spoof')       return { bg: 'rgba(239,68,68,0.12)',   color: '#fca5a5', label: '🚨 Spoof' }
    return                               { bg: 'rgba(245,158,11,0.12)',  color: '#fcd34d', label: '❓ Unknown' }
  }

  const counts = {
    all:         records.length,
    checked_in:  records.filter(r => r.status === 'checked_in').length,
    checked_out: records.filter(r => r.status === 'checked_out').length,
    spoof:       records.filter(r => r.status === 'spoof').length,
    unknown:     records.filter(r => r.status === 'unknown').length,
  }

  const tabs = [
    { key: 'all',         label: '📋 All' },
    { key: 'checked_in',  label: '✅ Checked In' },
    { key: 'checked_out', label: '🚪 Checked Out' },
    { key: 'spoof',       label: '🚨 Spoof' },
    { key: 'unknown',     label: '❓ Unknown' },
  ]

  const isAllSelected = filtered.length > 0 && filtered.every(r => selected.has(r.id))
  const isIndeterminate = filtered.some(r => selected.has(r.id)) && !isAllSelected

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const next = new Set(selected)
      filtered.forEach(r => next.delete(r.id))
      setSelected(next)
    } else {
      const next = new Set(selected)
      filtered.forEach(r => next.add(r.id))
      setSelected(next)
    }
  }

  const toggleRow = (id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return
    try {
      await axios.delete(`http://127.0.0.1:8000/api/attendance/records/${id}/delete/`)
      setRecords(prev => prev.filter(r => r.id !== id))
      const next = new Set(selected)
      next.delete(id)
      setSelected(next)
      setTotal(t => t - 1)
    } catch (err) {
      console.error(err)
      alert('Failed to delete record.')
    }
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    if (!window.confirm(`Delete ${selected.size} selected record${selected.size > 1 ? 's' : ''}? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await axios.post('http://127.0.0.1:8000/api/attendance/records/bulk-delete/', { ids: Array.from(selected) })
      setRecords(prev => prev.filter(r => !selected.has(r.id)))
      setTotal(t => t - selected.size)
      setSelected(new Set())
    } catch (err) {
      console.error(err)
      alert('Bulk delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  const handleExport = () => {
    const url = selectedMonth
      ? `http://127.0.0.1:8000/api/attendance/export/?month=${selectedMonth}`
      : `http://127.0.0.1:8000/api/attendance/export/`
    window.open(url, '_blank')
  }

  const handlePayrollExport = () => {
    if (!selectedMonth) { alert('Please select a month first.'); return }
    window.open(`http://127.0.0.1:8000/api/attendance/export-payroll/?month=${selectedMonth}`, '_blank')
  }

  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || 'All'

  // Search result summary
  const searchActive = search.trim().length > 0
  const subtitleText = searchActive
    ? `${filtered.length} of ${total} entries matched "${search}" in ${selectedMonthLabel}`
    : `${total} total entries for ${selectedMonthLabel}`

  return (
    <div>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Attendance Records</h1>
          <p style={s.subtitle}>{subtitleText}</p>
        </div>
        <div style={s.headerRight}>
          {/* Search bar */}
          <div style={{ ...s.searchWrap, ...(searchFocus ? s.searchWrapFocus : {}) }}>
            <span style={s.searchIcon}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              placeholder="Search name, ID, department..."
              style={s.searchInput}
            />
            {search && (
              <button onClick={() => setSearch('')} style={s.searchClear}>✕</button>
            )}
          </div>
          {/* Export buttons */}
          <HoverBtn base={s.exportBtn} hover={s.exportBtnHover} onClick={handleExport}>
            📊 Export Attendance — {selectedMonthLabel}
          </HoverBtn>
          <HoverBtn base={s.payrollBtn} hover={s.payrollBtnHover} onClick={handlePayrollExport}>
            💰 Export Payroll — {selectedMonthLabel}
          </HoverBtn>
        </div>
      </div>

      {/* Month Selector */}
      <div style={s.monthRow}>
        <span style={s.monthLabel}>📅 Month</span>
        <div style={s.monthScroll}>
          {monthOptions.map(opt => (
            <MonthChip
              key={opt.value}
              opt={opt}
              active={selectedMonth === opt.value}
              onClick={() => setSelectedMonth(opt.value)}
            />
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={s.tabs}>
        {tabs.map(tab => (
          <TabBtn
            key={tab.key}
            label={tab.label}
            count={counts[tab.key]}
            active={filter === tab.key}
            onClick={() => setFilter(tab.key)}
          />
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={s.bulkBar}>
          <span style={s.bulkCount}>{selected.size} record{selected.size > 1 ? 's' : ''} selected</span>
          <div style={s.bulkActions}>
            <HoverBtn base={s.btnClearSel} hover={s.btnClearSelHover} onClick={() => setSelected(new Set())}>
              ✕ Clear Selection
            </HoverBtn>
            <HoverBtn base={s.btnBulkDelete} hover={s.btnBulkDeleteHover} onClick={handleBulkDelete} disabled={deleting}>
              {deleting ? '⏳ Deleting...' : `🗑 Delete ${selected.size} Selected`}
            </HoverBtn>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={s.card}>
        {loading ? (
          <div style={s.empty}>Loading records...</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            {searchActive
              ? `No records matched "${search}" in ${selectedMonthLabel}.`
              : `No records found for ${selectedMonthLabel}.`}
            {searchActive && (
              <button onClick={() => setSearch('')} style={s.clearSearchBtn}>Clear search</button>
            )}
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={el => { if (el) el.indeterminate = isIndeterminate }}
                    onChange={toggleSelectAll}
                    style={s.checkbox}
                    title="Select all"
                  />
                </th>
                {['Employee', 'ID', 'Department', 'Date', 'Check In', 'Check Out', 'Hours', 'Status', 'Confidence', ''].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, i) => (
                <RecordRow
                  key={record.id}
                  record={record}
                  i={i}
                  st={getStatusStyle(record.status)}
                  isSelected={selected.has(record.id)}
                  onToggle={() => toggleRow(record.id)}
                  onDelete={() => handleDelete(record.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={s.pagination}>
          <HoverBtn
            base={s.pageBtn}
            hover={s.pageBtnHover}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Prev
          </HoverBtn>
          <div style={s.pageNumbers}>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} style={s.pageDots}>…</span>
                ) : (
                  <PageNumBtn key={p} num={p} active={page === p} onClick={() => setPage(p)} />
                )
              )}
          </div>
          <HoverBtn
            base={s.pageBtn}
            hover={s.pageBtnHover}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next →
          </HoverBtn>
          <span style={s.pageInfo}>Page {page} of {totalPages} · {total} records</span>
        </div>
      )}
    </div>
  )
}

function MonthChip({ opt, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ ...s.monthChip, ...(active ? s.monthChipActive : {}), ...(h && !active ? s.monthChipHover : {}) }}
    >
      {opt.label}
    </button>
  )
}

function PageNumBtn({ num, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ ...s.pageNum, ...(active ? s.pageNumActive : {}), ...(h && !active ? s.pageNumHover : {}) }}
    >
      {num}
    </button>
  )
}

function RecordRow({ record, i, st, isSelected, onToggle, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const [delHover, setDelHover] = useState(false)

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...s.tr,
        background: isSelected
          ? 'rgba(99,102,241,0.1)'
          : hovered
            ? 'rgba(99,102,241,0.05)'
            : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
        transition: 'background 0.15s ease',
        outline: isSelected ? '1px solid rgba(99,102,241,0.25)' : 'none',
      }}
    >
      <td style={{ ...s.td, width: '40px', textAlign: 'center' }}>
        <input type="checkbox" checked={isSelected} onChange={onToggle} style={s.checkbox} />
      </td>
      <td style={s.td}>{record.employee_name}</td>
      <td style={s.td}>{record.employee_id}</td>
      <td style={s.td}>{record.department}</td>
      <td style={s.td}>{record.date}</td>
      <td style={s.td}>{record.check_in_time_str}</td>
      <td style={s.td}>{record.check_out_time_str}</td>
      <td style={s.td}>{record.hours_worked > 0 ? `${record.hours_worked}h` : '-'}</td>
      <td style={s.td}>
        <span style={{ ...s.badge, background: st.bg, color: st.color }}>{st.label}</span>
      </td>
      <td style={s.td}>
        {record.confidence > 0 ? (
          <div style={s.confWrap}>
            <div style={s.confBar}>
              <div style={{ ...s.confFill, width: `${record.confidence * 100}%`, background: record.confidence > 0.7 ? '#10b981' : '#f59e0b' }} />
            </div>
            <span style={s.confText}>{(record.confidence * 100).toFixed(0)}%</span>
          </div>
        ) : '-'}
      </td>
      <td style={{ ...s.td, width: '40px', textAlign: 'center' }}>
        <button
          onClick={onDelete}
          onMouseEnter={() => setDelHover(true)}
          onMouseLeave={() => setDelHover(false)}
          title="Delete record"
          style={{
            ...s.delBtn,
            ...(delHover ? s.delBtnHover : {}),
            opacity: hovered || isSelected ? 1 : 0.1,
          }}
        >
          🗑
        </button>
      </td>
    </tr>
  )
}

const s = {
  header: {
    marginBottom: '24px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'flex-start',
    gap: '16px', flexWrap: 'wrap',
  },
  title: { fontSize: '28px', fontWeight: '800', color: '#f1f5f9', margin: '0 0 8px' },
  subtitle: { color: '#64748b', fontSize: '14px', margin: 0 },
  headerRight: {
    display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap',
  },

  // Search
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'rgba(15,20,40,0.8)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', padding: '8px 12px',
    minWidth: '220px', transition: 'all 0.18s ease',
  },
  searchWrapFocus: {
    borderColor: 'rgba(99,102,241,0.5)',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.1)',
  },
  searchIcon: { fontSize: '13px', flexShrink: 0 },
  searchInput: {
    background: 'transparent', border: 'none', outline: 'none',
    color: '#f1f5f9', fontSize: '13px', flex: 1, minWidth: 0,
  },
  searchClear: {
    background: 'none', border: 'none', color: '#475569',
    fontSize: '12px', cursor: 'pointer', padding: '0 2px', flexShrink: 0,
  },
  clearSearchBtn: {
    display: 'block', margin: '10px auto 0',
    padding: '6px 16px', borderRadius: '8px',
    border: '1px solid rgba(99,102,241,0.3)',
    background: 'rgba(99,102,241,0.08)',
    color: '#a5b4fc', fontSize: '12px', cursor: 'pointer',
  },

  exportBtn: {
    padding: '10px 20px', borderRadius: '10px',
    border: '1px solid rgba(16,185,129,0.3)',
    background: 'rgba(16,185,129,0.08)',
    color: '#6ee7b7', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap',
  },
  exportBtnHover: {
    background: 'rgba(16,185,129,0.18)', borderColor: 'rgba(16,185,129,0.5)',
    color: '#a7f3d0', boxShadow: '0 0 12px rgba(16,185,129,0.2)',
    transform: 'translateY(-1px)',
  },
  payrollBtn: {
    padding: '10px 20px', borderRadius: '10px',
    border: '1px solid rgba(245,158,11,0.3)',
    background: 'rgba(245,158,11,0.08)',
    color: '#fcd34d', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap',
  },
  payrollBtnHover: {
    background: 'rgba(245,158,11,0.18)', borderColor: 'rgba(245,158,11,0.5)',
    color: '#fde68a', boxShadow: '0 0 12px rgba(245,158,11,0.2)',
    transform: 'translateY(-1px)',
  },

  monthRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  monthLabel: { fontSize: '12px', fontWeight: '700', color: '#475569', whiteSpace: 'nowrap' },
  monthScroll: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' },
  monthChip: {
    padding: '6px 14px', borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'transparent', color: '#64748b',
    fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap',
    cursor: 'pointer', transition: 'all 0.18s ease', flexShrink: 0,
  },
  monthChipActive: { background: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.4)', color: '#a5b4fc' },
  monthChipHover: { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.14)', color: '#94a3b8' },

  tabs: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  tab: {
    padding: '8px 16px', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'transparent', color: '#64748b',
    fontSize: '13px', fontWeight: '600',
    display: 'flex', alignItems: 'center', gap: '6px',
    transition: 'all 0.18s ease',
  },
  tabHover: { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.14)', color: '#94a3b8' },
  tabActive: { background: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.3)', color: '#a5b4fc' },
  tabCount: { background: 'rgba(255,255,255,0.08)', borderRadius: '999px', padding: '1px 7px', fontSize: '11px' },

  bulkBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
    borderRadius: '10px', padding: '10px 16px', marginBottom: '12px',
  },
  bulkCount: { fontSize: '13px', fontWeight: '600', color: '#a5b4fc' },
  bulkActions: { display: 'flex', gap: '8px' },
  btnClearSel: {
    padding: '7px 14px', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent', color: '#64748b', fontSize: '12px', fontWeight: '600',
  },
  btnClearSelHover: { borderColor: 'rgba(255,255,255,0.2)', color: '#94a3b8', background: 'rgba(255,255,255,0.04)' },
  btnBulkDelete: {
    padding: '7px 16px', borderRadius: '8px',
    border: '1px solid rgba(239,68,68,0.35)',
    background: 'rgba(239,68,68,0.1)',
    color: '#fca5a5', fontSize: '12px', fontWeight: '600',
  },
  btnBulkDeleteHover: {
    background: 'rgba(239,68,68,0.2)', borderColor: 'rgba(239,68,68,0.5)',
    color: '#fecaca', boxShadow: '0 0 10px rgba(239,68,68,0.2)',
  },

  card: {
    background: 'rgba(15,20,40,0.8)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px', overflow: 'auto', marginBottom: '16px',
  },
  empty: { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '960px' },
  th: {
    padding: '14px 12px', textAlign: 'left',
    fontSize: '11px', fontWeight: '700', color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.04)' },
  td: { padding: '11px 12px', fontSize: '13px', color: '#cbd5e1', whiteSpace: 'nowrap' },
  checkbox: { width: '15px', height: '15px', cursor: 'pointer', accentColor: '#6366f1' },
  badge: { padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' },
  confWrap: { display: 'flex', alignItems: 'center', gap: '8px' },
  confBar: { width: '52px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' },
  confFill: { height: '100%', borderRadius: '999px', transition: 'width 0.3s' },
  confText: { fontSize: '12px', color: '#94a3b8' },
  delBtn: {
    background: 'transparent', border: 'none',
    fontSize: '14px', cursor: 'pointer',
    padding: '4px 6px', borderRadius: '6px',
    transition: 'all 0.15s ease',
  },
  delBtnHover: { background: 'rgba(239,68,68,0.15)' },

  pagination: { display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' },
  pageBtn: {
    padding: '8px 16px', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent', color: '#64748b', fontSize: '13px', fontWeight: '600',
  },
  pageBtnHover: { borderColor: 'rgba(255,255,255,0.2)', color: '#94a3b8', background: 'rgba(255,255,255,0.04)' },
  pageNumbers: { display: 'flex', gap: '4px', alignItems: 'center' },
  pageNum: {
    width: '36px', height: '36px', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'transparent', color: '#64748b',
    fontSize: '13px', fontWeight: '600',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.18s ease',
  },
  pageNumActive: { background: 'rgba(99,102,241,0.2)', borderColor: 'rgba(99,102,241,0.4)', color: '#a5b4fc' },
  pageNumHover: { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.14)', color: '#94a3b8' },
  pageDots: { color: '#334155', fontSize: '14px', padding: '0 4px' },
  pageInfo: { fontSize: '12px', color: '#475569', marginLeft: '8px' },
}