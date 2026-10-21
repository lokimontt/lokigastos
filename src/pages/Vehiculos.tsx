import { useState, type FormEvent } from 'react'
import { usePinMutation, usePinQuery } from '../lib/convexPin'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { errMsg } from '../lib/format'
import { useToast } from '../lib/toast'
import { Card, Empty, Loading, Patente, TableWrap } from '../components/Ui'

export function Vehiculos() {
  const toast = useToast()
  const vehiculos = usePinQuery(api.vehiculos.list)
  const duenos = usePinQuery(api.duenos.list)
  const arriendos = usePinQuery(api.arriendos.list, {})
  const crear = usePinMutation(api.vehiculos.create)
  const actualizar = usePinMutation(api.vehiculos.update)
  const eliminar = usePinMutation(api.vehiculos.remove)

  const [patente, setPatente] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [duenoId, setDuenoId] = useState('')
  const [guardando, setGuardando] = useState(false)

  const duenosActivos = (duenos ?? []).filter((d) => d.activo)

  const conteo = new Map<string, number>()
  for (const a of arriendos ?? []) conteo.set(a.vehiculoId, (conteo.get(a.vehiculoId) ?? 0) + 1)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const p = patente.trim().toUpperCase().replace(/\s+/g, '')
    if (!p || !duenoId) {
      toast('Completa patente y dueño', 'error')
      return
    }
    setGuardando(true)
    try {
      await crear({ patente: p, marca: marca.trim() || undefined, modelo: modelo.trim() || undefined, duenoId: duenoId as Id<'duenos'> })
      toast('Vehículo ' + p + ' agregado')
      setPatente('')
      setMarca('')
      setModelo('')
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
    if (!window.confirm(`¿Eliminar el vehículo ${p}?`)) return
    try {
      await eliminar({ id })
      toast('Vehículo eliminado')
    } catch (err) {
      toast(errMsg(err), 'error')
    }
  }

  return (
    <>
      <Card title="Agregar vehículo">
        <form onSubmit={onSubmit}>
          <div className="row">
            <div>
              <label htmlFor="v-patente">Patente</label>
              <input id="v-patente" value={patente} onChange={(e) => setPatente(e.target.value.toUpperCase())} placeholder="Ej: ABCD12" style={{ textTransform: 'uppercase' }} autoCapitalize="characters" required />
            </div>
            <div>
              <label htmlFor="v-dueno">Dueño</label>
              <select id="v-dueno" value={duenoId} onChange={(e) => setDuenoId(e.target.value)} required>
                <option value="">Seleccionar</option>
                {duenosActivos.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="row">
            <div>
              <label htmlFor="v-marca">Marca (opcional)</label>
              <input id="v-marca" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ej: Kia" />
            </div>
            <div>
              <label htmlFor="v-modelo">Modelo (opcional)</label>
              <input id="v-modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Ej: Morning" />
            </div>
          </div>
          {duenos !== undefined && duenosActivos.length === 0 && <p className="hint">Primero agrega un dueño en la pestaña Dueños.</p>}
          <div className="actions">
            <button className="btn btn-primary" type="submit" disabled={guardando || duenosActivos.length === 0}>
              {guardando ? 'Guardando…' : 'Agregar vehículo'}
            </button>
          </div>
        </form>
      </Card>

      <Card title="Vehículos registrados">
        {vehiculos === undefined ? (
          <Loading />
        ) : vehiculos.length === 0 ? (
          <Empty>Sin vehículos registrados</Empty>
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
                    <td>
                      <select value={v.duenoId} onChange={(e) => cambiarDueno(v._id, e.target.value)} style={{ margin: 0, width: 'auto', minWidth: 120 }} aria-label={'Dueño de ' + v.patente}>
                        {(duenos ?? []).map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="num">{arriendos === undefined ? '…' : (conteo.get(v._id) ?? 0)}</td>
                    <td>{v.activo ? <span className="badge badge-green">Activo</span> : <span className="badge badge-gray">Inactivo</span>}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-sm" onClick={() => toggleActivo(v._id, !v.activo)}>
                          {v.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => onEliminar(v._id, v.patente)}>
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
    </>
  )
}
