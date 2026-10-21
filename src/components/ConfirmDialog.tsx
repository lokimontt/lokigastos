import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { ConfirmContext, type ConfirmFn, type ConfirmOptions } from '../lib/confirm'

type Pending = { opts: ConfirmOptions; resolve: (ok: boolean) => void }

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      setPending((prev) => {
        prev?.resolve(false)
        return { opts, resolve }
      })
    })
  }, [])

  const cerrar = useCallback((ok: boolean) => {
    setPending((p) => {
      p?.resolve(ok)
      return null
    })
  }, [])

  const value = useMemo(() => confirm, [confirm])
  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {pending && <ConfirmDialog {...pending.opts} onConfirm={() => cerrar(true)} onCancel={() => cerrar(false)} />}
    </ConfirmContext.Provider>
  )
}

type DialogProps = ConfirmOptions & {
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger, onConfirm, onCancel }: DialogProps) {
  const titleId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="dialog-bg" onClick={onCancel}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
        <h2 className="dialog-title" id={titleId}>
          {title}
        </h2>
        {message && <div className="dialog-msg">{message}</div>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-lg" onClick={onCancel} ref={cancelRef}>
            {cancelLabel}
          </button>
          <button type="button" className={'btn btn-lg ' + (danger ? 'btn-danger-solid' : 'btn-primary')} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
