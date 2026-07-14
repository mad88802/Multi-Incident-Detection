import { motion } from 'framer-motion'

const MODULES = [
  {
    id: 'fire',
    emoji: '🔥',
    title: 'Fire & Smoke',
    desc: 'Real-time detection of active flames and smoke plumes using a custom-trained YOLOv8 model. Upload images or use your webcam for live inference.',
    tag: 'YOLOv8 · Live',
    className: 'fire',
  },
  {
    id: 'garbage',
    emoji: '🗑️',
    title: 'Garbage & Waste',
    desc: 'Identify and classify waste objects — plastic bottles, cardboard, organic waste, cans, and more. Multi-class detection with bounding box overlays.',
    tag: 'Multi-class · Active',
    className: 'garbage',
  },
  {
    id: 'accident',
    emoji: '🚗',
    title: 'Accident & Traffic',
    desc: 'Detect traffic hazards, collisions, overturned vehicles, road debris, and disabled vehicles. Built for smart city surveillance use cases.',
    tag: 'Hazard · Active',
    className: 'accident',
  },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const heroVariants = {
  hidden: { opacity: 0, y: -20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export default function HomePage({ onSelect, modelReady, onOpenDashboard }) {
  return (
    <div className="home-page">
      {/* Hero */}
      <motion.div
        className="home-hero"
        variants={heroVariants}
        initial="hidden"
        animate="show"
      >
        <div className="home-hero-badge">
          <span className="home-hero-badge-dot" />
          AI-Powered Detection Suite
        </div>

        <h1 className="home-hero-title">
          VisionAI
        </h1>

        <p className="home-hero-sub">
          Multi-hazard detection powered by deep learning. Select a module below to run real-time inference on images or live webcam feeds.
        </p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8, marginBottom: 8 }}>
          <button className="btn primary" onClick={onOpenDashboard} style={{ padding: '10px 24px', fontSize: '14px', borderRadius: '8px' }}>
            📡 Operations Center
          </button>
        </div>
      </motion.div>

      {/* Module cards */}
      <motion.div
        className="module-cards-grid"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {MODULES.map((m) => (
          <motion.div
            key={m.id}
            className={`module-card ${m.className}`}
            variants={cardVariants}
            onClick={() => onSelect(m.id)}
            whileTap={{ scale: 0.98 }}
          >
            {/* Glow blob */}
            <div className="module-card-glow" />

            {/* Icon */}
            <div className={`module-card-icon ${m.className}`}>
              {m.emoji}
            </div>

            {/* Body */}
            <div className="module-card-body">
              <div className="module-card-title">{m.title}</div>
              <div className="module-card-desc">{m.desc}</div>
            </div>

            {/* Footer */}
            <div className="module-card-footer">
              <span className="module-card-tag">{m.tag}</span>
              <span className="module-card-launch">
                Launch <span>→</span>
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
