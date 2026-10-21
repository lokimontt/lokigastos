import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Se llama cuando un error contiene "PIN incorrecto" (p.ej. cambió el PIN en el servidor). */
  onPinInvalido: () => void
}

type State = { error: Error | null }

/**
 * Captura errores de queries de Convex. Si el error es "PIN incorrecto" o
 * "APP_PIN no configurado", borra el PIN guardado y vuelve al login.
 */
export class PinErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (esErrorDePin(error)) {
      this.props.onPinInvalido()
      // Al borrar el PIN, App deja de renderizar este boundary; reseteamos por si acaso.
      this.setState({ error: null })
    } else {
      console.error('Error no controlado', error, info)
    }
  }

  render() {
    const { error } = this.state
    if (error && !esErrorDePin(error)) {
      return (
        <div className="card">
          <div className="section-title">Ocurrió un error</div>
          <p className="hint">{error.message}</p>
          <button className="btn" onClick={() => this.setState({ error: null })}>
            Reintentar
          </button>
        </div>
      )
    }
    if (error) return null
    return this.props.children
  }
}

function esErrorDePin(error: Error): boolean {
  const msg = error?.message ?? ''
  return msg.includes('PIN incorrecto') || msg.includes('APP_PIN no configurado')
}
