// src/components/ImageModal.tsx
import { useEffect, useRef } from 'react'
import type { SelectedImage } from '../types'

interface ImageModalProps {
  image: SelectedImage
  siblings: SelectedImage[]
  onClose: () => void
  onNavigate: (img: SelectedImage) => void
}

export function ImageModal({ image, siblings, onClose, onNavigate }: ImageModalProps) {
  const currentIdx = siblings.findIndex(s => s.student_id === image.student_id && s.column === image.column)
  const hasPrev = currentIdx > 0
  const hasNext = currentIdx < siblings.length - 1
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeBtnRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(siblings[currentIdx - 1])
      if (e.key === 'ArrowRight' && hasNext) onNavigate(siblings[currentIdx + 1])
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, hasPrev, hasNext, currentIdx, siblings, onNavigate])

  return (
    <>
      <style>{`
        @keyframes ay-modal-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ay-modal-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* Backdrop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Image: ${image.column} for ${image.student_id}`}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background: 'rgba(0,0,0,0.88)',
          animation: 'ay-modal-fade 180ms ease-out forwards',
        }}
        onClick={onClose}
      >
        {/* Content */}
        <div
          className="relative flex flex-col items-center gap-4 px-4"
          style={{
            maxWidth: '90vw',
            animation: 'ay-modal-scale 200ms cubic-bezier(0.23,1,0.32,1) forwards',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close */}
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="absolute -top-8 right-0 text-xs transition-opacity duration-150 opacity-50 hover:opacity-100"
            style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)' }}
            aria-label="Close modal"
          >
            [esc]
          </button>

          {/* Image */}
          <img
            src={image.url}
            alt={`${image.student_id} — ${image.column}`}
            className="rounded object-contain"
            style={{
              maxWidth: '85vw',
              maxHeight: '78vh',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          />

          {/* Nav + caption */}
          <div className="flex items-center gap-5">
            {hasPrev
              ? <button onClick={() => onNavigate(siblings[currentIdx - 1])} className="text-xs opacity-50 hover:opacity-100 transition-opacity duration-150" style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>← prev</button>
              : <span className="w-12" />
            }
            <div className="text-center">
              <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.55)' }}>
                <span style={{ color: '#00ffff' }}>{image.student_id}</span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}> · </span>
                {image.column}
              </p>
            </div>
            {hasNext
              ? <button onClick={() => onNavigate(siblings[currentIdx + 1])} className="text-xs opacity-50 hover:opacity-100 transition-opacity duration-150" style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>next →</button>
              : <span className="w-12" />
            }
          </div>
        </div>
      </div>
    </>
  )
}
