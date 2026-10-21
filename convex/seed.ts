import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { calcularDias, getTarifas, mesDe } from "./lib";

/**
 * Datos de ejemplo. Solo inserta si la tabla `vehiculos` está vacía.
 * Ejecutar manualmente: `npx convex run seed:seedDemo`
 */
export const seedDemo = internalMutation({
  args: {},
  returns: v.union(
    v.literal("skipped"),
    v.object({ duenoId: v.id("duenos"), vehiculos: v.number(), arriendos: v.number(), gastos: v.number() }),
  ),
  handler: async (ctx) => {
    const existente = await ctx.db.query("vehiculos").first();
    if (existente) return "skipped" as const;

    const { tarifaDia, tarifaLavado } = await getTarifas(ctx);

    const duenoId = await ctx.db.insert("duenos", {
      nombre: "Loki Montt",
      telefono: "+56 9 1234 5678",
      notas: "Dueño de ejemplo",
      activo: true,
    });

    const v1 = await ctx.db.insert("vehiculos", {
      patente: "ABCD12",
      marca: "Toyota",
      modelo: "Yaris",
      duenoId,
      activo: true,
    });
    const v2 = await ctx.db.insert("vehiculos", {
      patente: "WXYZ34",
      marca: "Chevrolet",
      modelo: "Sail",
      duenoId,
      activo: true,
    });

    const hoy = new Date();
    const yyyy = hoy.getUTCFullYear();
    const mm = String(hoy.getUTCMonth() + 1).padStart(2, "0");
    const fecha = (d: number) => `${yyyy}-${mm}-${String(d).padStart(2, "0")}`;

    const arriendo = async (
      vehiculoId: typeof v1,
      inicio: string,
      termino: string,
      cliente: string,
    ) => {
      const dias = calcularDias(inicio, termino);
      return await ctx.db.insert("arriendos", {
        vehiculoId,
        inicio,
        termino,
        dias,
        cliente,
        comisionDias: dias * tarifaDia,
        lavado: tarifaLavado,
        mes: mesDe(inicio),
        pagado: false,
      });
    };
    const a1 = await arriendo(v1, fecha(2), fecha(5), "Juan Pérez");
    await arriendo(v2, fecha(10), fecha(11), "María González");

    const gasto = async (g: {
      vehiculoId: typeof v1;
      arriendoId?: typeof a1;
      categoria: "pasajes" | "bencina" | "cambio_aceite";
      monto: number;
      fecha: string;
      descripcion: string;
    }) =>
      await ctx.db.insert("gastos", {
        ...g,
        mes: mesDe(g.fecha),
        pagado: false,
      });

    await gasto({
      vehiculoId: v1,
      arriendoId: a1,
      categoria: "pasajes",
      monto: 1500,
      fecha: fecha(2),
      descripcion: "Micro ida a entregar",
    });
    await gasto({
      vehiculoId: v1,
      arriendoId: a1,
      categoria: "bencina",
      monto: 12000,
      fecha: fecha(5),
      descripcion: "Carga al retirar",
    });
    await gasto({
      vehiculoId: v2,
      categoria: "cambio_aceite",
      monto: 45000,
      fecha: fecha(8),
      descripcion: "Cambio de aceite 10.000 km",
    });

    return { duenoId, vehiculos: 2, arriendos: 2, gastos: 3 };
  },
});
