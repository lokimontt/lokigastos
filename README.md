# Loki Rent a Car — Gastos

Control de gastos y comisiones de Viviana por cada vehículo de arriendo (cada vehículo con su propio dueño).

## Reglas de negocio
- **Comisión por arriendo**: `días × $5.000` + `$10.000` de lavado por cada entrega.
- **Gastos de entrega** (pasajes, estacionamiento, bencina, Uber, alimentación): ligados al arriendo y al vehículo, con foto de respaldo.
- **Gastos del vehículo** (aceite, cambio de aceite, mantención, otros): ligados solo al vehículo.
- **Total a pagar a Viviana** = comisiones + gastos del período.
- **Liquidación por dueño**: cada dueño ve días, comisión y gastos de sus vehículos.

Las tarifas se pueden cambiar en la tabla `config` de Convex.

## Stack
- Frontend: Vite + React + TypeScript (mobile-first, PWA básica).
- Backend/BD/fotos: [Convex](https://convex.dev) — proyecto `lokigastos`, team `lokimontt`.
- La app anterior (HTML + Supabase) quedó en `legacy/index.html` como referencia.

## Desarrollo
```bash
npm install
npx convex dev   # en una terminal (sincroniza funciones con el deployment dev)
npm run dev      # en otra
```
`.env.local` lo genera `npx convex dev` (no se versiona).

## Producción
1. En Convex dashboard → Settings → genera un **Deploy Key** de producción.
2. En Vercel, variable de entorno `CONVEX_DEPLOY_KEY` con ese valor.
3. Vercel usa `vercel.json`: `npx convex deploy --cmd 'npm run build'`, que despliega funciones a prod y setea `VITE_CONVEX_URL` automáticamente.

## Datos de ejemplo
```bash
npx convex run seed:seedDemo
```
