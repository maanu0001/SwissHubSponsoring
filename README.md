# SwissHub Sponsoring

Sponsoring-Plattform für den Schweizer Gaming-Verein **SwissHub**.

Die Anwendung vereint fünf Aufgaben in einem System:

| Bereich | Zweck |
| --- | --- |
| **Sponsor-CRM** | Alle potenziellen und bestehenden Partner mit Status, Kontakt und Historie |
| **Sponsorenseiten-Generator** | Individuelle Pitch-Seiten je Firma unter `/partner/<slug>` |
| **CMS** | Die öffentliche Sponsoring-Seite ohne Codeänderung pflegen |
| **Turnierverwaltung** | Turniere, Formate, Streamlinks und Bildergalerien |
| **Medienverwaltung** | Logos, Bilder und Dokumente per Upload oder externer URL |
| **PDF-Export** | Dieselben Inhalte als Kurzpräsentation oder vollständiges Dossier |

Die Anwendung kommt **ohne KI-Funktionen**, ohne Kontaktformulare, ohne
E-Mail-Versand und ohne externe Analyse-Dienste aus. Sie läuft vollständig auf
einem eigenen Linux-Server und hat keine Abhängigkeit zu Vercel oder einer
anderen Managed-Plattform.

---

## Inhaltsverzeichnis

