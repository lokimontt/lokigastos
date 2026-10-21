import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getDuenoOrThrow } from "./lib";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const duenos = await ctx.db
      .query("duenos")
      .withIndex("by_nombre")
      .collect();
    // Activos primero, luego por nombre (ya viene ordenado por nombre del índice)
    return duenos.sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      return a.nombre.localeCompare(b.nombre, "es");
    });
  },
});

export const create = mutation({
  args: {
    nombre: v.string(),
    telefono: v.optional(v.string()),
    notas: v.optional(v.string()),
  },
  returns: v.id("duenos"),
  handler: async (ctx, args) => {
    const nombre = args.nombre.trim();
    if (!nombre) throw new Error("El nombre es obligatorio");
    return await ctx.db.insert("duenos", {
      nombre,
      telefono: args.telefono?.trim() || undefined,
      notas: args.notas?.trim() || undefined,
      activo: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("duenos"),
    nombre: v.optional(v.string()),
    telefono: v.optional(v.string()),
    notas: v.optional(v.string()),
    activo: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, { id, ...campos }) => {
    await getDuenoOrThrow(ctx, id);
    const patch: Partial<{
      nombre: string;
      telefono: string | undefined;
      notas: string | undefined;
      activo: boolean;
    }> = {};
    if (campos.nombre !== undefined) {
      const nombre = campos.nombre.trim();
      if (!nombre) throw new Error("El nombre es obligatorio");
      patch.nombre = nombre;
    }
    if (campos.telefono !== undefined) {
      patch.telefono = campos.telefono.trim() || undefined;
    }
    if (campos.notas !== undefined) {
      patch.notas = campos.notas.trim() || undefined;
    }
    if (campos.activo !== undefined) patch.activo = campos.activo;
    await ctx.db.patch("duenos", id, patch);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("duenos") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await getDuenoOrThrow(ctx, id);
    const vehiculo = await ctx.db
      .query("vehiculos")
      .withIndex("by_dueno", (q) => q.eq("duenoId", id))
      .first();
    if (vehiculo) {
      throw new Error(
        "No se puede eliminar: el dueño tiene vehículos asociados",
      );
    }
    await ctx.db.delete("duenos", id);
    return null;
  },
});
