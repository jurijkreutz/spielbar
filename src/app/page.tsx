import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { GameCard } from '@/components/platform/GameCard';
import { NewsCard } from '@/components/platform/NewsCard';
import { DailyCard } from '@/components/platform/DailyCard';
import { LandingTracker } from '@/components/platform/LandingTracker';
import { PlayTodayButton } from '@/components/platform/PlayTodayButton';
import { WeeklyProgress } from '@/components/platform/WeeklyProgress';
import { ContinueModule } from '@/components/platform/ContinueModule';
import { TrackedLink } from '@/components/platform/TrackedLink';

export const metadata = {
  title: 'Spielbar | Browsergames. Sofort spielbar.',
  description: 'Keine Downloads, kein Login, kein Setup. Klick – und du bist drin. Klassiker, Daily-Rätsel und kurze Games für zwischendurch.',
};

export default async function Home() {
  const games = await prisma.game.findMany({
    where: { status: 'published' },
    orderBy: [{ homeFeatured: 'desc' }, { featured: 'desc' }, { sortOrder: 'asc' }],
  });

  const news = await prisma.news.findMany({
    where: { status: 'published' },
    orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
    take: 3,
  });

  const featuredGame = games.find((g) => g.homeFeatured) || games.find((g) => g.featured);

  const quickFlowSlugs = new Set(['stack-tower', 'lemonadestand']);
  const classicGames = games.filter((game) => !quickFlowSlugs.has(game.slug));
  const quickFlowGames = games.filter((game) => quickFlowSlugs.has(game.slug));
  const continueAssets = games.map((game) => ({
    slug: game.slug,
    thumbnail: game.thumbnail,
    continueBackground: (game as { continueBackground?: string | null }).continueBackground || null,
  }));

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Analytics Tracker */}
      <LandingTracker />

      {/* Hero / Above the fold */}
      <section className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img
                src="/spielbar.png"
                alt="Spielbar"
                className="h-14 md:h-16"
              />
            </div>

            {/* Headline + Subline (Ticket 1.1) */}
            <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 mb-4">
              Browsergames. Sofort spielbar.
            </h1>
            <p className="text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto mb-2">
              Keine Downloads, kein Login. Ein Klick – und du bist drin.
            </p>

            {/* Primary + Secondary CTA (Ticket 1.2) */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <PlayTodayButton
                href="/games/minesweeper/daily"
                className="px-8 py-4 bg-zinc-900 text-white text-lg font-semibold rounded-xl hover:bg-zinc-800 transition-colors shadow-lg hover:shadow-xl"
              >
                Daily spielen
              </PlayTodayButton>
              <a
                href="#alle-spiele"
                className="px-6 py-3 text-zinc-600 font-medium hover:text-zinc-900 transition-colors"
              >
                Alle Spiele ansehen ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Challenges Section (Ticket 2.1 - oben, vor Featured) */}
      <section className="py-12 bg-gradient-to-br from-amber-50 via-white to-blue-50 border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-zinc-900">
                Daily
              </h2>
              <p className="mt-2 text-zinc-600">
                Zwei tägliche Rätsel – für alle gleich.
              </p>
            </div>
            <WeeklyProgress className="w-full md:w-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <DailyCard game="minesweeper" />
            <DailyCard game="sudoku" />
          </div>
        </div>
      </section>

      {/* Featured Game Section (Ticket 2.2) */}
      {featuredGame && (
        <section className="py-16 bg-gradient-to-b from-amber-50 via-white to-white border-b border-zinc-200">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-10">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-amber-100 text-amber-800 rounded-full mb-3">
                ⭐ Empfehlung der Redaktion
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-zinc-900">
                Der Limonaden-Klicker
              </h2>
            </div>

            <div className="max-w-5xl mx-auto">
              <TrackedLink
                href={`/games/${featuredGame.slug}`}
                tracking={{ type: 'featured_card_click', slug: featuredGame.slug }}
                className="group block"
              >
                <div className="relative bg-white rounded-3xl shadow-xl shadow-zinc-200/50 overflow-hidden border border-zinc-100 hover:shadow-2xl hover:shadow-zinc-300/50 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex flex-col lg:flex-row">
                    {/* Großes Thumbnail */}
                    <div className="relative lg:w-1/2 aspect-[4/3] lg:aspect-auto">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-500/20"></div>
                      {featuredGame.thumbnail ? (
                        <img
                          src={featuredGame.thumbnail}
                          alt={featuredGame.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                          <span className="text-6xl">🎮</span>
                        </div>
                      )}
                      {featuredGame.badge && (
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1.5 text-sm font-semibold bg-amber-400 text-amber-900 rounded-full shadow-lg">
                            {featuredGame.badge}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="lg:w-1/2 p-8 md:p-10 flex flex-col justify-center">
                      <h3 className="text-3xl md:text-4xl font-bold text-zinc-900 group-hover:text-amber-600 transition-colors">
                        {featuredGame.name}
                      </h3>
                      <p className="mt-4 text-lg text-zinc-600 leading-relaxed">
                        {featuredGame.shortDescription}
                      </p>
                      <div className="mt-8">
                        <span className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white font-medium rounded-xl group-hover:bg-amber-500 group-hover:text-amber-900 transition-colors">
                          Jetzt spielen
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TrackedLink>
            </div>
          </div>
        </section>
      )}

      {/* Games Grid (Ticket 2.1 - unten) */}
      <section id="alle-spiele" className="py-16 scroll-mt-8">
        <div className="max-w-6xl mx-auto px-4 space-y-12">
          <ContinueModule assets={continueAssets} />
          {games.length === 0 ? (
            <p className="text-zinc-600">Noch keine Spiele verfügbar.</p>
          ) : (
            <>
              {classicGames.length > 0 && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-zinc-900">Klassiker</h2>
                    <p className="mt-2 text-zinc-600">Sofort verständlich. Immer gut.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classicGames.map((game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                </div>
              )}
              {quickFlowGames.length > 0 && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-zinc-900">Kurz &amp; Flow</h2>
                    <p className="mt-2 text-zinc-600">Eine Runde geht immer.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quickFlowGames.map((game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* News Section */}
      {news.length > 0 && (
        <section className="py-16 bg-white border-t border-zinc-200">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-zinc-900">Neuigkeiten</h2>
              <Link
                href="/news"
                className="text-zinc-600 hover:text-zinc-900 font-medium"
              >
                Alle News →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {news.map((item) => (
                <NewsCard key={item.id} news={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section (Ticket 5.1) */}
      <section className="py-16 border-t border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">
            Was ist Spielbar?
          </h2>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Spielbar ist eine Plattform für Browsergames, die ohne Umwege funktionieren.
            Du kannst sofort loslegen – ohne Downloads, ohne Account, ohne nervigen Overhead.
          </p>
          <p className="text-sm text-zinc-400">
            Gemacht für kurze Pausen: ein Spiel starten, abschalten, weiter.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-zinc-900 text-zinc-400">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p>© {new Date().getFullYear()} Spielbar. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </main>
  );
}
