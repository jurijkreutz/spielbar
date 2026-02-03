'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { News } from '@prisma/client';

interface NewsFormProps {
  news?: News;
}

export function NewsForm({ news }: NewsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: news?.title || '',
    slug: news?.slug || '',
    teaser: news?.teaser || '',
    content: news?.content || '',
    thumbnail: news?.thumbnail || '',
    status: news?.status || 'draft',
    pinned: news?.pinned || false,
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
    const slug = formData.title
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
      const url = news ? `/api/admin/news/${news.id}` : '/api/admin/news';
      const method = news ? 'PATCH' : 'POST';

      const submitData = {
        ...formData,
        publishedAt: formData.status === 'published' && !news?.publishedAt
          ? new Date().toISOString()
          : news?.publishedAt,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Speichern');
      }

      router.push('/admin/news');
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
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Titel *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            onBlur={() => !formData.slug && generateSlug()}
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
            required
          />
        </div>

        {/* Slug */}
        <div className="md:col-span-2">
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
          <p className="mt-1 text-xs text-zinc-500">/news/{formData.slug}</p>
        </div>

        {/* Teaser */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Teaser (max. 200 Zeichen)
          </label>
          <input
            type="text"
            name="teaser"
            value={formData.teaser}
            onChange={handleChange}
            maxLength={200}
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
          />
          <p className="mt-1 text-xs text-zinc-500">
            {formData.teaser.length}/200 Zeichen
          </p>
        </div>

        {/* Content */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Inhalt *
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={12}
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none font-mono text-sm"
            required
          />
          <p className="mt-1 text-xs text-zinc-500">
            Einfaches Markdown: # Überschrift, ## Unterüberschrift, - Liste, *kursiv*
          </p>
        </div>

        {/* Thumbnail URL */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Bild URL (optional)
          </label>
          <input
            type="text"
            name="thumbnail"
            value={formData.thumbnail}
            onChange={handleChange}
            placeholder="/news/bild.png"
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
          />
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
            <option value="draft">Entwurf</option>
            <option value="published">Veröffentlicht</option>
          </select>
        </div>

        {/* Pinned */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="pinned"
            id="pinned"
            checked={formData.pinned}
            onChange={handleChange}
            className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
          />
          <label htmlFor="pinned" className="text-sm font-medium text-zinc-700">
            Oben anpinnen
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-zinc-200">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Wird gespeichert...' : news ? 'Speichern' : 'Veröffentlichen'}
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

