# Spielbar – Österreichische Casual-Browsergames

Eine Plattform für fokussierte, gut gemachte Browsergames – ohne Ablenkung, ohne Overhead.

## 🚀 Quick Start

```bash
# Dependencies installieren
npm install

# Datenbank aus Migrations-Historie aufsetzen (Baseline + alle Folgemigrationen)
npx prisma migrate deploy

# Optional: Seed-Daten laden
npm run db:seed

# Wenn du lokal News erstellt/editiert hast:
npm run news:export

# Entwicklungsserver starten
npm run dev
```

Die Anwendung läuft dann unter: **http://localhost:3000**

---

## 🎮 Spiele (aktueller Stand)

Alle Spiele werden über die dynamische Route ausgeliefert:

- **Game-Detailseite:** `http://localhost:3000/games/[slug]`
- **Daily (Minesweeper):** `http://localhost:3000/games/minesweeper/daily`
- **Daily (Sudoku):** `http://localhost:3000/games/sudoku/daily`

Aktuelle Spiele im Repo:

- **Minesweeper** (`/games/minesweeper`)
- **Sudoku** (`/games/sudoku`)
- **Snake** (`/games/snake`)
- **StackTower** (`/games/stacktower`)
- **Lemonade Stand** (`/games/lemonadestand`)
- **Brick Breaker** (`/games/brick-breaker`)
- **Daily Minesweeper** (`/games/minesweeper/daily`)
- **Daily Sudoku** (`/games/sudoku/daily`)

---

## 💣 Minesweeper

Unser erstes Spiel: Der Klassiker komplett neu gedacht.

**URL:** `http://localhost:3000/games/minesweeper`

### Features

#### Klassisches Gameplay
- **Linksklick** – Feld aufdecken
- **Rechtsklick** – Flagge setzen/entfernen
- **Doppelklick auf Zahl** – Chording (alle angrenzenden Felder aufdecken, wenn Flaggen-Anzahl stimmt)
- **R** – Neues Spiel starten
- **P** – Proof-Hinweis anfordern

#### Schwierigkeitsgrade
| Stufe | Größe | Minen |
|-------|-------|-------|
| Anfänger | 9×9 | 10 |
| Fortgeschritten | 16×16 | 40 |
| Experte | 30×16 | 99 |
| Custom | Frei wählbar | Frei wählbar |

#### Proof-Mode (Skill-Verifizierung)
- **🔍 Proof-Button** zeigt logisch beweisbare Züge
- Unterscheidet echtes Können von Glückstreffern
- **Skill-Verified Bestzeit** – nur ohne Proof-Hilfe
- Nutzt Constraint-basierte Analyse

#### Game-Over-Analyse
- Automatische Analyse bei Niederlage
- Feedback: "Das war Pech" vs. "Da hättest du es wissen können"
- Zeigt, ob der fatale Zug logisch ableitbar war

#### Tutorial
- Interaktives Tutorial für Einsteiger
- Erklärt Grundmechaniken Schritt für Schritt

#### Color Pulse UI
- **Warme Farbnuancen** statt kaltem Grau, dezente Tiefe bei aufgedeckten Feldern
- **Animationen** bei Reveal, Flagge setzen und Gewinn (subtil, nicht ablenkend)
- **Proof-Mode Highlighting** – Grün = sicher, Rot = Mine (semantische Farben)
- **Theme-Switch** – Classic (ruhig) oder Pulse (lebendiger) wählbar

---

## 🔢 Sudoku

Sudoku als fokussiertes Logic-Game – schnell zu spielen, aber mit genug Tiefe (Notizen, Undo/Redo, Fehler-Handling), ideal als Daily.

**URL:** `http://localhost:3000/games/sudoku`

### Steuerung
| Aktion | Eingabe |
|--------|---------|
| Zahl setzen | `1–9` |
| Feld leeren | `Backspace` / `Delete` |
| Navigation | Pfeiltasten / `W A S D` |
| Notes/Notizen togglen | `N` |
| Undo / Redo | `Cmd/Ctrl+Z` / `Shift+Cmd/Ctrl+Z` |
| Neues Spiel (falls angeboten) | `R` |

> Hinweis: Je nach Modus (Daily vs. Free Play) können Restart/Erzeugung deaktiviert sein.

