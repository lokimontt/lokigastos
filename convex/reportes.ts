import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { categoriaGasto } from "./schema";
import { cargarVehiculosConDueno } from "./lib";
import type { QueryCtx } from "./_generated/server";

async function cargarPeriodo(ctx: QueryCtx, mes: string | undefined) {
  let arriendos: Doc<"arriendos">[];
  let gastos: Doc<"gastos">[];
  if (mes !== undefined) {
    [arriendos, gastos] = await Promise.all([
      ctx.db
        .query("arriendos")
        .withIndex("by_mes", (q) => q.eq("mes", mes))
        .collect(),
      ctx.db
        .query("gastos")
        .withIndex("by_mes", (q) => q.eq("mes", mes))
        .collect(),
    ]);
  } else {
    [arriendos, gastos] = await Promise.all([
      ctx.db.query("arriendos").collect(),
      ctx.db.query("gastos").collect(),
    ]);
  }
  return { arriendos, gastos };
}

type AcumVehiculo = {
  vehiculoId: Id<"vehiculos">;
  patente: string;
  duenoId: Id<"duenos">;
  dueno: string;
  dias: number;
  comision: number;
  gastos: number;
  total: number;
};

async function acumularPorVehiculo(ctx: QueryCtx, mes: string | undefined) {
  const [{ arriendos, gastos }, { vehiculosById }] = await Promise.all([
    cargarPeriodo(ctx, mes),
    cargarVehiculosConDueno(ctx),
  ]);
  const acum = new Map<Id<"vehiculos">, AcumVehiculo>();
  const getAcum = (vehiculoId: Id<"vehiculos">): AcumVehiculo => {
    let a = acum.get(vehiculoId);
    if (!a) {
      const veh = vehiculosById.get(vehiculoId);
      a = {
        vehiculoId,
        patente: veh?.patente ?? "?",
        duenoId: veh?.duenoId ?? ("" as Id<"duenos">),
        dueno: veh?.dueno?.nombre ?? "?",
        dias: 0,
        comision: 0,
        gastos: 0,
        total: 0,
      };
      acum.set(vehiculoId, a);
    }
    return a;
  };
  for (const r of arriendos) {
    const a = getAcum(r.vehiculoId);
    a.dias += r.dias;
    a.comision += r.comisionDias + r.lavado;
  }
  for (const g of gastos) {
    getAcum(g.vehiculoId).gastos += g.monto;
  }
  for (const a of acum.values()) a.total = a.comision + a.gastos;
  return { arriendos, gastos, vehiculosById, porVehiculo: [...acum.values()] };
}

export const resumen = query({
  args: { mes: v.optional(v.string()) },
  returns: v.object({
    totalGastos: v.number(),
    totalDias: v.number(),
    comisionDias: v.number(),
    comisionLavado: v.number(),
    totalComision: v.number(),
    totalPagarViviana: v.number(),
    arriendos: v.number(),
    porCategoria: v.array(v.object({ categoria: categoriaGasto, total: v.number() })),
    porVehiculo: v.array(
      v.object({
        vehiculoId: v.id("vehiculos"),
        patente: v.string(),
        dueno: v.string(),
        dias: v.number(),
        comision: v.number(),
        gastos: v.number(),
        total: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const { arriendos, gastos, porVehiculo } = await acumularPorVehiculo(
      ctx,
      args.mes,
    );

    let totalDias = 0;
    let comisionDias = 0;
    let comisionLavado = 0;
    for (const r of arriendos) {
      totalDias += r.dias;
      comisionDias += r.comisionDias;
      comisionLavado += r.lavado;
    }

    let totalGastos = 0;
    const porCat = new Map<Doc<"gastos">["categoria"], number>();
    for (const g of gastos) {
      totalGastos += g.monto;
      porCat.set(g.categoria, (porCat.get(g.categoria) ?? 0) + g.monto);
    }

    const totalComision = comisionDias + comisionLavado;
    return {
      totalGastos,
      totalDias,
      comisionDias,
      comisionLavado,
      totalComision,
      totalPagarViviana: totalComision + totalGastos,
      arriendos: arriendos.length,
      porCategoria: [...porCat.entries()]
        .map(([categoria, total]) => ({ categoria, total }))
        .sort((a, b) => b.total - a.total),
      porVehiculo: porVehiculo
        .map(({ duenoId: _duenoId, ...rest }) => rest)
        .sort((a, b) => b.total - a.total || a.patente.localeCompare(b.patente)),
    };
  },
});

export const porDueno = query({
  args: { mes: v.optional(v.string()) },
  returns: v.array(
    v.object({
      duenoId: v.id("duenos"),
      nombre: v.string(),
      vehiculos: v.array(
        v.object({
          vehiculoId: v.id("vehiculos"),
          patente: v.string(),
          dias: v.number(),
          comision: v.number(),
          gastos: v.number(),
          total: v.number(),
        }),
      ),
      dias: v.number(),
      comision: v.number(),
      gastos: v.number(),
      total: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const { porVehiculo, vehiculosById } = await acumularPorVehiculo(
      ctx,
      args.mes,
    );
    type AcumDueno = {
      duenoId: Id<"duenos">;
      nombre: string;
      vehiculos: {
        vehiculoId: Id<"vehiculos">;
        patente: string;
        dias: number;
        comision: number;
        gastos: number;
        total: number;
      }[];
      dias: number;
      comision: number;
      gastos: number;
      total: number;
    };
    const acum = new Map<Id<"duenos">, AcumDueno>();
    for (const pv of porVehiculo) {
      const veh = vehiculosById.get(pv.vehiculoId);
      if (!veh || !veh.dueno) continue; // vehículo/dueño huérfano
      let d = acum.get(veh.duenoId);
      if (!d) {
        d = {
          duenoId: veh.duenoId,
          nombre: veh.dueno.nombre,
          vehiculos: [],
          dias: 0,
          comision: 0,
          gastos: 0,
          total: 0,
        };
        acum.set(veh.duenoId, d);
      }
      d.vehiculos.push({
        vehiculoId: pv.vehiculoId,
        patente: pv.patente,
        dias: pv.dias,
        comision: pv.comision,
        gastos: pv.gastos,
        total: pv.total,
      });
      d.dias += pv.dias;
      d.comision += pv.comision;
      d.gastos += pv.gastos;
      d.total += pv.total;
    }
    return [...acum.values()]
      .map((d) => ({
        ...d,
        vehiculos: d.vehiculos.sort((a, b) => a.patente.localeCompare(b.patente)),
      }))
      .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, "es"));
  },
});

export const mesesDisponibles = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const [arriendos, gastos] = await Promise.all([
      ctx.db.query("arriendos").withIndex("by_mes").collect(),
      ctx.db.query("gastos").withIndex("by_mes").collect(),
    ]);
    const meses = new Set<string>();
    for (const a of arriendos) meses.add(a.mes);
    for (const g of gastos) meses.add(g.mes);
    return [...meses].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  },
});
