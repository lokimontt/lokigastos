export function clp(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CL')
}

/** Parsea 'YYYY-MM-DD' como fecha local (evita corrimiento por zona horaria). */
export function parseFecha(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function fecha(s: string | undefined | null): string {
  if (!s) return '—'
  return parseFecha(s).toLocaleDateString('es-CL')
}

/** 'YYYY-MM' → 'octubre de 2026' */
export function mesLabel(mes: string): string {
  const [y, m] = mes.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
}

/** Fecha de hoy en formato YYYY-MM-DD (hora local). */
export function hoy(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function mesDe(fechaISO: string): string {
  return fechaISO.slice(0, 7)
}

/** dias = max(1, round((termino - inicio) / 1 día)) */
export function calcDias(inicio: string, termino: string): number {
  if (!inicio || !termino) return 0
  const a = parseFecha(inicio).getTime()
  const b = parseFecha(termino).getTime()
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  return Math.max(1, Math.round((b - a) / 864e5))
}

export function errMsg(e: unknown): string {
  if (e instanceof Error) {
    // Convex envuelve el mensaje con "Uncaught Error: ..." y stack; nos quedamos con la primera línea útil.
    const m = e.message.split('\n').find((l) => l.trim()) ?? e.message
    return m.replace(/^Uncaught (Convex)?Error:\s*/, '').replace(/^\[CONVEX [^\]]+\]\s*/, '')
  }
  return String(e)
}

/** Suma `n` días a una fecha 'YYYY-MM-DD' (hora local). */
export function sumarDias(fechaISO: string, n: number): string {
  const d = parseFecha(fechaISO)
  d.setDate(d.getDate() + n)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** 'YYYY-MM-DD' → '21 oct' (fecha corta para tarjetas). */
export function fechaCorta(s: string | undefined | null): string {
  if (!s) return '—'
  return parseFecha(s).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }).replace('.', '')
}
