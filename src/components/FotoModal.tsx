import { useEffect } from 'react'

export function FotoModal({ url, onClose }: { url: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!url) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [url, onClose])

  if (!url) return null
  return (
    <div className="modal-bg" onClick={onClose} role="dialog" aria-label="Foto del comprobante">
      <button className="modal-close" onClick={onClose} aria-label="Cerrar">
        ×
      </button>
      <img src={url} alt="Comprobante" onClick={(e) => e.stopPropagation()} />
    </div>
  )
}
