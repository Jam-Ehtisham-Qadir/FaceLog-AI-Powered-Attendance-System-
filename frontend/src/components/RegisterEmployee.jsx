import { useState, useEffect, useRef } from 'react'
import * as faceapi from 'face-api.js'
import axios from 'axios'

const STEPS = [
  { id: 'straight', instruction: 'Look straight at the camera', icon: '😐', voice: 'Look straight at the camera, then press Capture' },
  { id: 'left',     instruction: 'Slowly turn your head left',   icon: '👈', voice: 'Slowly turn your head to the left, then press Capture' },
  { id: 'right',    instruction: 'Slowly turn your head right',  icon: '👉', voice: 'Slowly turn your head to the right, then press Capture' },
  { id: 'up',       instruction: 'Tilt your head slightly up',   icon: '☝️', voice: 'Tilt your head slightly upward, then press Capture' },
  { id: 'down',     instruction: 'Tilt your head slightly down', icon: '👇', voice: 'Tilt your head slightly downward, then press Capture' },
]

function HoverBtn({ base, hover, children, onClick, disabled, type }) {
  const [h, setH] = useState(false)
  return (
    <button
      type={type || 'button'}
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

export default function RegisterEmployee() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const detectionLoopRef = useRef(null)

  const [form, setForm] = useState({ name: '', employee_id: '', department: '', salary: '' })
  const [phase, setPhase] = useState('form') // form | capture | done
  const [camReady, setCamReady] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [capturedPhotos, setCapturedPhotos] = useState([])
  const [capturedPreviews, setCapturedPreviews] = useState([])
  const [justCaptured, setJustCaptured] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)       // { success, message }
  const [duplicate, setDuplicate] = useState(null) // { name, employee_id, department, confidence }

  useEffect(() => {
    faceapi.nets.tinyFaceDetector.loadFromUri('/models')
      .then(() => setModelsLoaded(true))
      .catch(() => setModelsLoaded(true))
  }, [])

  const speak = (text) => {
    try {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(text)
      utt.rate = 0.9
      window.speechSynthesis.speak(utt)
    } catch (e) {}
  }

  const startCapture = async () => {
    if (!form.name || !form.employee_id || !form.salary) {
      setResult({ success: false, message: 'Please fill in Name, Employee ID and Salary first.' })
      return
    }

    // Check duplicate ID before opening camera
    setResult(null)
    setDuplicate(null)
    try {
      const check = await axios.get(`http://127.0.0.1:8000/api/employees/`)
      const exists = check.data.some(emp => emp.employee_id === form.employee_id.trim())
      if (exists) {
        setResult({ success: false, message: `⚠️ Employee ID '${form.employee_id}' is already taken. Please use a different ID.` })
        return
      }
    } catch (err) {
      // If check fails, proceed anyway — backend will catch it
    }

    setCapturedPhotos([])
    setCapturedPreviews([])
    setCurrentStep(0)
    setJustCaptured(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      streamRef.current = stream
      setPhase('capture')
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().then(() => setCamReady(true)).catch(console.error)
        }
      }, 150)
    } catch (err) {
      console.error('Camera error:', err)
    }
  }

  const stopCamera = () => {
    if (detectionLoopRef.current) cancelAnimationFrame(detectionLoopRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCamReady(false)
    setFaceDetected(false)
  }

  useEffect(() => {
    if (phase === 'capture' && currentStep < STEPS.length) {
      setTimeout(() => speak(STEPS[currentStep].voice), 400)
      setJustCaptured(false)
    }
  }, [currentStep, phase])

  useEffect(() => {
    if (!camReady || !modelsLoaded || phase !== 'capture') return

    const detect = async () => {
      if (!videoRef.current || !canvasRef.current) return

      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 })
      )

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (detection) {
        setFaceDetected(true)
        const { x, y, width, height } = detection.box
        const rx = canvas.width - x - width
        const color = justCaptured ? '#6366f1' : '#00ff88'

        ctx.strokeStyle = color
        ctx.lineWidth = 3
        ctx.shadowColor = color
        ctx.shadowBlur = 12
        ctx.strokeRect(rx, y, width, height)
        ctx.shadowBlur = 0

        const cs = 16
        ctx.lineWidth = 4
        ;[
          [rx, y, cs, 0, 0, cs],
          [rx + width, y, -cs, 0, 0, cs],
          [rx, y + height, cs, 0, 0, -cs],
          [rx + width, y + height, -cs, 0, 0, -cs],
        ].forEach(([px, py, dx1, _, dx2, dy2]) => {
          ctx.beginPath()
          ctx.moveTo(px + dx1, py)
          ctx.lineTo(px, py)
          ctx.lineTo(px, py + dy2)
          ctx.stroke()
        })

        const label = justCaptured ? '✓ Captured!' : '✓ Face Detected'
        const labelW = justCaptured ? 110 : 125
        ctx.fillStyle = justCaptured ? 'rgba(99,102,241,0.9)' : 'rgba(0,255,136,0.9)'
        ctx.fillRect(rx, Math.max(y - 30, 4), labelW, 24)
        ctx.fillStyle = justCaptured ? '#fff' : '#000'
        ctx.font = 'bold 12px Inter, sans-serif'
        ctx.fillText(label, rx + 6, Math.max(y - 30, 4) + 16)
      } else {
        setFaceDetected(false)
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'
        ctx.lineWidth = 1
        ctx.setLineDash([6, 6])
        ctx.strokeRect(160, 60, 320, 340)
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(255,255,255,0.15)'
        ctx.font = '13px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Position your face in the frame', canvas.width / 2, canvas.height - 16)
        ctx.textAlign = 'left'
      }

      detectionLoopRef.current = requestAnimationFrame(detect)
    }

    detectionLoopRef.current = requestAnimationFrame(detect)
    return () => cancelAnimationFrame(detectionLoopRef.current)
  }, [camReady, modelsLoaded, phase, justCaptured])

  const captureFrame = () => {
    if (!videoRef.current || !faceDetected) return
    speak('Captured!')
    setJustCaptured(true)

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    const preview = canvas.toDataURL('image/jpeg', 0.95)

    canvas.toBlob((blob) => {
      setCapturedPhotos(prev => [...prev, blob])
      setCapturedPreviews(prev => [...prev, preview])

      setTimeout(() => {
        const next = currentStep + 1
        if (next >= STEPS.length) {
          stopCamera()
          setPhase('done')
          speak('All angles captured! Please click Register Employee to complete registration.')
        } else {
          setCurrentStep(next)
        }
      }, 800)
    }, 'image/jpeg', 0.95)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.employee_id || capturedPhotos.length === 0) {
      setResult({ success: false, message: 'Please complete face capture first.' })
      return
    }
    setLoading(true)
    setResult(null)
    setDuplicate(null)

    const formData = new FormData()
    formData.append('name', form.name)
    formData.append('employee_id', form.employee_id)
    formData.append('department', form.department)
    formData.append('salary', form.salary)
    formData.append('photo', capturedPhotos[0], 'photo_straight.jpg')

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/employees/', formData)
      const employeeId = res.data.employee.id

      if (capturedPhotos.length > 1) {
        const extraData = new FormData()
        capturedPhotos.slice(1).forEach((blob, i) => {
          extraData.append('photos', blob, `photo_${STEPS[i + 1].id}.jpg`)
        })
        await axios.post(`http://127.0.0.1:8000/api/employees/${employeeId}/add-photos/`, extraData)
      }

      speak(`${form.name} has been registered successfully!`)
      setResult({ success: true, message: `✅ ${form.name} registered with ${capturedPhotos.length} face angles!` })
      setForm({ name: '', employee_id: '', department: '', salary: '' })
      setCapturedPhotos([])
      setCapturedPreviews([])
      setPhase('form')
      setCurrentStep(0)

    } catch (err) {
      // Duplicate employee ID
      if (err.response?.status === 409 && err.response?.data?.error === 'duplicate_id') {
        setResult({ success: false, message: `⚠️ ${err.response.data.message}` })
      }
      // Duplicate face
      else if (err.response?.status === 409 && err.response?.data?.error === 'duplicate_face') {
        const data = err.response.data
        setDuplicate({
          name: data.existing_employee.name,
          employee_id: data.existing_employee.employee_id,
          department: data.existing_employee.department,
          confidence: data.confidence,
        })
        speak(`This face is already registered as ${data.existing_employee.name}.`)
      }
      // Other errors
      else {
        const errors = err.response?.data?.errors
        const msg = errors ? Object.values(errors).flat().join(', ') : 'Registration failed.'
        setResult({ success: false, message: msg })
      }
    } finally {
      setLoading(false)
    }
  }

  const resetCapture = () => {
    stopCamera()
    setCapturedPhotos([])
    setCapturedPreviews([])
    setCurrentStep(0)
    setPhase('form')
    setResult(null)
    setDuplicate(null)
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>Register Employee</h1>
        <p style={s.subtitle}>Multi-angle face registration for accurate attendance</p>
      </div>

      <div style={s.grid}>
        {/* Left: Form */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>👤 Employee Details</h3>

          {[
              { label: 'Full Name *', name: 'name', placeholder: 'e.g. John Smith' },
              { label: 'Employee ID *', name: 'employee_id', placeholder: 'e.g. EMP001' },
              { label: 'Department', name: 'department', placeholder: 'e.g. Engineering' },
              { label: 'Monthly Salary (PKR) *', name: 'salary', placeholder: 'e.g. 50000', type: 'number' },
          ].map(field => (
            <div key={field.name} style={s.field}>
              <label style={s.label}>{field.label}</label>
              <input
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                type={field.type || 'text'}
                style={s.input}
                disabled={phase === 'capture'}
              />
            </div>
          ))}

          {/* Step indicators */}
          <div style={s.stepsWrap}>
            <div style={s.stepsLabel}>Face Angles Progress</div>
            <div style={s.stepsRow}>
              {STEPS.map((step, i) => {
                const done = capturedPreviews[i]
                const active = phase === 'capture' && currentStep === i
                return (
                  <div key={step.id} style={{
                    ...s.stepDot,
                    background: done ? 'rgba(16,185,129,0.15)' : active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${done ? '#10b981' : active ? '#a5b4fc' : 'transparent'}`,
                  }}>
                    {done
                      ? <img src={capturedPreviews[i]} alt={step.id} style={s.stepThumb} />
                      : <span style={{ fontSize: '18px' }}>{step.icon}</span>
                    }
                    <div style={{ ...s.stepLabel, color: done ? '#10b981' : active ? '#a5b4fc' : '#334155' }}>
                      {step.id}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {phase === 'form' && (
            <HoverBtn base={s.btnStart} hover={s.btnStartHover} onClick={startCapture}>
              📷 Start Face Registration
            </HoverBtn>
          )}

          {phase === 'done' && (
            <>
              <HoverBtn
                base={s.btnRegister}
                hover={s.btnRegisterHover}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? '⏳ Registering...' : `✅ Register Employee (${capturedPhotos.length} photos)`}
              </HoverBtn>
              <HoverBtn base={s.btnCancel} hover={s.btnCancelHover} onClick={resetCapture}>
                🔄 Retake Photos
              </HoverBtn>
            </>
          )}

          {/* Generic result message */}
          {result && (
            <div style={{
              ...s.result,
              background: result.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              borderColor: result.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
              color: result.success ? '#6ee7b7' : '#fca5a5',
            }}>
              {result.message}
            </div>
          )}

          {/* Duplicate face warning card */}
          {duplicate && (
            <div style={s.duplicateCard}>
              <div style={s.duplicateHeader}>
                <span style={s.duplicateIcon}>⚠️</span>
                <div>
                  <div style={s.duplicateTitle}>Face Already Registered</div>
                  <div style={s.duplicateSub}>This face matches an existing employee record</div>
                </div>
              </div>
              <div style={s.duplicateBody}>
                <div style={s.duplicateRow}>
                  <span style={s.duplicateKey}>Name</span>
                  <span style={s.duplicateVal}>{duplicate.name}</span>
                </div>
                <div style={s.duplicateRow}>
                  <span style={s.duplicateKey}>Employee ID</span>
                  <span style={s.duplicateVal}>{duplicate.employee_id}</span>
                </div>
                <div style={s.duplicateRow}>
                  <span style={s.duplicateKey}>Department</span>
                  <span style={s.duplicateVal}>{duplicate.department || '—'}</span>
                </div>
                <div style={s.duplicateRow}>
                  <span style={s.duplicateKey}>Match Confidence</span>
                  <span style={{ ...s.duplicateVal, color: '#fbbf24', fontWeight: '700' }}>{duplicate.confidence}%</span>
                </div>
              </div>
              <div style={s.duplicateHint}>
                To re-register this person, go to <strong>Employees</strong> and delete the existing record first.
              </div>
              <HoverBtn
                base={s.btnRetake}
                hover={s.btnRetakeHover}
                onClick={resetCapture}
              >
                🔄 Try Different Person
              </HoverBtn>
            </div>
          )}
        </div>

        {/* Right: Camera */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>🎥 Live Face Capture</h3>

          {phase === 'capture' && (
            <>
              <div style={s.instructionBanner}>
                <span style={s.instructionIcon}>{STEPS[currentStep]?.icon}</span>
                <div>
                  <div style={s.instructionText}>{STEPS[currentStep]?.instruction}</div>
                  <div style={s.instructionSub}>Step {currentStep + 1} of {STEPS.length} — then press Capture</div>
                </div>
              </div>

              <div style={s.progressTrack}>
                <div style={{ ...s.progressFill, width: `${(capturedPreviews.length / STEPS.length) * 100}%` }} />
              </div>

              <div style={s.videoWrap}>
                <video ref={videoRef} style={s.video} muted playsInline autoPlay />
                <canvas ref={canvasRef} width={640} height={480} style={s.canvas} />
              </div>

              <HoverBtn
                base={{ ...s.btnCapture, background: faceDetected ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'rgba(255,255,255,0.05)', ...(faceDetected ? {} : s.btnDisabled) }}
                hover={faceDetected ? s.btnCaptureHover : {}}
                onClick={captureFrame}
                disabled={!faceDetected}
              >
                {faceDetected ? `📸 Capture — ${STEPS[currentStep]?.instruction}` : '⚪ Position your face first...'}
              </HoverBtn>

              <HoverBtn base={s.btnCancel} hover={s.btnCancelHover} onClick={resetCapture}>
                ✕ Cancel
              </HoverBtn>
            </>
          )}

          {phase === 'done' && (
            <div style={s.doneWrap}>
              <div style={{ fontSize: '48px' }}>🎉</div>
              <div style={s.doneTitle}>All 5 angles captured!</div>
              <div style={s.doneSub}>Click Register Employee to complete</div>
              <div style={s.thumbsGrid}>
                {capturedPreviews.map((src, i) => (
                  <div key={i} style={s.thumbWrap}>
                    <img src={src} alt={STEPS[i].id} style={s.thumb} />
                    <div style={s.thumbLabel}>{STEPS[i].icon} {STEPS[i].id}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {phase === 'form' && (
            <div style={s.placeholder}>
              <div style={{ fontSize: '48px' }}>🧠</div>
              <div style={s.placeholderTitle}>Multi-Angle Face Registration</div>
              <div style={s.placeholderSteps}>
                {STEPS.map((step, i) => (
                  <div key={i} style={s.placeholderStep}>
                    <span>{step.icon}</span>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>{step.instruction}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  header: { marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: '800', color: '#f1f5f9', margin: '0 0 8px' },
  subtitle: { color: '#64748b', fontSize: '14px', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  card: { background: 'rgba(15,20,40,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' },
  cardTitle: { fontSize: '15px', fontWeight: '700', color: '#e2e8f0', margin: 0 },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' },
  input: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#e2e8f0', fontSize: '14px', padding: '12px 16px', outline: 'none', fontFamily: 'inherit' },
  stepsWrap: { display: 'flex', flexDirection: 'column', gap: '8px' },
  stepsLabel: { fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' },
  stepsRow: { display: 'flex', gap: '6px' },
  stepDot: { flex: 1, borderRadius: '10px', padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', overflow: 'hidden' },
  stepThumb: { width: '100%', height: '36px', objectFit: 'cover', borderRadius: '6px' },
  stepLabel: { fontSize: '10px', fontWeight: '600', textAlign: 'center' },

  // Buttons
  btnStart: { padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', color: '#fff', fontSize: '14px', fontWeight: '700' },
  btnStartHover: { opacity: 0.88, transform: 'translateY(-1px)', boxShadow: '0 6px 20px rgba(99,102,241,0.35)' },
  btnRegister: { padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff', fontSize: '14px', fontWeight: '700' },
  btnRegisterHover: { opacity: 0.88, transform: 'translateY(-1px)', boxShadow: '0 6px 20px rgba(16,185,129,0.35)' },
  btnCapture: { padding: '14px', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '700' },
  btnCaptureHover: { opacity: 0.88, transform: 'translateY(-1px)', boxShadow: '0 6px 20px rgba(6,182,212,0.3)' },
  btnCancel: { padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#64748b', fontSize: '13px' },
  btnCancelHover: { borderColor: 'rgba(255,255,255,0.2)', color: '#94a3b8', background: 'rgba(255,255,255,0.04)' },
  btnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  btnRetake: { width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)', color: '#fcd34d', fontSize: '13px', fontWeight: '600' },
  btnRetakeHover: { background: 'rgba(245,158,11,0.16)', borderColor: 'rgba(245,158,11,0.5)', color: '#fde68a' },

  result: { padding: '12px 16px', borderRadius: '10px', border: '1px solid', fontSize: '14px' },

  // Duplicate face card
  duplicateCard: {
    background: 'rgba(245,158,11,0.06)',
    border: '1px solid rgba(245,158,11,0.3)',
    borderRadius: '12px', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  duplicateHeader: { display: 'flex', alignItems: 'flex-start', gap: '10px' },
  duplicateIcon: { fontSize: '22px', flexShrink: 0, marginTop: '1px' },
  duplicateTitle: { fontSize: '14px', fontWeight: '700', color: '#fcd34d' },
  duplicateSub: { fontSize: '12px', color: '#92400e', marginTop: '2px' },
  duplicateBody: { display: 'flex', flexDirection: 'column', gap: '6px' },
  duplicateRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' },
  duplicateKey: { fontSize: '12px', color: '#78716c', fontWeight: '600' },
  duplicateVal: { fontSize: '13px', color: '#e2e8f0', fontWeight: '600' },
  duplicateHint: { fontSize: '12px', color: '#78716c', lineHeight: 1.5 },

  instructionBanner: { display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '14px 18px' },
  instructionIcon: { fontSize: '32px', flexShrink: 0 },
  instructionText: { fontSize: '15px', fontWeight: '700', color: '#e2e8f0' },
  instructionSub: { fontSize: '12px', color: '#64748b', marginTop: '3px' },
  progressTrack: { height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)', borderRadius: '999px', transition: 'width 0.4s ease' },
  videoWrap: { position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#000' },
  video: { width: '100%', display: 'block', transform: 'scaleX(-1)' },
  canvas: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' },
  doneWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '8px 0' },
  doneTitle: { fontSize: '18px', fontWeight: '800', color: '#f1f5f9' },
  doneSub: { fontSize: '13px', color: '#64748b' },
  thumbsGrid: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' },
  thumbWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  thumb: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '2px solid rgba(16,185,129,0.4)' },
  thumbLabel: { fontSize: '11px', color: '#64748b', textTransform: 'capitalize' },
  placeholder: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px 0' },
  placeholderTitle: { fontSize: '15px', fontWeight: '700', color: '#e2e8f0' },
  placeholderSteps: { display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' },
  placeholderStep: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' },
}