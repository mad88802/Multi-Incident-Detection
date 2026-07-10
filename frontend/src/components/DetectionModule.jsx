import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import UploadTab from './UploadTab'
import WebcamTab from './WebcamTab'
import StatsTab  from './StatsTab'
import MapPanel from './MapPanel'

const TABS = [
  { id: 'upload', label: '📁 Upload Image' },
  { id: 'webcam', label: '📷 Live Webcam'  },
  { id: 'stats',  label: '📊 Statistics'   },
]

export default function DetectionModule({
  moduleKey,
  endpoint,
  primaryColor,
  secondaryColor,
  gradient,
  emoji,
  moduleName,
  moduleClassName,
  modelReady,
  onBack,
  triggerToast,
}) {
  const [tab, setTab] = useState('upload')
  const [detectionLog, setDetectionLog] = useState([])
  const [totalDetections, setTotalDetections] = useState(0)
  const [pendingEvent, setPendingEvent] = useState(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    setLoadError(null)
    fetch(`/api/events?module=${moduleKey}&limit=50`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        const mapped = data.events.map(ev => ({
          id: ev.id,
          time: new Date(ev.timestamp).toLocaleTimeString(),
          count: ev.count,
          inferenceMs: ev.inference_ms,
          labels: ev.labels,
          maxConf: ev.confidence,
        }))
        setDetectionLog(mapped)
        setTotalDetections(mapped.reduce((s, e) => s + e.count, 0))
      })
      .catch(err => {
        console.error('Error fetching logs:', err)
        setLoadError('Could not load statistics — make sure the backend is running on port 5001.')
      })
  }, [moduleKey])

  const saveEventToDb = (dets, inferenceMs, lat, lng) => {
    const labels = dets.map(d => d.label)
    const confidence = dets.length ? Math.max(...dets.map(d => d.confidence)) : 0

    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: moduleKey,
        labels,
        confidence,
        inference_ms: inferenceMs,
        count: dets.length,
        latitude: lat,
        longitude: lng
      })
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        const ev = data.event
        const entry = {
          id: ev.id,
          time: new Date(ev.timestamp).toLocaleTimeString(),
          count: ev.count,
          inferenceMs: ev.inference_ms,
          labels: ev.labels,
          maxConf: ev.confidence,
        }
        setDetectionLog(prev => [entry, ...prev].slice(0, 50))
        setTotalDetections(prev => prev + ev.count)
        if (dets.length > 0) {
          triggerToast(
            moduleKey,
            `${dets.length} items logged: ${labels.join(', ')}`
          )
        }
      })
      .catch(err => {
        console.error('Failed to store event:', err)
        triggerToast(moduleKey, 'Failed to save detection — is the backend running?')
      })
  }

  const addLog = (dets, inferenceMs) => {
    if (dets.length > 0) {
      setPendingEvent({ dets, inferenceMs })
    } else {
      saveEventToDb(dets, inferenceMs, null, null)
    }
  }

  const handleMapConfirm = (lat, lng) => {
    if (pendingEvent) {
      saveEventToDb(pendingEvent.dets, pendingEvent.inferenceMs, lat, lng)
      setPendingEvent(null)
    }
  }

  const handleMapCancel = () => {
    if (pendingEvent) {
      saveEventToDb(pendingEvent.dets, pendingEvent.inferenceMs, null, null)
      setPendingEvent(null)
    }
  }

  return (
    <div className="workspace">
      {/* Header */}
      <div className="workspace-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>

        <div className="workspace-header-title">
          <div className={`workspace-module-icon ${moduleClassName}`}>
            {emoji}
          </div>
          <div>
            <div className="workspace-title-text">{moduleName}</div>
            <div className="workspace-subtitle">Detection Module</div>
          </div>
        </div>

        <div className="workspace-header-right">
          {modelReady !== null && (
            <div className="status-badge">
              <span className={`dot ${modelReady ? 'green' : 'red'}`} />
              {modelReady ? 'Model Ready' : 'Model Missing'}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="workspace-body">
        {/* Tab bar */}
        <div className="tab-bar">
          {TABS.map(t => (
            <motion.button
              key={t.id}
              className={`tab-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
              whileTap={{ scale: 0.96 }}
            >
              {t.label}
            </motion.button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
          >
            {tab === 'upload' && (
              <UploadTab
                endpoint={endpoint}
                primaryColor={primaryColor}
                emoji={emoji}
                onDetect={addLog}
                moduleName={moduleName}
                gradient={gradient}
              />
            )}
            {tab === 'webcam' && (
              <WebcamTab
                endpoint={endpoint}
                primaryColor={primaryColor}
                emoji={emoji}
                onDetect={addLog}
              />
            )}
            {tab === 'stats' && (
              <StatsTab
                log={detectionLog}
                total={totalDetections}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                emoji={emoji}
                loadError={loadError}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {pendingEvent && (
        <MapPanel
          emoji={emoji}
          moduleName={moduleName}
          onConfirm={handleMapConfirm}
          onCancel={handleMapCancel}
        />
      )}
    </div>
  )
}
