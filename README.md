# Generador de Presupuestos

Aplicacion en Next.js para generar cotizaciones en PDF para Interchile Clima y Benjamin Yanez. Usa Prisma con PostgreSQL y Playwright para exportar el presupuesto en formato A4. En produccion, PostgreSQL corre en Servidor-BYL como servicio dedicado de Dokploy.

## Desarrollo local

```bash
npm install
cp .env.example .env
npm run db:init
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Clientes y sucursales

Seleccionar una sucursal completa solo nombre, comuna y ciudad. La atención, el pago,
el código del proyecto y el código del presupuesto se guardan en cada cotización.
El autoguardado no modifica el catálogo: para registrar un cliente o una sucursal,
marcar su opción y pulsar **Guardar ahora**. Una sucursal existente se reutiliza por
nombre y comuna, independientemente del contacto o proyecto.

Los nombres confirmados de Mall Portal Temuco (Cenco Temuco / Cenco Mall) se muestran
juntos. El local S506 sigue separado del mall. Los documentos históricos conservan
sus textos originales.

Pruebas de regresión (Node 22.18 o superior):

```bash
node --experimental-strip-types --test scripts/client-branches.test.mjs
```

Para revisar duplicados en otra base configurada con `DATABASE_URL`, desde el
checkout del repositorio:

```bash
node --experimental-strip-types --env-file=.env scripts/normalize-branches.mjs
node --experimental-strip-types --env-file=.env scripts/normalize-branches.mjs --apply
```

El primer comando solo muestra el plan. `--apply` guarda un respaldo en
`output/backups`, unifica las referencias y verifica dentro de una transacción que
el contenido de los presupuestos no cambie. No incorpora sucursales desde cotizaciones.

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

La base de datos de produccion vive en un volumen persistente del servicio PostgreSQL de Dokploy. Configurar `DATABASE_URL` como variable de entorno de la aplicacion; no subir la credencial a Git.

## Deploy en Dokploy

La base dedicada, la migracion desde Supabase y los respaldos estan documentados en [docs/base-servidor.md](docs/base-servidor.md).

1. Crear una app desde el repositorio y rama `main`.
2. Usar deploy por `Dockerfile`.
3. Exponer el puerto `3000`.
4. Agregar variables de entorno:

```text
DATABASE_URL=postgresql://...
PORT=3000
```

El contenedor ejecuta automaticamente `prisma migrate deploy` y luego `node scripts/init-db.mjs` al iniciar. Eso actualiza las tablas de PostgreSQL y asegura los datos base sin borrar clientes ni cotizaciones.
