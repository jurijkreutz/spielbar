'use client';

import { FormEvent, useState } from 'react';

const MIN_PASSWORD_LENGTH = 8;

interface PasswordResponse {
  error?: string;
  message?: string;
}

export default function AdminPasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(
        `Das neue Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Die neuen Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | PasswordResponse
        | null;

      if (!response.ok) {
        setError(result?.error || 'Passwort konnte nicht geändert werden.');
        return;
      }

      setSuccess(result?.message || 'Passwort erfolgreich geändert.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Es ist ein Fehler aufgetreten. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h4 className="text-base font-semibold text-zinc-900">Admin-Passwort ändern</h4>
      <p className="mt-1 text-sm text-zinc-500">
        Mindestlänge: {MIN_PASSWORD_LENGTH} Zeichen
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <div>
          <label
            htmlFor="currentPassword"
            className="mb-1 block text-sm font-medium text-zinc-700"
          >
            Aktuelles Passwort
          </label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-zinc-900"
            placeholder="••••••••"
            required
          />
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="mb-1 block text-sm font-medium text-zinc-700"
          >
            Neues Passwort
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-zinc-900"
            placeholder="••••••••"
            required
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1 block text-sm font-medium text-zinc-700"
          >
            Neues Passwort bestätigen
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-zinc-900"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 py-3 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Wird gespeichert...' : 'Passwort aktualisieren'}
        </button>
      </form>
    </div>
  );
}
