import Link from 'next/link';
import type { Game } from '@prisma/client';
import { GAME_DESCRIPTIONS } from '@/lib/gameDescriptions';

interface GameCardProps {
  game: Game;
  showLongDescription?: boolean;
}

const badgeColors: Record<string, string> = {
  'Neu': 'bg-blue-100 text-blue-800',
  'Beliebt': 'bg-amber-100 text-amber-800',
  'Beta': 'bg-purple-100 text-purple-800',
  'Coming soon': 'bg-zinc-100 text-zinc-600',
};

export function GameCard({ game, showLongDescription = false }: GameCardProps) {
  // Get description from our constants, fallback to database value
  const descriptions = GAME_DESCRIPTIONS[game.slug];
  const shortDesc = descriptions?.short || game.shortDescription;
  const longDesc = descriptions?.long || game.longDescription;

  return (
    <div className="flex flex-col">
      <Link
        href={`/games/${game.slug}`}
        className="group block bg-white rounded-xl border border-zinc-200 overflow-hidden hover:border-zinc-300 hover:shadow-lg transition-all flex-1"
      >
        <div className="aspect-video bg-zinc-100 overflow-hidden">
          {game.thumbnail ? (
            <img
              src={game.thumbnail}
              alt={game.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-300">
              <span className="text-5xl">🎮</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {game.badge && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badgeColors[game.badge] || 'bg-zinc-100 text-zinc-600'}`}>
                {game.badge}
              </span>
            )}
            {game.featured && (
              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                Featured
              </span>
            )}
          </div>
          <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-700">
            {game.name}
          </h3>
          <p className="mt-1 text-sm text-zinc-600 line-clamp-2">
            {shortDesc}
          </p>
          <div className="mt-4">
            <span className="text-sm font-medium text-zinc-900 group-hover:text-zinc-700">
              Spielen →
            </span>
          </div>
        </div>
      </Link>
      {/* Long description below card (Ticket 6) */}
      {showLongDescription && longDesc && (
        <p className="mt-3 text-sm text-zinc-500 leading-relaxed px-1">
          {longDesc}
        </p>
      )}
    </div>
  );
}
