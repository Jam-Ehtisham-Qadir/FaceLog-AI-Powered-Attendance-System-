import { useState, useRef, useCallback } from 'react'
import axios from 'axios'

export default function MarkAttendance() {
  const [mode, setMode] = useState('upload') // 'upload' or 'webcam'
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [webcamActive, setWebcamActive] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      setPreview(URL.createObjectURL(file))
      setResult(null)
    }
  }

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      setWebcamActive(true)
    } catch (err) {
      alert('Could not access webcam. Please allow camera permission.')
    }
  }

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setWebcamActive(false)
  }

  const captureFromWebcam = () => {
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    canvas.toBlob(blob => {
      const file = new File([blob], 'webcam_capture.jpg', { type: 'image/jpeg' })
      setPhoto(file)
      setPreview(URL.createObjectURL(blob))
      setResult(null)
      stopWebcam()
    }, 'image/jpeg', 0.95)
  }

  const handleSubmit = async () => {
    if (!photo) {
      setResult({ status: 'error', message: 'Please provide a photo first.' })
      return
    }
    setLoading(true)
    setResult(null)
    const formData = new FormData()
    formData.append('photo', photo)
    try {
      const res = await axios.post('/api/attendance/mark/', formData)
      setResult(res.data)
    } catch (err) {
      setResult({ status: 'error', message: err.response?.data?.error || 'Something went wrong.' })
    } finally {
      setLoading(false)
    }
  }

  const getResultStyle = () => {
    if (!result) return { bg: '', border: '', color: '' }
    if (result.status === 'present') return { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: '#6ee7b7' }
    if (result.status === 'spoof') return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#fca5a5' }
    if (result.status === 'duplicate') return { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: '#fcd34d' }
    if (result.status === 'unknown') return { bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)', color: '#94a3b8' }
    return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#fca5a5' }
  }

  const rs = getResultStyle()

  const ConfidenceMeter = ({ label, value, color }) => (
    <div style={s.meter}>
      <div style={s.meterHeader}>
        <span style={s.meterLabel}>{label}</span>
        <span style={{ ...s.meterValue, color }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div style={s.meterTrack}>
        <div style={{ ...s.meterFill, width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  )

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>Mark Attendance</h1>
        <p style={s.subtitle}>AI-powered face verification with anti-spoofing</p>
      </div>

      {/* Mode Toggle */}
      <div style={s.modeToggle}>
        <button
          onClick={() => { setMode('upload'); stopWebcam(); setPhoto(null); setPreview(null); setResult(null) }}
          style={{ ...s.modeBtn, ...(mode === 'upload' ? s.modeBtnActive : {}) }}
        >
          📁 Upload Photo
        </button>
        <button
          onClick={() => { setMode('webcam'); setPhoto(null); setPreview(null); setResult(null) }}
          style={{ ...s.modeBtn, ...(mode === 'webcam' ? s.modeBtnActive : {}) }}
        >
          📷 Use Webcam
        </button>
      </div>

      <div style={s.grid}>
        {/* Left: Capture Section */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>
            {mode === 'upload' ? '📁 Upload Photo' : '📷 Webcam Capture'}
          </h3>

          {mode === 'upload' ? (
            <label style={s.uploadBox}>
              <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              {preview ? (
                <img src={preview} alt="Captured" style={s.previewImg} />
              ) : (
                <div style={s.uploadPlaceholder}>
                  <div style={s.uploadIcon}>📸</div>
                  <div style={s.uploadText}>Click to upload photo</div>
                  <div style={s.uploadHint}>JPG, PNG supported</div>
                </div>
              )}
            </label>
          ) : (
            <div style={s.webcamBox}>
              {preview ? (
                <img src={preview} alt="Captured" style={s.previewImg} />
              ) : (
                <video ref={videoRef} autoPlay playsInline style={{ ...s.previewImg, display: webcamActive ? 'block' : 'none' }} />
              )}
              {!webcamActive && !preview && (
                <div style={s.uploadPlaceholder}>
                  <div style={s.uploadIcon}>📷</div>
                  <div style={s.uploadText}>Click Start Camera below</div>
                </div>
              )}
            </div>
          )}

          {/* Webcam Controls */}
          {mode === 'webcam' && (
            <div style={s.webcamControls}>
              {!webcamActive && !preview && (
                <button onClick={startWebcam} style={s.btnGreen}>▶ Start Camera</button>
              )}
              {webcamActive && (
                <>
                  <button onClick={captureFromWebcam} style={s.btn}>📸 Capture Photo</button>
                  <button onClick={stopWebcam} style={s.btnOutline}>✕ Stop</button>
                </>
              )}
              {preview && (
                <button onClick={() => { setPhoto(null); setPreview(null); setResult(null) }} style={s.btnOutline}>🔄 Retake</button>
              )}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !photo}
            style={{ ...s.btn, ...(loading || !photo ? s.btnDisabled : {}) }}
          >
            {loading ? '🔍 Verifying...' : '✅ Mark Attendance'}
          </button>

          {loading && (
            <div style={s.loadingSteps}>
              <div style={s.loadingStep}>🔍 Running anti-spoofing check with GPT-4o Vision...</div>
              <div style={s.loadingStep}>🧠 Matching face against registered employees...</div>
              <div style={s.loadingStep}>📝 Recording attendance...</div>
            </div>
          )}
        </div>

        {/* Right: Result Section */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>📊 Verification Result</h3>

          {!result && !loading && (
            <div style={s.emptyResult}>
              <div style={s.emptyIcon}>🤖</div>
              <div style={s.emptyText}>Result will appear here after verification</div>
            </div>
          )}

          {result && (
            <div style={{ ...s.resultBox, background: rs.bg, borderColor: rs.border }}>
              <div style={s.resultIcon}>
                {result.status === 'present' && '✅'}
                {result.status === 'spoof' && '🚨'}
                {result.status === 'unknown' && '❓'}
                {result.status === 'duplicate' && '⚠️'}
                {result.status === 'error' && '⚠️'}
              </div>
              <div style={{ ...s.resultStatus, color: rs.color }}>
                {result.status === 'present' && 'Attendance Marked'}
                {result.status === 'spoof' && 'Spoof Detected'}
                {result.status === 'unknown' && 'Face Not Recognized'}
                {result.status === 'duplicate' && 'Already Marked Today'}
                {result.status === 'error' && 'Error'}
              </div>
              <div style={s.resultMessage}>{result.message}</div>

              {/* Confidence Meters */}
              {result.liveness_confidence !== undefined && (
                <div style={s.meters}>
                  <ConfidenceMeter
                    label="Liveness Score"
                    value={result.liveness_confidence}
                    color="#10b981"
                  />
                  {result.spoof_confidence !== undefined && (
                    <ConfidenceMeter
                      label="Spoof Risk"
                      value={result.spoof_confidence}
                      color="#ef4444"
                    />
                  )}
                  {result.confidence !== undefined && result.status === 'present' && (
                    <ConfidenceMeter
                      label="Face Match"
                      value={result.confidence}
                      color="#6366f1"
                    />
                  )}
                </div>
              )}

              {/* Employee Info */}
              {(result.status === 'present' || result.status === 'duplicate') && result.employee && (
                <div style={s.employeeInfo}>
                  {[
                    { label: 'Name', value: result.employee.name },
                    { label: 'ID', value: result.employee.employee_id },
                    { label: 'Department', value: result.employee.department || '-' },
                  ].map(row => (
                    <div key={row.label} style={s.infoRow}>
                      <span style={s.infoLabel}>{row.label}</span>
                      <span style={s.infoValue}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.status === 'spoof' && result.reason && (
                <div style={s.spoofReason}>
                  <span style={s.infoLabel}>Reason: </span>
                  <span style={{ color: '#fca5a5', fontSize: '13px' }}>{result.reason}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  header: { marginBottom: '24px' },
  title: { fontSize: '28px', fontWeight: '800', color: '#f1f5f9', margin: '0 0 8px' },
  subtitle: { color: '#64748b', fontSize: '14px', margin: 0 },
  modeToggle: { display: 'flex', gap: '8px', marginBottom: '20px' },
  modeBtn: {
    padding: '10px 20px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'transparent', color: '#64748b',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  modeBtnActive: {
    background: 'rgba(99,102,241,0.12)',
    borderColor: 'rgba(99,102,241,0.3)',
    color: '#a5b4fc',
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  card: {
    background: 'rgba(15,20,40,0.8)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px', padding: '28px',
    display: 'flex', flexDirection: 'column', gap: '16px',
  },
  cardTitle: { fontSize: '15px', fontWeight: '700', color: '#e2e8f0', margin: 0 },
  uploadBox: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px dashed rgba(255,255,255,0.1)',
    borderRadius: '12px', overflow: 'hidden',
    cursor: 'pointer', minHeight: '220px',
  },
  webcamBox: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid rgba(255,255,255,0.06)',
    borderRadius: '12px', overflow: 'hidden', minHeight: '220px',
  },
  previewImg: { width: '100%', height: '220px', objectFit: 'cover', display: 'block' },
  uploadPlaceholder: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '10px', padding: '40px',
  },
  uploadIcon: { fontSize: '40px' },
  uploadText: { color: '#94a3b8', fontSize: '14px', fontWeight: '500' },
  uploadHint: { color: '#334155', fontSize: '12px' },
  webcamControls: { display: 'flex', gap: '8px' },
  btn: {
    padding: '13px', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
    color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', flex: 1,
  },
  btnGreen: {
    padding: '13px', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #10b981, #06b6d4)',
    color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', flex: 1,
  },
  btnOutline: {
    padding: '13px 16px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent', color: '#94a3b8',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  btnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  loadingSteps: { display: 'flex', flexDirection: 'column', gap: '8px' },
  loadingStep: { color: '#64748b', fontSize: '12px' },
  emptyResult: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '12px', minHeight: '200px',
  },
  emptyIcon: { fontSize: '48px' },
  emptyText: { color: '#334155', fontSize: '13px' },
  resultBox: {
    border: '1px solid', borderRadius: '12px', padding: '24px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
  },
  resultIcon: { fontSize: '44px' },
  resultStatus: { fontSize: '20px', fontWeight: '800' },
  resultMessage: { color: '#94a3b8', fontSize: '13px', textAlign: 'center' },
  meters: { width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' },
  meter: { width: '100%' },
  meterHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  meterLabel: { color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' },
  meterValue: { fontSize: '12px', fontWeight: '700' },
  meterTrack: { height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: '999px', transition: 'width 0.5s ease' },
  employeeInfo: {
    width: '100%', background: 'rgba(255,255,255,0.03)',
    borderRadius: '10px', padding: '14px',
    display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px',
  },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { color: '#e2e8f0', fontSize: '13px', fontWeight: '600' },
  spoofReason: { marginTop: '4px', textAlign: 'center' },
}