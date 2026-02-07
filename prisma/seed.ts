import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const prisma = new PrismaClient();

interface SeedNewsEntry {
  slug: string;
  title: string;
  teaser?: string | null;
  content: string;
  thumbnail?: string | null;
  status?: string;
  pinned?: boolean;
  publishedAt?: string | null;
}

const DEFAULT_SEED_NEWS: SeedNewsEntry[] = [
  {
    slug: 'willkommen-auf-spielbar',
    title: 'Willkommen auf Spielbar!',
    teaser: 'Unsere neue Plattform für österreichische Casual-Browsergames ist online.',
    content: `# Willkommen auf Spielbar!

Wir freuen uns, euch unsere neue Plattform für simple, hochwertige Browsergames vorzustellen.

## Was ist Spielbar?

Spielbar ist eine Sammlung von fokussierten, gut gemachten Casual-Games – ohne Ablenkung, ohne Overhead. Einfach spielen.

## Unser erstes Spiel: Minesweeper

Zum Start haben wir den Klassiker Minesweeper komplett neu gebaut:
- Modernes, cleanes Design
- Proof-Mode für verifizierte Skill-Runs
- Intelligente Analyse bei Game Over

Weitere Spiele sind bereits in Entwicklung. Schaut regelmäßig vorbei!

*Euer Spielbar-Team*`,
    status: 'published',
    pinned: true,
    publishedAt: new Date().toISOString(),
  },
];

const DEFAULT_ADMIN_EMAIL = 'admin@spielbar.at';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

function parseSeedNews(raw: unknown): SeedNewsEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .map((entry) => ({
      slug: typeof entry.slug === 'string' ? entry.slug : '',
      title: typeof entry.title === 'string' ? entry.title : '',
      teaser: typeof entry.teaser === 'string' ? entry.teaser : null,
      content: typeof entry.content === 'string' ? entry.content : '',
      thumbnail: typeof entry.thumbnail === 'string' ? entry.thumbnail : null,
      status: typeof entry.status === 'string' ? entry.status : 'draft',
      pinned: entry.pinned === true,
      publishedAt: typeof entry.publishedAt === 'string' ? entry.publishedAt : null,
    }))
    .filter((entry) => entry.slug && entry.title && entry.content);
}

async function loadSeedNews(): Promise<SeedNewsEntry[]> {
  const filePath = path.join(process.cwd(), 'prisma', 'seed-data', 'news.json');

  try {
    const fileContent = await readFile(filePath, 'utf8');
    const parsed = parseSeedNews(JSON.parse(fileContent));

    if (parsed.length === 0) {
      return DEFAULT_SEED_NEWS;
    }

    return parsed;
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'ENOENT'
    ) {
      return DEFAULT_SEED_NEWS;
    }

    console.warn('⚠️ Konnte prisma/seed-data/news.json nicht laden, nutze Default-News');
    return DEFAULT_SEED_NEWS;
  }
}

function getInitialAdminPassword(): string {
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (typeof password === 'string' && password.length > 0) {
    return password;
  }
  return DEFAULT_ADMIN_PASSWORD;
}

