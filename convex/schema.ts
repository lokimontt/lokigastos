import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Categorías de gasto
export const categoriaGasto = v.union(
  // Gastos por entrega (Viviana al entregar/retirar un auto)
  v.literal("pasajes"),
  v.literal("estacionamiento"),
  v.literal("bencina"),
  v.literal("uber"),
  v.literal("alimentacion"),
  // Gastos del vehículo (mantención)
  v.literal("aceite"),
  v.literal("cambio_aceite"),
  v.literal("mantencion"),
  v.literal("otros"),
);

export default defineSchema({
  // Dueños de vehículos (cada auto puede tener distinto dueño)
  duenos: defineTable({
    nombre: v.string(),
    telefono: v.optional(v.string()),
    notas: v.optional(v.string()),
    activo: v.boolean(),
  }).index("by_nombre", ["nombre"]),

  vehiculos: defineTable({
    patente: v.string(), // siempre en mayúsculas, sin espacios
    marca: v.optional(v.string()),
    modelo: v.optional(v.string()),
    duenoId: v.id("duenos"),
    activo: v.boolean(),
  })
    .index("by_patente", ["patente"])
    .index("by_dueno", ["duenoId"]),

  // Un arriendo = una entrega. Comisión = dias*5000 + 10000 (lavado)
  arriendos: defineTable({
    vehiculoId: v.id("vehiculos"),
    inicio: v.string(), // YYYY-MM-DD
    termino: v.string(), // YYYY-MM-DD
    dias: v.number(), // max(1, termino - inicio)
    cliente: v.optional(v.string()),
    notas: v.optional(v.string()),
    comisionDias: v.number(), // dias * TARIFA_DIA
    lavado: v.number(), // TARIFA_LAVADO (10000) por entrega
    mes: v.string(), // YYYY-MM de `inicio`, para filtros
    pagado: v.boolean(), // liquidado a Viviana
  })
    .index("by_vehiculo", ["vehiculoId"])
    .index("by_mes", ["mes"])
    .index("by_inicio", ["inicio"]),

  gastos: defineTable({
    vehiculoId: v.id("vehiculos"),
    arriendoId: v.optional(v.id("arriendos")), // si es gasto de una entrega
    categoria: categoriaGasto,
    monto: v.number(), // CLP entero
    fecha: v.string(), // YYYY-MM-DD
    mes: v.string(), // YYYY-MM
    descripcion: v.optional(v.string()),
    fotoId: v.optional(v.id("_storage")), // comprobante/boleta
    pagado: v.boolean(), // reembolsado a Viviana
  })
    .index("by_vehiculo", ["vehiculoId"])
    .index("by_arriendo", ["arriendoId"])
    .index("by_mes", ["mes"])
    .index("by_fecha", ["fecha"]),

  // Tarifas configurables (una sola fila "default")
  config: defineTable({
    key: v.string(),
    tarifaDia: v.number(), // 5000
    tarifaLavado: v.number(), // 10000
  }).index("by_key", ["key"]),
});
