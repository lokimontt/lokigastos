import { useState, type FormEvent } from 'react'
import { useConvex } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { usePin } from '../lib/pin'

export function Login() {
  const convex = useConvex()
  const { setPin } = usePin()
  const [valor, setValor] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    const pin = valor.trim()
    if (!pin) return
    setCargando(true)
    setError(null)
    try {
      const ok = await convex.query(api.auth.verificarPin, { pin })
      if (ok) {
        setPin(pin)
      } else {
        setError('PIN incorrecto')
        setValor('')
      }
    } catch {
      setError('No se pudo verificar el PIN. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login">
      <form className="login-card card" onSubmit={enviar}>
        <h1 className="login-title">Loki Rent a Car</h1>
        <p className="login-sub">Ingresa el PIN para continuar</p>
        <label htmlFor="pin">PIN</label>
        <input
          id="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          autoFocus
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          disabled={cargando}
        />
        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}
        <button type="submit" className="btn btn-primary login-btn" disabled={cargando || !valor.trim()}>
          {cargando ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
