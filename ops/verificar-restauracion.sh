#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

export RESTIC_REPOSITORY=/backups/presupuestos-ich-restic
export RESTIC_PASSWORD_FILE=/etc/presupuestos-ich/restic-password
DB_SERVICE=presupuestos-ich-postgres-xkt7sv
TEST_DB=presupuestos_ich_respaldo_prueba
TARGET=$(mktemp -d /var/tmp/presupuestos-ich-restauracion.XXXXXX)
created_db=0

cleanup() {
  if (( created_db == 1 )); then
    docker exec "$DB_CONTAINER" dropdb -U presupuestos_app --if-exists "$TEST_DB" || true
  fi
  if [[ "$TARGET" == /var/tmp/presupuestos-ich-restauracion.* && -d "$TARGET" ]]; then
    rm -rf -- "$TARGET"
  fi
}
trap cleanup EXIT

[[ "$(findmnt -rno TARGET -T /backups)" == /backups ]] || { echo 'HDD no montado'; exit 1; }
mapfile -t containers < <(docker ps -q --filter "label=com.docker.swarm.service.name=$DB_SERVICE")
[[ "${#containers[@]}" == 1 ]] || { echo 'Base dedicada no disponible'; exit 1; }
DB_CONTAINER=${containers[0]}

restic restore latest --target "$TARGET" >/dev/null
mapfile -t dumps < <(find "$TARGET/var/tmp" -type f -name presupuestos-ich.dump)
[[ "${#dumps[@]}" == 1 ]] || { echo 'El respaldo no contiene un único volcado'; exit 1; }
docker exec -i "$DB_CONTAINER" pg_restore --list < "${dumps[0]}" >/dev/null

docker exec "$DB_CONTAINER" createdb -U presupuestos_app -O presupuestos_app "$TEST_DB"
created_db=1
docker exec -i "$DB_CONTAINER" pg_restore -U presupuestos_app -d "$TEST_DB" --no-owner --no-acl --exit-on-error < "${dumps[0]}"

for table in Client ClientBranch CompanySettings Quote QuoteItem TemplateText _prisma_migrations; do
  query="SELECT count(*) FROM public.\"$table\""
  expected=$(docker exec "$DB_CONTAINER" psql -U presupuestos_app -d presupuestos_ich -Atqc "$query")
  restored=$(docker exec "$DB_CONTAINER" psql -U presupuestos_app -d "$TEST_DB" -Atqc "$query")
  [[ "$expected" == "$restored" ]] || { echo "Descuadre en $table"; exit 1; }
  echo "$table: $restored"
done
echo 'Restauración aislada verificada; los datos coinciden con producción.'
