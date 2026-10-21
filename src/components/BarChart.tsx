import { clp } from '../lib/format'
import { catInfo } from '../lib/categorias'
import { Empty } from './Ui'

type Item = { categoria: string; total: number }

/** Gráfico de barras horizontal en CSS puro, por categoría. */
export function BarChart({ data }: { data: Item[] }) {
  const items = data.filter((d) => d.total > 0).sort((a, b) => b.total - a.total)
  if (items.length === 0) return <Empty>Sin gastos en el período</Empty>
  const max = Math.max(...items.map((d) => d.total))
  return (
    <div className="bars" role="img" aria-label="Gastos por categoría">
      {items.map((d) => {
        const info = catInfo(d.categoria)
        const pct = Math.max(2, Math.round((d.total / max) * 100))
        return (
          <div className="bar-row" key={d.categoria}>
            <span>{info.label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: pct + '%', background: info.color }} />
            </div>
            <span className="bar-amt">{clp(d.total)}</span>
          </div>
        )
      })}
    </div>
  )
}
