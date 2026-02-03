'use client';

import { useEffect, useState } from 'react';
import { ACHIEVEMENTS, AchievementsState } from '../types/lemonadestand';
import { getAchievementDef } from '../hooks/useAchievements';

interface AchievementsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: AchievementsState['achievements'];
  records: AchievementsState['records'];
  isUnlocked: (id: string) => boolean;
  onReset: () => void;
}

function formatTime(ms: number | null): string {
  if (ms === null) return '—';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

export function AchievementsPopup({
  isOpen,
  onClose,
  achievements,
  records,
  isUnlocked,
  onReset,
}: AchievementsPopupProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (confirmReset) {
          setConfirmReset(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, confirmReset]);

  // Reset confirm state when popup closes
  useEffect(() => {
    if (!isOpen && confirmReset) {
      // Use setTimeout to avoid setting state during render
      const timer = setTimeout(() => setConfirmReset(false), 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, confirmReset]);

  if (!isOpen) return null;

  const unlockedCount = achievements.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-amber-200 bg-gradient-to-r from-amber-100 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-amber-800 flex items-center gap-2">
                🏆 Lifetime Erfolge & Statistiken
              </h2>
              <p className="text-sm text-amber-600 mt-1">
                {unlockedCount} von {totalCount} freigeschaltet ·
                <span className="italic"> im Cache gespeichert</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-amber-600 hover:text-amber-800 transition p-2 hover:bg-amber-200 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Achievements Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              ⭐ Auszeichnungen
            </h3>
            <div className="grid gap-3">
              {ACHIEVEMENTS.map((def) => {
                const unlocked = isUnlocked(def.id);
                const achievement = achievements.find((a) => a.id === def.id);
                const unlockedDate = achievement
                  ? new Date(achievement.unlockedAt).toLocaleDateString('de-AT')
                  : null;

                return (
                  <div
                    key={def.id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition ${
                      unlocked
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'
                        : 'bg-gray-100 border-2 border-gray-200 opacity-60'
                    }`}
                  >
                    <div
                      className={`text-4xl ${
                        unlocked ? '' : 'grayscale opacity-50'
                      }`}
                    >
                      {def.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">
                        {def.name}
                        {unlocked && <span className="ml-2 text-green-600">✓</span>}
                      </div>
                      <div className="text-sm text-gray-600">{def.description}</div>
                      {unlockedDate && (
                        <div className="text-xs text-green-600 mt-1">
                          Freigeschaltet am {unlockedDate}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Records Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              📊 Deine Records
            </h3>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-100">
              <div className="grid gap-4">
                {/* Time Records */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="text-xs text-gray-500 uppercase tracking-wider">
                      ⏱️ Zeit bis Hochhaus
                    </div>
                    <div className="text-xl font-bold text-blue-600 mt-1">
                      {formatTime(records.timeToHighrise)}
                    </div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="text-xs text-gray-500 uppercase tracking-wider">
                      ⏱️ Zeit bis Maxed
                    </div>
                    <div className="text-xl font-bold text-blue-600 mt-1">
                      {formatTime(records.timeToAllMaxed)}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${formatNumber(records.lifetimeEarnings)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">💸 Gesamtumsatz</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatNumber(records.lifetimeClicks)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">🖱️ Klicks</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {formatTime(records.totalPlayTime)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">📈 Spielzeit</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-amber-200 bg-amber-50/50">
          <p className="text-xs text-gray-500 text-center mb-3">
            ♾️ Deine Lifetime-Erfolge bleiben lokal gespeichert.
          </p>

          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full py-2 px-4 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex items-center justify-center gap-2"
            >
              🗑️ Alles zurücksetzen
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 text-center mb-3">
                Wirklich alle Erfolge, Records UND das Spiel zurücksetzen?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    onReset();
                    setConfirmReset(false);
                    onClose();
                  }}
                  className="flex-1 py-2 px-4 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium"
                >
                  Ja, alles löschen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Achievement unlock notification toast
interface AchievementToastProps {
  achievementId: string | null;
  onDismiss: () => void;
}

export function AchievementToast({ achievementId, onDismiss }: AchievementToastProps) {
  const def = achievementId ? getAchievementDef(achievementId) : null;

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!achievementId) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [achievementId, onDismiss]);

  if (!def) return null;

  return (
    <div
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10001] animate-bounce-in"
      onClick={onDismiss}
    >
      <div className="bg-gradient-to-r from-amber-400 to-yellow-400 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 cursor-pointer hover:scale-105 transition">
        <div className="text-4xl">{def.icon}</div>
        <div>
          <div className="text-sm font-medium opacity-90">Erfolg freigeschaltet!</div>
          <div className="text-lg font-bold">{def.name}</div>
        </div>
      </div>
    </div>
  );
}

