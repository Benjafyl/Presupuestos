# Base de datos de Presupuestos ICH en Servidor-BYL

## Estado al 20/10/2026

Dokploy tiene un PostgreSQL 16 dedicado en el proyecto **Presupuestos ICH**, entorno `production`, servicio `presupuestos-ich-postgres-xkt7sv`. La base `presupuestos_ich` usa el usuario `presupuestos_app`, un volumen Docker persistente en el SSD y la red interna de Dokploy. **No hay puerto externo publicado.** Las credenciales se conservan solo en Dokploy y en el servidor, nunca en Git.

La base nueva se creó vacía. La aplicación de producción sigue apuntando a Supabase y no se debe cambiar su `DATABASE_URL` hasta recuperar y verificar los datos históricos. El 20/10/2026 Presupuestos devolvía 502 porque Supabase no respondía desde el servidor; también fallaban otras conexiones IPv4 desde la red local. Un servicio local nuevo no recupera los presupuestos existentes por sí solo.

## Migración pendiente

1. Restablecer la conectividad con Supabase o conseguir una exportación verificable de esa base. No iniciar una base vacía como si fuese la historia real.
2. Sacar un volcado completo de la base de origen y conservarlo en el HDD antes del corte. Registrar fecha, tamaño y versión de PostgreSQL. No colocar volcados ni credenciales en Git, Jira o mensajes.
3. Restaurar en `presupuestos_ich`, ejecutar las migraciones versionadas y comparar conteos de `Client`, `ClientBranch`, `Quote`, `QuoteItem`, `CompanySettings` y `TemplateText`; comprobar cotizaciones antiguas y sus PDF en una prueba aislada.
4. Detener la escritura en origen durante el corte final, repetir el volcado y la comparación, cambiar `DATABASE_URL` de la app en Dokploy a la URL **interna** de la base y desplegar solo Presupuestos. Verificar clientes, presupuestos y exportación PDF antes de retirar la dependencia de Supabase.
5. Conservar la exportación original y la configuración anterior para revertir si la comprobación falla. No publicar el puerto PostgreSQL a internet.

## Respaldo local

El servidor ejecuta `ops/presupuestos-ich-backup` mediante las unidades systemd de `ops/` cada día a las 03:40 hora de Chile, después del respaldo de Kronos 2.0. Crea un volcado PostgreSQL, verifica su catálogo y lo guarda cifrado con restic en `/backups/presupuestos-ich-restic` (HDD `BACKUPS`); conserva siete copias diarias y cuatro semanales. La clave reside en `/etc/presupuestos-ich/restic-password`, fuera del repositorio. El proceso comprueba que el HDD esté montado y se detiene si llega al 85 % de uso.

Comprobar: `systemctl status presupuestos-ich-backup.timer`, `systemctl status presupuestos-ich-backup.service`, `journalctl -u presupuestos-ich-backup.service -n 40`, `cat /var/lib/presupuestos-ich-backup/last-success` y `df -h /backups`. Una restauración aislada con datos reales queda pendiente del volcado de Supabase.
