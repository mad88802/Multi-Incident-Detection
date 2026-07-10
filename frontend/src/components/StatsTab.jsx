import { motion } from 'framer-motion'

export default function StatsTab({ log, total, primaryColor, secondaryColor, emoji, loadError }) {
  const avgConf = log.length
    ? (log.reduce((s, e) => s + e.maxConf, 0) / log.length * 100).toFixed(1)
    : '—'

  const avgMs = log.length
    ? Math.round(log.reduce((s, e) => s + (e.inferenceMs || 0), 0) / log.length)
    : '—'

  const STAT_CARDS = [
    { label: 'Total Detections',  value: total,          color: primaryColor,   emoji: emoji },
    { label: 'Avg Confidence',    value: avgConf !== '—' ? `${avgConf}%` : '—', color: secondaryColor, emoji: '📊' },
    { label: 'Avg Inference (ms)',value: avgMs,           color: '#a8c5ff',      emoji: '⚡' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stat cards */}
      <div className="stats-row">
        {STAT_CARDS.map((s, i) => (
          <motion.div
            key={s.label}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <span style={{ fontSize: 22 }}>{s.emoji}</span>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Alert log */}
      <div className="card">
        <p className="section-title">Detection Log</p>
        {loadError ? (
          <div style={{ textAlign: 'center', color: 'var(--fire-2)', padding: '32px 0', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
            {loadError}
          </div>
        ) : log.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
            No detections logged yet — run scans to generate stats
          </div>
        ) : (
          <div className="alert-log">
            {log.map((entry, i) => (
              <motion.div
                key={entry.id}
                className="alert-item"
                style={{
                  borderColor: entry.count > 0 ? `${primaryColor}59` : 'var(--border)',
                  background: entry.count > 0 ? `${primaryColor}0f` : 'rgba(255,255,255,0.03)'
                }}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i < 8 ? i * 0.04 : 0 }}
              >
                <span className="alert-icon">{entry.count > 0 ? emoji : '✅'}</span>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>
                    {entry.count > 0
                      ? `${entry.count} detection${entry.count > 1 ? 's' : ''}: ${[...new Set(entry.labels)].join(', ')}`
                      : 'Clear scan — no threats'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Confidence: {(entry.maxConf * 100).toFixed(1)}% · {entry.inferenceMs}ms
                  </div>
                </div>
                <span className="alert-time">{entry.time}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
