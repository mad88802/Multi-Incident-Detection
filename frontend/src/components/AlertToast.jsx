import { motion, AnimatePresence } from 'framer-motion'

export default function AlertToast({ toasts, onClose }) {
  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={`toast-alert ${t.moduleKey}`}
            initial={{ opacity: 0, y: -20, x: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.2 } }}
            layout
          >
            <div className="toast-icon">
              {t.moduleKey === 'fire' ? '🔥' : t.moduleKey === 'garbage' ? '🗑️' : '🚗'}
            </div>
            <div className="toast-content">
              <div className="toast-title">
                {t.moduleKey === 'fire' ? 'Incident Detected: Fire/Smoke' :
                 t.moduleKey === 'garbage' ? 'Clean-up Alert: Waste Spotted' :
                 'Traffic Alert: Accident Spotted'}
              </div>
              <div className="toast-body">{t.message}</div>
            </div>
            <button className="toast-close-btn" onClick={() => onClose(t.id)}>
              &times;
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
