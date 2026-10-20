# Base de datos de Presupuestos ICH en Servidor-BYL

## Estado operativo desde el 20/10/2026

La aplicación **Presupuestos ICH** usa un PostgreSQL 16 dedicado en el proyecto homónimo de Dokploy, entorno `production`. El servicio es `presupuestos-ich-postgres-xkt7sv`, la base `presupuestos_ich` y el usuario `presupuestos_app`. Su volumen persistente está en el SSD y solo se conecta por la red interna `dokploy-network`; no se publicó un puerto PostgreSQL a internet. `DATABASE_URL` está configurada en Dokploy y **nunca debe copiarse al repositorio**.

La migración desde Supabase quedó completada y verificada. Al momento del corte había 8 clientes, 10 sucursales, 37 presupuestos y 330 ítems. La aplicación mostró las cotizaciones históricas, respondió correctamente en `/api/health/db` y generó un PDF antiguo. La URL pública es [presupuestos.interchileclima.cl](https://presupuestos.interchileclima.cl/). El PostgreSQL anterior de Supabase se conservó sin modificaciones como contingencia; la aplicación ya no depende de él para trabajar.

## Cómo se hizo la migración

1. Se comprobó el acceso a la base Supabase (PostgreSQL 17) y se guardó un primer volcado privado en el HDD `BACKUPS`.
2. Se restauró una copia en una base de prueba aislada del nuevo servicio PostgreSQL 16. Se cotejaron todas las tablas de la aplicación y las cuatro migraciones de Prisma.
3. Se pausó solo la aplicación Presupuestos en Dokploy, se tomó un volcado final y se restauró en `presupuestos_ich`. La copia final permanece en `/backups/presupuestos-ich-origen/supabase-public-final-2026-10-20.dump` con acceso restringido a `root`.
4. Se cambió `DATABASE_URL` a la conexión interna de Dokploy y se desplegó solo Presupuestos. Se comprobó que el servicio usa `presupuestos_ich` y que los conteos coinciden con Supabase.

No borrar los volcados de origen ni la base anterior hasta decidir expresamente su retención. Los nombres de archivo y fechas de esta sección son referencias operativas; no contienen credenciales.

## Respaldo y restauración

El servicio `presupuestos-ich-backup.timer` ejecuta `ops/presupuestos-ich-backup` cada día a las **03:40 hora de Chile**, después del respaldo de Kronos 2.0. Crea un volcado de PostgreSQL y lo guarda cifrado con restic en `/backups/presupuestos-ich-restic` (HDD `BACKUPS`). Conserva **7 copias diarias y 4 semanales**. La clave está en `/etc/presupuestos-ich/restic-password`, fuera del repositorio. El script comprueba el montaje del HDD y se detiene si llega al 85 % de uso.

El 20/10/2026 se ejecutó un respaldo con los datos migrados y se restauró en una base aislada. Se compararon las siete tablas con producción; todas coincidieron. El procedimiento reproducible está en `ops/verificar-restauracion.sh` y deja limpia la base de prueba. Solo ejecutarlo durante una revisión operativa autorizada; consume temporalmente espacio y recursos del servicio dedicado.

Para revisar el estado sin modificar datos:

```bash
systemctl status presupuestos-ich-backup.timer
systemctl status presupuestos-ich-backup.service
cat /var/lib/presupuestos-ich-backup/last-success
df -h /backups
```

Las copias están **solo en el mismo servidor**, según la decisión del propietario. El HDD protege frente a un fallo del SSD, pero un incidente que afecte al servidor completo también puede afectar los respaldos. La aplicación y la base se administran desde Dokploy; los respaldos locales se administran mediante systemd porque la pantalla de respaldos de Dokploy requiere un destino S3.
