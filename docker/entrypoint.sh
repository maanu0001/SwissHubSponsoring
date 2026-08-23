#!/bin/sh
set -e

echo "[entrypoint] SwissHub Sponsoring starting…"

if [ -z "$DATABASE_URL" ]; then
  echo "[entrypoint] FEHLER: DATABASE_URL ist nicht gesetzt." >&2
  exit 1
fi

if [ -z "$AUTH_SECRET" ]; then
  echo "[entrypoint] FEHLER: AUTH_SECRET ist nicht gesetzt." >&2
  echo "[entrypoint] Erzeugen Sie einen Wert mit: openssl rand -base64 48" >&2
  exit 1
fi

# Wait for PostgreSQL to accept connections before running migrations.
echo "[entrypoint] Warte auf die Datenbank…"
ATTEMPT=0
until node -e "
const net = require('node:net');
const url = new URL(process.env.DATABASE_URL);
const socket = net.connect({ host: url.hostname, port: Number(url.port || 5432) });
socket.on('connect', () => { socket.end(); process.exit(0); });
socket.on('error', () => process.exit(1));
socket.setTimeout(3000, () => { socket.destroy(); process.exit(1); });
" 2>/dev/null; do
  ATTEMPT=$((ATTEMPT + 1))
  if [ "$ATTEMPT" -ge 60 ]; then
    echo "[entrypoint] FEHLER: Datenbank nach 60 Versuchen nicht erreichbar." >&2
    exit 1
  fi
  sleep 2
done
echo "[entrypoint] Datenbank erreichbar."

# Apply pending migrations. Safe to run on every start.
echo "[entrypoint] Führe Datenbankmigrationen aus…"
node node_modules/prisma/build/index.js migrate deploy

echo "[entrypoint] Starte Anwendung."
exec "$@"
