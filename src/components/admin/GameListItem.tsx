'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Game } from '@prisma/client';

interface GameListItemProps {
  game: Game;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  published: { label: 'Veröffentlicht', className: 'bg-emerald-100 text-emerald-800' },
  draft: { label: 'Entwurf', className: 'bg-zinc-100 text-zinc-600' },
  coming_soon: { label: 'Coming Soon', className: 'bg-blue-100 text-blue-800' },
};

export function GameListItem({ game }: GameListItemProps) {
  const router = useRouter();
  const status = statusLabels[game.status] || statusLabels.draft;

  const handleToggleFeatured = async () => {
    await fetch(`/api/admin/games/${game.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !game.featured }),
    });
    router.refresh();
  };

  const handleToggleStatus = async () => {
    const newStatus = game.status === 'published' ? 'draft' : 'published';
    await fetch(`/api/admin/games/${game.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  };

  return (
    <tr className="hover:bg-zinc-50">
      <td className="px-4 py-3">
        <span className="text-zinc-500 text-sm">{game.sortOrder}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
            {game.thumbnail ? (
              <img
                src={game.thumbnail}
                alt={game.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                🎮
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-zinc-900">{game.name}</p>
            <p className="text-xs text-zinc-500">/games/{game.slug}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleToggleStatus}
          className={`px-2 py-1 text-xs font-medium rounded-full ${status.className}`}
        >
          {status.label}
        </button>
      </td>
      <td className="px-4 py-3">
        {game.badge ? (
          <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
            {game.badge}
          </span>
        ) : (
          <span className="text-zinc-400 text-sm">-</span>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleToggleFeatured}
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            game.featured
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          {game.featured ? '⭐ Featured' : 'Nicht featured'}
        </button>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/games/${game.slug}`}
            target="_blank"
            className="px-3 py-1 text-sm text-zinc-600 hover:text-zinc-900"
          >
            Ansehen
          </Link>
          <Link
            href={`/admin/games/${game.id}`}
            className="px-3 py-1 text-sm bg-zinc-100 text-zinc-700 rounded hover:bg-zinc-200"
          >
            Bearbeiten
          </Link>
        </div>
      </td>
    </tr>
  );
}

