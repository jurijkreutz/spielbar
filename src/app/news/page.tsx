import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { NewsCard } from '@/components/platform/NewsCard';
import SiteFooter from '@/components/platform/SiteFooter';

export const metadata = {
  title: 'News | Spielbar',
  description: 'Neuigkeiten, Updates und Release Notes von Spielbar',
};

export default async function NewsPage() {
  const news = await prisma.news.findMany({
    where: { status: 'published' },
    orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
  });

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-zinc-600 hover:text-zinc-900 font-medium flex items-center gap-2"
            >
              ← Zurück zur Startseite
            </Link>
            <Link href="/" className="flex items-center">
              <img
                src="/spielbar.png"
                alt="Spielbar"
                className="h-8"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">Neuigkeiten</h1>

          {news.length === 0 ? (
            <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center">
              <p className="text-zinc-600">Noch keine News vorhanden.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {news.map((item) => (
                <NewsCard key={item.id} news={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </main>
  );
}
