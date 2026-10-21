import type { ReactNode } from 'react'

type Props = {
  /** Lado izquierdo de la cabecera (patente, categoría…). */
  title: ReactNode
  /** Lado derecho de la cabecera (monto, estado…). */
  right?: ReactNode
  children?: ReactNode
  /** Fila de acciones al pie. */
  actions?: ReactNode
  muted?: boolean
}

/** Tarjeta de lista para móvil: cabecera jerarquizada, cuerpo libre y acciones al pie. */
export function ItemCard({ title, right, children, actions, muted }: Props) {
  return (
    <article className={'item' + (muted ? ' item-muted' : '')}>
      <div className="item-head">
        <div className="item-title">{title}</div>
        {right !== undefined && <div className="item-right">{right}</div>}
      </div>
      {children}
      {actions && <div className="item-actions">{actions}</div>}
    </article>
  )
}

/** Fila de meta-datos pequeños separados por puntos. */
export function ItemMeta({ children }: { children: ReactNode }) {
  return <div className="item-meta">{children}</div>
}

/** Grilla de pares etiqueta/valor (días, comisión, gastos…). */
export function ItemStats({ items }: { items: { label: string; value: ReactNode; className?: string }[] }) {
  return (
    <dl className="item-stats">
      {items.map((it) => (
        <div key={it.label} className="item-stat">
          <dt>{it.label}</dt>
          <dd className={it.className}>{it.value}</dd>
        </div>
      ))}
    </dl>
  )
}
