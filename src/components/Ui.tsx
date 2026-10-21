import type { ReactNode } from 'react'
import { catInfo } from '../lib/categorias'

export function Loading({ text = 'Cargando…' }: { text?: string }) {
  return <div className="loading">{text}</div>
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}

export function Card({ title, right, children }: { title?: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="card">
      {title && (
        <div className="section-title">
          <span>{title}</span>
          {right}
        </div>
      )}
      {children}
    </div>
  )
}

export function Patente({ p }: { p: string }) {
  return <span className="badge badge-blue">{p || '—'}</span>
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
