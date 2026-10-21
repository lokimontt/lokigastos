import { useCallback, useState, type FormEvent } from 'react'
import { usePinMutation, usePinQuery } from '../lib/convexPin'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { errMsg } from '../lib/format'
import { useToast } from '../lib/toast'
import { useIsMobile } from '../lib/useMedia'
import { BottomSheet } from '../components/BottomSheet'
import { Fab } from '../components/Fab'
import { Chips } from '../components/Chips'
import { useConfirm } from '../lib/confirm'
import { ItemCard, ItemMeta } from '../components/ItemCard'
import { Card, Empty, Loading, Patente, TableWrap } from '../components/Ui'

export function Vehiculos() {
  const toast = useToast()
  const confirm = useConfirm()
  const isMobile = useIsMobile()
  const vehiculos = usePinQuery(api.vehiculos.list)
  const duenos = usePinQuery(api.duenos.list)
  const arriendos = usePinQuery(api.arriendos.list, {})
  const crear = usePinMutation(api.vehiculos.create)
  const actualizar = usePinMutation(api.vehiculos.update)
  const eliminar = usePinMutation(api.vehiculos.remove)

  const [abierto, setAbierto] = useState(false)
  const [patente, setPatente] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [duenoId, setDuenoId] = useState('')
  const [guardando, setGuardando] = useState(false)

  const duenosActivos = (duenos ?? []).filter((d) => d.activo)
  const usarChipsDueno = duenosActivos.length > 0 && duenosActivos.length <= 8

  const conteo = new Map<string, number>()
  for (const a of arriendos ?? []) conteo.set(a.vehiculoId, (conteo.get(a.vehiculoId) ?? 0) + 1)

  const cerrar = useCallback(() => {
    if (guardando) return
    setAbierto(false)
  }, [guardando])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (guardando) return
    const p = patente.trim().toUpperCase().replace(/\s+/g, '')
    if (!p) {
      toast('Ingresa la patente', 'error')
      return
    }
    if (!duenoId) {
      toast('Elige el dueño', 'error')
      return
    }
    setGuardando(true)
    try {
      await crear({ patente: p, marca: marca.trim() || undefined, modelo: modelo.trim() || undefined, duenoId: duenoId as Id<'duenos'> })
      toast('Vehículo ' + p + ' agregado')
      setPatente('')
      setMarca('')
      setModelo('')
      setAbierto(false)
    } catch (err) {
      toast(errMsg(err), 'error')
    } finally {
      setGuardando(false)
    }
  }

  const cambiarDueno = async (id: Id<'vehiculos'>, nuevo: string) => {
    try {
      await actualizar({ id, duenoId: nuevo as Id<'duenos'> })
      toast('Dueño actualizado')
    } catch (err) {
      toast(errMsg(err), 'error')
    }
  }

  const toggleActivo = async (id: Id<'vehiculos'>, activo: boolean) => {
    try {
      await actualizar({ id, activo })
      toast(activo ? 'Vehículo activado' : 'Vehículo desactivado')
    } catch (err) {
      toast(errMsg(err), 'error')
    }
  }

  const onEliminar = async (id: Id<'vehiculos'>, p: string) => {
    const ok = await confirm({
      title: 'Eliminar vehículo',
      message: `Se eliminará el vehículo ${p}. Si tiene arriendos o gastos registrados, mejor desactívalo para conservar el historial.`,
      confirmLabel: 'Eliminar',
      danger: true,
    })
    if (!ok) return
    try {
      await eliminar({ id })
      toast('Vehículo eliminado')
    } catch (err) {
      toast(errMsg(err), 'error')
    }
  }

  const selectDueno = (v: { _id: Id<'vehiculos'>; patente: string; duenoId: Id<'duenos'> }) => (
    <select value={v.duenoId} onChange={(e) => cambiarDueno(v._id, e.target.value)} className="inline-select" aria-label={'Dueño de ' + v.patente}>
      {(duenos ?? []).map((d) => (
        <option key={d._id} value={d._id}>
          {d.nombre}
        </option>
      ))}
    </select>
  )

  return (
    <>
      <Card title="Vehículos" right={vehiculos && vehiculos.length > 0 ? <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>{vehiculos.length} registrados</span> : null}>
        {vehiculos === undefined ? (
          <Loading />
        ) : vehiculos.length === 0 ? (
          <Empty icon="🚙" hint="Toca + para agregar tu primer vehículo.">
            Sin vehículos registrados
          </Empty>
        ) : isMobile ? (
          <div className="item-list">
            {vehiculos.map((v) => (
              <ItemCard
                key={v._id}
                muted={!v.activo}
                title={
                  <div className="item-title-stack">
                    <Patente p={v.patente} lg />
                    <span className="item-subtitle">{[v.marca, v.modelo].filter(Boolean).join(' ') || 'Sin marca / modelo'}</span>
                  </div>
                }
                right={v.activo ? <span className="badge badge-green">Activo</span> : <span className="badge badge-gray">Inactivo</span>}
                actions={
                  <>
                    <button type="button" className="btn btn-sm" onClick={() => toggleActivo(v._id, !v.activo)}>
                      {v.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => onEliminar(v._id, v.patente)}>
                      Eliminar
                    </button>
                  </>
                }
              >
                <ItemMeta>
                  <span>
                    {arriendos === undefined ? '…' : (conteo.get(v._id) ?? 0)} arriendo{conteo.get(v._id) === 1 ? '' : 's'}
                  </span>
                </ItemMeta>
                <div className="field-inline">
                  <span className="muted">Dueño</span>
                  {selectDueno(v)}
                </div>
              </ItemCard>
            ))}
          </div>
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Patente</th>
                  <th>Marca / modelo</th>
                  <th>Dueño</th>
                  <th className="num">Arriendos</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vehiculos.map((v) => (
                  <tr key={v._id} style={{ opacity: v.activo ? 1 : 0.55 }}>
                    <td>
                      <Patente p={v.patente} />
                    </td>
                    <td className="muted">{[v.marca, v.modelo].filter(Boolean).join(' ') || '—'}</td>
                    <td>{selectDueno(v)}</td>
                    <td className="num">{arriendos === undefined ? '…' : (conteo.get(v._id) ?? 0)}</td>
                    <td>{v.activo ? <span className="badge badge-green">Activo</span> : <span className="badge badge-gray">Inactivo</span>}</td>
                    <td>
                      <div className="actions-cell">
                        <button type="button" className="btn btn-sm" onClick={() => toggleActivo(v._id, !v.activo)}>
                          {v.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => onEliminar(v._id, v.patente)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      <Fab onClick={() => setAbierto(true)} label="Agregar vehículo" />

      <BottomSheet
        open={abierto}
        onClose={cerrar}
        title="Agregar vehículo"
        footer={
          <button className="btn btn-primary btn-lg btn-block" type="submit" form="form-vehiculo" disabled={guardando || duenosActivos.length === 0} aria-busy={guardando}>
            {guardando && <span className="spinner" aria-hidden="true" />}
            {guardando ? 'Guardando…' : 'Guardar vehículo'}
          </button>
        }
      >
        <form id="form-vehiculo" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="v-patente">Patente</label>
            <input
              id="v-patente"
              className="input-patente"
              value={patente}
              onChange={(e) => setPatente(e.target.value.toUpperCase())}
              placeholder="ABCD12"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={8}
              required
            />
          </div>
          <div className="field">
            <label htmlFor={usarChipsDueno ? undefined : 'v-dueno'}>Dueño</label>
            {duenos === undefined ? (
              <Loading rows={1} />
            ) : duenosActivos.length === 0 ? (
              <p className="hint">Primero agrega un dueño en la pestaña Dueños.</p>
            ) : usarChipsDueno ? (
              <Chips ariaLabel="Dueño" options={duenosActivos.map((d) => ({ value: d._id as string, label: d.nombre }))} value={duenoId || null} onChange={setDuenoId} />
            ) : (
              <select id="v-dueno" value={duenoId} onChange={(e) => setDuenoId(e.target.value)} required>
                <option value="">Seleccionar</option>
                {duenosActivos.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="v-marca">Marca (opcional)</label>
              <input id="v-marca" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ej: Kia" />
            </div>
            <div className="field">
              <label htmlFor="v-modelo">Modelo (opcional)</label>
              <input id="v-modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Ej: Morning" />
            </div>
          </div>
        </form>
      </BottomSheet>
    </>
  )
}
