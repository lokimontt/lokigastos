import { useCallback, useState, type FormEvent } from 'react'
import { usePinMutation, usePinQuery } from '../lib/convexPin'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { calcDias, clp, errMsg, fecha, fechaCorta, hoy, sumarDias } from '../lib/format'
import { useToast } from '../lib/toast'
import { useIsMobile } from '../lib/useMedia'
import { MesFilter } from '../components/MesFilter'
import { BottomSheet } from '../components/BottomSheet'
import { Fab } from '../components/Fab'
import { Chips } from '../components/Chips'
import { useConfirm } from '../lib/confirm'
import { ItemCard, ItemMeta, ItemStats } from '../components/ItemCard'
import { Card, Empty, Loading, PagadoBadge, Patente, TableWrap } from '../components/Ui'

type Props = {
  onAgregarGasto: (vehiculoId: Id<'vehiculos'>, arriendoId: Id<'arriendos'>) => void
}

export function Arriendos({ onAgregarGasto }: Props) {
  const toast = useToast()
  const confirm = useConfirm()
  const isMobile = useIsMobile()
  const vehiculos = usePinQuery(api.vehiculos.list)
  const config = usePinQuery(api.config.get)
  const [mes, setMes] = useState('')
  const arriendos = usePinQuery(api.arriendos.list, { mes: mes || undefined })
  const crear = usePinMutation(api.arriendos.create)
  const actualizar = usePinMutation(api.arriendos.update)
  const eliminar = usePinMutation(api.arriendos.remove)

  const [abierto, setAbierto] = useState(false)
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
  const usarChips = activos.length > 0 && activos.length <= 8

  const abrirNuevo = () => {
    const h = hoy()
    setInicio(h)
    setTermino(h)
    setAbierto(true)
  }

  const cerrar = useCallback(() => {
    if (guardando) return
    setAbierto(false)
  }, [guardando])

  const cambiarInicio = (nuevo: string) => {
    setInicio(nuevo)
    if (nuevo && termino < nuevo) setTermino(nuevo)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (guardando) return
    if (!vehiculoId) {
      toast('Elige el vehículo', 'error')
      return
    }
    if (!inicio || !termino) {
      toast('Completa inicio y término', 'error')
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
      setAbierto(false)
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
    const ok = await confirm({
      title: 'Eliminar arriendo',
      message: `Se eliminará el arriendo de ${patente}. Los gastos ligados a esta entrega quedarán como gastos del vehículo.`,
      confirmLabel: 'Eliminar',
      danger: true,
    })
    if (!ok) return
    try {
      await eliminar({ id })
      toast('Arriendo eliminado')
    } catch (err) {
      toast(errMsg(err), 'error')
    }
  }

  const atajosTermino = [1, 2, 3]

  return (
    <>
      <Card
        title="Arriendos"
        right={
          arriendos && arriendos.length > 0 ? (
            <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>
              {arriendos.length} entrega{arriendos.length === 1 ? '' : 's'}
            </span>
          ) : null
        }
      >
        <div className="filter-stack">
          <MesFilter value={mes} onChange={setMes} />
        </div>
        {arriendos === undefined ? (
          <Loading />
        ) : arriendos.length === 0 ? (
          <Empty icon="🚗" hint={mes ? 'Prueba con otro mes.' : 'Toca + para registrar tu primera entrega.'}>
            {mes ? 'Sin arriendos en este mes' : 'Sin arriendos registrados'}
          </Empty>
        ) : isMobile ? (
          <div className="item-list">
            {arriendos.map((a) => {
              const comisionArr = a.comisionDias + a.lavado
              return (
                <ItemCard
                  key={a._id}
                  title={
                    <div className="item-title-stack">
                      <Patente p={a.vehiculo.patente} lg />
                      <span className="item-subtitle">{a.cliente || a.dueno.nombre}</span>
                    </div>
                  }
                  right={<PagadoBadge pagado={a.pagado} />}
                  actions={
                    <>
                      <button type="button" className="btn btn-sm" onClick={() => onAgregarGasto(a.vehiculoId, a._id)}>
                        + Gasto
                      </button>
                      <button type="button" className={'btn btn-sm' + (a.pagado ? '' : ' btn-green')} onClick={() => togglePagado(a._id, !a.pagado)}>
                        {a.pagado ? 'Desmarcar' : 'Pagado'}
                      </button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => onEliminar(a._id, a.vehiculo.patente)}>
                        Eliminar
                      </button>
                    </>
                  }
                >
                  <ItemMeta>
                    <span>
                      {fechaCorta(a.inicio)} → {fechaCorta(a.termino)}
                    </span>
                    <span className="strong">
                      {a.dias} día{a.dias === 1 ? '' : 's'}
                    </span>
                    {a.cliente && <span>{a.dueno.nombre}</span>}
                  </ItemMeta>
                  {a.notas && <div className="item-desc">{a.notas}</div>}
                  <ItemStats
                    items={[
                      { label: 'Comisión', value: clp(comisionArr), className: 'green strong' },
                      { label: 'Gastos entrega', value: clp(a.gastosEntrega) },
                      { label: 'Total', value: clp(a.totalEntrega), className: 'strong' },
                    ]}
                  />
                </ItemCard>
              )
            })}
          </div>
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
                          <button type="button" className="btn btn-sm" onClick={() => onAgregarGasto(a.vehiculoId, a._id)} title="Agregar gasto de esta entrega">
                            + Gasto
                          </button>
                          <button type="button" className={'btn btn-sm' + (a.pagado ? '' : ' btn-green')} onClick={() => togglePagado(a._id, !a.pagado)}>
                            {a.pagado ? 'Desmarcar' : 'Pagado'}
                          </button>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => onEliminar(a._id, a.vehiculo.patente)}>
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

      <Fab onClick={abrirNuevo} label="Registrar arriendo" />

      <BottomSheet
        open={abierto}
        onClose={cerrar}
        title="Registrar arriendo"
        footer={
          <button className="btn btn-primary btn-lg btn-block" type="submit" form="form-arriendo" disabled={guardando || vehiculos === undefined} aria-busy={guardando}>
            {guardando && <span className="spinner" aria-hidden="true" />}
            {guardando ? 'Guardando…' : 'Guardar arriendo'}
          </button>
        }
      >
        <form id="form-arriendo" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor={usarChips ? undefined : 'arr-vehiculo'}>Vehículo</label>
            {vehiculos === undefined ? (
              <Loading rows={1} />
            ) : activos.length === 0 ? (
              <p className="hint">Primero agrega un vehículo en la pestaña Vehículos.</p>
            ) : usarChips ? (
              <Chips
                ariaLabel="Vehículo"
                size="lg"
                options={activos.map((v) => ({ value: v._id as string, label: v.patente, sub: v.dueno.nombre }))}
                value={vehiculoId || null}
                onChange={setVehiculoId}
              />
            ) : (
              <select id="arr-vehiculo" value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)} required>
                <option value="">Seleccionar</option>
                {activos.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.patente} — {v.dueno.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="arr-inicio">Inicio</label>
              <input id="arr-inicio" type="date" value={inicio} onChange={(e) => cambiarInicio(e.target.value)} required />
              <div className="quick-row">
                <button type="button" className={'chip chip-sm' + (inicio === hoy() ? ' active' : '')} onClick={() => cambiarInicio(hoy())}>
                  Hoy
                </button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="arr-termino">Término</label>
              <input id="arr-termino" type="date" value={termino} min={inicio} onChange={(e) => setTermino(e.target.value)} required />
              <div className="quick-row" role="group" aria-label="Atajos de término">
                {atajosTermino.map((n) => {
                  const val = inicio ? sumarDias(inicio, n) : ''
                  return (
                    <button key={n} type="button" className={'chip chip-sm' + (val && termino === val ? ' active' : '')} onClick={() => val && setTermino(val)} disabled={!inicio}>
                      +{n}
                      {n === 1 ? ' día' : ''}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="arr-cliente">Cliente (opcional)</label>
              <input id="arr-cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nombre del cliente" />
            </div>
            <div className="field">
              <label htmlFor="arr-notas">Notas (opcional)</label>
              <input id="arr-notas" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: entrega en aeropuerto" />
            </div>
          </div>

          <div className="comision-box" role="status" aria-live="polite">
            <div className="comision-label">Comisión de esta entrega</div>
            <div className="comision-value">{clp(comision)}</div>
            <div className="comision-detalle">
              {dias} día{dias === 1 ? '' : 's'} × {clp(tarifaDia)} + lavado {clp(tarifaLavado)}
            </div>
          </div>
        </form>
      </BottomSheet>
    </>
  )
}
