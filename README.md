# DockSlot – Zeitfenstermanagement

Ein Buchungssystem für Wareneingangsdocks in Logistikzentren. Spediteure können Zeitfenster an Rampen reservieren; Disponenten behalten per Rasteransicht den Überblick und pflegen den Status der Anlieferungen.

## Voraussetzungen

- Node.js 18 oder höher
- npm 8+

## Einrichtung

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Datenbank erstellen, Migrationen ausführen und Testdaten laden
npm run db:setup

# 3. Entwicklungsserver starten
npm run dev
```

Anschließend die App unter **http://localhost:3000** aufrufen.

## Rollenwechsel

Oben rechts in der Navigationsleiste befindet sich ein Umschalter:

- **Spediteur-Modus** (Standard): Zeitplan ansehen, freie Zeitfenster buchen.
- **Admin-Modus**: Zusätzlich Rampen und Konfiguration verwalten sowie alle Buchungen einsehen und Statuswechsel durchführen.

Die gewählte Rolle wird im LocalStorage gespeichert.

## Verfügbare Skripte

| Befehl | Beschreibung |
|---|---|
| `npm run dev` | Entwicklungsserver starten |
| `npm run build` | Produktions-Build erstellen |
| `npm run start` | Produktionsserver starten |
| `npm run db:setup` | Datenbank zurücksetzen, Migrationen und Seed ausführen |
| `npm run db:seed` | Nur Testdaten einspielen |
| `npm run db:migrate` | Neue Migration erstellen und anwenden |

## Datenmodell (Kurzübersicht)

- **Dock** – Rampe (Name, aktiv/inaktiv)
- **SlotConfig** – Öffnungszeiten, Slot-Dauer, Pufferzeit, Arbeitstage
- **Booking** – Buchung mit Status-Workflow:
  `GEBUCHT → EINGETROFFEN → IN_ABFERTIGUNG → ABGESCHLOSSEN`
  Jederzeit stornierbar: `→ STORNIERT`

## Tech-Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- Prisma ORM 7 + SQLite (via better-sqlite3 Adapter)
- date-fns, Zod
