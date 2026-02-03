import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { GameCard } from '@/components/platform/GameCard';
import { NewsCard } from '@/components/platform/NewsCard';
import { RandomBadge } from '@/components/RandomBadge';

export const metadata = {
  title: 'Spielbar | Österreichische Casual-Browsergames',
  description: 'Fokussierte Browsergames – ohne Ablenkung, ohne Overhead. Einfach spielen.',
};

export default async function Home() {
  const games = await prisma.game.findMany({
    where: { status: 'published' },
    orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }],
  });

  const news = await prisma.news.findMany({
    where: { status: 'published' },
    orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
    take: 3,
  });

  const featuredGame = games.find((g) => g.featured);

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Hero / Above the fold */}
      <section className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative inline-block">
                <img
                  src="/spielbar.png"
                  alt="Spielbar"
                  className="h-16 md:h-20"
                />
                <div className="absolute -top-2 -right-6 md:-right-8 transform rotate-12">
                  <RandomBadge />
                </div>
              </div>
            </div>
            <p className="mt-4 text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto">
              Fokussierte Browsergames – ohne Ablenkung, ohne Overhead. Einfach spielen.
            </p>
          </div>

          {/* Featured Game */}
          {featuredGame && (
            <div className="mt-12">
              <div className="bg-gradient-to-br from-zinc-100 to-zinc-50 rounded-2xl p-6 md:p-8 border border-zinc-200">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-full md:w-1/3">
                    <div className="aspect-video bg-zinc-200 rounded-xl overflow-hidden">
                      {featuredGame.thumbnail ? (
                        <img
                          src={featuredGame.thumbnail}
                          alt={featuredGame.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          <span className="text-4xl">🎮</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      {featuredGame.badge && (
                        <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                          {featuredGame.badge}
                        </span>
                      )}
                      <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                        Featured
                      </span>
                    </div>
                    <h2 className="mt-3 text-2xl md:text-3xl font-bold text-zinc-900">
                      {featuredGame.name}
                    </h2>
                    <p className="mt-2 text-zinc-600">
                      {featuredGame.shortDescription}
                    </p>
                    <Link
                      href={`/games/${featuredGame.slug}`}
                      className="inline-flex mt-6 px-6 py-3 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      Jetzt spielen
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Games Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-zinc-900 mb-8">Alle Spiele</h2>
          {games.length === 0 ? (
            <p className="text-zinc-600">Noch keine Spiele verfügbar.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
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

      {/* About Section */}
      <section className="py-16 border-t border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">
            Über Spielbar
          </h2>
          <p className="text-zinc-600 leading-relaxed">
            Spielbar ist eine österreichische Plattform für simple, gut gemachte
            Browsergames. Wir glauben an fokussiertes Spielerlebnis ohne Ablenkung –
            hochwertig, clean und auf den Punkt. Keine Werbung, kein Overhead.
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
