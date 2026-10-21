/** Deja solo dígitos de un string y lo devuelve como número entero (0 si está vacío). */
export function parseMonto(s: string): number {
  const digits = s.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

/** Formatea un string con dígitos como miles chilenos: "12500" → "12.500". */
export function formatMonto(s: string): string {
  const n = parseMonto(s)
  return n ? n.toLocaleString('es-CL') : ''
}
