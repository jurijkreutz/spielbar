'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Game } from '@prisma/client';

type GameWithHomeFeatured = Game & { homeFeatured?: boolean };

interface GameFormProps {
  game?: GameWithHomeFeatured;
}

const badges = ['Neu', 'Beliebt', 'Beta', 'Coming soon'];
const statuses = [
  { value: 'published', label: 'Veröffentlicht' },
  { value: 'draft', label: 'Entwurf' },
  { value: 'coming_soon', label: 'Coming Soon' },
];

export function GameForm({ game }: GameFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: game?.name || '',
    slug: game?.slug || '',
    shortDescription: game?.shortDescription || '',
    longDescription: game?.longDescription || '',
    thumbnail: game?.thumbnail || '',
    status: game?.status || 'draft',
    badge: game?.badge || '',
    featured: game?.featured || false,
    homeFeatured: game?.homeFeatured || false,
    sortOrder: game?.sortOrder || 0,
    gameComponent: game?.gameComponent || '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[äö]/g, (m) => ({ ä: 'ae', ö: 'oe' }[m] || m))
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = game ? `/api/admin/games/${game.id}` : '/api/admin/games';
      const method = game ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sortOrder: Number(formData.sortOrder),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Speichern');
      }

      router.push('/admin/games');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={() => !formData.slug && generateSlug()}
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
            required
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            URL-Slug *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
              required
            />
            <button
              type="button"
              onClick={generateSlug}
              className="px-3 py-2 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200"
            >
              Generieren
            </button>
          </div>
          <p className="mt-1 text-xs text-zinc-500">/games/{formData.slug}</p>
        </div>

        {/* Short Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Kurzbeschreibung * (max. 120 Zeichen)
          </label>
          <input
            type="text"
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleChange}
            maxLength={120}
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
            required
          />
          <p className="mt-1 text-xs text-zinc-500">
            {formData.shortDescription.length}/120 Zeichen
          </p>
        </div>

        {/* Long Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Langbeschreibung
          </label>
          <textarea
            name="longDescription"
            value={formData.longDescription}
            onChange={handleChange}
            rows={6}
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
          />
        </div>

        {/* Thumbnail URL */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Thumbnail URL
          </label>
          <input
            type="text"
            name="thumbnail"
            value={formData.thumbnail}
            onChange={handleChange}
            placeholder="/games/minesweeper.svg"
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
          />
        </div>

        {/* Game Component */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Game Component *
          </label>
          <input
            type="text"
            name="gameComponent"
            value={formData.gameComponent}
            onChange={handleChange}
            placeholder="Minesweeper"
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
            required
          />
          <p className="mt-1 text-xs text-zinc-500">
            Name der React-Komponente (muss im Code existieren)
          </p>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Badge */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Badge
          </label>
          <select
            name="badge"
            value={formData.badge}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
          >
            <option value="">Kein Badge</option>
            {badges.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Reihenfolge
          </label>
          <input
            type="number"
            name="sortOrder"
            value={formData.sortOrder}
            onChange={handleChange}
            min={0}
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
          />
        </div>

        {/* Featured */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="featured"
            id="featured"
            checked={formData.featured}
            onChange={handleChange}
            className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
          />
          <label htmlFor="featured" className="text-sm font-medium text-zinc-700">
            Als Featured markieren
          </label>
        </div>

        {/* Home Featured (Empfohlen) */}
        <div className="flex items-center gap-3 md:col-span-2">
          <input
            type="checkbox"
            name="homeFeatured"
            id="homeFeatured"
            checked={formData.homeFeatured}
            onChange={handleChange}
            className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
          />
          <div>
            <label htmlFor="homeFeatured" className="text-sm font-medium text-zinc-700">
              Empfohlen (Startseite)
            </label>
            <p className="text-xs text-zinc-500">
              Es kann nur ein Spiel als „Empfohlen“ auf der Startseite ausgewählt sein.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-zinc-200">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Wird gespeichert...' : game ? 'Speichern' : 'Anlegen'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 text-zinc-700 font-medium hover:text-zinc-900"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
