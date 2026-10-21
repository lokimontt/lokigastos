import type { ReactNode } from 'react'
import { catInfo } from '../lib/categorias'

/** Skeleton discreto para listas (o texto "Cargando…"). */
export function Loading({ text = 'Cargando…', rows = 3 }: { text?: string; rows?: number }) {
  return (
    <div className="loading" role="status" aria-live="polite" aria-label={text}>
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton" key={i} aria-hidden="true" />
      ))}
      <span className="visually-hidden">{text}</span>
    </div>
  )
}

export function Empty({ icon = '📭', children, hint }: { icon?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="empty-text">{children}</div>
      {hint && <div className="empty-hint">{hint}</div>}
    </div>
  )
}

export function Card({ title, right, children, className }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={'card' + (className ? ' ' + className : '')}>
      {title && (
        <div className="section-title">
          <span>{title}</span>
          {right}
        </div>
      )}
      {children}
    </section>
  )
}

export function Patente({ p, lg }: { p: string; lg?: boolean }) {
  return <span className={'badge badge-blue patente' + (lg ? ' patente-lg' : '')}>{p || '—'}</span>
}

export function CatBadge({ c }: { c: string }) {
  const i = catInfo(c)
  return <span className={'badge ' + i.badge}>{i.label}</span>
}

export function PagadoBadge({ pagado }: { pagado: boolean }) {
  return pagado ? <span className="badge badge-green">Pagado</span> : <span className="badge badge-amber">Pendiente</span>
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="table-wrap">{children}</div>
}

/** Botón de ícono accesible (aria-label obligatorio). */
export function IconButton({ label, onClick, children, className }: { label: string; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" className={'icon-btn' + (className ? ' ' + className : '')} onClick={onClick} aria-label={label} title={label}>
      {children}
    </button>
  )
}
