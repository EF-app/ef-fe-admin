import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: number
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 480,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(43,39,48,0.5)] backdrop-blur-sm animate-[fadeIn_0.18s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-lg p-7 w-full mx-4"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-extrabold">{title}</h3>
            <button onClick={onClose} className="text-text-soft hover:text-text">
              <X size={18} />
            </button>
          </div>
        )}
        <div>{children}</div>
        {footer && <div className="flex gap-2 justify-end mt-6">{footer}</div>}
      </div>
    </div>
  )
}
