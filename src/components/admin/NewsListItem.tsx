'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { News } from '@prisma/client';

interface NewsListItemProps {
  news: News;
}

export function NewsListItem({ news }: NewsListItemProps) {
  const router = useRouter();

  const formattedDate = news.publishedAt
    ? new Date(news.publishedAt).toLocaleDateString('de-AT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : new Date(news.createdAt).toLocaleDateString('de-AT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

  const handleToggleStatus = async () => {
    const newStatus = news.status === 'published' ? 'draft' : 'published';
    await fetch(`/api/admin/news/${news.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        publishedAt: newStatus === 'published' ? new Date().toISOString() : null,
      }),
    });
    router.refresh();
  };

  const handleTogglePinned = async () => {
    await fetch(`/api/admin/news/${news.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !news.pinned }),
    });
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm('News wirklich löschen?')) return;

    await fetch(`/api/admin/news/${news.id}`, {
      method: 'DELETE',
    });
    router.refresh();
  };

  return (
    <tr className="hover:bg-zinc-50">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-zinc-900 line-clamp-1">{news.title}</p>
          <p className="text-xs text-zinc-500">/news/{news.slug}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleToggleStatus}
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            news.status === 'published'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-zinc-100 text-zinc-600'
          }`}
        >
          {news.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
        </button>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-zinc-600">{formattedDate}</span>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleTogglePinned}
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            news.pinned
              ? 'bg-amber-100 text-amber-800'
              : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          {news.pinned ? '📌 Angepinnt' : 'Nicht gepinnt'}
        </button>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {news.status === 'published' && (
            <Link
              href={`/news/${news.slug}`}
              target="_blank"
              className="px-3 py-1 text-sm text-zinc-600 hover:text-zinc-900"
            >
              Ansehen
            </Link>
          )}
          <Link
            href={`/admin/news/${news.id}`}
            className="px-3 py-1 text-sm bg-zinc-100 text-zinc-700 rounded hover:bg-zinc-200"
          >
            Bearbeiten
          </Link>
          <button
            onClick={handleDelete}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
          >
            Löschen
          </button>
        </div>
      </td>
    </tr>
  );
}

