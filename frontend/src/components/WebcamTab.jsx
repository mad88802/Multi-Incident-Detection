import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function WebcamTab({ endpoint, primaryColor, emoji, onDetect }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)

  const [isRunning, setIsRunning]   = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError]           = useState(null)
  const [lastResult, setLastResult] = useState(null)
  const [fps, setFps]               = useState(0)
  const fpsRef = useRef({ count: 0, last: Date.now() })

  const drawBoxes = useCallback((dets, videoEl, canvas) => {
    if (!canvas || !videoEl) return
    const ctx = canvas.getContext('2d')
    canvas.width  = videoEl.videoWidth  || 640
    canvas.height = videoEl.videoHeight || 480
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const d of dets) {
      const [x1, y1, x2, y2] = d.bbox
      const scaleX = canvas.width  / (videoEl.videoWidth  || 640)
      const scaleY = canvas.height / (videoEl.videoHeight || 480)
      const rx1 = x1 * scaleX, ry1 = y1 * scaleY
      const rw  = (x2 - x1) * scaleX, rh = (y2 - y1) * scaleY

      // Box
      ctx.strokeStyle = d.color || primaryColor
      ctx.lineWidth   = 2.5
      ctx.strokeRect(rx1, ry1, rw, rh)

      // Label bg
      const label = `${d.label} ${(d.confidence * 100).toFixed(0)}%`
      ctx.font = 'bold 13px Inter, sans-serif'
      const tw = ctx.measureText(label).width
      ctx.fillStyle = d.color || primaryColor
      ctx.fillRect(rx1, ry1 - 22, tw + 10, 22)

      // Label text
      ctx.fillStyle = '#fff'
      ctx.fillText(label, rx1 + 5, ry1 - 6)
    }
  }, [primaryColor])

  const capture = useCallback(async () => {
    if (!videoRef.current || isCapturing) return
    const video = videoRef.current
    if (video.readyState < 2) return

    setIsCapturing(true)
    try {
      const offscreen = document.createElement('canvas')
      offscreen.width  = video.videoWidth
      offscreen.height = video.videoHeight
      offscreen.getContext('2d').drawImage(video, 0, 0)

      const blob = await new Promise(res => offscreen.toBlob(res, 'image/jpeg', 0.75))
      const fd   = new FormData()
      fd.append('file', blob, 'frame.jpg')

      const resp = await fetch(endpoint, { method: 'POST', body: fd })
      const data = await resp.json()

      if (data.detections) {
        drawBoxes(data.detections, videoRef.current, canvasRef.current)
        setLastResult(data)
        if (data.detections.length > 0) onDetect(data.detections, data.inference_ms)
      }

      fpsRef.current.count++
      const now = Date.now()
      if (now - fpsRef.current.last >= 1000) {
        setFps(fpsRef.current.count)
        fpsRef.current = { count: 0, last: now }
      }
    } catch { /* ignore frame errors */ }
    finally { setIsCapturing(false) }
  }, [isCapturing, drawBoxes, onDetect, endpoint])

  const startCamera = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsRunning(true)
      intervalRef.current = setInterval(capture, 600)
    } catch (err) {
      setError(err.message || 'Could not access webcam')
    }
  }

  const stopCamera = () => {
    clearInterval(intervalRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (videoRef.current)  videoRef.current.srcObject = null
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
    setIsRunning(false)
    setLastResult(null)
    setFps(0)
  }

  useEffect(() => {
    if (isRunning) {
      clearInterval(intervalRef.current)
      intervalRef.current = setInterval(capture, 600)
    }
  }, [capture, isRunning])

  useEffect(() => () => stopCamera(), [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Webcam view */}
      <div className="webcam-wrap" style={{ position: 'relative' }}>
        <video ref={videoRef} muted playsInline style={{ width:'100%', height:'100%', objectFit:'cover', display: isRunning ? 'block' : 'none' }} />
        <canvas ref={canvasRef} className="webcam-canvas-overlay" style={{ position:'absolute', inset:0, pointerEvents:'none' }} />

        {!isRunning && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
            <motion.div
              style={{ fontSize: 56 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              📷
            </motion.div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Camera is off</p>
          </div>
        )}

        {/* Live indicator */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute', top: 12, left: 12,
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                borderRadius: 99, padding: '4px 12px',
                display: 'flex', alignItems: 'center', gap: 7,
                border: `1px solid ${primaryColor}66`, fontSize: 12, fontWeight: 600,
              }}
            >
              <motion.span
                style={{ width: 7, height: 7, borderRadius: '50%', background: primaryColor, display: 'inline-block' }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              LIVE · {fps} fps
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last detection overlay */}
        <AnimatePresence>
          {isRunning && lastResult && lastResult.count > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: primaryColor, backdropFilter: 'blur(8px)',
                borderRadius: 8, padding: '6px 12px',
                fontSize: 12, fontWeight: 700, color: '#fff',
                boxShadow: `0 0 15px ${primaryColor}66`
              }}
            >
              {emoji} {lastResult.count} detection{lastResult.count > 1 ? 's' : ''}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error */}
      {error && (
        <div className="error-msg">⚠️ {error}</div>
      )}

      {/* Controls */}
      <div className="webcam-btn-row">
        {!isRunning ? (
          <motion.button
            className="btn primary"
            onClick={startCamera}
            whileTap={{ scale: 0.97 }}
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
              boxShadow: `0 0 20px ${primaryColor}4d`
            }}
          >
            ▶ Start Detection
          </motion.button>
        ) : (
          <motion.button
            className="btn"
            onClick={stopCamera}
            whileTap={{ scale: 0.97 }}
            style={{ borderColor: `${primaryColor}66`, color: primaryColor }}
          >
            ⏹ Stop
          </motion.button>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          Frames processed every 600ms
        </span>
      </div>
    </div>
  )
}
