import type { Doc } from '../../convex/_generated/dataModel'

export type Categoria = Doc<'gastos'>['categoria']

export const CATEGORIAS: { value: Categoria; label: string; badge: string; color: string; entrega: boolean }[] = [
  { value: 'pasajes', label: 'Pasajes', badge: 'badge-blue', color: '#378ADD', entrega: true },
  { value: 'estacionamiento', label: 'Estacionamiento', badge: 'badge-gray', color: '#888780', entrega: true },
  { value: 'bencina', label: 'Bencina', badge: 'badge-amber', color: '#BA7517', entrega: true },
  { value: 'uber', label: 'Uber', badge: 'badge-teal', color: '#1D9E75', entrega: true },
  { value: 'alimentacion', label: 'Alimentación', badge: 'badge-coral', color: '#D85A30', entrega: true },
  { value: 'aceite', label: 'Aceite', badge: 'badge-amber', color: '#854F0B', entrega: false },
  { value: 'cambio_aceite', label: 'Cambio de aceite', badge: 'badge-red', color: '#E24B4A', entrega: false },
  { value: 'mantencion', label: 'Mantención', badge: 'badge-red', color: '#A32D2D', entrega: false },
  { value: 'otros', label: 'Otros', badge: 'badge-gray', color: '#444441', entrega: false },
]

export function catInfo(c: string) {
  return CATEGORIAS.find((x) => x.value === c) ?? { value: c as Categoria, label: c, badge: 'badge-gray', color: '#888', entrega: false }
}

export function catLabel(c: string): string {
  return catInfo(c).label
}
