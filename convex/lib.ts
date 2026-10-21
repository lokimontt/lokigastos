import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

export const DEFAULT_TARIFA_DIA = 5000;
export const DEFAULT_TARIFA_LAVADO = 10000;
export const CONFIG_KEY = "default";

export const tarifasValidator = v.object({
  tarifaDia: v.number(),
  tarifaLavado: v.number(),
});

/** Parsea YYYY-MM-DD como UTC (evita desfases por zona horaria). */
export function parseFechaUTC(fecha: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new Error(`Fecha inválida: "${fecha}" (se espera YYYY-MM-DD)`);
  }
  const [y, m, d] = fecha.split("-").map(Number);
  const ts = Date.UTC(y, m - 1, d);
  if (Number.isNaN(ts)) throw new Error(`Fecha inválida: "${fecha}"`);
  return ts;
}

/** dias = max(1, round((termino - inicio) / 1 día)) */
export function calcularDias(inicio: string, termino: string): number {
  const ini = parseFechaUTC(inicio);
  const fin = parseFechaUTC(termino);
  if (fin < ini) {
    throw new Error("La fecha de término no puede ser anterior al inicio");
  }
  return Math.max(1, Math.round((fin - ini) / 86400000));
}

/** mes = YYYY-MM de una fecha YYYY-MM-DD */
export function mesDe(fecha: string): string {
  parseFechaUTC(fecha); // valida
  return fecha.slice(0, 7);
}

export function normalizarPatente(patente: string): string {
  return patente.replace(/[\s-]+/g, "").toUpperCase();
}

export async function getTarifas(
  ctx: QueryCtx | MutationCtx,
): Promise<{ tarifaDia: number; tarifaLavado: number }> {
  const cfg = await ctx.db
    .query("config")
    .withIndex("by_key", (q) => q.eq("key", CONFIG_KEY))
    .unique();
  return {
    tarifaDia: cfg?.tarifaDia ?? DEFAULT_TARIFA_DIA,
    tarifaLavado: cfg?.tarifaLavado ?? DEFAULT_TARIFA_LAVADO,
  };
}

export async function getVehiculoOrThrow(
  ctx: QueryCtx | MutationCtx,
  id: Id<"vehiculos">,
): Promise<Doc<"vehiculos">> {
  const vehiculo = await ctx.db.get("vehiculos", id);
  if (!vehiculo) throw new Error("Vehículo no encontrado");
  return vehiculo;
}

export async function getDuenoOrThrow(
  ctx: QueryCtx | MutationCtx,
  id: Id<"duenos">,
): Promise<Doc<"duenos">> {
  const dueno = await ctx.db.get("duenos", id);
  if (!dueno) throw new Error("Dueño no encontrado");
  return dueno;
}

/** Carga vehículos + dueños en memoria para enriquecer listados sin N+1. */
export async function cargarVehiculosConDueno(ctx: QueryCtx | MutationCtx) {
  const [vehiculos, duenos] = await Promise.all([
    ctx.db.query("vehiculos").collect(),
    ctx.db.query("duenos").collect(),
  ]);
  const duenosById = new Map<Id<"duenos">, Doc<"duenos">>(
    duenos.map((d) => [d._id, d]),
  );
  const vehiculosById = new Map<
    Id<"vehiculos">,
    Doc<"vehiculos"> & { dueno: Doc<"duenos"> | null }
  >(
    vehiculos.map((veh) => [
      veh._id,
      { ...veh, dueno: duenosById.get(veh.duenoId) ?? null },
    ]),
  );
  return { vehiculos, duenos, duenosById, vehiculosById };
}
