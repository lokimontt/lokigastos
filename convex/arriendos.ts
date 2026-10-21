import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  calcularDias,
  cargarVehiculosConDueno,
  getTarifas,
  getVehiculoOrThrow,
  mesDe,
} from "./lib";

export const list = query({
  args: {
    mes: v.optional(v.string()),
    vehiculoId: v.optional(v.id("vehiculos")),
  },
  handler: async (ctx, args) => {
    let arriendos: Doc<"arriendos">[];
    if (args.vehiculoId !== undefined) {
      const vehiculoId = args.vehiculoId;
      arriendos = await ctx.db
        .query("arriendos")
        .withIndex("by_vehiculo", (q) => q.eq("vehiculoId", vehiculoId))
        .collect();
      if (args.mes !== undefined) {
        arriendos = arriendos.filter((a) => a.mes === args.mes);
      }
    } else if (args.mes !== undefined) {
      const mes = args.mes;
      arriendos = await ctx.db
        .query("arriendos")
        .withIndex("by_mes", (q) => q.eq("mes", mes))
        .collect();
    } else {
      arriendos = await ctx.db.query("arriendos").withIndex("by_inicio").collect();
    }

    // Gastos de entrega ligados a cada arriendo
    const gastosPorArriendo = new Map<Id<"arriendos">, number>();
    await Promise.all(
      arriendos.map(async (a) => {
        const gastos = await ctx.db
          .query("gastos")
          .withIndex("by_arriendo", (q) => q.eq("arriendoId", a._id))
          .collect();
        gastosPorArriendo.set(
          a._id,
          gastos.reduce((sum, g) => sum + g.monto, 0),
        );
      }),
    );

    const { vehiculosById } = await cargarVehiculosConDueno(ctx);

    return arriendos
      .map((a) => {
        const veh = vehiculosById.get(a.vehiculoId);
        if (!veh || !veh.dueno) {
          throw new Error("Vehículo o dueño no encontrado para el arriendo");
        }
        const { dueno, ...vehiculo } = veh;
        const gastosEntrega = gastosPorArriendo.get(a._id) ?? 0;
        return {
          ...a,
          vehiculo,
          dueno,
          gastosEntrega,
          totalEntrega: a.comisionDias + a.lavado + gastosEntrega,
        };
      })
      .sort((a, b) => {
        if (a.inicio !== b.inicio) return a.inicio < b.inicio ? 1 : -1;
        return b._creationTime - a._creationTime;
      });
  },
});

export const create = mutation({
  args: {
    vehiculoId: v.id("vehiculos"),
    inicio: v.string(),
    termino: v.string(),
    cliente: v.optional(v.string()),
    notas: v.optional(v.string()),
  },
  returns: v.id("arriendos"),
  handler: async (ctx, args) => {
    await getVehiculoOrThrow(ctx, args.vehiculoId);
    const { tarifaDia, tarifaLavado } = await getTarifas(ctx);
    const dias = calcularDias(args.inicio, args.termino);
    return await ctx.db.insert("arriendos", {
      vehiculoId: args.vehiculoId,
      inicio: args.inicio,
      termino: args.termino,
      dias,
      cliente: args.cliente?.trim() || undefined,
      notas: args.notas?.trim() || undefined,
      comisionDias: dias * tarifaDia,
      lavado: tarifaLavado,
      mes: mesDe(args.inicio),
      pagado: false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("arriendos"),
    vehiculoId: v.optional(v.id("vehiculos")),
    inicio: v.optional(v.string()),
    termino: v.optional(v.string()),
    cliente: v.optional(v.string()),
    notas: v.optional(v.string()),
    pagado: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, { id, ...campos }) => {
    const arriendo = await ctx.db.get("arriendos", id);
    if (!arriendo) throw new Error("Arriendo no encontrado");

    const patch: Partial<Omit<Doc<"arriendos">, "_id" | "_creationTime">> = {};

    const cambiaVehiculo =
      campos.vehiculoId !== undefined && campos.vehiculoId !== arriendo.vehiculoId;
    const cambiaFechas =
      (campos.inicio !== undefined && campos.inicio !== arriendo.inicio) ||
      (campos.termino !== undefined && campos.termino !== arriendo.termino);
    if (arriendo.pagado && (cambiaVehiculo || cambiaFechas)) {
      throw new Error(
        "El arriendo ya está pagado: no se puede cambiar vehículo ni fechas",
      );
    }

    if (cambiaVehiculo && campos.vehiculoId !== undefined) {
      await getVehiculoOrThrow(ctx, campos.vehiculoId);
      patch.vehiculoId = campos.vehiculoId;
      // Mantener coherentes los gastos ligados a este arriendo
      const gastos = await ctx.db
        .query("gastos")
        .withIndex("by_arriendo", (q) => q.eq("arriendoId", id))
        .collect();
      for (const g of gastos) {
        await ctx.db.patch("gastos", g._id, { vehiculoId: campos.vehiculoId });
      }
    }

    if (cambiaFechas) {
      const inicio = campos.inicio ?? arriendo.inicio;
      const termino = campos.termino ?? arriendo.termino;
      // Conservar la tarifa histórica del arriendo (no la config actual)
      const tarifaDia =
        arriendo.dias > 0 ? arriendo.comisionDias / arriendo.dias : 0;
      const dias = calcularDias(inicio, termino);
      patch.inicio = inicio;
      patch.termino = termino;
      patch.dias = dias;
      patch.comisionDias = Math.round(dias * tarifaDia);
      patch.lavado = arriendo.lavado;
      patch.mes = mesDe(inicio);
    }

    if (campos.cliente !== undefined) {
      patch.cliente = campos.cliente.trim() || undefined;
    }
    if (campos.notas !== undefined) patch.notas = campos.notas.trim() || undefined;
    if (campos.pagado !== undefined) patch.pagado = campos.pagado;

    await ctx.db.patch("arriendos", id, patch);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("arriendos") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const arriendo = await ctx.db.get("arriendos", id);
    if (!arriendo) throw new Error("Arriendo no encontrado");
    // Los gastos ligados se desligan (no se eliminan)
    const gastos = await ctx.db
      .query("gastos")
      .withIndex("by_arriendo", (q) => q.eq("arriendoId", id))
      .collect();
    for (const g of gastos) {
      await ctx.db.patch("gastos", g._id, { arriendoId: undefined });
    }
    await ctx.db.delete("arriendos", id);
    return null;
  },
});
