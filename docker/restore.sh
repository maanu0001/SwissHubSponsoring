#!/bin/sh
# ---------------------------------------------------------------------------
# SwissHub Sponsoring – Wiederherstellung aus einem Backup
#
#   ./docker/restore.sh <db-dump.sql.gz> [uploads.tar.gz]
#
# ACHTUNG: Überschreibt die aktuelle Datenbank vollständig.
# ---------------------------------------------------------------------------
set -e

DB_DUMP="$1"
UPLOADS_ARCHIVE="$2"
DB_CONTAINER="${DB_CONTAINER:-swisshub-db}"
APP_CONTAINER="${APP_CONTAINER:-swisshub-app}"
DB_USER="${POSTGRES_USER:-swisshub}"
DB_NAME="${POSTGRES_DB:-swisshub}"

if [ -z "$DB_DUMP" ] || [ ! -f "$DB_DUMP" ]; then
  echo "Aufruf: ./docker/restore.sh <db-dump.sql.gz> [uploads.tar.gz]" >&2
  exit 1
fi

printf "Die aktuelle Datenbank '%s' wird überschrieben. Fortfahren? [ja/nein] " "$DB_NAME"
read -r ANSWER
[ "$ANSWER" = "ja" ] || { echo "Abgebrochen."; exit 1; }

echo "→ Anwendung stoppen…"
docker stop "$APP_CONTAINER" >/dev/null 2>&1 || true

echo "→ Datenbank wiederherstellen…"
gunzip -c "$DB_DUMP" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1

if [ -n "$UPLOADS_ARCHIVE" ] && [ -f "$UPLOADS_ARCHIVE" ]; then
  echo "→ Uploads wiederherstellen…"
  docker run --rm \
    --volumes-from "$APP_CONTAINER" \
    -v "$(cd "$(dirname "$UPLOADS_ARCHIVE")" && pwd):/backup" \
    alpine:3.20 \
    sh -c "rm -rf /app/uploads/* && tar xzf /backup/$(basename "$UPLOADS_ARCHIVE") -C /app"
fi

echo "→ Anwendung starten…"
docker start "$APP_CONTAINER"

echo "Fertig. Prüfen Sie den Status mit: docker compose -f docker-compose.prod.yml ps"
