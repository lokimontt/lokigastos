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

## Acceso
La app pide un **PIN compartido**. Se define con la variable `APP_PIN` del deployment de Convex:
```bash
npx convex env set APP_PIN 1234          # dev
npx convex env set APP_PIN 1234 --prod   # producción
```

## Producción
- Backend: `npx convex deploy` (deployment prod `enchanted-snail-101`) sube las funciones.
- Frontend: Vercel (proyecto `lokigastos`) construye con `npm run build` usando la variable `VITE_CONVEX_URL` apuntando al deployment prod. Cada push a `main` despliega.

## Datos de ejemplo
```bash
npx convex run seed:seedDemo
```