### Features
- **Sauberes Grid mit Selection-UX** (Row/Col/Box Highlighting)
- **Notizen (Pencil Marks)** pro Zelle
- **Fehleranzeige** (optional / je nach Einstellung)
- **Undo/Redo** & sichere Eingabelogik
- **Dark Mode / Theme Support** (auf Plattform-Level)

---

## 📅 Daily Minesweeper

**URL:** `http://localhost:3000/games/minesweeper/daily`

Das tägliche Minesweeper-Rätsel – wie Wordle, aber für Logik-Fans.

### Konzept
- **Ein Board pro Tag** – Alle Spieler haben exakt dasselbe Rätsel
- **Garantiert logisch lösbar** – Kein Raten nötig, reine Logik
- **Kein Neustart** – Nur ein Versuch pro Tag
- **Hinweise optional** – Nutzung wird vermerkt

### Schwierigkeit (rotiert nach Wochentag)
| Tag | Schwierigkeit |
|-----|---------------|
| Mo, Di | Leicht (9×9, 10 Minen) |
| Mi, Do, Fr | Mittel (12×12, 25 Minen) |
| Sa, So | Schwer (16×16, 45 Minen) |

### Ergebnis-Status
- **✨ Clean Solve** – Ohne Hinweise gelöst
- **Solved with Hints** – Mit Proof-Hilfe gelöst
- Zeit & Züge werden angezeigt

### Technische Details
- Seeded Random Generator für deterministische Boards
- Solver prüft bei Generierung, ob Board ohne Guess lösbar ist
- Spielerversuche werden per localStorage-ID gespeichert

---

## 📅 Daily Sudoku

**URL:** `http://localhost:3000/games/sudoku/daily`

Das tägliche Sudoku – ein Puzzle pro Tag für alle.

### Konzept
- **Ein Sudoku pro Tag** – deterministisch generiert/ausgeliefert
- **Ein Versuch pro Tag** – im Daily-Modus kein beliebiges Rerollen
- **Notizen erlaubt** – aber läuft als Teil deiner Lösung

### Technische Details
- **Daily-Board Eintrag** in der Datenbank (Prisma) für Lives/Archiv
- Attempts/Status optional (je nach Implementierung) analog zu Minesweeper-Daily

---

## 🐍 Snake

Klassisches Snake als modernes Canvas-Game mit Specials und Highscores.

**URL:** `http://localhost:3000/games/snake`

### Steuerung
| Aktion | Eingabe |
|--------|---------|
| Start | `Space` (oder Tipp/Touch) |
| Bewegen | Pfeiltasten oder `W A S D` |
| Pause | `Esc` oder `P` |

### Features (Auszug)
- Highscores in `localStorage`
- Special Items (z.B. Slow / Ghost / Double / Shrink)
- Combo-System + Partikel-Feedback

---

## 🗼 StackTower

Das perfekte Flow-Game: ruhig, präzise und hochgradig befriedigend.

**URL:** `http://localhost:3000/games/stacktower`

### Spielprinzip
- Stapele horizontale Plattformen zu einem immer höheren Turm
- Jede neue Plattform bewegt sich seitlich hin und her
- Mit einem Klick (oder Leertaste) wird sie fallen gelassen
- Alles, was nicht überlappt, wird sauber abgeschnitten
- Ziel: So hoch wie möglich stapeln

### Steuerung
| Aktion | Eingabe |
|--------|---------|
| Platzieren | Klick oder `Space` |
| Neustart | `R` (nach Game Over) |

### Features
- **Perfect Stack** – Pixelgenaue Treffer behalten die volle Breite und geben Bonuspunkte
- **Perfect Streak** – Mehrere perfekte Züge hintereinander multipliziert den Bonus
- **Dynamische Geschwindigkeit** – Steigt langsam aber stetig mit der Höhe
- **Himmel-Gradient** – Hintergrund verändert sich dezent mit zunehmender Höhe
- **Fallende Stücke** – Abgeschnittene Teile fallen physikalisch nach unten
- **Sofortiger Restart** – Ein Klick und du bist wieder drin

---

## 🧱 Brick Breaker

Zen-Arcade Brick Breaker: präzise, ruhig, sofort im Flow.

**URL:** `http://localhost:3000/games/brick-breaker`

