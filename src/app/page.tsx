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
import { RandomBadge } from '@/components/RandomBadge';
import { HeroParallax } from '@/components/platform/HeroParallax';
import SiteFooter from '@/components/platform/SiteFooter';

export const dynamic = 'force-dynamic';


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

  const quickFlowSlugs = new Set(['stack-tower', 'lemonadestand', 'brick-breaker']);
  const classicGames = games.filter((game) => !quickFlowSlugs.has(game.slug));
  const quickFlowGames = games.filter((game) => quickFlowSlugs.has(game.slug));
  const continueAssets = games.map((game) => ({
    slug: game.slug,
    thumbnail: game.thumbnail,
    continueBackground: (game as { continueBackground?: string | null }).continueBackground || null,
  }));

  return (
    <main className="min-h-screen bg-white">
      {/* Analytics Tracker */}
      <LandingTracker />

      {/* Hero / Above the fold */}
      <section className="bg-white border-b border-zinc-100 hero-surface">
        <HeroParallax />
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative inline-flex items-center">
                <img
                  src="/spielbar.png"
                  alt="Spielbar"
                  className="h-14 md:h-16"
                />
                <div className="absolute -top-3 -right-10 md:-right-12 rotate-12">
                  <RandomBadge />
                </div>
              </div>
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
                className="primary-cta px-8 py-4 text-lg font-semibold rounded-xl"
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
      <section className="section-tint section-daily pt-12 pb-6 md:pt-14 md:pb-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-end gap-4 md:gap-6 mb-8 md:mb-10">
            <div className="text-left max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-900/70">
                Zwei tägliche Rätsel – für alle gleich.
              </p>
              <h2 className="mt-2 text-2xl md:text-3xl font-bold text-zinc-900">
                Heute
              </h2>
            </div>
            <WeeklyProgress className="w-full sm:w-auto md:justify-self-end" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <DailyCard game="minesweeper" />
            <DailyCard game="sudoku" />
          </div>
        </div>
      </section>

      {/* Featured Game Section (Ticket 2.2) */}
      {featuredGame && (
        <>
          <div className="premium-divider" aria-hidden="true" />
          <section className="section-tint section-featured pt-10 pb-20 md:pt-12 md:pb-24">
            <div className="max-w-6xl mx-auto px-4">
              <div className="mb-10 md:mb-12 text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-900/70">
                  Empfohlen
                </p>
                <h2 className="mt-3 text-2xl md:text-3xl font-bold text-zinc-900">
                  Der Limonaden-Klicker
                </h2>
              </div>

              <div className="w-full">
                <TrackedLink
                  href={`/games/${featuredGame.slug}`}
                  tracking={{ type: 'featured_card_click', slug: featuredGame.slug }}
                  className="group block"
                >
                  <div className="spotlight-card relative bg-white rounded-3xl overflow-hidden">
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
                          <span className="primary-cta inline-flex items-center gap-2 px-6 py-3 font-medium rounded-xl">
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
        </>
      )}

      {/* Games Grid (Ticket 2.1 - unten) */}
      <section id="alle-spiele" className="py-16 bg-white border-t border-zinc-100 scroll-mt-8">
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
        <section className="py-16 bg-white border-t border-zinc-100">
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
      <section className="py-16 border-t border-zinc-100">
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
      <SiteFooter />
    </main>
  );
}
