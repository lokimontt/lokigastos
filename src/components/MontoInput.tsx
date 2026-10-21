import { formatMonto } from '../lib/monto'

type Props = {
  id: string
  /** Solo dígitos (sin puntos). */
  value: string
  onChange: (digits: string) => void
  placeholder?: string
  required?: boolean
  autoFocus?: boolean
}

/** Input de monto CLP: teclado numérico y separador de miles al escribir. */
export function MontoInput({ id, value, onChange, placeholder = '0', required, autoFocus }: Props) {
  return (
    <div className="monto-wrap">
      <span className="monto-prefix" aria-hidden="true">
        $
      </span>
      <input
        id={id}
        className="monto-input"
        type="text"
        inputMode="numeric"
        pattern="[0-9.]*"
        autoComplete="off"
        value={formatMonto(value)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
      />
    </div>
  )
}
