import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import HomePage from './components/HomePage'
import DetectionModule from './components/DetectionModule'
import DashboardPage from './components/DashboardPage'
import AlertToast from './components/AlertToast'
import './index.css'

const MODULES = {
  fire: {
    key: 'fire',
    emoji: '🔥',
    name: 'Fire & Smoke',
    endpoint: '/api/detect/fire',
    primaryColor: 'var(--fire-1)',
    secondaryColor: 'var(--fire-2)',
    gradient: 'linear-gradient(90deg, var(--fire-1), var(--fire-2))',
    className: 'fire',
  },
  garbage: {
    key: 'garbage',
    emoji: '🗑️',
    name: 'Garbage & Waste',
    endpoint: '/api/detect/garbage',
    primaryColor: 'var(--garbage-1)',
    secondaryColor: 'var(--garbage-2)',
    gradient: 'linear-gradient(90deg, var(--garbage-1), var(--garbage-2))',
    className: 'garbage',
  },
  accident: {
    key: 'accident',
    emoji: '🚗',
    name: 'Accident & Traffic',
    endpoint: '/api/detect/accident',
    primaryColor: 'var(--accident-1)',
    secondaryColor: 'var(--accident-2)',
    gradient: 'linear-gradient(90deg, var(--accident-1), var(--accident-2))',
    className: 'accident',
  },
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.22 } },
}

export default function App() {
  const [activeModule, setActiveModule] = useState(null) // null = home
  const [modelReady, setModelReady] = useState(null)
  const [particles, setParticles] = useState([])
  const [toasts, setToasts] = useState([])
  const [dashboardOpen, setDashboardOpen] = useState(false)

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setModelReady(d.model_ready))
      .catch(() => setModelReady(false))

    // Generate static particle properties with negative delays for random initial phase
    const generated = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * -30,
      duration: Math.random() * 25 + 15,
    }))
    setParticles(generated)
  }, [])

  const triggerToast = (moduleKey, message) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, moduleKey, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5500)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const module = activeModule ? MODULES[activeModule] : null

  return (
    <div className={`app-shell theme-${dashboardOpen ? 'home' : activeModule || 'home'}`}>
      {/* Animated background orbs */}
      <div className="bg-orbs">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>
      <div className="bg-grid" />

      {/* Floating particles */}
      <div className="bg-particles">
        {particles.map(p => (
          <div
            key={p.id}
            className="bg-particle"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Global Notifications */}
      <AlertToast toasts={toasts} onClose={removeToast} />

      {/* Pages */}
      <AnimatePresence mode="wait">
        {dashboardOpen ? (
          <motion.div
            key="dashboard"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <DashboardPage onBack={() => setDashboardOpen(false)} />
          </motion.div>
        ) : activeModule === null ? (
          <motion.div
            key="home"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ flex: 1 }}
          >
            <HomePage
              onSelect={setActiveModule}
              modelReady={modelReady}
              onOpenDashboard={() => setDashboardOpen(true)}
            />
          </motion.div>
        ) : (
          <motion.div
            key={activeModule}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <DetectionModule
              moduleKey={module.key}
              endpoint={module.endpoint}
              primaryColor={module.primaryColor}
              secondaryColor={module.secondaryColor}
              gradient={module.gradient}
              emoji={module.emoji}
              moduleName={module.name}
              moduleClassName={module.className}
              modelReady={modelReady}
              onBack={() => setActiveModule(null)}
              triggerToast={triggerToast}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
