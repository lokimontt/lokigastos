import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { categoriaGasto } from "./schema";
import { cargarVehiculosConDueno, getVehiculoOrThrow, mesDe } from "./lib";

export const list = query({
  args: {
    mes: v.optional(v.string()),
    vehiculoId: v.optional(v.id("vehiculos")),
    arriendoId: v.optional(v.id("arriendos")),
    categoria: v.optional(categoriaGasto),
  },
  handler: async (ctx, args) => {
    let gastos: Doc<"gastos">[];
    if (args.arriendoId !== undefined) {
      const arriendoId = args.arriendoId;
      gastos = await ctx.db
        .query("gastos")
        .withIndex("by_arriendo", (q) => q.eq("arriendoId", arriendoId))
        .collect();
    } else if (args.vehiculoId !== undefined) {
      const vehiculoId = args.vehiculoId;
      gastos = await ctx.db
        .query("gastos")
        .withIndex("by_vehiculo", (q) => q.eq("vehiculoId", vehiculoId))
        .collect();
    } else if (args.mes !== undefined) {
      const mes = args.mes;
      gastos = await ctx.db
        .query("gastos")
        .withIndex("by_mes", (q) => q.eq("mes", mes))
        .collect();
    } else {
      gastos = await ctx.db.query("gastos").withIndex("by_fecha").collect();
    }

    // Filtros restantes en memoria
    gastos = gastos.filter(
      (g) =>
        (args.mes === undefined || g.mes === args.mes) &&
        (args.vehiculoId === undefined || g.vehiculoId === args.vehiculoId) &&
        (args.categoria === undefined || g.categoria === args.categoria),
    );

    const { vehiculosById } = await cargarVehiculosConDueno(ctx);

    const enriquecidos = await Promise.all(
      gastos.map(async (g) => {
        const veh = vehiculosById.get(g.vehiculoId);
        if (!veh || !veh.dueno) {
          throw new Error("Vehículo o dueño no encontrado para el gasto");
        }
        const { dueno, ...vehiculo } = veh;
        const fotoUrl = g.fotoId ? await ctx.storage.getUrl(g.fotoId) : null;
        return { ...g, vehiculo, dueno, fotoUrl };
      }),
    );

    return enriquecidos.sort((a, b) => {
      if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1;
      return b._creationTime - a._creationTime;
    });
  },
});

async function validarArriendo(
  ctx: Parameters<typeof getVehiculoOrThrow>[0],
  arriendoId: Id<"arriendos">,
  vehiculoId: Id<"vehiculos">,
) {
  const arriendo = await ctx.db.get("arriendos", arriendoId);
  if (!arriendo) throw new Error("Arriendo no encontrado");
  if (arriendo.vehiculoId !== vehiculoId) {
    throw new Error("El arriendo no corresponde al vehículo indicado");
  }
}

function validarMonto(monto: number) {
  if (!Number.isInteger(monto) || monto < 0) {
    throw new Error("El monto debe ser un entero en CLP mayor o igual a 0");
  }
}

export const create = mutation({
  args: {
    vehiculoId: v.id("vehiculos"),
    arriendoId: v.optional(v.id("arriendos")),
    categoria: categoriaGasto,
    monto: v.number(),
    fecha: v.string(),
    descripcion: v.optional(v.string()),
    fotoId: v.optional(v.id("_storage")),
  },
  returns: v.id("gastos"),
  handler: async (ctx, args) => {
    await getVehiculoOrThrow(ctx, args.vehiculoId);
    if (args.arriendoId !== undefined) {
      await validarArriendo(ctx, args.arriendoId, args.vehiculoId);
    }
    validarMonto(args.monto);
    return await ctx.db.insert("gastos", {
      vehiculoId: args.vehiculoId,
      arriendoId: args.arriendoId,
      categoria: args.categoria,
      monto: args.monto,
      fecha: args.fecha,
      mes: mesDe(args.fecha),
      descripcion: args.descripcion?.trim() || undefined,
      fotoId: args.fotoId,
      pagado: false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("gastos"),
    vehiculoId: v.optional(v.id("vehiculos")),
    // null = desligar del arriendo
    arriendoId: v.optional(v.union(v.id("arriendos"), v.null())),
    categoria: v.optional(categoriaGasto),
    monto: v.optional(v.number()),
    fecha: v.optional(v.string()),
    descripcion: v.optional(v.string()),
    // null = quitar la foto (se borra del storage)
    fotoId: v.optional(v.union(v.id("_storage"), v.null())),
    pagado: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, { id, ...campos }) => {
    const gasto = await ctx.db.get("gastos", id);
    if (!gasto) throw new Error("Gasto no encontrado");

    const patch: Partial<Omit<Doc<"gastos">, "_id" | "_creationTime">> = {};
    const vehiculoId = campos.vehiculoId ?? gasto.vehiculoId;

    if (campos.vehiculoId !== undefined) {
      await getVehiculoOrThrow(ctx, campos.vehiculoId);
      patch.vehiculoId = campos.vehiculoId;
    }
    if (campos.arriendoId !== undefined) {
      if (campos.arriendoId === null) {
        patch.arriendoId = undefined;
      } else {
        await validarArriendo(ctx, campos.arriendoId, vehiculoId);
        patch.arriendoId = campos.arriendoId;
      }
    } else if (campos.vehiculoId !== undefined && gasto.arriendoId) {
      // Cambió el vehículo: el arriendo anterior debe seguir siendo coherente
      await validarArriendo(ctx, gasto.arriendoId, vehiculoId);
    }
    if (campos.categoria !== undefined) patch.categoria = campos.categoria;
    if (campos.monto !== undefined) {
      validarMonto(campos.monto);
      patch.monto = campos.monto;
    }
    if (campos.fecha !== undefined) {
      patch.fecha = campos.fecha;
      patch.mes = mesDe(campos.fecha);
    }
    if (campos.descripcion !== undefined) {
      patch.descripcion = campos.descripcion.trim() || undefined;
    }
    if (campos.fotoId !== undefined) {
      const nuevaFoto = campos.fotoId ?? undefined;
      if (gasto.fotoId && gasto.fotoId !== nuevaFoto) {
        await ctx.storage.delete(gasto.fotoId);
      }
      patch.fotoId = nuevaFoto;
    }
    if (campos.pagado !== undefined) patch.pagado = campos.pagado;

    await ctx.db.patch("gastos", id, patch);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("gastos") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const gasto = await ctx.db.get("gastos", id);
    if (!gasto) throw new Error("Gasto no encontrado");
    if (gasto.fotoId) {
      const meta = await ctx.db.system.get("_storage", gasto.fotoId);
      if (meta) await ctx.storage.delete(gasto.fotoId);
    }
    await ctx.db.delete("gastos", id);
    return null;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
