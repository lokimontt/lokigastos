import { usePinQuery } from '../lib/convexPin'
import { api } from '../../convex/_generated/api'
import { mesLabel } from '../lib/format'

type Props = {
  value: string
  onChange: (mes: string) => void
  label?: string
}

/** Select de mes (YYYY-MM) alimentado por api.reportes.mesesDisponibles. "" = todos. */
export function MesFilter({ value, onChange, label = 'Mes:' }: Props) {
  const meses = usePinQuery(api.reportes.mesesDisponibles)
  const opciones = meses ?? []
  // Si el mes seleccionado ya no existe, lo mostramos igual para no perder el valor.
  const lista = value && !opciones.includes(value) ? [value, ...opciones] : opciones
  return (
    <>
      <label htmlFor="mes-filter">{label}</label>
      <select id="mes-filter" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todos</option>
        {lista.map((m) => (
          <option key={m} value={m}>
            {mesLabel(m)}
          </option>
        ))}
      </select>
    </>
  )
}
