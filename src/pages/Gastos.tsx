import { useCallback, useState, type FormEvent } from 'react'
import { usePinMutation, usePinQuery } from '../lib/convexPin'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { clp, errMsg, fecha, hoy } from '../lib/format'
import { CATEGORIAS, catInfo, type Categoria } from '../lib/categorias'
import { comprimirImagen, subirBlob } from '../lib/image'
import { useToast } from '../lib/toast'
import { useIsMobile } from '../lib/useMedia'
import { parseMonto } from '../lib/monto'
import { MesFilter } from '../components/MesFilter'
import { FotoModal } from '../components/FotoModal'
import { BottomSheet } from '../components/BottomSheet'
import { Fab } from '../components/Fab'
import { Chips } from '../components/Chips'
import { MontoInput } from '../components/MontoInput'
import { FotoInput } from '../components/FotoInput'
import { useConfirm } from '../lib/confirm'
import { ItemCard, ItemMeta } from '../components/ItemCard'
import { Card, CatBadge, Empty, Loading, PagadoBadge, Patente, TableWrap } from '../components/Ui'

export type GastoPreset = { vehiculoId: Id<'vehiculos'>; arriendoId: Id<'arriendos'>; key: number }

type Props = {
  preset: GastoPreset | null
}

const CATS_ENTREGA = CATEGORIAS.filter((c) => c.entrega).map((c) => ({ value: c.value, label: c.label, color: c.color }))
const CATS_VEHICULO = CATEGORIAS.filter((c) => !c.entrega).map((c) => ({ value: c.value, label: c.label, color: c.color }))

