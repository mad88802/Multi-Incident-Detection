import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import DetectionResults from './DetectionResults'

export default function UploadTab({ endpoint, primaryColor, emoji, onDetect, moduleName, gradient }) {
  const [preview, setPreview]     = useState(null)
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  const onDrop = useCallback((accepted) => {
    const file = accepted[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError(null)
    runDetection(file)
  }, [endpoint])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.bmp'] },
    multiple: false,
  })

  async function runDetection(file) {
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)

      const res  = await fetch(endpoint, { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok || data.error) throw new Error(data.error || 'Detection failed')

      setResult(data)
      onDetect(data.detections, data.inference_ms)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setPreview(null)
    setResult(null)
    setError(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Drop zone */}
      {!preview && (
        <motion.div
          {...getRootProps()}
          className={`upload-zone ${isDragActive ? 'drag-over' : ''}`}
          style={{
            borderColor: isDragActive ? primaryColor : `${primaryColor}66`,
            background: isDragActive ? `${primaryColor}18` : `${primaryColor}08`
          }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.005 }}
        >
          <input {...getInputProps()} />
          <motion.div
            className="upload-icon"
            style={{ filter: `drop-shadow(0 0 12px ${primaryColor}66)` }}
            animate={isDragActive ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] } : { y: [0, -6, 0] }}
            transition={isDragActive ? { duration: 0.4 } : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {isDragActive ? emoji : '📂'}
          </motion.div>
          <p className="upload-title">
            {isDragActive ? 'Drop to detect!' : 'Drag & drop an image'}
          </p>
          <p className="upload-sub">or click to browse files</p>
          <p className="upload-hint">Supports JPG, PNG, WEBP · {moduleName} detection</p>
        </motion.div>
      )}

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="spinner-wrap card"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="spinner" style={{ borderTopColor: primaryColor }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Running inference…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="error-msg"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            ⚠️ {error}
            <button onClick={reset} style={{ marginLeft:'auto', background:'none', border:'none', color:'#ff6b6b', cursor:'pointer', fontSize:13 }}>
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <DetectionResults
              result={result}
              onReset={reset}
              primaryColor={primaryColor}
              emoji={emoji}
              gradient={gradient}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
