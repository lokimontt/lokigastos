/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as arriendos from "../arriendos.js";
import type * as auth from "../auth.js";
import type * as config from "../config.js";
import type * as duenos from "../duenos.js";
import type * as gastos from "../gastos.js";
import type * as lib from "../lib.js";
import type * as reportes from "../reportes.js";
import type * as seed from "../seed.js";
import type * as vehiculos from "../vehiculos.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  arriendos: typeof arriendos;
  auth: typeof auth;
  config: typeof config;
  duenos: typeof duenos;
  gastos: typeof gastos;
  lib: typeof lib;
  reportes: typeof reportes;
  seed: typeof seed;
  vehiculos: typeof vehiculos;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
