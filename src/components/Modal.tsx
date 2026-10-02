'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="panel mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:mx-6 sm:p-6"
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="eyebrow mb-1">Dialog</div>
                <h3 className="font-display text-lg font-semibold tracking-tight sm:text-xl">{title}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost shrink-0 rounded-full p-1.5"
                aria-label="Close"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