### Spielprinzip
- Ein Paddle, ein Ball, klare Patterns
- 5 kurze Levels mit sanfter Steigerung
- Seltene Powerups (Multi-Ball, Wider Paddle, Slow)
- Instant Restart (Space oder Klick)

### Steuerung
| Aktion | Eingabe |
|--------|---------|
| Paddle bewegen | Maus/Trackpad oder Pfeiltasten |
| Start/Restart | Klick oder `Space` |

### Features
- **Fair & präzise Kollisionen** – keine WTF-Momente
- **Anti-Stuck-Logik** – Ball bleibt immer spielbar
- **Score + Bestscore** – lokal gespeichert
- **Zen-Visuals** – ruhig, klar, aber lebendig

---

## 🍋 Lemonade Stand

Ein leichtes, beruhigendes Idle-Tycoon-Game – perfekt für kurze Pausen.

**URL:** `http://localhost:3000/games/lemonadestand`

### Spielprinzip
- Starte mit einem einfachen Limonadenstand
- Klicke zum Verkaufen – jeder Klick bringt sofort Geld
- Investiere in Upgrades für mehr Einnahmen
- Dein Stand wird mit jedem Upgrade sichtbar schöner
- Passives Einkommen läuft auch wenn du nicht klickst

### Steuerung
| Aktion | Eingabe |
|--------|---------|
| Verkaufen | Klick / Tippen auf Stand |
| Upgrade kaufen | Button klicken |

### Features
- **Sofortige Belohnung** – Jeder Klick bringt sichtbares Geld
- **3 Upgrade-Kategorien**:
  - 🍋 **Produkt** – Bessere Zutaten = mehr Geld pro Klick
  - 🏪 **Stand** – Größer & schöner = mehr passives Einkommen
  - ✨ **Ambiente** – Dekoration = Multiplikatoren
- **Visueller Fortschritt** – Stand verändert sich mit Upgrades
- **Offline-Einnahmen** – Verdiene auch während du weg bist
- **Autosave** – Fortschritt wird automatisch gespeichert
- **Sommer-Atmosphäre** – Warme Farben, sanfte Animationen
- **🏆 Achievements & Records** – Lifetime-Erfolge & persönliche Bestzeiten

### Upgrade-System
| Kategorie | Beispiel-Upgrades | Effekt |
|-----------|-------------------|--------|
| Produkt | Bio-Zitronen, Premium Zucker, Eiswürfel | Mehr € pro Klick |
| Stand | Größerer Stand, Werbeschild, Sonnenschirm | Mehr passives Einkommen |
| Ambiente | Sitzbank, Pflanzen, Musikbox, Lichterkette | Multiplikatoren |

### Achievements & Records
Das Spiel trackt deinen Fortschritt über alle Spielsitzungen hinweg:

#### 🏆 Lifetime Achievements (5 Stück)
- **🍋 First Sip** – Erste Limonade verkauft
- **💰 Sweet Profit** – $10.000 Gesamtumsatz erreicht
- **🏪 Real Business** – Lemonade-Haus freigeschaltet
- **🏙️ Lemonade Empire** – Lemonade-Hochhaus freigeschaltet
- **👑 Lemonade Tycoon** – Alle Upgrades auf Maximalstufe

#### 📊 Persönliche Records
- **Zeit bis Hochhaus** – Wie schnell hast du das Hochhaus erreicht?
- **Zeit bis Maxed** – Wie lange bis alle Upgrades maximal?
- **Lifetime Earnings** – Gesamtumsatz über alle Spielsitzungen
- **Lifetime Clicks** – Gesamtzahl aller Klicks
- **Total Play Time** – Deine akkumulierte Spielzeit

#### Reset-Optionen
- **🔄 Spiel zurücksetzen** – Startet das Spiel neu, **behält aber Achievements**
- **🗑️ Alles zurücksetzen** – Komplett von vorne, inklusive Achievements & Records

> 💡 **Philosophie:** Achievements sind eine ruhige Anerkennung deines Fortschritts – ohne Druck, ohne Vergleich mit anderen. Sie gehören nur dir.

---

## 🔐 Admin-Bereich

### Login-URL
```
http://localhost:3000/admin/login
```

### Standard-Zugangsdaten
| Feld     | Wert                    |
|----------|-------------------------|
| E-Mail   | `admin@spielbar.at`   |
| Passwort | `admin123`              |

> ⚠️ **Wichtig:** Ändere das Passwort in der Produktion!

