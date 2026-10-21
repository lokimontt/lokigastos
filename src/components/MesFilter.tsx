import { usePinQuery } from '../lib/convexPin'
import { api } from '../../convex/_generated/api'
import { Chips, type ChipOption } from './Chips'

type Props = {
  value: string
  onChange: (mes: string) => void
  /** Cuántos meses mostrar como chips (los más recientes). */
  max?: number
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function mesCorto(mes: string): string {
  const [y, m] = mes.split('-').map(Number)
  return `${MESES_CORTOS[(m ?? 1) - 1]} ${String(y).slice(2)}`
}

/** Chips horizontales de mes (YYYY-MM) alimentados por api.reportes.mesesDisponibles. "" = todos. */
export function MesFilter({ value, onChange, max = 8 }: Props) {
  const meses = usePinQuery(api.reportes.mesesDisponibles)
  const opciones = (meses ?? []).slice(0, max)
  // Si el mes seleccionado ya no está en la lista, lo mostramos igual para no perder el valor.
  const lista = value && !opciones.includes(value) ? [value, ...opciones] : opciones
  const options: ChipOption<string>[] = [{ value: '', label: 'Todos' }, ...lista.map((m) => ({ value: m, label: mesCorto(m) }))]
  return <Chips options={options} value={value} onChange={onChange} ariaLabel="Filtrar por mes" layout="scroll" />
}
