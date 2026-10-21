import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { clp, mesLabel } from '../lib/format'
import { MesFilter } from '../components/MesFilter'
import { BarChart } from '../components/BarChart'
import { Card, Empty, Loading, Patente, TableWrap } from '../components/Ui'

export function Resumen() {
  const [mes, setMes] = useState('')
  const r = useQuery(api.reportes.resumen, { mes: mes || undefined })

  return (
    <>
      <div className="filter-bar">
        <MesFilter value={mes} onChange={setMes} />
      </div>
      {r === undefined ? (
        <Loading />
      ) : (
        <>
          <div className="metric-grid">
            <div className="metric">
              <div className="metric-label">Total gastos</div>
              <div className="metric-value">{clp(r.totalGastos)}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Días arrendados ({r.arriendos} entregas)</div>
              <div className="metric-value">{r.totalDias}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Comisión por días</div>
              <div className="metric-value green">{clp(r.comisionDias)}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Lavados</div>
              <div className="metric-value green">{clp(r.comisionLavado)}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Total comisión</div>
              <div className="metric-value green">{clp(r.totalComision)}</div>
            </div>
            <div className="metric destacada">
              <div className="metric-label">Total a pagar a Viviana</div>
              <div className="metric-value">{clp(r.totalPagarViviana)}</div>
            </div>
          </div>

          <Card title={'Gastos por categoría' + (mes ? ' · ' + mesLabel(mes) : '')}>
            <BarChart data={r.porCategoria} />
          </Card>

          <Card title="Por vehículo">
            {r.porVehiculo.length === 0 ? (
              <Empty>Sin movimientos en el período</Empty>
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
