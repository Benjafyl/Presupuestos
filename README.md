# Generador de Presupuestos

Aplicacion local en Next.js para generar cotizaciones en PDF para Interchile Clima y Benjamin Yanez. Usa Prisma con SQLite local y Playwright para exportar el presupuesto en formato A4.

## Desarrollo local

```bash
npm install
npm run db:init
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev       # servidor local
npm run db:init   # inicializa SQLite y Prisma Client
npm run build     # build de produccion
npm run start     # servidor Next.js de produccion
npm run lint      # lint
```

## Docker

La imagen usa Playwright con Chromium incluido para que la exportacion PDF funcione dentro del contenedor.

```bash
docker build -t presupuestos .
docker run --rm -p 3000:3000 -v presupuestos_data:/app/prisma presupuestos
```

La base SQLite queda en `/app/prisma/dev.db`. Para no perder clientes, cotizaciones y configuraciones, montar un volumen persistente en `/app/prisma`.

## Deploy en Dockploy

1. Crear una app desde el repositorio y rama `main`.
2. Usar deploy por `Dockerfile`.
3. Exponer el puerto `3000`.
4. Agregar un volumen persistente:

```text
/app/prisma
```

5. Variables opcionales:

```text
DATABASE_URL=file:./dev.db
PORT=3000
```

El contenedor ejecuta automaticamente `node scripts/init-db.mjs` al iniciar, por lo que crea o actualiza la base SQLite si el volumen esta vacio.
