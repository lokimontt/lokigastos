import { useState } from 'react'
import type { Id } from '../convex/_generated/dataModel'
import { Nav, type Tab } from './components/Nav'
import { ToastProvider } from './components/Toast'
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

  const [hoyLabel] = useState(() => new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }))

  const irAGasto = (vehiculoId: Id<'vehiculos'>, arriendoId: Id<'arriendos'>) => {
    setGastoPreset({ vehiculoId, arriendoId, key: Date.now() })
    setTab('gastos')
    window.scrollTo({ top: 0 })
  }

  return (
    <ToastProvider>
      <div className="wrap">
        <div className="topbar">
          <div className="topbar-title">Loki Rent a Car · Gastos</div>
          <div className="topbar-right">
            <div className="topbar-date">{hoyLabel}</div>
            <button className="btn btn-sm" onClick={salir} title="Cerrar sesión">
              Salir
            </button>
          </div>
        </div>
        <Nav tab={tab} onChange={setTab} />
        {tab === 'resumen' && <Resumen />}
        {tab === 'arriendos' && <Arriendos onAgregarGasto={irAGasto} />}
        {tab === 'gastos' && <Gastos preset={gastoPreset} />}
        {tab === 'vehiculos' && <Vehiculos />}
        {tab === 'duenos' && <Duenos />}
      </div>
    </ToastProvider>
  )
}
