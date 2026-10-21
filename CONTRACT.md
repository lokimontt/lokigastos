# Loki Gastos — Contrato backend/frontend

Convex deployment dev: `quaint-shark-613` (team lokimontt, project lokigastos). Variables en `.env.local`.

## Reglas de negocio
- Comisión de Viviana por arriendo = `dias * tarifaDia (5000)` + `tarifaLavado (10000)` por cada entrega (1 arriendo = 1 entrega).
- `dias = max(1, round((termino - inicio) / 1 día))`.
- Gastos de entrega (pasajes, estacionamiento, bencina, uber, alimentacion) van ligados a un `arriendoId` (opcional) y siempre a un `vehiculoId`.
- Gastos de vehículo (aceite, cambio_aceite, mantencion, otros) van ligados solo al `vehiculoId`.
- Total a pagar a Viviana en un período = comisiones (días + lavado) + todos los gastos del período.
- Cada vehículo tiene un dueño; los reportes se agrupan por dueño para que cada dueño vea cuánto le corresponde cobrar/pagar.
- Montos en CLP enteros. Fechas `YYYY-MM-DD`. Mes `YYYY-MM`.

## Funciones Convex (archivo → export)
`convex/duenos.ts`
- `list` query() → Dueno[] (activos primero, ordenado por nombre)
- `create` mutation({nombre, telefono?, notas?}) → Id
- `update` mutation({id, nombre?, telefono?, notas?, activo?})
- `remove` mutation({id}) — falla si tiene vehículos

`convex/vehiculos.ts`
- `list` query() → (Vehiculo & { dueno: Dueno })[]
- `create` mutation({patente, marca?, modelo?, duenoId}) → Id (patente normalizada a MAYÚSCULAS; error si duplicada)
- `update` mutation({id, patente?, marca?, modelo?, duenoId?, activo?})
- `remove` mutation({id}) — falla si tiene arriendos o gastos

`convex/arriendos.ts`
- `list` query({mes?, vehiculoId?}) → (Arriendo & { vehiculo, dueno, gastosEntrega: number, totalEntrega: number })[] ordenado por inicio desc
- `create` mutation({vehiculoId, inicio, termino, cliente?, notas?}) → Id (calcula dias, comisionDias, lavado, mes usando tarifas de config)
- `update` mutation({id, inicio?, termino?, cliente?, notas?, pagado?}) (recalcula)
- `remove` mutation({id}) — elimina también gastos ligados? NO: desliga (arriendoId = undefined)

`convex/gastos.ts`
- `list` query({mes?, vehiculoId?, arriendoId?, categoria?}) → (Gasto & { vehiculo, dueno, fotoUrl: string|null })[] ordenado por fecha desc
- `create` mutation({vehiculoId, arriendoId?, categoria, monto, fecha, descripcion?, fotoId?}) → Id
- `update` mutation({id, ...campos opcionales, pagado?})
- `remove` mutation({id}) — borra también el archivo de storage si existe
- `generateUploadUrl` mutation() → string (para subir foto)

`convex/reportes.ts`
- `resumen` query({mes?}) → { totalGastos, totalDias, comisionDias, comisionLavado, totalComision, totalPagarViviana, arriendos: number, porCategoria: {categoria, total}[], porVehiculo: {vehiculoId, patente, dueno, dias, comision, gastos, total}[] }
- `porDueno` query({mes?}) → { duenoId, nombre, vehiculos: [{vehiculoId, patente, dias, comision, gastos, total}], dias, comision, gastos, total }[]
- `mesesDisponibles` query() → string[] (YYYY-MM desc)

`convex/config.ts`
- `get` query() → {tarifaDia, tarifaLavado} (defaults 5000/10000 si no existe)
- `set` mutation({tarifaDia, tarifaLavado})

## Frontend
- Vite + React + TS, mobile-first (Viviana lo usa desde el celular), español de Chile.
- `ConvexProvider` con `import.meta.env.VITE_CONVEX_URL`.
- Pestañas: Resumen, Arriendos, Gastos, Vehículos, Dueños/Liquidación.
- Foto: `<input type="file" accept="image/*" capture="environment">`, comprimir en cliente (canvas, max 1280px, jpeg 0.8) y subir con `generateUploadUrl` → POST → `storageId`.
