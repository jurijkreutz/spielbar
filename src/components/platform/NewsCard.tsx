import Link from 'next/link';
import type { News } from '@prisma/client';

interface NewsCardProps {
  news: News;
}

export function NewsCard({ news }: NewsCardProps) {
  const formattedDate = news.publishedAt
    ? new Date(news.publishedAt).toLocaleDateString('de-AT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <Link
      href={`/news/${news.slug}`}
      className="group block bg-white rounded-xl border border-zinc-200 p-5 hover:border-zinc-300 hover:shadow-md transition-all"
    >
      {news.pinned && (
        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full mb-3">
          📌 Angepinnt
        </span>
      )}
      <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-700 line-clamp-2">
        {news.title}
      </h3>
      {news.teaser && (
        <p className="mt-2 text-sm text-zinc-600 line-clamp-2">{news.teaser}</p>
      )}
      {formattedDate && (
        <p className="mt-3 text-xs text-zinc-400">{formattedDate}</p>
      )}
    </Link>
  );
}

