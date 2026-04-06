import { useState, useEffect, useRef, useCallback } from 'react'
import * as faceapi from 'face-api.js'
import axios from 'axios'

const BACKEND = 'http://127.0.0.1:8000'
const AUTO_SCAN_DELAY = 2000

function HoverKioskBtn({ onClick, disabled, color, children }) {
  const [hovered, setHovered] = useState(false)

  const baseStyle = color === 'green' ? s.btnCheckin : s.btnCheckout
  const hoverGlow = color === 'green'
    ? { boxShadow: '0 16px 40px rgba(16,185,129,0.35)', borderColor: 'rgba(16,185,129,0.8)', background: 'rgba(16,185,129,0.16)' }
    : { boxShadow: '0 16px 40px rgba(245,158,11,0.35)', borderColor: 'rgba(245,158,11,0.8)', background: 'rgba(245,158,11,0.16)' }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...baseStyle,
        ...(disabled ? s.btnDisabled : {}),
        ...(hovered && !disabled ? { transform: 'translateY(-6px) scale(1.04)', ...hoverGlow } : {}),
      }}
    >
      {children}
    </button>
  )
}

export default function Kiosk() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const detectionLoopRef = useRef(null)
  const faceStableRef = useRef(0)
  const processingRef = useRef(false)

  const [mode, setMode] = useState('home')
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [faceCount, setFaceCount] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [camReady, setCamReady] = useState(false)
  const [autoScanProgress, setAutoScanProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [timeError, setTimeError] = useState(null)
  const [blink, setBlink] = useState(true)

  // Clock
  useEffect(() => {
    const t = setInterval(() => {
      setCurrentTime(new Date())
      setBlink(b => !b)
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // Load face-api models
  useEffect(() => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    ]).then(() => {
      setModelsLoaded(true)
    }).catch(() => {
      setModelsLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (mode === 'home') {
      stopCamera()
      setResult(null)
      setFaceCount(0)
      setCountdown(null)
      setAutoScanProgress(0)
      processingRef.current = false
    } else {
      startCamera()
    }
    return () => stopCamera()
  }, [mode])

  // Office hours check
  const isCheckinAllowed = () => {
    const h = currentTime.getHours()
    return h >= 8 && h < 13
  }

  const isCheckoutAllowed = () => {
    const h = currentTime.getHours()
    return h >= 12
  }

  const handleCheckinClick = () => {
    setTimeError(null)
    if (!isCheckinAllowed()) {
      const timeStr = currentTime.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
      setTimeError({
        type: 'checkin',
        message: `Check-in is only allowed between 8:00 AM and 1:00 PM.\nCurrent time: ${timeStr}`,
      })
      setTimeout(() => setTimeError(null), 5000)
      return
    }
    setMode('checkin')
  }

  const handleCheckoutClick = () => {
    setTimeError(null)
    if (!isCheckoutAllowed()) {
      const timeStr = currentTime.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
      setTimeError({
        type: 'checkout',
        message: `Check-out is only allowed from 12:00 PM onwards.\nCurrent time: ${timeStr}`,
      })
      setTimeout(() => setTimeError(null), 5000)
      return
    }
    setMode('checkout')
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          setCamReady(true)
        }
      }
    } catch (err) {
      console.error('Camera error:', err)
    }
  }

  const stopCamera = () => {
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current)
      detectionLoopRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCamReady(false)
    setFaceCount(0)
    faceStableRef.current = 0
    setAutoScanProgress(0)
  }

  // Face detection loop
  useEffect(() => {
    if (!camReady || !modelsLoaded || mode === 'home') return

    const detect = async () => {
      if (!videoRef.current || !canvasRef.current) {
        cancelAnimationFrame(detectionLoopRef.current)
        return
      }

      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 })
      )

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const count = detections.length
      setFaceCount(count)

      if (count === 0) {
        faceStableRef.current = 0
        setAutoScanProgress(0)
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'
        ctx.lineWidth = 1
        ctx.setLineDash([8, 8])
        ctx.strokeRect(170, 60, 300, 340)
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(255,255,255,0.18)'
        ctx.font = '14px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Position your face in the frame', canvas.width / 2, canvas.height - 20)
        ctx.textAlign = 'left'

      } else if (count > 1) {
        faceStableRef.current = 0
        setAutoScanProgress(0)
        detections.forEach(d => {
          const { x, y, width, height } = d.box
          const rx = canvas.width - x - width
          ctx.strokeStyle = '#ef4444'
          ctx.lineWidth = 3
          ctx.shadowColor = '#ef4444'
          ctx.shadowBlur = 12
          ctx.strokeRect(rx, y, width, height)
          ctx.shadowBlur = 0
        })
        ctx.fillStyle = 'rgba(239,68,68,0.85)'
        ctx.fillRect(canvas.width / 2 - 140, 12, 280, 32)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 14px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('⚠ Multiple faces detected', canvas.width / 2, 33)
        ctx.textAlign = 'left'

      } else {
        const { x, y, width, height } = detections[0].box
        const rx = canvas.width - x - width

        if (faceStableRef.current === 0) faceStableRef.current = Date.now()
        const elapsed = Date.now() - faceStableRef.current
        const progress = Math.min(elapsed / AUTO_SCAN_DELAY, 1)
        setAutoScanProgress(progress)

        ctx.strokeStyle = '#00ff88'
        ctx.lineWidth = 3
        ctx.shadowColor = '#00ff88'
        ctx.shadowBlur = 12
        ctx.strokeRect(rx, y, width, height)
        ctx.shadowBlur = 0

        const cs = 18
        ctx.lineWidth = 4
        ctx.strokeStyle = '#00ff88'
        const corners = [
          [rx, y, cs, 0, 0, cs],
          [rx + width, y, -cs, 0, 0, cs],
          [rx, y + height, cs, 0, 0, -cs],
          [rx + width, y + height, -cs, 0, 0, -cs],
        ]
        corners.forEach(([px, py, dx1, dy1, dx2, dy2]) => {
          ctx.beginPath()
          ctx.moveTo(px + dx1, py)
          ctx.lineTo(px, py)
          ctx.lineTo(px, py + (dy2 || dy1))
          ctx.stroke()
        })

        if (progress < 1) {
          ctx.strokeStyle = `rgba(0,255,136,${0.4 + progress * 0.6})`
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.arc(rx + width / 2, y + height / 2, Math.min(width, height) / 2 + 10, -Math.PI / 2, -Math.PI / 2 + progress * 2 * Math.PI)
          ctx.stroke()
        }

        const labelX = rx
        const labelY = y - 32
        ctx.fillStyle = 'rgba(0,255,136,0.9)'
        ctx.fillRect(labelX, Math.max(labelY, 4), 130, 26)
        ctx.fillStyle = '#000'
        ctx.font = 'bold 13px Inter, sans-serif'
        ctx.fillText('✓ Face Detected', labelX + 8, Math.max(labelY, 4) + 18)

        if (progress >= 1 && !processingRef.current) {
          processingRef.current = true
          captureAndSubmit(mode === 'checkin' ? 'checkin' : 'checkout')
        }
      }

      detectionLoopRef.current = requestAnimationFrame(detect)
    }

    detectionLoopRef.current = requestAnimationFrame(detect)
    return () => cancelAnimationFrame(detectionLoopRef.current)
  }, [camReady, modelsLoaded, mode, processing, result])

  const captureAndSubmit = useCallback(async (endpoint) => {
    if (!videoRef.current || processing) return
    setProcessing(true)
    setResult(null)
    faceStableRef.current = 0
    setAutoScanProgress(0)
    setCountdown(null)

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)

    canvas.toBlob(async (blob) => {
      const formData = new FormData()
      formData.append('photo', blob, 'capture.jpg')

      try {
        const res = await axios.post(`${BACKEND}/api/attendance/${endpoint}/`, formData)
        setResult(res.data)
        stopCamera()
        playSound(res.data.success || ['checked_in', 'checked_out'].includes(res.data.status))
      } catch (err) {
        const errData = err.response?.data
        setResult({
          success: false,
          status: errData?.status || 'error',
          message: errData?.message || 'Server error.',
        })
        stopCamera()
        playSound(false)
      } finally {
        setProcessing(false)
        processingRef.current = false
        setTimeout(() => {
          setResult(null)
          setMode('home')
        }, 5000)
      }
    }, 'image/jpeg', 0.95)
  }, [processing])

  const playSound = (success) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      if (success) {
        osc.frequency.setValueAtTime(523, ctx.currentTime)
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.12)
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.24)
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.7)
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime)
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.25)
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.6)
      }
    } catch (e) {}
  }

  const getResultColor = () => {
    if (!result) return {}
    const st = result.status
    if (['checked_in', 'checked_out'].includes(st)) return { bg: 'rgba(16,185,129,0.18)', border: '#10b981', color: '#6ee7b7' }
    if (st === 'spoof') return { bg: 'rgba(239,68,68,0.18)', border: '#ef4444', color: '#fca5a5' }
    if (st === 'outside_hours') return { bg: 'rgba(99,102,241,0.18)', border: '#6366f1', color: '#a5b4fc' }
    if (['duplicate', 'not_checked_in', 'not_registered'].includes(st)) return { bg: 'rgba(245,158,11,0.18)', border: '#f59e0b', color: '#fcd34d' }
    return { bg: 'rgba(239,68,68,0.18)', border: '#ef4444', color: '#fca5a5' }
  }

  const rc = getResultColor()

  // ── HOME SCREEN ──
  if (mode === 'home') {
    const checkinDisabled = !isCheckinAllowed()
    const checkoutDisabled = !isCheckoutAllowed()

    return (
      <div style={s.kiosk}>
        <div style={s.homeWrap}>
          <img src="/src/assets/logo.png" style={{ width: '250px', height: '250px', objectFit: 'contain' }} />
          <div style={s.homeTitle}>FaceLog</div>
          <div style={s.homeSub}>AI-Powered Attendance System</div>
          <div style={s.homeTime}>
            {currentTime.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }).split(':')[0]}
            <span style={{ opacity: blink ? 1 : 0.15, transition: 'opacity 0.3s ease' }}>:</span>
            {currentTime.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }).split(':')[1]}
          </div>
          <div style={s.homeDate}>
            {currentTime.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          {/* Office hours info strip */}
          <div style={s.officeHoursInfo}>
            <span style={{ color: checkinDisabled ? '#ef4444' : '#10b981' }}>
              ✅ Check-in: 8:00 AM – 1:00 PM
            </span>
            <span style={s.hoursDivider}>·</span>
            <span style={{ color: checkoutDisabled ? '#ef4444' : '#f59e0b' }}>
              🚪 Check-out: 12:00 PM – 11:59 PM
            </span>
          </div>

          {/* Time error banner */}
          {timeError && (
            <div style={s.timeErrorBanner}>
              <div style={s.timeErrorIcon}>🕐</div>
              <div style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{timeError.message}</div>
            </div>
          )}

          <div style={s.homeBtns}>
            <HoverKioskBtn
              onClick={handleCheckinClick}
              disabled={checkinDisabled}
              color="green"
            >
              <span style={s.btnIcon}>✅</span>
              <span style={s.btnLabel}>Check In</span>
              <span style={s.btnDesc}>
                {checkinDisabled ? 'Outside check-in hours' : 'Start your work day'}
              </span>
            </HoverKioskBtn>

            <HoverKioskBtn
              onClick={handleCheckoutClick}
              disabled={checkoutDisabled}
              color="amber"
            >
              <span style={s.btnIcon}>🚪</span>
              <span style={s.btnLabel}>Check Out</span>
              <span style={s.btnDesc}>
                {checkoutDisabled ? 'Available from 12:00 PM' : 'End your work day'}
              </span>
            </HoverKioskBtn>
          </div>

        </div>
      </div>
    )
  }

  // ── CAMERA SCREEN ──
  const isCheckin = mode === 'checkin'
  const modeLabel = isCheckin ? 'Check In' : 'Check Out'
  const modeColor = isCheckin ? '#10b981' : '#f59e0b'
  const modeIcon = isCheckin ? '✅' : '🚪'

  const faceStatusMsg = () => {
    if (faceCount === 0) return { text: '⚪ Looking for face...', color: '#64748b' }
    if (faceCount > 1) return { text: '🔴 Multiple faces — please ensure only one person is visible', color: '#ef4444' }
    if (autoScanProgress >= 1) return { text: '🟢 Scanning now...', color: '#00ff88' }
    return { text: `🟢 Face detected — hold still (${Math.round(autoScanProgress * 100)}%)`, color: '#00ff88' }
  }

  const fs = faceStatusMsg()

  return (
    <div style={s.kiosk}>
      <div style={s.camWrap}>

        <div style={s.camHeader}>
          <button onClick={() => setMode('home')} style={s.backBtn}>← Back</button>
          <div style={{ ...s.modeTag, borderColor: modeColor, color: modeColor }}>
            {modeIcon} {modeLabel}
          </div>
          <div style={s.headerTime}>
            {currentTime.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div style={s.videoWrap}>
          <video ref={videoRef} style={s.video} muted playsInline />
          <canvas ref={canvasRef} width={640} height={480} style={s.canvas} />

          {processing && !countdown && (
            <div style={s.processingOverlay}>
              <div style={s.spinnerWrap}>
                <div style={s.processingText}>🔍 Verifying identity...</div>
                <div style={s.processingSubText}>Anti-spoofing & face matching in progress</div>
              </div>
            </div>
          )}

          {result && (
            <div style={{ ...s.resultOverlay, background: rc.bg, borderColor: rc.border }}>
              <div style={s.resultIcon}>
                {result.status === 'checked_in'     && '✅'}
                {result.status === 'checked_out'    && '👋'}
                {result.status === 'spoof'          && '🚨'}
                {result.status === 'duplicate'      && '⚠️'}
                {result.status === 'not_checked_in' && '⚠️'}
                {result.status === 'not_registered' && '🚫'}
                {result.status === 'outside_hours'  && '🕐'}
                {result.status === 'unknown'        && '❓'}
                {result.status === 'error'          && '⚠️'}
              </div>
              <div style={{ ...s.resultMsg, color: rc.color }}>{result.message}</div>
              {result.employee && (
                <div style={s.resultName}>{result.employee.name}</div>
              )}
              {result.status === 'checked_in' && result.check_in_time && (
                <div style={s.resultTime}>Check-in time: {result.check_in_time}</div>
              )}
              {result.status === 'checked_out' && (
                <div style={s.resultTime}>
                  {result.check_in_time} → {result.check_out_time} &nbsp;|&nbsp; {result.hours_worked}h worked
                </div>
              )}
              {result.status === 'spoof' && result.reason && (
                <div style={s.resultReason}>{result.reason}</div>
              )}
              <div style={s.resultDismiss}>Returning to home in 5s...</div>
            </div>
          )}

          {faceCount === 1 && !processing && !result && autoScanProgress > 0 && (
            <div style={s.progressBarWrap}>
              <div style={{ ...s.progressBarFill, width: `${autoScanProgress * 100}%` }} />
            </div>
          )}
        </div>

        {!processing && !result && (
          <div style={s.camBottom}>
            <div style={{ ...s.faceStatus, color: fs.color }}>{fs.text}</div>
            {!modelsLoaded && <div style={s.modelLoading}>⏳ Loading AI models...</div>}
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  kiosk: {
    minHeight: '100vh',
    background: '#0a0e1a',
    fontFamily: "'Inter', sans-serif",
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeWrap: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '10px',
    padding: '30px 40px',   // was 60px 40px
  },
  homeLogo: { fontSize: '64px' },
  homeTitle: {
    fontSize: '36px', fontWeight: '900',  // was 48px
    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  homeSub: { color: '#475569', fontSize: '14px' },
  homeTime: { fontSize: '42px', fontWeight: '800', color: '#f1f5f9', marginTop: '8px' },
  homeDate: { color: '#64748b', fontSize: '14px' },
  officeHoursInfo: {
    display: 'flex', gap: '12px', alignItems: 'center',
    fontSize: '13px', fontWeight: '600',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '999px', padding: '8px 20px',
    marginTop: '4px',
  },
  hoursDivider: { color: '#334155' },
  timeErrorBanner: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    background: 'rgba(99,102,241,0.1)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: '12px', padding: '16px 24px',
    color: '#a5b4fc', fontSize: '14px', fontWeight: '600',
    maxWidth: '400px', textAlign: 'center',
  },
  timeErrorIcon: { fontSize: '32px' },
  homeBtns: { display: 'flex', gap: '24px', marginTop: '16px' },
  btnCheckin: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    padding: '22px 36px', borderRadius: '20px',  // was 32px 48px
    border: '2px solid rgba(16,185,129,0.4)',
    background: 'rgba(16,185,129,0.08)',
    cursor: 'pointer', transition: 'all 0.22s ease',
  },
  btnCheckout: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    padding: '22px 36px', borderRadius: '20px',  // was 32px 48px
    border: '2px solid rgba(245,158,11,0.4)',
    background: 'rgba(245,158,11,0.08)',
    cursor: 'pointer', transition: 'all 0.22s ease',
  },
  btnDisabled: {
    opacity: 0.35, cursor: 'not-allowed',
    filter: 'grayscale(60%)',
    transform: 'none',
    boxShadow: 'none',
  },
  btnIcon: { fontSize: '30px' },
  btnLabel: { fontSize: '17px', fontWeight: '800', color: '#f1f5f9' },
  btnDesc: { fontSize: '13px', color: '#64748b' },
  adminLink: { marginTop: '24px', color: '#334155', fontSize: '13px', textDecoration: 'none' },

  camWrap: { width: '700px', display: 'flex', flexDirection: 'column', gap: '16px' },
  camHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '0 4px',
  },
  backBtn: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
    color: '#94a3b8', padding: '8px 16px', borderRadius: '8px',
    cursor: 'pointer', fontSize: '13px',
  },
  modeTag: {
    border: '1px solid', borderRadius: '999px',
    padding: '6px 20px', fontSize: '14px', fontWeight: '700',
  },
  headerTime: { color: '#475569', fontSize: '14px' },
  videoWrap: {
    position: 'relative', borderRadius: '20px',
    overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)',
    background: '#000',
  },
  video: { width: '100%', display: 'block', transform: 'scaleX(-1)' },
  canvas: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none',
  },
  processingOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  spinnerWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  processingText: { fontSize: '22px', fontWeight: '700', color: '#fff' },
  processingSubText: { fontSize: '13px', color: '#94a3b8' },
  resultOverlay: {
    position: 'absolute', inset: 0,
    border: '2px solid',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '12px',
    backdropFilter: 'blur(10px)',
  },
  resultIcon: { fontSize: '72px' },
  resultMsg: { fontSize: '22px', fontWeight: '800', textAlign: 'center', padding: '0 24px' },
  resultName: { fontSize: '20px', color: '#f1f5f9', fontWeight: '700' },
  resultTime: { fontSize: '14px', color: '#94a3b8' },
  resultReason: { fontSize: '13px', color: '#fca5a5', textAlign: 'center', padding: '0 32px' },
  resultDismiss: { fontSize: '12px', color: '#475569', marginTop: '8px' },
  progressBarWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '4px', background: 'rgba(255,255,255,0.1)',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #00ff88, #6366f1)',
    transition: 'width 0.1s linear',
  },
  camBottom: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '8px',
  },
  faceStatus: { fontSize: '14px', fontWeight: '600', textAlign: 'center' },
  modelLoading: { color: '#475569', fontSize: '12px' },
}