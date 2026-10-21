import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ToastContext } from '../lib/toast'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState('')
  const [tipo, setTipo] = useState<'ok' | 'error'>('ok')
  const [show, setShow] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const toast = useCallback((m: string, t: 'ok' | 'error' = 'ok') => {
    setMsg(m)
    setTipo(t)
    setShow(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setShow(false), t === 'error' ? 4000 : 2500)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={'toast' + (show ? ' show' : '') + (tipo === 'error' ? ' error' : '')} role="status">
        {msg}
      </div>
    </ToastContext.Provider>
  )
}
