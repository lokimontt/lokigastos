import { useEffect, useId, useRef, type ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  /** Zona fija al pie (p. ej. botón Guardar). */
  footer?: ReactNode
}

/**
 * Hoja inferior en móvil / modal centrado en desktop (solo CSS).
 * Cierra con X, tocando el fondo o Esc. Bloquea el scroll del body mientras está abierta.
 */
export function BottomSheet({ open, onClose, title, children, footer }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Foco al primer control del formulario para teclado / lectores de pantalla.
    const t = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea, button.chip, button')
      first?.focus()
    }, 50)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      window.clearTimeout(t)
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panelRef} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-head">
          <h2 className="sheet-title" id={titleId}>
            {title}
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  )
}