export function Gastos({ preset }: Props) {
  const toast = useToast()
  const confirm = useConfirm()
  const isMobile = useIsMobile()
  const vehiculos = usePinQuery(api.vehiculos.list)
  const crear = usePinMutation(api.gastos.create)
  const actualizar = usePinMutation(api.gastos.update)
  const eliminar = usePinMutation(api.gastos.remove)
  const generarUploadUrl = usePinMutation(api.gastos.generateUploadUrl)
  const descartarFoto = usePinMutation(api.gastos.descartarFoto)

  // ---- formulario (en bottom sheet)
  const [abierto, setAbierto] = useState(false)
  const [vehiculoId, setVehiculoId] = useState('')
  const [arriendoId, setArriendoId] = useState('')
  const [categoria, setCategoria] = useState<Categoria>('pasajes')
  const [monto, setMonto] = useState('')
  const [fechaG, setFechaG] = useState(hoy())
  const [descripcion, setDescripcion] = useState('')
  const [foto, setFoto] = useState<{ blob: Blob; url: string } | null>(null)
  const [procesandoFoto, setProcesandoFoto] = useState(false)
  const [guardando, setGuardando] = useState<false | 'foto' | 'datos'>(false)

  // Arriendos del vehículo seleccionado (para ligar el gasto a una entrega)
  const arriendosVehiculo = usePinQuery(api.arriendos.list, vehiculoId ? { vehiculoId: vehiculoId as Id<'vehiculos'> } : 'skip')

  // Preselección desde "+ Gasto" en un arriendo (ajuste de estado durante el render, por key)
  const [presetKey, setPresetKey] = useState<number | null>(null)
  if (preset && preset.key !== presetKey) {
    setPresetKey(preset.key)
    setVehiculoId(preset.vehiculoId)
    setArriendoId(preset.arriendoId)
    setCategoria('pasajes')
    setFechaG(hoy())
    setAbierto(true)
  }

  const limpiarFoto = useCallback(() => {
    setFoto((f) => {
      if (f) URL.revokeObjectURL(f.url)
      return null
    })
  }, [])

  const onFotoFile = async (file: File) => {
    setProcesandoFoto(true)
    try {
      const blob = await comprimirImagen(file)
      limpiarFoto()
      setFoto({ blob, url: URL.createObjectURL(blob) })
    } catch (err) {
      toast(errMsg(err), 'error')
      limpiarFoto()
    } finally {
      setProcesandoFoto(false)
    }
  }

  const abrirNuevo = () => {
    setFechaG(hoy())
    setAbierto(true)
  }

  const cerrar = useCallback(() => {
    if (guardando) return
    setAbierto(false)
  }, [guardando])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (guardando) return
    const montoNum = parseMonto(monto)
    if (!vehiculoId) {
      toast('Elige el vehículo', 'error')
      return
    }
    if (!montoNum || montoNum <= 0) {
      toast('Ingresa el monto', 'error')
      return
    }
    if (!fechaG) {
      toast('Ingresa la fecha', 'error')
      return
    }
    let fotoId: Id<'_storage'> | undefined
    try {
      if (foto) {
        setGuardando('foto')
        const url = await generarUploadUrl()
        fotoId = (await subirBlob(url, foto.blob)) as Id<'_storage'>
      }
      setGuardando('datos')
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
      setAbierto(false)
    } catch (err) {
      toast(errMsg(err), 'error')
      // Si la foto ya se subió pero el gasto no se creó, evitar archivo huérfano
      if (fotoId) descartarFoto({ fotoId }).catch(() => {})
    } finally {
      setGuardando(false)
    }
  }

  // ---- lista
  const [mes, setMes] = useState('')
  const [fVehiculo, setFVehiculo] = useState('')
  const [fCategoria, setFCategoria] = useState('')
  const gastos = usePinQuery(api.gastos.list, {
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

  const onEliminar = async (id: Id<'gastos'>, montoG: number, cat: string) => {
    const ok = await confirm({
      title: 'Eliminar gasto',
      message: `Se eliminará el gasto de ${clp(montoG)} (${catInfo(cat).label}) y su foto. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    })
    if (!ok) return
    try {
      await eliminar({ id })
      toast('Gasto eliminado')
    } catch (err) {
      toast(errMsg(err), 'error')
    }
  }

  const totalLista = (gastos ?? []).reduce((s, g) => s + g.monto, 0)
  const activos = (vehiculos ?? []).filter((v) => v.activo)
  const usarChipsVehiculo = activos.length > 0 && activos.length <= 8
  const hayFiltro = Boolean(mes || fVehiculo || fCategoria)

  const labelGuardar = guardando === 'foto' ? 'Subiendo foto…' : guardando === 'datos' ? 'Guardando…' : 'Guardar gasto'

  return (
    <>
      <Card
        title="Gastos"
        right={
          gastos && gastos.length > 0 ? (
            <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>
              {gastos.length} · Total {clp(totalLista)}
            </span>
          ) : null
        }
      >
        <div className="filter-stack">
          <MesFilter value={mes} onChange={setMes} />
          <div className="filter-row">
            <select id="f-vehiculo" value={fVehiculo} onChange={(e) => setFVehiculo(e.target.value)} aria-label="Filtrar por vehículo">
              <option value="">Vehículo: todos</option>
              {(vehiculos ?? []).map((v) => (
                <option key={v._id} value={v._id}>
                  {v.patente}
                </option>
              ))}
            </select>
            <select id="f-categoria" value={fCategoria} onChange={(e) => setFCategoria(e.target.value)} aria-label="Filtrar por categoría">
              <option value="">Categoría: todas</option>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {gastos === undefined ? (
          <Loading />
        ) : gastos.length === 0 ? (
          <Empty icon="🧾" hint={hayFiltro ? 'Prueba con otro mes o quita los filtros.' : 'Toca + para registrar tu primer gasto.'}>
            {hayFiltro ? 'Sin gastos con estos filtros' : 'Sin gastos registrados'}
          </Empty>
        ) : isMobile ? (
          <div className="item-list">
            {gastos.map((g) => (
              <ItemCard
                key={g._id}
                title={
                  <div className="item-amount-row">
                    <span className="item-amount">{clp(g.monto)}</span>
                    <CatBadge c={g.categoria} />
                  </div>
                }
                right={<PagadoBadge pagado={g.pagado} />}
                actions={
                  <>
                    <button type="button" className={'btn btn-sm' + (g.pagado ? '' : ' btn-green')} onClick={() => togglePagado(g._id, !g.pagado)}>
                      {g.pagado ? 'Desmarcar' : 'Pagado'}
                    </button>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => onEliminar(g._id, g.monto, g.categoria)}>
                      Eliminar
                    </button>
                  </>
                }
              >
                <div className="item-body">
                  <div className="item-body-text">
                    <ItemMeta>
                      <Patente p={g.vehiculo.patente} />
                      <span>{fecha(g.fecha)}</span>
                      <span>{g.dueno.nombre}</span>
                      {g.arriendoId && <span className="badge badge-teal">Entrega</span>}
                    </ItemMeta>
                    {g.descripcion && <div className="item-desc">{g.descripcion}</div>}
                  </div>
                  {g.fotoUrl && (
                    <button type="button" className="thumb-btn" onClick={() => setFotoAbierta(g.fotoUrl)} aria-label="Ver foto del comprobante">
                      <img className="thumb" src={g.fotoUrl} alt="" loading="lazy" />
                    </button>
                  )}
                </div>
              </ItemCard>
            ))}
          </div>
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
                        <button type="button" className="thumb-btn" onClick={() => setFotoAbierta(g.fotoUrl)} aria-label="Ver foto del comprobante">
                          <img className="thumb" src={g.fotoUrl} alt="" loading="lazy" />
                        </button>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <PagadoBadge pagado={g.pagado} />
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button type="button" className={'btn btn-sm' + (g.pagado ? '' : ' btn-green')} onClick={() => togglePagado(g._id, !g.pagado)}>
                          {g.pagado ? 'Desmarcar' : 'Pagado'}
                        </button>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => onEliminar(g._id, g.monto, g.categoria)}>
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

      <Fab onClick={abrirNuevo} label="Registrar gasto" />

      <BottomSheet
        open={abierto}
        onClose={cerrar}
        title="Registrar gasto"
        footer={
          <button className="btn btn-primary btn-lg btn-block" type="submit" form="form-gasto" disabled={Boolean(guardando) || procesandoFoto} aria-busy={Boolean(guardando)}>
            {guardando && <span className="spinner" aria-hidden="true" />}
            {labelGuardar}
          </button>
        }
      >
        <form id="form-gasto" onSubmit={onSubmit}>
          <div className="field">
            <label id="g-vehiculo-label" htmlFor={usarChipsVehiculo ? undefined : 'g-vehiculo'}>
              Vehículo
            </label>
            {vehiculos === undefined ? (
              <Loading rows={1} />
            ) : activos.length === 0 ? (
              <p className="hint">Primero agrega un vehículo en la pestaña Vehículos.</p>
            ) : usarChipsVehiculo ? (
              <Chips
                ariaLabel="Vehículo"
                size="lg"
                options={activos.map((v) => ({ value: v._id as string, label: v.patente, sub: v.dueno.nombre }))}
                value={vehiculoId || null}
                onChange={(v) => {
                  setVehiculoId(v)
                  setArriendoId('')
                }}
              />
            ) : (
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
            )}
          </div>

          {vehiculoId && (arriendosVehiculo === undefined || arriendosVehiculo.length > 0) && (
            <div className="field">
              <label htmlFor="g-arriendo">Entrega / arriendo (opcional)</label>
              <select id="g-arriendo" value={arriendoId} onChange={(e) => setArriendoId(e.target.value)}>
                <option value="">Sin arriendo (gasto del vehículo)</option>
                {(arriendosVehiculo ?? []).map((a) => (
                  <option key={a._id} value={a._id}>
                    {fecha(a.inicio)} → {fecha(a.termino)} · {a.dias}d{a.cliente ? ' · ' + a.cliente : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label id="g-cat-label">Categoría</label>
            <div className="chip-group-label">Entrega</div>
            <Chips ariaLabel="Categoría de entrega" options={CATS_ENTREGA} value={categoria} onChange={setCategoria} />
            <div className="chip-group-label">Vehículo</div>
            <Chips ariaLabel="Categoría del vehículo" options={CATS_VEHICULO} value={categoria} onChange={setCategoria} />
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="g-monto">Monto</label>
              <MontoInput id="g-monto" value={monto} onChange={setMonto} required />
            </div>
            <div className="field">
              <label htmlFor="g-fecha">Fecha</label>
              <input id="g-fecha" type="date" value={fechaG} onChange={(e) => setFechaG(e.target.value)} required />
            </div>
          </div>

          <div className="field">
            <label htmlFor="g-desc">Descripción (opcional)</label>
            <input id="g-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: metro ida y vuelta" />
          </div>

          <div className="field">
            <label htmlFor="g-foto">Foto de respaldo</label>
            <FotoInput id="g-foto" foto={foto} procesando={procesandoFoto} onFile={onFotoFile} onClear={limpiarFoto} />
          </div>
        </form>
      </BottomSheet>

      <FotoModal url={fotoAbierta} onClose={() => setFotoAbierta(null)} />
    </>
  )
}
