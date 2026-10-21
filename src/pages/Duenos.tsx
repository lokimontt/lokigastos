import { useState, type FormEvent } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { clp, errMsg, mesLabel } from '../lib/format'
import { useToast } from '../lib/toast'
import { MesFilter } from '../components/MesFilter'
import { Card, Empty, Loading, Patente, TableWrap } from '../components/Ui'

export function Duenos() {
  const toast = useToast()
  const duenos = useQuery(api.duenos.list)
  const crear = useMutation(api.duenos.create)
  const actualizar = useMutation(api.duenos.update)
  const eliminar = useMutation(api.duenos.remove)

  // Formulario (crear o editar)
  const [editId, setEditId] = useState<Id<'duenos'> | null>(null)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)

  const limpiar = () => {
    setEditId(null)
    setNombre('')
    setTelefono('')
    setNotas('')
  }

  const editar = (d: { _id: Id<'duenos'>; nombre: string; telefono?: string; notas?: string }) => {
    setEditId(d._id)
    setNombre(d.nombre)
    setTelefono(d.telefono ?? '')
    setNotas(d.notas ?? '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const n = nombre.trim()
    if (!n) {
      toast('El nombre es obligatorio', 'error')
      return
    }
    setGuardando(true)
    try {
      if (editId) {
        await actualizar({ id: editId, nombre: n, telefono: telefono.trim() || undefined, notas: notas.trim() || undefined })
        toast('Dueño actualizado')
      } else {
        await crear({ nombre: n, telefono: telefono.trim() || undefined, notas: notas.trim() || undefined })
        toast('Dueño agregado')
      }
      limpiar()
    } catch (err) {
      toast(errMsg(err), 'error')
    } finally {
      setGuardando(false)
    }
  }

  const toggleActivo = async (id: Id<'duenos'>, activo: boolean) => {
    try {
      await actualizar({ id, activo })
      toast(activo ? 'Dueño activado' : 'Dueño desactivado')
    } catch (err) {
      toast(errMsg(err), 'error')
    }
  }

  const onEliminar = async (id: Id<'duenos'>, n: string) => {
    if (!window.confirm(`¿Eliminar al dueño ${n}?`)) return
    try {
      await eliminar({ id })
      toast('Dueño eliminado')
      if (editId === id) limpiar()
    } catch (err) {
      toast(errMsg(err), 'error')
    }
  }

  // Liquidación
  const [mes, setMes] = useState('')
  const liquidacion = useQuery(api.reportes.porDueno, { mes: mes || undefined })

  return (
    <>
      <Card title={editId ? 'Editar dueño' : 'Agregar dueño'}>
        <form onSubmit={onSubmit}>
          <div className="row">
            <div>
              <label htmlFor="d-nombre">Nombre</label>
              <input id="d-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del dueño" required />
            </div>
            <div>
              <label htmlFor="d-telefono">Teléfono (opcional)</label>
              <input id="d-telefono" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+56 9 ..." />
            </div>
          </div>
          <div>
            <label htmlFor="d-notas">Notas (opcional)</label>
            <input id="d-notas" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: paga los días 5 de cada mes" />
          </div>
          <div className="actions">
            {editId && (
              <button type="button" className="btn" onClick={limpiar}>
                Cancelar
              </button>
            )}
            <button className="btn btn-primary" type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : editId ? 'Guardar cambios' : 'Agregar dueño'}
            </button>
          </div>
        </form>
      </Card>

      <Card title="Dueños">
        {duenos === undefined ? (
          <Loading />
        ) : duenos.length === 0 ? (
          <Empty>Sin dueños registrados</Empty>
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Notas</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {duenos.map((d) => (
                  <tr key={d._id} style={{ opacity: d.activo ? 1 : 0.55 }}>
                    <td className="strong">{d.nombre}</td>
                    <td>{d.telefono ? <a href={'tel:' + d.telefono.replace(/\s+/g, '')}>{d.telefono}</a> : <span className="muted">—</span>}</td>
                    <td className="wrap-text muted">{d.notas || '—'}</td>
                    <td>{d.activo ? <span className="badge badge-green">Activo</span> : <span className="badge badge-gray">Inactivo</span>}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-sm" onClick={() => editar(d)}>
                          Editar
                        </button>
                        <button className="btn btn-sm" onClick={() => toggleActivo(d._id, !d.activo)}>
                          {d.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => onEliminar(d._id, d.nombre)}>
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

      <Card title="Liquidación por dueño">
        <div className="filter-bar">
          <MesFilter value={mes} onChange={setMes} />
        </div>
        {liquidacion === undefined ? (
          <Loading />
        ) : liquidacion.length === 0 ? (
          <Empty>Sin movimientos{mes ? ' en ' + mesLabel(mes) : ''}</Empty>
        ) : (
          liquidacion.map((d) => (
            <div className={'dueno-card' + (d.total > 0 ? ' con-saldo' : '')} key={d.duenoId}>
              <div className="dueno-header">
                <div className="dueno-nombre">{d.nombre}</div>
                <div className="dueno-saldo">{clp(d.total)}</div>
              </div>
              <div className="dueno-detalle">
                <div className="dueno-item">
                  Días
                  <span>{d.dias}</span>
                </div>
                <div className="dueno-item">
                  Comisión
                  <span>{clp(d.comision)}</span>
                </div>
                <div className="dueno-item">
                  Gastos
                  <span>{clp(d.gastos)}</span>
                </div>
              </div>
              {d.vehiculos.length > 0 && (
                <TableWrap>
                  <table>
                    <thead>
                      <tr>
                        <th>Patente</th>
                        <th className="num">Días</th>
                        <th className="num">Comisión</th>
                        <th className="num">Gastos</th>
                        <th className="num">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.vehiculos.map((v) => (
                        <tr key={v.vehiculoId}>
                          <td>
                            <Patente p={v.patente} />
                          </td>
                          <td className="num">{v.dias}</td>
                          <td className="num green">{clp(v.comision)}</td>
                          <td className="num">{clp(v.gastos)}</td>
                          <td className="num strong">{clp(v.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              )}
            </div>
          ))
        )}
      </Card>
    </>
  )
}
