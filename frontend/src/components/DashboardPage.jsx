import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export default function DashboardPage({ onBack }) {
  const [stats, setStats] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/events/stats').then(r => {
        if (!r.ok) throw new Error(`Stats HTTP ${r.status}`)
        return r.json()
      }),
      fetch('/api/events?limit=40').then(r => {
        if (!r.ok) throw new Error(`Events HTTP ${r.status}`)
        return r.json()
      })
    ])
      .then(([statsData, eventsData]) => {
        setStats(statsData)
        setEvents(eventsData.events)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching dashboard statistics:', err)
        setError('Could not load statistics. Make sure the Flask backend is running (python backend/app.py).')
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (loading || !stats || !window.L || !mapContainerRef.current) return

    const L = window.L
    
    // Default centering coords (Algiers approx center)
    let center = [36.7538, 3.0588]
    if (stats.map_events && stats.map_events.length > 0) {
      // center on the latest pinned event
      const latest = stats.map_events[stats.map_events.length - 1]
      center = [latest.latitude, latest.longitude]
    }

    const map = L.map(mapContainerRef.current).setView(center, 12)
    mapRef.current = map

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map)

    stats.map_events.forEach(ev => {
      const emoji = ev.module === 'fire' ? '🔥' : ev.module === 'garbage' ? '🗑️' : '🚗'
      const customIcon = L.divIcon({
        className: 'custom-map-pin-dash',
        html: `<div style="font-size: 24px; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.6)); cursor: pointer;">${emoji}</div>`,
        iconSize: [26, 26]
      })

      const marker = L.marker([ev.latitude, ev.longitude], { icon: customIcon }).addTo(map)
      marker.bindPopup(`
        <div class="map-popup-custom">
          <strong>${ev.module.toUpperCase()} INCIDENT</strong>
          <div>Detections: <em>${ev.labels.join(', ')}</em></div>
          <div>Confidence: <strong>${(ev.confidence * 100).toFixed(0)}%</strong></div>
          <div class="map-popup-time">${new Date(ev.timestamp).toLocaleString()}</div>
        </div>
      `)
    })

    setTimeout(() => {
      map.invalidateSize()
    }, 250)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [loading, stats])

  const renderTrendChart = () => {
    if (!stats || !stats.daily || stats.daily.length === 0) {
      return (
        <div className="empty-chart-msg">
          📈 No event data reported in the last 7 days.
        </div>
      )
    }

    const maxCount = Math.max(...stats.daily.map(d => d.count), 5)

    return (
      <div className="chart-wrapper">
        <div className="chart-bars">
          {stats.daily.map((d, idx) => {
            const pct = (d.count / maxCount) * 100
            const dateObj = new Date(d.day)
            const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })

            return (
              <div key={d.day} className="chart-column">
                <div className="chart-bar-container">
                  <motion.div
                    className="chart-bar-fill"
                    style={{ height: `${pct}%` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ delay: idx * 0.05, duration: 0.5, ease: 'easeOut' }}
                  >
                    <span className="chart-bar-tooltip">{d.count} events</span>
                  </motion.div>
                </div>
                <div className="chart-bar-label">{formattedDate}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: '80vh' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)' }}>Compiling operational reports...</p>
      </div>
    )
  }

  const fires = stats?.by_module?.fire || 0
  const garbage = stats?.by_module?.garbage || 0
  const accidents = stats?.by_module?.accident || 0

  return (
    <div className="workspace">
      {/* Header */}
      <div className="workspace-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Workspace
        </button>
        <div className="workspace-header-title">
          <div className="workspace-module-icon" style={{ background: 'rgba(167,139,250,0.15)', color: 'var(--accent-2)' }}>
            📡
          </div>
          <div>
            <div className="workspace-title-text">Operations Center</div>
            <div className="workspace-subtitle">Live Incident Intelligence & Stats</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="workspace-body">
        {error && (
          <div className="card" style={{ borderColor: 'var(--fire-2)', color: 'var(--fire-2)', textAlign: 'center', padding: '20px', marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}

        {/* KPI Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <span style={{ fontSize: '24px' }}>📈</span>
            <div className="stat-value" style={{ color: 'var(--accent-3)' }}>{stats?.total || 0}</div>
            <div className="stat-label">Total Events Logs</div>
          </div>
          <div className="stat-card">
            <span style={{ fontSize: '24px' }}>🔥</span>
            <div className="stat-value" style={{ color: 'var(--fire-2)' }}>{fires}</div>
            <div className="stat-label">Fires / Smoke Incidents</div>
          </div>
          <div className="stat-card">
            <span style={{ fontSize: '24px' }}>🗑️</span>
            <div className="stat-value" style={{ color: 'var(--garbage-2)' }}>{garbage}</div>
            <div className="stat-label">Garbage Reports</div>
          </div>
          <div className="stat-card">
            <span style={{ fontSize: '24px' }}>🚗</span>
            <div className="stat-value" style={{ color: 'var(--accident-2)' }}>{accidents}</div>
            <div className="stat-label">Traffic Hazards / Accidents</div>
          </div>
        </div>

        {/* Dashboard Main Row (Chart and Map) */}
        <div className="dashboard-main-row">
          <div className="card dash-chart-card">
            <p className="section-title">7-Day Incident Volume</p>
            {renderTrendChart()}
          </div>

          <div className="card dash-map-card">
            <p className="section-title">Active Incident Pins</p>
            <div ref={mapContainerRef} className="dashboard-map" />
          </div>
        </div>

        {/* Logs Table */}
        <div className="card dash-table-card">
          <p className="section-title">Incident Audit Trail</p>
          {events.length === 0 ? (
            <div className="empty-ledger-view">
              <span>📋</span>
              <p>No active incidents found in database. Scan images or webcam feeds to record audits.</p>
            </div>
          ) : (
            <div className="ledger-table-wrapper">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Threats / Items Pinned</th>
                    <th>Avg Confidence</th>
                    <th>Speed (ms)</th>
                    <th>Coordinates</th>
                    <th>Timestamp (UTC)</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id} className="ledger-table-row">
                      <td className={`td-module ${e.module}`}>
                        <span>
                          {e.module === 'fire' ? '🔥 Fire & Smoke' :
                           e.module === 'garbage' ? '🗑️ Garbage' : '🚗 Traffic hazard'}
                        </span>
                      </td>
                      <td className="td-labels">{e.labels.join(', ')}</td>
                      <td className="td-conf">{(e.confidence * 100).toFixed(0)}%</td>
                      <td>{Math.round(e.inference_ms)} ms</td>
                      <td className="td-coords">
                        {e.latitude ? `${e.latitude.toFixed(5)}, ${e.longitude.toFixed(5)}` : 'Skipped'}
                      </td>
                      <td className="td-time">{new Date(e.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
