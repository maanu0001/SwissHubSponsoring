#!/bin/sh
# ---------------------------------------------------------------------------
# SwissHub Sponsoring – Backup von Datenbank und Uploads
#
#   ./docker/backup.sh [zielverzeichnis]
#
# Legt zwei Dateien an:
#   <ziel>/swisshub-db-<zeitstempel>.sql.gz
#   <ziel>/swisshub-uploads-<zeitstempel>.tar.gz
# ---------------------------------------------------------------------------
set -e

TARGET_DIR="${1:-./backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DB_CONTAINER="${DB_CONTAINER:-swisshub-db}"
APP_CONTAINER="${APP_CONTAINER:-swisshub-app}"
DB_USER="${POSTGRES_USER:-swisshub}"
DB_NAME="${POSTGRES_DB:-swisshub}"

mkdir -p "$TARGET_DIR"

echo "→ Datenbank sichern…"
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists \
  | gzip > "$TARGET_DIR/swisshub-db-$STAMP.sql.gz"

echo "→ Uploads sichern…"
docker run --rm \
  --volumes-from "$APP_CONTAINER" \
  -v "$(cd "$TARGET_DIR" && pwd):/backup" \
  alpine:3.20 \
  tar czf "/backup/swisshub-uploads-$STAMP.tar.gz" -C /app uploads

echo "→ Backup geprüft:"
gzip -t "$TARGET_DIR/swisshub-db-$STAMP.sql.gz" && echo "  Datenbank-Dump ist gültig."
tar tzf "$TARGET_DIR/swisshub-uploads-$STAMP.tar.gz" > /dev/null && echo "  Uploads-Archiv ist gültig."

echo ""
echo "Fertig:"
ls -lh "$TARGET_DIR/swisshub-db-$STAMP.sql.gz" "$TARGET_DIR/swisshub-uploads-$STAMP.tar.gz"
