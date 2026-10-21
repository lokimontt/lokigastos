import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { clp, errMsg, fecha, hoy } from '../lib/format'
import { CATEGORIAS, type Categoria } from '../lib/categorias'
import { comprimirImagen, subirBlob } from '../lib/image'
import { useToast } from '../lib/toast'
import { MesFilter } from '../components/MesFilter'
import { FotoModal } from '../components/FotoModal'
import { Card, CatBadge, Empty, Loading, PagadoBadge, Patente, TableWrap } from '../components/Ui'

export type GastoPreset = { vehiculoId: Id<'vehiculos'>; arriendoId: Id<'arriendos'>; key: number }

type Props = {
  preset: GastoPreset | null
}

export function Gastos({ preset }: Props) {
  const toast = useToast()
  const vehiculos = useQuery(api.vehiculos.list)
  const crear = useMutation(api.gastos.create)
  const actualizar = useMutation(api.gastos.update)
  const eliminar = useMutation(api.gastos.remove)
  const generarUploadUrl = useMutation(api.gastos.generateUploadUrl)

  // ---- formulario
  const [vehiculoId, setVehiculoId] = useState('')
  const [arriendoId, setArriendoId] = useState('')
  const [categoria, setCategoria] = useState<Categoria>('pasajes')
  const [monto, setMonto] = useState('')
  const [fechaG, setFechaG] = useState(hoy())
  const [descripcion, setDescripcion] = useState('')
  const [foto, setFoto] = useState<{ blob: Blob; url: string } | null>(null)
  const [procesandoFoto, setProcesandoFoto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Arriendos del vehículo seleccionado (para ligar el gasto a una entrega)
  const arriendosVehiculo = useQuery(api.arriendos.list, vehiculoId ? { vehiculoId: vehiculoId as Id<'vehiculos'> } : 'skip')

  // Preselección desde "Agregar gasto de esta entrega" (ajuste de estado durante el render, por key)
  const [presetKey, setPresetKey] = useState<number | null>(null)
  if (preset && preset.key !== presetKey) {
    setPresetKey(preset.key)
    setVehiculoId(preset.vehiculoId)
    setArriendoId(preset.arriendoId)
    setCategoria('pasajes')
  }

  const limpiarFoto = () => {
    if (foto) URL.revokeObjectURL(foto.url)
    setFoto(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const onFoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProcesandoFoto(true)
    try {
      const blob = await comprimirImagen(file)
      if (foto) URL.revokeObjectURL(foto.url)
      setFoto({ blob, url: URL.createObjectURL(blob) })
    } catch (err) {
      toast(errMsg(err), 'error')
      limpiarFoto()
    } finally {
      setProcesandoFoto(false)
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const montoNum = Math.round(Number(monto))
    if (!vehiculoId || !categoria || !fechaG || !montoNum || montoNum <= 0) {
      toast('Completa vehículo, categoría, monto y fecha', 'error')
      return
    }
    setGuardando(true)
    try {
      let fotoId: Id<'_storage'> | undefined
      if (foto) {
        const url = await generarUploadUrl()
        fotoId = (await subirBlob(url, foto.blob)) as Id<'_storage'>
      }
      await crear({
        vehiculoId: vehiculoId as Id<'vehiculos'>,
        arriendoId: arriendoId ? (arriendoId as Id<'arriendos'>) : undefined,
        categoria,
        monto: montoNum,
        fecha: fechaG,
        descripcion: descripcion.trim() || undefined,
        fotoId,
      })
      toast('Gasto registrado — ' + clp(montoNum))
      setMonto('')
      setDescripcion('')
      limpiarFoto()
    } catch (err) {
      toast(errMsg(err), 'error')
    } finally {
      setGuardando(false)
    }
  }

  // ---- lista
  const [mes, setMes] = useState('')
  const [fVehiculo, setFVehiculo] = useState('')
  const [fCategoria, setFCategoria] = useState('')
  const gastos = useQuery(api.gastos.list, {
    mes: mes || undefined,
    vehiculoId: fVehiculo ? (fVehiculo as Id<'vehiculos'>) : undefined,
    categoria: fCategoria ? (fCategoria as Categoria) : undefined,
  })
  const [fotoAbierta, setFotoAbierta] = useState<string | null>(null)

  const togglePagado = async (id: Id<'gastos'>, pagado: boolean) => {
    try {
      await actualizar({ id, pagado })
      toast(pagado ? 'Marcado como pagado' : 'Marcado como pendiente')
    } catch (err) {
      toast(errMsg(err), 'error')
    }
  }

  const onEliminar = async (id: Id<'gastos'>, montoG: number) => {
    if (!window.confirm(`¿Eliminar este gasto de ${clp(montoG)}?`)) return
    try {
      await eliminar({ id })
      toast('Gasto eliminado')
    } catch (err) {
      toast(errMsg(err), 'error')
    }
  }

  const totalLista = (gastos ?? []).reduce((s, g) => s + g.monto, 0)
  const activos = (vehiculos ?? []).filter((v) => v.activo)

  return (
    <>
      <Card title="Registrar gasto">
        <form onSubmit={onSubmit}>
          <div className="row">
            <div>
              <label htmlFor="g-vehiculo">Vehículo</label>
              <select
                id="g-vehiculo"
                value={vehiculoId}
                onChange={(e) => {
                  setVehiculoId(e.target.value)
                  setArriendoId('')
                }}
                required
              >
                <option value="">Seleccionar</option>
                {activos.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.patente} — {v.dueno.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="g-arriendo">Arriendo / entrega (opcional)</label>
              <select id="g-arriendo" value={arriendoId} onChange={(e) => setArriendoId(e.target.value)} disabled={!vehiculoId}>
                <option value="">{vehiculoId ? 'Sin arriendo (gasto del vehículo)' : 'Elige un vehículo primero'}</option>
                {(arriendosVehiculo ?? []).map((a) => (
                  <option key={a._id} value={a._id}>
                    {fecha(a.inicio)} → {fecha(a.termino)} · {a.dias}d{a.cliente ? ' · ' + a.cliente : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="row">
            <div>
              <label htmlFor="g-categoria">Categoría</label>
              <select id="g-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)}>
                <optgroup label="Gastos de entrega">
                  {CATEGORIAS.filter((c) => c.entrega).map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Gastos del vehículo">
                  {CATEGORIAS.filter((c) => !c.entrega).map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label htmlFor="g-monto">Monto (CLP)</label>
              <input id="g-monto" type="number" inputMode="numeric" min={1} step={1} value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" required />
            </div>
          </div>
          <div className="row">
            <div>
              <label htmlFor="g-fecha">Fecha</label>
              <input id="g-fecha" type="date" value={fechaG} onChange={(e) => setFechaG(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="g-desc">Descripción (opcional)</label>
              <input id="g-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: metro ida y vuelta" />
            </div>
          </div>
          <div>
            <label htmlFor="g-foto">Foto de respaldo (boleta / comprobante)</label>
            <input id="g-foto" ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFoto} />
            {procesandoFoto && <p className="hint">Procesando foto…</p>}
            {foto && (
              <div>
                <img className="foto-preview-lg" src={foto.url} alt="Vista previa del comprobante" />
                <p className="hint">
                  {(foto.blob.size / 1024).toFixed(0)} KB ·{' '}
                  <button type="button" className="btn-link" onClick={limpiarFoto}>
                    Quitar foto
                  </button>
                </p>
              </div>
            )}
          </div>
          <div className="actions">
            <button className="btn btn-primary" type="submit" disabled={guardando || procesandoFoto}>
              {guardando ? 'Guardando…' : 'Registrar gasto'}
            </button>
          </div>
        </form>
      </Card>

      <Card title="Historial de gastos" right={gastos && gastos.length > 0 ? <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>Total: {clp(totalLista)}</span> : null}>
        <div className="filter-bar">
          <MesFilter value={mes} onChange={setMes} />
          <label htmlFor="f-vehiculo">Vehículo:</label>
          <select id="f-vehiculo" value={fVehiculo} onChange={(e) => setFVehiculo(e.target.value)}>
            <option value="">Todos</option>
            {(vehiculos ?? []).map((v) => (
              <option key={v._id} value={v._id}>
                {v.patente}
              </option>
            ))}
          </select>
          <label htmlFor="f-categoria">Categoría:</label>
          <select id="f-categoria" value={fCategoria} onChange={(e) => setFCategoria(e.target.value)}>
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        {gastos === undefined ? (
          <Loading />
        ) : gastos.length === 0 ? (
          <Empty>Sin gastos registrados</Empty>
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Patente</th>
                  <th>Dueño</th>
                  <th>Categoría</th>
                  <th className="num">Monto</th>
                  <th>Descripción</th>
                  <th>Entrega</th>
                  <th>Foto</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {gastos.map((g) => (
                  <tr key={g._id}>
                    <td>{fecha(g.fecha)}</td>
                    <td>
                      <Patente p={g.vehiculo.patente} />
                    </td>
                    <td>{g.dueno.nombre}</td>
                    <td>
                      <CatBadge c={g.categoria} />
                    </td>
                    <td className="num strong">{clp(g.monto)}</td>
                    <td className="wrap-text muted">{g.descripcion || '—'}</td>
                    <td>{g.arriendoId ? <span className="badge badge-teal">Sí</span> : <span className="muted">—</span>}</td>
                    <td>
                      {g.fotoUrl ? (
                        <img className="foto-preview" src={g.fotoUrl} alt="Comprobante" loading="lazy" onClick={() => setFotoAbierta(g.fotoUrl)} />
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <PagadoBadge pagado={g.pagado} />
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className={'btn btn-sm' + (g.pagado ? '' : ' btn-green')} onClick={() => togglePagado(g._id, !g.pagado)}>
                          {g.pagado ? 'Desmarcar' : 'Pagado'}
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => onEliminar(g._id, g.monto)}>
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
      <FotoModal url={fotoAbierta} onClose={() => setFotoAbierta(null)} />
    </>
  )
}
