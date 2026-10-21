import { useRef, useState, type FormEvent } from 'react'
import { useConvex } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { usePin } from '../lib/pin'

const LARGO = 4

export function Login() {
  const convex = useConvex()
  const { setPin } = usePin()
  const [valor, setValor] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const verificar = async (pin: string) => {
    if (!pin || cargando) return
    setCargando(true)
    setError(null)
    try {
      const ok = await convex.query(api.auth.verificarPin, { pin })
      if (ok) {
        setPin(pin)
      } else {
        setError('PIN incorrecto. Intenta de nuevo.')
        setValor('')
        inputRef.current?.focus()
      }
    } catch {
      setError('No se pudo verificar el PIN. Revisa tu conexión.')
    } finally {
      setCargando(false)
    }
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    void verificar(valor)
  }

  return (
    <div className="login">
      <form className="login-card card" onSubmit={enviar}>
        <img src="/icon.svg" alt="" className="login-logo" width={72} height={72} />
        <h1 className="login-title">Loki Rent a Car</h1>
        <p className="login-sub">Ingresa el PIN de 4 dígitos</p>

        <label htmlFor="pin" className="visually-hidden">
          PIN
        </label>
        <div className="pin-wrap" onClick={() => inputRef.current?.focus()}>
          <input
            id="pin"
            ref={inputRef}
            className="pin-input"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={LARGO}
            autoFocus
            value={valor}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, LARGO)
              setValor(v)
              // Envío automático al completar los 4 dígitos.
              if (v.length === LARGO) void verificar(v)
            }}
            disabled={cargando}
            aria-describedby={error ? 'pin-error' : undefined}
            aria-invalid={error ? true : undefined}
          />
          <div className="pin-boxes" aria-hidden="true">
            {Array.from({ length: LARGO }).map((_, i) => (
              <span key={i} className={'pin-box' + (valor.length > i ? ' filled' : '') + (valor.length === i && !cargando ? ' current' : '')}>
                {valor.length > i ? '•' : ''}
              </span>
            ))}
          </div>
        </div>

        {error && (
          <div className="login-error" role="alert" id="pin-error">
            {error}
          </div>
        )}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={cargando || valor.length < LARGO} aria-busy={cargando}>
          {cargando && <span className="spinner" aria-hidden="true" />}
          {cargando ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
