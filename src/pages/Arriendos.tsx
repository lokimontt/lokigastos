import { useState, type FormEvent } from 'react'
import { usePinMutation, usePinQuery } from '../lib/convexPin'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { calcDias, clp, errMsg, fecha, hoy } from '../lib/format'
import { useToast } from '../lib/toast'
import { MesFilter } from '../components/MesFilter'
import { Card, Empty, Loading, PagadoBadge, Patente, TableWrap } from '../components/Ui'

type Props = {
  onAgregarGasto: (vehiculoId: Id<'vehiculos'>, arriendoId: Id<'arriendos'>) => void
}

export function Arriendos({ onAgregarGasto }: Props) {
  const toast = useToast()
  const vehiculos = usePinQuery(api.vehiculos.list)
  const config = usePinQuery(api.config.get)
  const [mes, setMes] = useState('')
  const arriendos = usePinQuery(api.arriendos.list, { mes: mes || undefined })
  const crear = usePinMutation(api.arriendos.create)
  const actualizar = usePinMutation(api.arriendos.update)
  const eliminar = usePinMutation(api.arriendos.remove)

  const [vehiculoId, setVehiculoId] = useState('')
  const [inicio, setInicio] = useState(hoy())
  const [termino, setTermino] = useState(hoy())
  const [cliente, setCliente] = useState('')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)

  const tarifaDia = config?.tarifaDia ?? 5000
  const tarifaLavado = config?.tarifaLavado ?? 10000
  const dias = calcDias(inicio, termino)
  const comision = dias > 0 ? dias * tarifaDia + tarifaLavado : 0
  const activos = (vehiculos ?? []).filter((v) => v.activo)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!vehiculoId || !inicio || !termino) {
      toast('Completa vehículo, inicio y término', 'error')
      return
    }
    if (termino < inicio) {
      toast('El término debe ser igual o posterior al inicio', 'error')
      return
    }
    setGuardando(true)
    try {
      await crear({
        vehiculoId: vehiculoId as Id<'vehiculos'>,
        inicio,
        termino,
        cliente: cliente.trim() || undefined,
        notas: notas.trim() || undefined,
      })
      toast(`Arriendo registrado — ${dias} día${dias === 1 ? '' : 's'}, comisión ${clp(comision)}`)
      setCliente('')
      setNotas('')
    } catch (err) {
      toast(errMsg(err), 'error')
    } finally {
      setGuardando(false)
    }
  }

  const togglePagado = async (id: Id<'arriendos'>, pagado: boolean) => {
    try {
      await actualizar({ id, pagado })
      toast(pagado ? 'Marcado como pagado' : 'Marcado como pendiente')
    } catch (err) {
      toast(errMsg(err), 'error')
    }
  }

  const onEliminar = async (id: Id<'arriendos'>, patente: string) => {
    if (!window.confirm(`¿Eliminar el arriendo de ${patente}? Los gastos ligados quedarán sin arriendo.`)) return
    try {
      await eliminar({ id })
      toast('Arriendo eliminado')
    } catch (err) {
      toast(errMsg(err), 'error')
    }
  }

  return (
    <>
      <Card title="Registrar arriendo (entrega)">
        <form onSubmit={onSubmit}>
          <div className="row3">
            <div>
              <label htmlFor="arr-vehiculo">Vehículo</label>
              <select id="arr-vehiculo" value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)} required>
                <option value="">Seleccionar</option>
                {activos.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.patente} — {v.dueno.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="arr-inicio">Inicio</label>
              <input id="arr-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="arr-termino">Término</label>
              <input id="arr-termino" type="date" value={termino} min={inicio} onChange={(e) => setTermino(e.target.value)} required />
            </div>
          </div>
          <div className="row">
            <div>
              <label htmlFor="arr-cliente">Cliente (opcional)</label>
              <input id="arr-cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nombre del cliente" />
            </div>
            <div>
              <label htmlFor="arr-notas">Notas (opcional)</label>
              <input id="arr-notas" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: entrega en aeropuerto" />
            </div>
          </div>
          <div className="calc-box">
            <span>
              {dias} día{dias === 1 ? '' : 's'} × {clp(tarifaDia)} + lavado {clp(tarifaLavado)}
            </span>
            <span>
              Comisión: <strong>{clp(comision)}</strong>
            </span>
          </div>
          <div className="actions">
            <button className="btn btn-primary" type="submit" disabled={guardando || vehiculos === undefined}>
              {guardando ? 'Guardando…' : 'Registrar arriendo'}
            </button>
          </div>
          {vehiculos !== undefined && activos.length === 0 && <p className="hint">Primero agrega un vehículo en la pestaña Vehículos.</p>}
        </form>
      </Card>

      <Card title="Arriendos">
        <div className="filter-bar">
          <MesFilter value={mes} onChange={setMes} />
        </div>
        {arriendos === undefined ? (
          <Loading />
        ) : arriendos.length === 0 ? (
          <Empty>Sin arriendos registrados</Empty>
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Patente</th>
                  <th>Dueño</th>
                  <th>Inicio</th>
                  <th>Término</th>
                  <th className="num">Días</th>
                  <th>Cliente</th>
                  <th className="num">Comisión</th>
                  <th className="num">Gastos entrega</th>
                  <th className="num">Total</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {arriendos.map((a) => {
                  const comisionArr = a.comisionDias + a.lavado
                  return (
                    <tr key={a._id}>
                      <td>
                        <Patente p={a.vehiculo.patente} />
                      </td>
                      <td>{a.dueno.nombre}</td>
                      <td>{fecha(a.inicio)}</td>
                      <td>{fecha(a.termino)}</td>
                      <td className="num">{a.dias}</td>
                      <td className="wrap-text">
                        {a.cliente || <span className="muted">—</span>}
                        {a.notas && <div className="muted" style={{ fontSize: 11 }}>{a.notas}</div>}
                      </td>
                      <td className="num green strong">{clp(comisionArr)}</td>
                      <td className="num">{clp(a.gastosEntrega)}</td>
                      <td className="num strong">{clp(a.totalEntrega)}</td>
                      <td>
                        <PagadoBadge pagado={a.pagado} />
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button className="btn btn-sm" onClick={() => onAgregarGasto(a.vehiculoId, a._id)} title="Agregar gasto de esta entrega">
                            + Gasto
                          </button>
                          <button className={'btn btn-sm' + (a.pagado ? '' : ' btn-green')} onClick={() => togglePagado(a._id, !a.pagado)}>
                            {a.pagado ? 'Desmarcar' : 'Pagado'}
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => onEliminar(a._id, a.vehiculo.patente)}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>
    </>
  )
}
