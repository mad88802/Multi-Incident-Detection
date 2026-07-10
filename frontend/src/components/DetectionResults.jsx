import { motion } from 'framer-motion'

export default function DetectionResults({ result, onReset, primaryColor, emoji, gradient }) {
  const { annotated_img, detections, inference_ms, count } = result
  const hasDetections = count > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary banner */}
      <motion.div
        className="card"
        style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px',
          background: hasDetections
            ? `${primaryColor}14`
            : 'rgba(0,200,150,0.06)',
          borderColor: hasDetections
            ? `${primaryColor}59`
            : 'rgba(0,200,150,0.3)',
        }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.span
          style={{ fontSize: 32 }}
          animate={hasDetections ? { rotate: [0, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, repeat: hasDetections ? 2 : 0 }}
        >
          {hasDetections ? emoji : '✅'}
        </motion.span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            {hasDetections
              ? `${count} detection${count > 1 ? 's' : ''} found!`
              : 'Scene is clean — no issues detected'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Inference time: <strong>{inference_ms} ms</strong>
          </div>
        </div>
        <button
          className="btn"
          onClick={onReset}
          style={{ marginLeft: 'auto' }}
        >
          ↩ New Image
        </button>
      </motion.div>

      {/* Image + detections */}
      <div className="results-grid">
        {/* Annotated image */}
        <motion.div
          className="result-image-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {annotated_img && (
            <img
              src={`data:image/jpeg;base64,${annotated_img}`}
              alt="Detection result"
            />
          )}
        </motion.div>

        {/* Detection list */}
        <div>
          <p className="section-title">Detections</p>
          {detections.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 16px' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🛡️</div>
              <div>Scene is clear</div>
            </div>
          ) : (
            <div className="det-list">
              {detections.map((d, i) => (
                <motion.div
                  key={i}
                  className="det-card"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="det-label">
                    <span className="det-dot" style={{ background: d.color || primaryColor }} />
                    <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{d.label}</span>
                  </div>
                  <div className="conf-bar-bg">
                    <motion.div
                      className="conf-bar-fill"
                      style={{ background: gradient }}
                      initial={{ width: 0 }}
                      animate={{ width: `${d.confidence * 100}%` }}
                      transition={{ delay: 0.2 + i * 0.08, duration: 0.6, ease: [0.4,0,0.2,1] }}
                    />
                  </div>
                  <div className="conf-pct">{(d.confidence * 100).toFixed(1)}% confidence</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
