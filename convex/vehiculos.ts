import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  cargarVehiculosConDueno,
  getDuenoOrThrow,
  getVehiculoOrThrow,
  normalizarPatente,
  requirePin,
} from "./lib";

export const list = query({
  args: { pin: v.string() },
  handler: async (ctx, args) => {
    requirePin(args.pin);
    const { vehiculos, duenosById } = await cargarVehiculosConDueno(ctx);
    return vehiculos
      .map((veh) => {
        const dueno = duenosById.get(veh.duenoId);
        if (!dueno) throw new Error("Dueño no encontrado para el vehículo");
        return { ...veh, dueno };
      })
      .sort((a, b) => {
        if (a.activo !== b.activo) return a.activo ? -1 : 1;
        return a.patente.localeCompare(b.patente);
      });
  },
});

async function assertPatenteLibre(
  ctx: Parameters<typeof getVehiculoOrThrow>[0],
  patente: string,
  exceptoId?: Id<"vehiculos">,
) {
  const existente = await ctx.db
    .query("vehiculos")
    .withIndex("by_patente", (q) => q.eq("patente", patente))
    .first();
  if (existente && existente._id !== exceptoId) {
    throw new Error(`La patente ${patente} ya está registrada`);
  }
}

export const create = mutation({
  args: {
    pin: v.string(),
    patente: v.string(),
    marca: v.optional(v.string()),
    modelo: v.optional(v.string()),
    duenoId: v.id("duenos"),
  },
  returns: v.id("vehiculos"),
  handler: async (ctx, args) => {
    requirePin(args.pin);
    const patente = normalizarPatente(args.patente);
    if (!patente) throw new Error("La patente es obligatoria");
    await getDuenoOrThrow(ctx, args.duenoId);
    await assertPatenteLibre(ctx, patente);
    return await ctx.db.insert("vehiculos", {
      patente,
      marca: args.marca?.trim() || undefined,
      modelo: args.modelo?.trim() || undefined,
      duenoId: args.duenoId,
      activo: true,
    });
  },
});

export const update = mutation({
  args: {
    pin: v.string(),
    id: v.id("vehiculos"),
    patente: v.optional(v.string()),
    marca: v.optional(v.string()),
    modelo: v.optional(v.string()),
    duenoId: v.optional(v.id("duenos")),
    activo: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, { pin, id, ...campos }) => {
    requirePin(pin);
    await getVehiculoOrThrow(ctx, id);
    const patch: Partial<{
      patente: string;
      marca: string | undefined;
      modelo: string | undefined;
      duenoId: Id<"duenos">;
      activo: boolean;
    }> = {};
    if (campos.patente !== undefined) {
      const patente = normalizarPatente(campos.patente);
      if (!patente) throw new Error("La patente es obligatoria");
      await assertPatenteLibre(ctx, patente, id);
      patch.patente = patente;
    }
    if (campos.marca !== undefined) patch.marca = campos.marca.trim() || undefined;
    if (campos.modelo !== undefined) {
      patch.modelo = campos.modelo.trim() || undefined;
    }
    if (campos.duenoId !== undefined) {
      await getDuenoOrThrow(ctx, campos.duenoId);
      patch.duenoId = campos.duenoId;
    }
    if (campos.activo !== undefined) patch.activo = campos.activo;
    await ctx.db.patch("vehiculos", id, patch);
    return null;
  },
});

export const remove = mutation({
  args: { pin: v.string(), id: v.id("vehiculos") },
  returns: v.null(),
  handler: async (ctx, { pin, id }) => {
    requirePin(pin);
    await getVehiculoOrThrow(ctx, id);
    const arriendo = await ctx.db
      .query("arriendos")
      .withIndex("by_vehiculo", (q) => q.eq("vehiculoId", id))
      .first();
    if (arriendo) {
      throw new Error("No se puede eliminar: el vehículo tiene arriendos");
    }
    const gasto = await ctx.db
      .query("gastos")
      .withIndex("by_vehiculo", (q) => q.eq("vehiculoId", id))
      .first();
    if (gasto) {
      throw new Error("No se puede eliminar: el vehículo tiene gastos");
    }
    await ctx.db.delete("vehiculos", id);
    return null;
  },
});