### Admin-Funktionen

Nach dem Login hast du Zugriff auf:

- **Dashboard** (`/admin`) – Übersicht & Statistiken
- **Spiele verwalten** (`/admin/games`) – Spiele anlegen, bearbeiten, sortieren
- **News verwalten** (`/admin/news`) – News-Beiträge erstellen & veröffentlichen

---

## 📁 Projekt-Struktur (relevant)

```
src/
├── app/
│   ├── page.tsx                          # Startseite (Plattform-Übersicht)
│   ├── games/
│   │   ├── [slug]/page.tsx               # Dynamische Spielseiten
│   │   ├── minesweeper/daily/page.tsx    # Daily Minesweeper Page (Minesweeper)
│   │   └── sudoku/daily/page.tsx         # Daily Sudoku Page
│   ├── news/                             # News-Bereich
│   ├── admin/                            # Admin-CMS
│   └── api/
│       ├── daily/route.ts                # Daily Board API (Minesweeper/Sudoku je nach Routing)
│       ├── admin/                        # Admin APIs
│       └── auth/                         # NextAuth
├── games/
│   ├── index.ts                          # zentrale Exporte für Spiele
│   ├── minesweeper/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   ├── sudoku/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   ├── snake/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   ├── stacktower/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   └── lemonadestand/
│       ├── components/
│       ├── hooks/
│       └── types/
├── components/
│   ├── platform/                         # Plattform-Komponenten (Cards etc.)
│   └── admin/                            # Admin-UI Komponenten
└── lib/
    ├── prisma.ts                         # Datenbank-Client
    └── auth.ts                           # Authentifizierung
```

---

## 🎮 Neues Spiel hinzufügen

### 1. Spiel implementieren
Lege das Spiel unter `src/games/<slug>/...` an (analog zu `snake/` oder `stacktower/`).

### 2. Exporte ergänzen
In `src/games/index.ts` exportieren.

### 3. Rendering-Mapping ergänzen
In `src/app/games/[slug]/page.tsx` die Komponente importieren und im Mapping hinzufügen.

### 4. Im Admin anlegen
1. Gehe zu `/admin/games/new`
2. Fülle das Formular aus
3. Bei "Game Component" den Namen eingeben (z.B. `Tetris`)
4. Thumbnail hochladen unter `/public/games/`

---

## 🗄️ Datenbank

Das Projekt verwendet **Prisma** mit **SQLite**.

```bash
# Frischer Clone / neues Environment:
# 1) DB exakt aus Repo-Migrationen herstellen
npx prisma migrate deploy

# 2) Optional: Seed laden
npm run db:seed

# 3) Lokale News als versionierte Seed-Daten exportieren
# (vor Commit/Push ausführen)
npm run news:export

# Prisma Studio (Datenbank-GUI)
npm run db:studio

# Neue Migration in der Entwicklung erstellen
npx prisma migrate dev --name <kurze-beschreibung>

# Prisma Client neu generieren (falls nötig)
npx prisma generate
```

### Migrations-Regeln (wichtig)

- Migrationen in `prisma/migrations/` sind die Quelle der Wahrheit.
- Für Setup von Mensch/Agent immer zuerst `npx prisma migrate deploy`.
- Keine Schema-Änderungen nur mit `db push` einspielen, wenn sie versioniert sein sollen.
- Bei einem komplett frischen lokalen Start kann `prisma/dev.db` gelöscht und danach `npx prisma migrate deploy` erneut ausgeführt werden.

### News von lokal nach Prod übernehmen

Lokale News liegen in deiner SQLite-DB und sind per `.gitignore` nicht im Repo.
Damit News beim Push in Prod ankommen:

1. News lokal im Admin veröffentlichen (`/admin/news`)
2. `npm run news:export` ausführen
3. Die Datei `prisma/seed-data/news.json` committen und pushen
4. In Prod `npx prisma migrate deploy && npm run db:seed` ausführen

`db:seed` spielt die News aus `prisma/seed-data/news.json` idempotent per Upsert ein.

### Datenbank-Modelle

- **User** – Admin-Benutzer
- **Game** – Spiele-Katalog
- **News** – News/Updates
- **DailyBoard** / **DailyAttempt** – Daily Minesweeper
- **SudokuDaily** (oder analoges Modell) – Daily Sudoku (je nach Schema)
