import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { CONFIG_KEY, getTarifas, tarifasValidator } from "./lib";

export const get = query({
  args: {},
  returns: tarifasValidator,
  handler: async (ctx) => {
    return await getTarifas(ctx);
  },
});

export const set = mutation({
  args: { tarifaDia: v.number(), tarifaLavado: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.tarifaDia < 0 || args.tarifaLavado < 0) {
      throw new Error("Las tarifas no pueden ser negativas");
    }
    const existing = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", CONFIG_KEY))
      .unique();
    if (existing) {
      await ctx.db.patch("config", existing._id, {
        tarifaDia: args.tarifaDia,
        tarifaLavado: args.tarifaLavado,
      });
    } else {
      await ctx.db.insert("config", {
        key: CONFIG_KEY,
        tarifaDia: args.tarifaDia,
        tarifaLavado: args.tarifaLavado,
      });
    }
    return null;
  },
});
