import { useCallback, useState, type FormEvent } from 'react'
import { usePinMutation, usePinQuery } from '../lib/convexPin'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { clp, errMsg, mesLabel } from '../lib/format'
import { useToast } from '../lib/toast'
import { useIsMobile } from '../lib/useMedia'
import { MesFilter } from '../components/MesFilter'
import { BottomSheet } from '../components/BottomSheet'
import { Fab } from '../components/Fab'
import { useConfirm } from '../lib/confirm'
import { ItemCard, ItemMeta } from '../components/ItemCard'
import { Card, Empty, Loading, Patente, TableWrap } from '../components/Ui'

type DuenoEdit = { _id: Id<'duenos'>; nombre: string; telefono?: string; notas?: string }

export function Duenos() {
  const toast = useToast()
  const confirm = useConfirm()
  const isMobile = useIsMobile()
  const duenos = usePinQuery(api.duenos.list)
  const crear = usePinMutation(api.duenos.create)
  const actualizar = usePinMutation(api.duenos.update)
  const eliminar = usePinMutation(api.duenos.remove)

  // Formulario (crear o editar) en bottom sheet
  const [abierto, setAbierto] = useState(false)
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

  const abrirNuevo = () => {
    limpiar()
    setAbierto(true)
  }

  const editar = (d: DuenoEdit) => {
    setEditId(d._id)
    setNombre(d.nombre)
    setTelefono(d.telefono ?? '')
    setNotas(d.notas ?? '')
    setAbierto(true)
  }

  const cerrar = useCallback(() => {
    if (guardando) return
    setAbierto(false)
  }, [guardando])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (guardando) return
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
      setAbierto(false)
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
    const ok = await confirm({
      title: 'Eliminar dueño',
      message: `Se eliminará a ${n}. Si tiene vehículos asociados, mejor desactívalo para conservar el historial.`,
      confirmLabel: 'Eliminar',
      danger: true,
    })
    if (!ok) return
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
  const liquidacion = usePinQuery(api.reportes.porDueno, { mes: mes || undefined })

  const telLink = (t: string) => (
    <a href={'tel:' + t.replace(/\s+/g, '')} className="tel-link">
      {t}
    </a>
  )

  return (
    <>
      <Card title="Dueños">
        {duenos === undefined ? (
          <Loading />
        ) : duenos.length === 0 ? (
          <Empty icon="👤" hint="Toca + para agregar el primer dueño.">
            Sin dueños registrados
          </Empty>
        ) : isMobile ? (
          <div className="item-list">
            {duenos.map((d) => (
              <ItemCard
                key={d._id}
                muted={!d.activo}
                title={<span className="item-name">{d.nombre}</span>}
                right={d.activo ? <span className="badge badge-green">Activo</span> : <span className="badge badge-gray">Inactivo</span>}
                actions={
                  <>
                    <button type="button" className="btn btn-sm" onClick={() => editar(d)}>
                      Editar
                    </button>
                    <button type="button" className="btn btn-sm" onClick={() => toggleActivo(d._id, !d.activo)}>
                      {d.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => onEliminar(d._id, d.nombre)}>
                      Eliminar
                    </button>
                  </>
                }
              >
                <ItemMeta>{d.telefono ? telLink(d.telefono) : <span>Sin teléfono</span>}</ItemMeta>
                {d.notas && <div className="item-desc">{d.notas}</div>}
              </ItemCard>
            ))}
          </div>
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
                    <td>{d.telefono ? telLink(d.telefono) : <span className="muted">—</span>}</td>
                    <td className="wrap-text muted">{d.notas || '—'}</td>
                    <td>{d.activo ? <span className="badge badge-green">Activo</span> : <span className="badge badge-gray">Inactivo</span>}</td>
                    <td>
                      <div className="actions-cell">
                        <button type="button" className="btn btn-sm" onClick={() => editar(d)}>
                          Editar
                        </button>
                        <button type="button" className="btn btn-sm" onClick={() => toggleActivo(d._id, !d.activo)}>
                          {d.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => onEliminar(d._id, d.nombre)}>
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
        <div className="filter-stack">
          <MesFilter value={mes} onChange={setMes} />
        </div>
        {liquidacion === undefined ? (
          <Loading />
        ) : liquidacion.length === 0 ? (
          <Empty icon="🧮">Sin movimientos{mes ? ' en ' + mesLabel(mes) : ''}</Empty>
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
                <div className="mini-list">
                  {d.vehiculos.map((v) => (
                    <div className="mini-row" key={v.vehiculoId}>
                      <Patente p={v.patente} />
                      <span className="muted">{v.dias} d</span>
                      <span className="green">{clp(v.comision)}</span>
                      <span className="muted">{clp(v.gastos)}</span>
                      <span className="strong num">{clp(v.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </Card>

      <Fab onClick={abrirNuevo} label="Agregar dueño" />

      <BottomSheet
        open={abierto}
        onClose={cerrar}
        title={editId ? 'Editar dueño' : 'Agregar dueño'}
        footer={
          <button className="btn btn-primary btn-lg btn-block" type="submit" form="form-dueno" disabled={guardando} aria-busy={guardando}>
            {guardando && <span className="spinner" aria-hidden="true" />}
            {guardando ? 'Guardando…' : editId ? 'Guardar cambios' : 'Guardar dueño'}
          </button>
        }
      >
        <form id="form-dueno" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="d-nombre">Nombre</label>
            <input id="d-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del dueño" autoComplete="off" required />
          </div>
          <div className="field">
            <label htmlFor="d-telefono">Teléfono (opcional)</label>
            <input id="d-telefono" type="tel" inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+56 9 ..." />
          </div>
          <div className="field">
            <label htmlFor="d-notas">Notas (opcional)</label>
            <input id="d-notas" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: paga los días 5 de cada mes" />
          </div>
        </form>
      </BottomSheet>
    </>
  )
}
