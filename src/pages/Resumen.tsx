import { useState } from 'react'
import { usePinQuery } from '../lib/convexPin'
import { api } from '../../convex/_generated/api'
import { clp, mesLabel } from '../lib/format'
import { useIsMobile } from '../lib/useMedia'
import { MesFilter } from '../components/MesFilter'
import { BarChart } from '../components/BarChart'
import { ItemCard, ItemStats } from '../components/ItemCard'
import { Card, Empty, Loading, Patente, TableWrap } from '../components/Ui'

export function Resumen() {
  const isMobile = useIsMobile()
  const [mes, setMes] = useState('')
  const r = usePinQuery(api.reportes.resumen, { mes: mes || undefined })
  const periodo = mes ? mesLabel(mes) : 'todo el período'

  return (
    <>
      <div className="filter-stack">
        <MesFilter value={mes} onChange={setMes} />
      </div>
      {r === undefined ? (
        <Loading rows={5} />
      ) : (
        <>
          <div className="metric-grid">
            <div className="metric destacada">
              <div className="metric-label">Total a pagar a Viviana · {periodo}</div>
              <div className="metric-value">{clp(r.totalPagarViviana)}</div>
              <div className="metric-sub">
                Comisión {clp(r.totalComision)} + gastos {clp(r.totalGastos)}
              </div>
            </div>
            <div className="metric">
              <div className="metric-label">Total comisión</div>
              <div className="metric-value green">{clp(r.totalComision)}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Total gastos</div>
              <div className="metric-value">{clp(r.totalGastos)}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Días arrendados</div>
              <div className="metric-value">{r.totalDias}</div>
              <div className="metric-sub">
                {r.arriendos} entrega{r.arriendos === 1 ? '' : 's'}
              </div>
            </div>
            <div className="metric">
              <div className="metric-label">Por días · lavados</div>
              <div className="metric-value green">{clp(r.comisionDias)}</div>
              <div className="metric-sub">Lavados {clp(r.comisionLavado)}</div>
            </div>
          </div>

          <Card title="Gastos por categoría" className="card-compact">
            <BarChart data={r.porCategoria} />
          </Card>

          <Card title="Por vehículo">
            {r.porVehiculo.length === 0 ? (
              <Empty icon="🚗" hint="Registra arriendos y gastos para ver el detalle por vehículo.">
                Sin movimientos en el período
              </Empty>
            ) : isMobile ? (
              <div className="item-list">
                {r.porVehiculo.map((v) => (
                  <ItemCard
                    key={v.vehiculoId}
                    title={
                      <div className="item-title-stack">
                        <Patente p={v.patente} lg />
                        <span className="item-subtitle">{v.dueno}</span>
                      </div>
                    }
                    right={<span className="item-amount">{clp(v.total)}</span>}
                  >
                    <ItemStats
                      items={[
                        { label: 'Días', value: v.dias },
                        { label: 'Comisión', value: clp(v.comision), className: 'green strong' },
                        { label: 'Gastos', value: clp(v.gastos) },
                      ]}
                    />
                  </ItemCard>
                ))}
                <div className="item item-total">
                  <span>Total</span>
                  <span className="strong">{clp(r.totalPagarViviana)}</span>
                </div>
              </div>
            ) : (
              <TableWrap>
                <table>
                  <thead>
                    <tr>
                      <th>Patente</th>
                      <th>Dueño</th>
                      <th className="num">Días</th>
                      <th className="num">Comisión</th>
                      <th className="num">Gastos</th>
                      <th className="num">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.porVehiculo.map((v) => (
                      <tr key={v.vehiculoId}>
                        <td>
                          <Patente p={v.patente} />
                        </td>
                        <td>{v.dueno}</td>
                        <td className="num">{v.dias}</td>
                        <td className="num green">{clp(v.comision)}</td>
                        <td className="num">{clp(v.gastos)}</td>
                        <td className="num strong">{clp(v.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2}>Total</td>
                      <td className="num">{r.totalDias}</td>
                      <td className="num green">{clp(r.totalComision)}</td>
                      <td className="num">{clp(r.totalGastos)}</td>
                      <td className="num">{clp(r.totalPagarViviana)}</td>
                    </tr>
                  </tfoot>
                </table>
              </TableWrap>
            )}
          </Card>
        </>
      )}
    </>
  )
}
