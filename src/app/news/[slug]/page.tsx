import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import SiteFooter from '@/components/platform/SiteFooter';

export const dynamic = 'force-dynamic';


interface NewsDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  const news = await prisma.news.findUnique({
    where: { slug },
  });

  if (!news) {
    return { title: 'News nicht gefunden | Spielbar' };
  }

  return {
    title: `${news.title} | Spielbar`,
    description: news.teaser || news.title,
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  const news = await prisma.news.findUnique({
    where: { slug, status: 'published' },
  });

  if (!news) {
    notFound();
  }

  const formattedDate = news.publishedAt
    ? new Date(news.publishedAt).toLocaleDateString('de-AT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/news"
              className="text-zinc-600 hover:text-zinc-900 font-medium flex items-center gap-2"
            >
              ← Alle News
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
      <article className="py-12">
        <div className="max-w-3xl mx-auto px-4">
          {news.pinned && (
            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full mb-4">
              📌 Angepinnt
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900">
            {news.title}
          </h1>
          {formattedDate && (
            <p className="mt-2 text-zinc-500">{formattedDate}</p>
          )}

          <div className="mt-8 prose prose-zinc max-w-none">
            {news.content.split('\n').map((line, i) => {
              if (line.startsWith('# ')) {
                return (
                  <h1 key={i} className="text-2xl font-bold text-zinc-900 mt-8 mb-4">
                    {line.slice(2)}
                  </h1>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <h2 key={i} className="text-xl font-bold text-zinc-900 mt-6 mb-3">
                    {line.slice(3)}
                  </h2>
                );
              }
              if (line.startsWith('- ')) {
                return (
                  <li key={i} className="text-zinc-600 ml-4">
                    {line.slice(2)}
                  </li>
                );
              }
              if (line.startsWith('*') && line.endsWith('*')) {
                return (
                  <p key={i} className="text-zinc-500 italic mt-4">
                    {line.slice(1, -1)}
                  </p>
                );
              }
              if (line.trim() === '') {
                return <br key={i} />;
              }
              return (
                <p key={i} className="text-zinc-600 mb-3">
                  {line}
                </p>
              );
            })}
          </div>
        </div>
      </article>

      {/* Footer */}
      <SiteFooter />
    </main>
  );
}