1. [Technischer Stack](#technischer-stack)
2. [Schnellstart Entwicklung](#schnellstart-entwicklung)
3. [Konfiguration](#konfiguration)
4. [Produktion mit Docker](#produktion-mit-docker)
5. [Reverse Proxy und HTTPS](#reverse-proxy-und-https)
6. [Backup und Restore](#backup-und-restore)
7. [Update-Deployment](#update-deployment)
8. [Adminkonten](#adminkonten)
9. [Der typische Arbeitsablauf](#der-typische-arbeitsablauf)
10. [PDF-Export](#pdf-export)
11. [Architektur](#architektur)
12. [Sicherheit](#sicherheit)
13. [Datenschutz](#datenschutz)
14. [Fehlersuche](#fehlersuche)

---

## Technischer Stack

- **Next.js 15** (App Router, React Server Components, Server Actions)
- **TypeScript** im strict-Modus
- **PostgreSQL 16** mit **Prisma ORM**
- **Tailwind CSS** mit CSS-Variablen für das zur Laufzeit änderbare Branding
- **Docker** und **Docker Compose** für den Produktivbetrieb
- Serverseitige Authentifizierung mit in der Datenbank gespeicherten Sessions
  und bcrypt-Passworthashes

---

## Schnellstart Entwicklung

Voraussetzungen: **Node.js ≥ 20.9** und **Docker** (oder ein lokal
installiertes PostgreSQL 16).

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Konfiguration anlegen
cp .env.example .env
#    In .env mindestens AUTH_SECRET setzen:
#    openssl rand -base64 48

# 3. Datenbank starten (PostgreSQL im Container, App läuft auf dem Host)
docker compose up -d

# 4. Schema anwenden
npm run db:migrate

# 5. SwissHub-Startdaten einspielen (idempotent, mehrfach ausführbar)
npm run seed

# 6. Entwicklungsserver starten
npm run dev
```

Danach erreichbar:

- Öffentliche Sponsoring-Seite: <http://localhost:3000>
- Adminbereich: <http://localhost:3000/admin>

Die Anmeldedaten stammen aus `ADMIN_EMAIL` und `ADMIN_INITIAL_PASSWORD` in
der `.env`.

### Weitere Befehle

```bash
npm run build          # Produktionsbuild erstellen
npm run start          # Produktionsbuild lokal starten
npm run typecheck      # TypeScript prüfen, ohne zu bauen
npm run lint           # ESLint ausführen
npm run db:studio      # Prisma Studio – grafischer Datenbankbrowser
npm run db:migrate     # Neue Migration erstellen und anwenden
npm run db:deploy      # Bestehende Migrationen anwenden (Produktion)
npm run seed           # Startdaten ergänzen (überschreibt nichts)
```

---

## Konfiguration

Alle Einstellungen kommen aus Umgebungsvariablen. `.env.example` ist die
vollständige, kommentierte Vorlage.

| Variable | Pflicht | Bedeutung |
| --- | --- | --- |
| `DATABASE_URL` | ja | PostgreSQL-Verbindungsstring |
| `AUTH_SECRET` | ja | Schlüssel für Sessions und Seiten-Passwortschutz. `openssl rand -base64 48` |
| `NEXT_PUBLIC_APP_URL` | ja | Vollständige öffentliche Adresse, z. B. `https://sponsoring.swisshub.gg` |
| `UPLOAD_DIR` | nein | Ablage für Uploads. Standard `./uploads`, im Container `/app/uploads` |
| `MAX_UPLOAD_SIZE` | nein | Maximale Dateigrösse in Bytes. Standard `10485760` (10 MB) |
| `ADMIN_EMAIL` | nein | Wird beim ersten Start als Adminkonto angelegt |
| `ADMIN_INITIAL_PASSWORD` | nein | Startpasswort dieses Kontos |
| `SESSION_MAX_AGE` | nein | Session-Gültigkeit in Sekunden. Standard `43200` (12 h) |
| `PAGE_PASSWORD_MAX_AGE` | nein | Gültigkeit des Zugangs zu geschützten Seiten. Standard 14 Tage |
| `LOGIN_MAX_ATTEMPTS` | nein | Anmeldeversuche pro Zeitfenster. Standard `8` |
| `LOGIN_WINDOW_SECONDS` | nein | Länge des Zeitfensters. Standard `900` (15 min) |
| `SKIP_BOOTSTRAP` | nein | `true` überspringt das automatische Seeding beim Start |

> **Die Zieldomain ist nirgends im Code verdrahtet.** Links, Sitemap,
> OpenGraph-Angaben und der Twitch-Embed leiten sich ausschliesslich aus
> `NEXT_PUBLIC_APP_URL` ab.

---

## Produktion mit Docker

### Erstinbetriebnahme

```bash
# 1. Repository auf den Server holen
git clone <repository-url> swisshub-sponsoring
cd swisshub-sponsoring

# 2. Konfiguration anlegen
cp .env.example .env
nano .env
```

In der `.env` mindestens setzen:

```bash
POSTGRES_PASSWORD="<langes Zufallspasswort>"
AUTH_SECRET="<openssl rand -base64 48>"
NEXT_PUBLIC_APP_URL="https://sponsoring.swisshub.gg"
ADMIN_EMAIL="admin@swisshub.gg"
ADMIN_INITIAL_PASSWORD="<Startpasswort>"
```

```bash
# 3. Bauen und starten
docker compose -f docker-compose.prod.yml up -d --build

# 4. Status prüfen
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
```

Beim Start passiert automatisch:

1. Der Container wartet, bis PostgreSQL Verbindungen annimmt.
2. `prisma migrate deploy` wendet alle offenen Migrationen an.
3. Die Anwendung startet und legt fehlende Startdaten an – Leistungskatalog,
   Templates, Beispielturniere, Partner-Referenzen und die Sektionen der
   öffentlichen Seite.
4. Existiert noch kein Adminkonto, wird eines aus `ADMIN_EMAIL` und
   `ADMIN_INITIAL_PASSWORD` erzeugt.

Dieser Vorgang ist **idempotent**: Vorhandene Daten werden nie überschrieben.

> **Nach der ersten Anmeldung** das Passwort unter
> `/admin/settings/account` ändern und `ADMIN_INITIAL_PASSWORD` aus der `.env`
> entfernen.

### Container-Übersicht

| Container | Aufgabe | Persistenz |
| --- | --- | --- |
| `swisshub-app` | Next.js-Anwendung, lauscht auf `127.0.0.1:3000` | Volume `uploads` → `/app/uploads` |
| `swisshub-db` | PostgreSQL 16, nur im internen Netz erreichbar | Volume `db_data` |

Beide Container laufen mit `restart: unless-stopped` und besitzen einen
Healthcheck. Die App-Instanz läuft als unprivilegierter Benutzer (`nextjs`,
UID 1001).

### Nützliche Befehle

```bash
# Logs
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f db

# Status und Healthcheck
docker compose -f docker-compose.prod.yml ps
curl -s http://127.0.0.1:3000/api/health

# Neustart
docker compose -f docker-compose.prod.yml restart app

# Stoppen (Daten bleiben in den Volumes erhalten)
docker compose -f docker-compose.prod.yml down

# Migrationen manuell anwenden
docker compose -f docker-compose.prod.yml exec app \
  node node_modules/prisma/build/index.js migrate deploy

# Datenbank-Shell
docker compose -f docker-compose.prod.yml exec db psql -U swisshub -d swisshub
```

---

## Reverse Proxy und HTTPS

Die Anwendung lauscht bewusst nur auf `127.0.0.1:3000`. TLS wird vom Reverse
Proxy terminiert.

### Nginx

`/etc/nginx/sites-available/sponsoring.swisshub.gg`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name sponsoring.swisshub.gg;

    # Certbot legt hier seine Challenge-Dateien ab.
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name sponsoring.swisshub.gg;

    ssl_certificate     /etc/letsencrypt/live/sponsoring.swisshub.gg/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sponsoring.swisshub.gg/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    # HSTS erst aktivieren, wenn HTTPS zuverlässig läuft.
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Grosszügig genug für Bild-Uploads (vgl. MAX_UPLOAD_SIZE).
    client_max_body_size 12M;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";

        proxy_read_timeout 60s;
        proxy_buffering    off;
    }

    # Statische Assets sind content-addressed und dürfen lange gecacht werden.
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Aktivieren und Zertifikat ausstellen:

```bash
sudo ln -s /etc/nginx/sites-available/sponsoring.swisshub.gg \
           /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Let's Encrypt / Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d sponsoring.swisshub.gg

# Automatische Erneuerung prüfen
sudo certbot renew --dry-run
```

> Zertifikate liegen unter `/etc/letsencrypt` auf dem Server und gehören
> **niemals** ins Repository.

`X-Forwarded-For` weiterzureichen ist wichtig: Das Rate-Limiting beim Login
wertet diesen Header aus.

---

## Backup und Restore

Zu sichern sind zwei Dinge: die **PostgreSQL-Datenbank** und das
**Upload-Verzeichnis**.

### Backup durchführen

```bash
./docker/backup.sh ./backups
```

Das Skript erzeugt zwei Dateien und prüft beide anschliessend auf Lesbarkeit:

```
backups/swisshub-db-20260823-140000.sql.gz
backups/swisshub-uploads-20260823-140000.tar.gz
```

Manuell geht dasselbe so:

```bash
# Datenbank
docker exec swisshub-db pg_dump -U swisshub -d swisshub --clean --if-exists \
  | gzip > backup-db.sql.gz

# Uploads
docker run --rm --volumes-from swisshub-app -v "$PWD:/backup" alpine:3.20 \
  tar czf /backup/backup-uploads.tar.gz -C /app uploads
```

### Backup prüfen

```bash
gzip -t backups/swisshub-db-*.sql.gz          # Archiv intakt?
zcat backups/swisshub-db-*.sql.gz | head -40  # Inhalt plausibel?
tar tzf backups/swisshub-uploads-*.tar.gz | head
```

Ein vollständiger Test spielt das Backup in eine Wegwerf-Datenbank ein:

```bash
docker exec swisshub-db createdb -U swisshub swisshub_restore_test
zcat backups/swisshub-db-*.sql.gz \
  | docker exec -i swisshub-db psql -U swisshub -d swisshub_restore_test
docker exec swisshub-db psql -U swisshub -d swisshub_restore_test \
  -c "SELECT count(*) FROM sponsors;"
docker exec swisshub-db dropdb -U swisshub swisshub_restore_test
```

### Wiederherstellen

```bash
./docker/restore.sh backups/swisshub-db-20260823-140000.sql.gz \
                    backups/swisshub-uploads-20260823-140000.tar.gz
```

Das Skript fragt vor dem Überschreiben nach, stoppt die App, spielt Datenbank
und Uploads ein und startet die App wieder.

### Automatisieren

```bash
# Täglich um 03:15 Uhr sichern, Backups älter als 30 Tage entfernen
sudo crontab -e
```

```cron
15 3 * * * cd /opt/swisshub-sponsoring && ./docker/backup.sh /var/backups/swisshub >> /var/log/swisshub-backup.log 2>&1
30 3 * * * find /var/backups/swisshub -name 'swisshub-*' -mtime +30 -delete
```

> Kopieren Sie die Backups zusätzlich auf ein anderes System. Ein Backup, das
> nur auf demselben Server liegt, schützt nicht vor dessen Ausfall.

---

## Update-Deployment

```bash
cd /opt/swisshub-sponsoring

# 1. Vorher sichern
./docker/backup.sh /var/backups/swisshub

# 2. Neuen Stand holen
git pull

# 3. Neu bauen und starten – Migrationen laufen beim Start automatisch
docker compose -f docker-compose.prod.yml up -d --build

# 4. Prüfen
docker compose -f docker-compose.prod.yml ps
curl -s http://127.0.0.1:3000/api/health
docker compose -f docker-compose.prod.yml logs --tail=50 app
```

Die Volumes bleiben unangetastet: Ein Rebuild oder Neustart verliert weder
Datenbankinhalte noch hochgeladene Dateien.

---

## Adminkonten

Es gibt **keine öffentliche Registrierung**. Konten werden auf dem Server
angelegt.

```bash
# Neues Konto (Passwort wird erzeugt und einmalig angezeigt)
docker compose -f docker-compose.prod.yml exec app \
  npx tsx --conditions=react-server scripts/create-admin.ts \
  --email name@swisshub.gg --name "Vorname Nachname"

# Passwort zurücksetzen (beendet alle Sitzungen dieses Kontos)
docker compose -f docker-compose.prod.yml exec app \
  npx tsx --conditions=react-server scripts/reset-password.ts \
  --email name@swisshub.gg --password "neues-passwort"
```

In der Entwicklungsumgebung genügt:

```bash
npm run admin:create -- --email name@swisshub.gg --name "Vorname Nachname"
npm run admin:password -- --email name@swisshub.gg --password "neues-passwort"
```

Admins ändern ihr eigenes Passwort im Adminbereich unter
**Einstellungen → Konto**.

---

## Der typische Arbeitsablauf

So entsteht in wenigen Minuten eine individuelle Sponsorenseite:

1. **Sponsoren → Neuen Sponsor erstellen** öffnen.
2. **Schritt 1 – Unternehmen:** Firmenname, Logo, Website und Branche.
3. **Schritt 2 – Kontakt:** Ansprechpartner, E-Mail, Telefon, interne Notizen.
4. **Schritt 3 – Turnier:** Bestehendes Turnier wählen oder direkt im Dialog
   ein neues anlegen.
5. **Schritt 4 – Sponsoring:** Art der Unterstützung (Geld, Sachpreise, Game
   Keys, Hardware, Dienstleistungen, Kombination) und Betrag bzw. Freitext.
6. **Schritt 5 – Leistungen:** Aus dem Katalog anklicken. Fehlt etwas, lässt
   sich eine eigene Leistung direkt im Dialog anlegen.
7. **Schritt 6 – Template:** Ausgangspunkt wählen. Das Template bestimmt nur
   den Startzustand – anschliessend ist jede Sektion frei editierbar.
8. **Erstellen.** Die Seite öffnet sich im Editor.
9. **Editor:** Texte, Zahlen, Bilder und Leistungen anpassen, Sektionen per
   Drag-and-Drop (oder mit den Pfeiltasten) sortieren und ein- oder ausblenden.
10. **Vorschau:** Desktop, Tablet und Mobile prüfen.
11. **Einstellungen → Seite veröffentlichen.**
12. **Link kopieren** und in die E-Mail an das Unternehmen einfügen:
    `https://sponsoring.swisshub.gg/partner/digitec`
13. Optional **PDF Export** öffnen, Kurzpräsentation oder Dossier wählen und die
    Datei der Sponsoring-Mail anhängen – für Firmen, die keine Links aus
    E-Mails öffnen dürfen. Siehe [PDF-Export](#pdf-export).

Optional lässt sich unter **Einstellungen → Sichtbarkeit** ein Passwortschutz
aktivieren. Besucher sehen dann zuerst eine Passwortabfrage.

**Entwürfe und archivierte Seiten sind niemals öffentlich erreichbar** – ein
Aufruf liefert eine 404-Seite.

---

## PDF-Export

Viele Unternehmen öffnen aus Sicherheitsgründen keine Links aus E-Mails. Jede
Sponsorenseite lässt sich deshalb zusätzlich als PDF exportieren, das einer
Sponsoring-Mail direkt angehängt werden kann.

Das PDF wird **aus denselben Daten** erzeugt wie die Sponsorenseite. Es gibt
keinen zweiten Editor und keine doppelte Datenpflege: Wird der Betrag von
CHF 2’000 auf CHF 2’500 geändert, steht beim nächsten Export automatisch der
neue Betrag im Dokument.

### Die beiden Varianten

| Variante | Zweck | Umfang |
| --- | --- | --- |
| **Kurzpräsentation** | Erstansprache | Kompakter Pitch, typischerweise 5–7 Seiten |
| **Vollständiges Dossier** | Firmen mit konkretem Interesse | Alle freigegebenen Sektionen |

Beide werden im Sponsorenseiten-Editor über **PDF Export** erzeugt. Der Dialog
bietet zusätzlich eine Vorschau, die den echten PDF-Renderer im Browser anzeigt.

### Sichtbarkeit pro Sektion

Jede Sektion einer Sponsorenseite hat drei unabhängige Schalter:

```text
Website              ✓
Kurzpräsentation     ✓
Vollständiges Dossier ✓
```

Im Editor sitzt die Steuerung als kompakter Chip in der Kopfzeile jeder
Sektion (`Web · Kurz · Dossier`). So lässt sich beispielsweise eine
Bildergalerie online zeigen, im kurzen PDF aber weglassen und im Dossier wieder
aufnehmen.

Sinnvolle Voreinstellungen sind pro Sektionstyp hinterlegt: Der Kurzpitch
enthält standardmässig nur die Kernargumentation (Hero, persönliche Ansprache,
Warum diese Partnerschaft, Turnier, Reichweite, Vorschlag, Leistungen, Vision,
Über SwissHub, Kontakt). Budgetverwendung, Turnierhistorie, Referenzpartner,
VOD-Links und Galerien landen zunächst nur im Dossier.

Templates speichern diese Einstellungen mit. Beim Erstellen einer Sponsorenseite
werden sie – wie alle anderen Templatewerte – **einmalig kopiert**. Spätere
Änderungen am Template verändern bestehende Seiten nicht.

Die Reihenfolge im PDF entspricht der Reihenfolge auf der Sponsorenseite. Im
Datenmodell existiert zusätzlich ein optionales Feld `pdfOrder`; ist es gesetzt,
hat es Vorrang. Ein zweiter Seitenbaukasten war dafür bewusst nicht nötig.

### QR-Code

Die Abschlussseite kann einen QR-Code auf die individuelle Sponsorenseite
enthalten, z. B. `https://sponsoring.swisshub.gg/partner/world-of-games`.

- Der Code wird **lokal auf dem Server** erzeugt (Bibliothek `qrcode`, Ausgabe
  als SVG). Es wird kein externer QR-Dienst aufgerufen.
- Bei **Entwürfen** ist der QR-Code automatisch deaktiviert, weil der Link noch
  nicht erreichbar wäre.

### Technische Umsetzung

- **Engine:** Playwright mit headless Chromium. Der Export läuft vollständig
  serverseitig – kein `window.print()`, keine Abhängigkeit vom Browser des
  Admins, kein externer PDF-Dienst.
- **Eigener Renderer:** Das PDF ist kein Ausdruck der Website. Unter
  `/admin/pdf/sponsor-page/[id]` liegt ein eigener A4-Renderer ohne Navigation,
  Animationen, Hover-Zustände oder Buttons.
- **Seitenaufteilung:** Die Verteilung auf Seiten wird serverseitig berechnet.
  Jede Seite ist ein fest 210 × 297 mm grosser Block; Karten, KPI-Blöcke und
  Bilder werden nie über zwei Seiten zerschnitten. Ein Messskript im Renderer
  meldet überlaufende Seiten im Serverlog.
- **Schriften:** ausschliesslich lokale Systemschriften (Liberation Sans,
  DejaVu Sans). Zur Exportzeit wird nichts nachgeladen – der Export funktioniert
  auch ohne Internetzugang des Servers.
- **Metadaten:** Titel, Autor, Betreff und Ersteller werden gesetzt.
- **Branding:** Primär- und Sekundärfarbe kommen aus den Branding-Einstellungen.
  Eine Farbänderung wirkt sich beim nächsten Export automatisch aus.
- **Durchgehendes Dark Theme:** Das PDF verwendet auf allen Seiten dieselben
  Anthrazit-/Rot-Tokens wie die Web-App (siehe `globals.css`), damit ein Export
  wie eine zusammenhängende Präsentation wirkt und nicht wie eine gedruckte
  Webseite. Es gibt bewusst kein helles Theme: Jede Seite füllt A4 vollflächig
  mit dem dunklen Grund, Karten sind leicht aufgehellte Flächen, Rot bleibt
  Akzent. Die Kennzahlen- und die Angebotsfläche tragen zusätzlich einen
  dezenten Brand-Verlauf.
- **Bildschirm vor Druck:** Die Gestaltung ist auf digitale Weitergabe
  optimiert. Der Export bleibt auf Papier lesbar, verbraucht dort aber
  entsprechend Toner.
- **Hintergründe im Export:** `@page { margin: 0 }`, `printBackground: true`
  und `print-color-adjust: exact` sorgen dafür, dass der dunkle Grund bis an
  alle Seitenränder reicht. Die `@media print`-Regel der Web-App (heller Grund
  beim Ausdruck der öffentlichen Seite) wird im PDF-Stylesheet gezielt
  überstimmt.

### Sicherheit

- Der Export ist ausschliesslich für angemeldete Admins erreichbar; die
  Berechtigung wird serverseitig geprüft, nicht nur der Button ausgeblendet.
- Die Renderroute akzeptiert entweder eine Admin-Session **oder** ein kurzlebiges,
  signiertes Token. Dem Browserprozess wird **kein Session-Cookie**
  weitergereicht; das Token gilt nur für eine Seite, einen Modus und wenige
  Minuten.
- Chromium lädt ausschliesslich die interne Renderroute über Loopback. Alle
  Anfragen an andere Ursprünge werden abgebrochen – ausgenommen Bilder, damit
  extern gehostete Logos funktionieren. `file://` ist gesperrt. Sponsorlinks
  erscheinen im PDF nur als Text bzw. Link, sie werden nie geladen.

### Performance

- Ein Export dauert typischerweise ein bis drei Sekunden.
- Gleichzeitige Exporte sind begrenzt (`PDF_MAX_CONCURRENT`, Standard 2);
  weitere Anfragen warten in einer kleinen In-Process-Queue. Eine externe
  Queue wäre für diese Funktion unverhältnismässig.
- Der Browser wird nach jedem Export in einem `finally`-Block beendet, auch bei
  Timeout oder Fehler. Es bleiben keine Prozesse zurück.

### Docker-Anforderungen

Das Produktionsimage installiert Chromium samt Systembibliotheken und
Schriftpaketen selbst:

```dockerfile
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN apt-get update \
    && apt-get install -y --no-install-recommends fonts-liberation fonts-dejavu-core \
    && node node_modules/playwright/cli.js install --with-deps chromium
```

Zusätzlich setzt `docker-compose.prod.yml` `shm_size: 512mb` – die
Docker-Voreinstellung von 64 MB reicht Chromium nicht und führt zu abstürzenden
Renderprozessen.

Wer stattdessen ein System-Chromium verwenden möchte, setzt `PDF_CHROMIUM_PATH`
auf dessen Pfad.

### Fehlersuche PDF-Export

**„Chromium wurde nicht gefunden“**
Der Browser fehlt im Image oder auf dem Host. Nachinstallieren mit:

```bash
npx playwright install --with-deps chromium
```

Alternativ ein vorhandenes Chromium verwenden:

```bash
PDF_CHROMIUM_PATH=/usr/bin/chromium
```

**„Chromium konnte nicht starten – es fehlen Systembibliotheken“**
Typisch für schlanke Images ohne die Chromium-Abhängigkeiten. Lösung:

```bash
npx playwright install-deps chromium
```

Manuell entspricht das unter anderem `libnss3`, `libnspr4`, `libatk1.0-0`,
`libatk-bridge2.0-0`, `libcups2`, `libdrm2`, `libxkbcommon0`, `libxcomposite1`,
`libxdamage1`, `libxfixes3`, `libxrandr2`, `libgbm1`, `libpango-1.0-0`,
`libcairo2` und `libasound2`.

**Text erscheint als leere Kästchen**
Im Image fehlen Schriften. `fonts-liberation` und `fonts-dejavu-core`
installieren.

**„Der Export ist ausgelastet“**
Es laufen bereits `PDF_MAX_CONCURRENT` Exporte. Entweder kurz warten oder den
Wert erhöhen – jeder gleichzeitige Export braucht zusätzlichen Arbeitsspeicher.

**Ein externes Bild fehlt im PDF**
Nicht erreichbare externe Bilder werden übersprungen, damit der Export nicht
abbricht; im Serverlog erscheint ein Hinweis. Für zuverlässige Ergebnisse
Bilder hochladen statt zu verlinken.

**„Die PDF-Erstellung hat zu lange gedauert“**
Der Export bricht nach 30 Sekunden Ladezeit ab. Meist verursacht durch sehr
grosse oder langsam ausgelieferte externe Bilder.

**Im Serverlog steht „content overflow on sheet(s)“**
Eine Sektion enthält mehr Inhalt, als auf ein A4-Blatt passt. Der Export bleibt
gültig, der betroffene Abschnitt wird aber abgeschnitten. Abhilfe: den Text der
Sektion kürzen oder die Sektion aufteilen.

---

## Architektur

```
src/
├── app/
│   ├── page.tsx                       Öffentliche Sponsoring-Hauptseite
│   ├── partner/[slug]/                Individuelle Sponsorenseiten
│   ├── impressum/, datenschutz/       Rechtliche Seiten (CMS-gepflegt)
│   ├── admin/
│   │   ├── login/                     Anmeldung (ausserhalb des Guards)
│   │   ├── (app)/                     Geschützter Adminbereich
│   │   │   ├── page.tsx               Dashboard
│   │   │   ├── sponsors/              CRM inkl. Erstellungs-Assistent
│   │   │   ├── sponsor-pages/[id]/    Sponsorenseiten-Editor
│   │   │   ├── tournaments/           Turnierverwaltung
│   │   │   ├── templates/             Template-Verwaltung
│   │   │   ├── benefits/              Leistungskatalog
│   │   │   ├── media/                 Medienverwaltung
│   │   │   ├── content/               CMS der öffentlichen Seite
│   │   │   ├── partners/              Partner-Referenzen
│   │   │   └── settings/              Branding, SEO, Recht, Konto, Protokoll
│   │   ├── preview/sponsor-page/[id]/ Vorschau ohne Admin-Rahmen
│   │   └── pdf/sponsor-page/[id]/     A4-Renderer für den PDF-Export
│   ├── api/admin/…/pdf/               Erzeugt und liefert die PDF-Datei
│   ├── api/media/[...path]/           Auslieferung hochgeladener Dateien
│   ├── api/health/                    Healthcheck für Docker und Proxy
│   ├── robots.ts, sitemap.ts          SEO
│   └── error.tsx, not-found.tsx       Fehlerseiten im SwissHub-Stil
├── components/
│   ├── ui/                            Button, Input, Modal, DataTable, …
│   ├── admin/                         Editoren, Picker, Selektoren
│   └── public/                        Sektions-Renderer der öffentlichen Seiten
├── lib/                               Auth, DB, Sanitizing, Storage, Formate
└── server/
    ├── actions/                       Server Actions (alle Mutationen)
    ├── page-builder.ts                Template → fertige Sponsorenseite
    ├── render.ts                      Aufbau des Render-Kontexts
    ├── pdf/                           Datenaufbau, Seitenaufteilung, Chromium
    └── bootstrap.ts                   Idempotentes Seeding beim Start
```

### Zentrale Entscheidungen

**Sektionen statt festem Layout.** Jede Seite – öffentliche Hauptseite wie
individuelle Sponsorenseite – besteht aus sortierbaren Sektionen mit typisiertem
JSON-Payload. Neue Abschnittstypen lassen sich ergänzen, ohne bestehende Daten
zu migrieren.

**Templates erzeugen Kopien.** Beim Erstellen einer Seite werden die Sektionen
des Templates einmalig kopiert. Danach ist die Seite vollständig unabhängig:
Änderungen am Template wirken sich nie rückwirkend auf bestehende Seiten aus,
und das Template schränkt die Bearbeitung nicht ein.

**Ein Renderer für Vorschau und Live-Seite.** `/admin/preview/sponsor-page/[id]`
verwendet exakt dieselben Komponenten wie `/partner/[slug]`. Die Vorschau ist
damit keine Annäherung, sondern das echte Ergebnis.

**Branding über CSS-Variablen.** Die Markenfarben liegen in der Datenbank und
werden serverseitig als CSS-Custom-Properties in das Dokument geschrieben.
Eine Farbänderung wirkt sofort und ohne Rebuild – auch auf den ersten
gerenderten Frame.

**Uploads ausserhalb des Bundles.** Dateien liegen in `UPLOAD_DIR` auf einem
persistenten Volume und werden über `/api/media/...` ausgeliefert. Ein Redeploy
berührt sie nicht.

**PDF mit serverseitiger Seitenaufteilung.** Der Export benutzt dieselben Daten
wie die Sponsorenseite, aber einen eigenen A4-Renderer. Welche Inhalte auf
welches Blatt kommen, entscheidet der Server, bevor der Browser rendert. Das
macht Seitenzahlen exakt und verhindert, dass eine Leistungskarte oder ein
KPI-Block über zwei Blätter zerrissen wird.

---

## Sicherheit

- **Passwörter** werden mit bcrypt (Kostenfaktor 12) gehasht. Klartext wird
  nirgends gespeichert oder protokolliert.
- **Sessions** liegen in der Datenbank; im Cookie steht nur ein Zufallstoken,
  gespeichert wird ausschliesslich dessen SHA-256-Hash. Cookies sind
  `httpOnly`, `SameSite=Lax` und bei HTTPS zusätzlich `Secure`.
- **CSRF:** Alle Mutationen laufen über Next.js Server Actions, die
  Origin und Host serverseitig prüfen.
- **Rate-Limiting** beim Login: standardmässig 8 Versuche pro E-Mail/IP in
  15 Minuten, in der Datenbank gezählt und damit neustart- und
  instanzübergreifend wirksam.
- **Berechtigungen** werden in jeder Server Action erneut serverseitig geprüft,
  nicht nur beim Rendern der Seite.
- **XSS:** Rich-Text wird beim Speichern *und* beim Rendern über eine
  Allowlist (`sanitize-html`) geführt. Client-Ausgaben werden nie vertraut.
- **SQL-Injection** ist durch Prisma ausgeschlossen; es gibt keine
  String-konkatenierten Abfragen.
- **Uploads** werden über die Magic Bytes validiert, nicht über den vom Client
  gemeldeten MIME-Typ. Dateinamen werden zufällig erzeugt, Path Traversal wird
  vor jedem Dateizugriff abgewiesen. SVG-Dateien mit Skripten, Event-Handlern
  oder externen Referenzen werden abgelehnt. Ausgeliefert wird mit
  `X-Content-Type-Options: nosniff` und einer restriktiven CSP mit `sandbox`.
- **Security-Header** (`X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, …) setzt `next.config.mjs` für alle Routen.
- **Secrets** kommen ausschliesslich aus Umgebungsvariablen. Serverseitige
  Module sind mit `server-only` markiert und können nicht versehentlich im
  Client-Bundle landen.
- **Passwortgeschützte Sponsorenseiten:** Das Passwort verlässt den Server nie.
  Nach erfolgreicher Eingabe wird ein signiertes Cookie gesetzt, dessen
  Signatur den Passworthash einschliesst – ein Passwortwechsel entwertet damit
  sofort alle zuvor erteilten Zugänge.
- **Adminbereich und individuelle Sponsorenseiten** senden `noindex`.

---

## Datenschutz

Die Anwendung bindet **keine externen Analyse-Dienste** ein.

Optional erfasst sie für Sponsorenseiten eine minimale Aufrufstatistik:

- Anzahl der Aufrufe insgesamt und pro Tag
- Zeitpunkt des letzten Aufrufs

Nicht gespeichert werden: IP-Adressen, User-Agents, Cookies zu Analysezwecken,
Referrer oder irgendeine Form von Fingerprinting. Eine Zuordnung zu einzelnen
Personen ist damit nicht möglich.

Impressum und Datenschutzerklärung sind im Adminbereich unter
**Einstellungen → Rechtliches** editierbar. Sie sind mit **klar markierten
Platzhaltern** vorbelegt – die tatsächlichen Angaben müssen von SwissHub
ergänzt und rechtlich geprüft werden.

---

## Fehlersuche

**Die App startet nicht, `docker logs` zeigt `AUTH_SECRET ist nicht gesetzt`**
`AUTH_SECRET` fehlt in der `.env`. Erzeugen mit `openssl rand -base64 48`.

**`Datenbank nach 60 Versuchen nicht erreichbar`**
Der DB-Container läuft nicht oder ist unhealthy:
`docker compose -f docker-compose.prod.yml logs db`. Häufige Ursache ist ein
`POSTGRES_PASSWORD`, das nach dem ersten Start geändert wurde – das Passwort
steckt dann noch im Volume `db_data`.

**Anmeldung nicht möglich, kein Adminkonto vorhanden**
`ADMIN_EMAIL`/`ADMIN_INITIAL_PASSWORD` setzen und den Container neu starten,
oder ein Konto per `scripts/create-admin.ts` anlegen (siehe
[Adminkonten](#adminkonten)).

**„Zu viele Anmeldeversuche“**
Das Rate-Limit greift. Entweder das Zeitfenster abwarten oder die Sperre lösen:

```bash
docker compose -f docker-compose.prod.yml exec db \
  psql -U swisshub -d swisshub -c "DELETE FROM login_attempts;"
```

**Hochgeladene Bilder erscheinen nicht**
Prüfen, ob das Volume eingebunden ist und beschreibbar bleibt:

```bash
docker compose -f docker-compose.prod.yml exec app ls -la /app/uploads
```

**Links zeigen auf `localhost` statt auf die Domain**
`NEXT_PUBLIC_APP_URL` ist falsch gesetzt. Wert korrigieren und den Container
neu bauen – die Variable wird teilweise zur Buildzeit eingebettet:

```bash
docker compose -f docker-compose.prod.yml up -d --build app
```

**Twitch-Embed bleibt leer**
Twitch verlangt, dass der `parent`-Parameter exakt der aufrufenden Domain
entspricht. Er wird aus `NEXT_PUBLIC_APP_URL` abgeleitet; über `localhost`
aufgerufene Produktionsseiten zeigen deshalb keinen Player.

**Änderungen auf der öffentlichen Seite erscheinen verzögert**
Die öffentliche Hauptseite ist gecacht (5 Minuten). Speichern im CMS
invalidiert den Cache sofort; ein harter Reload im Browser hilft bei
zwischengespeicherten Assets.

---

## Lizenz

Interne Anwendung von SwissHub. Alle Rechte vorbehalten.