async function main() {

  try {
    // Admin User erstellen
    const existingAdmin = await prisma.user.findUnique({
      where: { email: DEFAULT_ADMIN_EMAIL },
      select: { email: true },
    });

    if (!existingAdmin) {
      const initialAdminPassword = getInitialAdminPassword();
      const hashedPassword = await bcrypt.hash(initialAdminPassword, 12);

      const admin = await prisma.user.create({
        data: {
          email: DEFAULT_ADMIN_EMAIL,
          password: hashedPassword,
          name: 'Admin',
        },
      });

      console.log('✅ Admin user created:', admin.email);

      if (!process.env.ADMIN_INITIAL_PASSWORD) {
        console.warn(
          '⚠️ ADMIN_INITIAL_PASSWORD ist nicht gesetzt. Es wurde das Standardpasswort verwendet.'
        );
      }
    } else {
      console.log('ℹ️ Admin user exists, password unchanged:', existingAdmin.email);
    }

    // Minesweeper als erstes Spiel
    const minesweeper = await prisma.game.upsert({
      where: { slug: 'minesweeper' },
      update: {},
      create: {
        name: 'Minesweeper',
        slug: 'minesweeper',
        shortDescription: 'Der Klassiker neu gedacht. Logik, Risiko und schnelle Entscheidungen.',
        longDescription: `Minesweeper ist ein zeitloser Puzzle-Klassiker, bei dem es darum geht, alle sicheren Felder aufzudecken, ohne eine Mine zu erwischen.

Nutze die Zahlen als Hinweise: Jede Zahl zeigt an, wie viele Minen in den angrenzenden Feldern versteckt sind. Mit Logik und manchmal etwas Mut findest du deinen Weg durch das Minenfeld.

**Features:**
- Klassisches Gameplay mit modernem Design
- Proof-Mode für verifizierte Skill-Runs
- Analyse bei Game Over: War es Pech oder ein Fehler?`,
        thumbnail: '/games/minesweeper.svg',
        status: 'published',
        badge: 'Beliebt',
        featured: true,
        sortOrder: 1,
        gameComponent: 'Minesweeper',
      },
    });

    console.log('✅ Game created:', minesweeper.name);

    // Stack Tower als zweites Spiel
    const stackTower = await prisma.game.upsert({
      where: { slug: 'stack-tower' },
      update: {},
      create: {
        name: 'Stack Tower',
        slug: 'stack-tower',
        shortDescription: 'Stapele Blöcke zu einem immer höheren Turm. Präzision wird belohnt.',
        longDescription: `Stack Tower ist das perfekte Flow-Game: ruhig, präzise und hochgradig befriedigend.

Stapele horizontale Plattformen zu einem immer höheren Turm. Jede neue Plattform bewegt sich seitlich – mit einem Klick lässt du sie fallen. Alles, was nicht perfekt überlappt, wird sauber abgeschnitten.

**Gameplay:**
- Einfach zu verstehen, schwer zu meistern
- Perfekte Treffer werden mit Bonuspunkten belohnt
- Geschwindigkeit steigt langsam aber stetig
- Kein Zufall – jeder Fehler ist dein Fehler

**Das Gefühl:**
- Minimalistisch und meditativ
- Jeder Zug fühlt sich kontrolliert an
- "Nur noch eine Runde" garantiert`,
        thumbnail: '/games/stacktower.svg',
        status: 'published',
        badge: 'Neu',
        featured: true,
        sortOrder: 2,
        gameComponent: 'StackTower',
      },
    });

    console.log('✅ Game created:', stackTower.name);

    // Snake als drittes Spiel
    const snake = await prisma.game.upsert({
      where: { slug: 'snake' },
      update: {},
      create: {
        name: 'Snake',
        slug: 'snake',
        shortDescription: 'Der Arcade-Klassiker in modernem Design. Schnell, smooth und süchtig machend.',
        longDescription: `Snake, wie es 2026 hätte erfunden werden müssen. Klassisches Gameplay, modernes Feeling.

Die Schlange bewegt sich kontinuierlich – sammle Nahrung, werde länger, werde schneller. Kollidiere nicht mit dir selbst oder dem Rand.

**Features:**
- Butterweiche Steuerung mit Input-Queue
- Combo-System für aggressive Spieler
- Special Items für taktische Tiefe
- Dynamisches Spielfeld mit Parallax-Effekt

**Special Items:**
- ⏱ Slow Motion – kurzzeitig langsamer
- 👻 Ghost Mode – durch dich selbst hindurch
- ✨ Double Points – doppelte Punkte
- 📏 Shrink – kürze deine Schlange

**Das Gefühl:**
- "One more run" garantiert
- Instant Restart – kein Menü-Overhead
- Polished und final`,
        thumbnail: '/games/snake.svg',
        status: 'published',
        badge: 'Neu',
        featured: true,
        sortOrder: 3,
        gameComponent: 'Snake',
      },
    });

    console.log('✅ Game created:', snake.name);

    // Lemonade Stand als viertes Spiel
    const lemonadeStand = await prisma.game.upsert({
      where: { slug: 'lemonadestand' },
      update: {},
      create: {
        name: 'Lemonade Stand',
        slug: 'lemonadestand',
        shortDescription: 'Ein leichtes, beruhigendes Idle-Tycoon-Game – perfekt für kurze Pausen.',
        longDescription: `Lemonade Stand ist das ultimative Sommer-Feeling als Game. Entspannt, befriedigend und süchtig machend.

Starte mit einem simplen Limonadenstand und baue ihn Schritt für Schritt aus. Jeder Klick verkauft Limonade, jedes Upgrade macht deinen Stand schöner und profitabler.

**Gameplay:**
- Klicken = sofort Geld verdienen
- Upgrades sind klar und spürbar
- Passives Einkommen läuft nebenbei
- Fortschritt wird automatisch gespeichert

**Upgrade-Kategorien:**
- 🍋 Produkt – Bessere Zutaten für mehr Gewinn
- 🏪 Stand – Größer und schöner für mehr Kunden
- ✨ Ambiente – Dekoration für Multiplikatoren

**Das Gefühl:**
- Sommer, Sonne, Flow
- "Nur noch ein Upgrade" garantiert
- Perfekt für 30 Sekunden bis 5 Minuten`,
        thumbnail: '/games/lemonadestand_thumbnail.png',
        status: 'published',
        badge: 'Neu',
        featured: true,
        sortOrder: 4,
        gameComponent: 'LemonadeStand',
      },
    });

    console.log('✅ Game created:', lemonadeStand.name);

    // Brick Breaker als sechstes Spiel
    const brickBreaker = await prisma.game.upsert({
      where: { slug: 'brick-breaker' },
      update: {},
      create: {
        name: 'Brick Breaker',
        slug: 'brick-breaker',
        shortDescription: 'Zen-Arcade Brick Breaker – präzise, ruhig, sofort im Flow.',
        longDescription: `Brick Breaker, reduziert auf das Wesentliche: ein Paddle, ein Ball, klare Patterns. Die Steuerung ist direkt, die Kollisionen fühlen sich fair an – kein Chaos, nur Flow.

**Features:**
- 5 kurze, lernbare Levels mit sanfter Steigerung
- Präzise Kollisionen und kontrollierbares Tempo
- Seltene Powerups: Multi-Ball, Wider Paddle, Slow
- Instant Restart mit Space oder Klick

**Das Gefühl:**
- Zen-Arcade statt Neon
- 60–180 Sekunden pro Run
- Noch eine Runde ohne Frust`,
        thumbnail: '/games/brickbreaker.svg',
        status: 'published',
        badge: 'Neu',
        featured: true,
        sortOrder: 6,
        gameComponent: 'BrickBreaker',
      },
    });

    console.log('✅ Game created:', brickBreaker.name);

    // Sudoku als fünftes Spiel
    const sudoku = await prisma.game.upsert({
      where: { slug: 'sudoku' },
      update: {},
      create: {
        name: 'Sudoku',
        slug: 'sudoku',
        shortDescription: 'Das klassische Zahlenrätsel – modern, klar und kompromisslos sauber.',
        longDescription: `Sudoku ist das ultimative Denkspiel – reduziert, hochwertig und meditativ.

Fülle das 9×9 Gitter so aus, dass jede Zeile, jede Spalte und jedes 3×3 Feld die Zahlen 1-9 genau einmal enthält.

**Features:**
- Perfekt ausgerichtetes, cleanes Grid
- Drei Schwierigkeitsgrade: Easy, Medium, Hard
- Daily Sudoku – jeden Tag ein neues Rätsel für alle
- Notizen-Modus für fortgeschrittene Techniken
- Dark & Light Mode

**Das Gefühl:**
- Ruhig und fokussiert
- Modern und erwachsen
- Eher "Apple-Tool" als "Mobile-Game"`,
        thumbnail: '/games/sudoku.svg',
        status: 'published',
        badge: 'Neu',
        featured: true,
        sortOrder: 5,
        gameComponent: 'Sudoku',
      },
    });

    console.log('✅ Game created:', sudoku.name);

    // News aus versionierter Seed-Datei laden und idempotent einspielen
    const seedNews = await loadSeedNews();

    for (const seedEntry of seedNews) {
      const status = seedEntry.status === 'published' ? 'published' : 'draft';
      const parsedPublishedAt = seedEntry.publishedAt ? new Date(seedEntry.publishedAt) : null;
      const publishedAt =
        parsedPublishedAt && !Number.isNaN(parsedPublishedAt.getTime())
          ? parsedPublishedAt
          : status === 'published'
            ? new Date()
            : null;

      const news = await prisma.news.upsert({
        where: { slug: seedEntry.slug },
        update: {
          title: seedEntry.title,
          teaser: seedEntry.teaser || null,
          content: seedEntry.content,
          thumbnail: seedEntry.thumbnail || null,
          status,
          pinned: seedEntry.pinned === true,
          publishedAt,
        },
        create: {
          slug: seedEntry.slug,
          title: seedEntry.title,
          teaser: seedEntry.teaser || null,
          content: seedEntry.content,
          thumbnail: seedEntry.thumbnail || null,
          status,
          pinned: seedEntry.pinned === true,
          publishedAt,
        },
      });

      console.log('✅ News synced:', news.title);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
