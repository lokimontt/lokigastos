import type { ReactNode } from 'react'

export type ChipOption<T extends string> = {
  value: T
  label: ReactNode
  /** Texto secundario pequeño bajo la etiqueta (p. ej. dueño). */
  sub?: ReactNode
  /** Color de acento (punto a la izquierda). */
  color?: string
  disabled?: boolean
}

type Props<T extends string> = {
  options: ChipOption<T>[]
  value: T | null
  onChange: (v: T) => void
  ariaLabel: string
  /** 'wrap' (por defecto) o 'scroll' horizontal en una sola fila. */
  layout?: 'wrap' | 'scroll'
  /** Chips grandes (p. ej. patentes). */
  size?: 'md' | 'lg'
}

/** Grupo de chips seleccionables (un solo valor). Rol radiogroup para accesibilidad. */
export function Chips<T extends string>({ options, value, onChange, ariaLabel, layout = 'wrap', size = 'md' }: Props<T>) {
  return (
    <div className={'chips' + (layout === 'scroll' ? ' chips-scroll' : '') + (size === 'lg' ? ' chips-lg' : '')} role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={'chip' + (active ? ' active' : '')}
            onClick={() => onChange(o.value)}
            disabled={o.disabled}
          >
            {o.color && <span className="chip-dot" style={{ background: o.color }} aria-hidden="true" />}
            <span className="chip-label">
              {o.label}
              {o.sub && <small className="chip-sub">{o.sub}</small>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
