# Generador de Presupuestos

Aplicacion local en Next.js para generar cotizaciones en PDF para Interchile Clima y Benjamin Yanez. Usa Prisma con PostgreSQL/Supabase y Playwright para exportar el presupuesto en formato A4.

## Desarrollo local

```bash
npm install
cp .env.example .env
npm run db:init
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev       # servidor local
npm run db:init   # genera Prisma Client, aplica migraciones y crea datos base
npm run build     # build de produccion
npm run start     # servidor Next.js de produccion
npm run lint      # lint
```

## Docker

La imagen usa Playwright con Chromium incluido para que la exportacion PDF funcione dentro del contenedor.

```bash
docker build -t presupuestos .
docker run --rm -p 3000:3000 --env-file .env presupuestos
```

La base de datos persistente vive en Supabase/PostgreSQL. No se necesita volumen para la base de datos; lo importante es configurar `DATABASE_URL` como variable de entorno.

## Deploy en Dockploy

1. Crear una app desde el repositorio y rama `main`.
2. Usar deploy por `Dockerfile`.
3. Exponer el puerto `3000`.
4. Agregar variables de entorno:

```text
DATABASE_URL=postgresql://...
PORT=3000
```

El contenedor ejecuta automaticamente `prisma migrate deploy` y luego `node scripts/init-db.mjs` al iniciar. Eso crea/actualiza las tablas en Supabase y asegura los datos base sin borrar clientes ni cotizaciones.
