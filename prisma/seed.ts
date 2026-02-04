import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {

  try {
    // Admin User erstellen
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@spielbar.at' },
      update: {},
      create: {
        email: 'admin@spielbar.at',
        password: hashedPassword,
        name: 'Admin',
      },
    });

    console.log('✅ Admin user created:', admin.email);

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

    // Willkommens-News
    const welcomeNews = await prisma.news.upsert({
      where: { slug: 'willkommen-auf-spielbar' },
      update: {},
      create: {
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
        publishedAt: new Date(),
      },
    });

    console.log('✅ News created:', welcomeNews.title);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

