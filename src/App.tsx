import { useState } from 'react'
import type { Id } from '../convex/_generated/dataModel'
import { Nav, type Tab } from './components/Nav'
import { ToastProvider } from './components/Toast'
import { ConfirmProvider } from './components/ConfirmDialog'
import { PinErrorBoundary } from './components/PinErrorBoundary'
import { PinProvider, usePin } from './lib/pin'
import { Login } from './pages/Login'
import { Resumen } from './pages/Resumen'
import { Arriendos } from './pages/Arriendos'
import { Gastos, type GastoPreset } from './pages/Gastos'
import { Vehiculos } from './pages/Vehiculos'
import { Duenos } from './pages/Duenos'

export default function App() {
  return (
    <PinProvider>
      <Gate />
    </PinProvider>
  )
}

function Gate() {
  const { pin, salir } = usePin()
  if (!pin) return <Login />
  return (
    <PinErrorBoundary key={pin} onPinInvalido={salir}>
      <Main />
    </PinErrorBoundary>
  )
}

function Main() {
  const { salir } = usePin()
  const [tab, setTab] = useState<Tab>('resumen')
  const [gastoPreset, setGastoPreset] = useState<GastoPreset | null>(null)

  const [hoyLabel] = useState(() => new Date().toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, ''))

  const irAGasto = (vehiculoId: Id<'vehiculos'>, arriendoId: Id<'arriendos'>) => {
    setGastoPreset({ vehiculoId, arriendoId, key: Date.now() })
    setTab('gastos')
    window.scrollTo({ top: 0 })
  }

  const cambiarTab = (t: Tab) => {
    setTab(t)
    window.scrollTo({ top: 0 })
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="wrap">
          <header className="topbar">
            <div className="topbar-title">
              <img src="/icon.svg" alt="" width={24} height={24} className="topbar-logo" />
              <span>Loki Gastos</span>
            </div>
            <div className="topbar-right">
              <span className="topbar-date">{hoyLabel}</span>
              <button type="button" className="icon-btn" onClick={salir} aria-label="Cerrar sesión" title="Cerrar sesión">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            </div>
          </header>
          <Nav tab={tab} onChange={cambiarTab} />
          <main>
            {tab === 'resumen' && <Resumen />}
            {tab === 'arriendos' && <Arriendos onAgregarGasto={irAGasto} />}
            {tab === 'gastos' && <Gastos preset={gastoPreset} />}
            {tab === 'vehiculos' && <Vehiculos />}
            {tab === 'duenos' && <Duenos />}
          </main>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  )
}
