import { query } from "./_generated/server";
import { v } from "convex/values";

/** Devuelve true si el PIN coincide con APP_PIN. No lanza. */
export const verificarPin = query({
  args: { pin: v.string() },
  returns: v.boolean(),
  handler: async (_ctx, { pin }) => {
    const expected = process.env.APP_PIN;
    return expected !== undefined && expected !== "" && pin === expected;
  },
});
