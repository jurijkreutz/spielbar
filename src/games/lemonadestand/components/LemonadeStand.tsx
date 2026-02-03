'use client';

import { useRef, useState, useEffect } from 'react';
import { useLemonadeStand } from '../hooks/useLemonadeStand';
import { useAchievements } from '../hooks/useAchievements';
import { UPGRADES } from '../types/lemonadestand';
import { AchievementsPopup, AchievementToast } from './AchievementsPopup';

export function LemonadeStand() {
  const {
    gameState,
    stats,
    customers,
    floatingMoney,
    offlineEarnings,
    isLoaded,
    handleClick,
    purchaseUpgrade,
    getUpgradeLevel,
    getUpgradeCost,
    canAfford,
    dismissOfflineEarnings,
    resetGame,
  } = useLemonadeStand();

  const {
    achievements,
    records,
    isUnlocked,
    checkAchievements,
    newlyUnlocked,
    dismissNotification,
    isLoaded: achievementsLoaded,
    resetAchievements,
  } = useAchievements();

  const [selectedCategory, setSelectedCategory] = useState<
    'product' | 'stand' | 'ambiance' | 'all'
  >('all');
  const [achievementsOpen, setAchievementsOpen] = useState(false);

  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Combined reset function for achievements and game
  const handleCompleteReset = () => {
    resetAchievements();
    resetGame();
  };

  // Check achievements whenever game state changes
  useEffect(() => {
    if (!isLoaded || !achievementsLoaded) return;

    checkAchievements({
      totalClicks: gameState.totalClicks,
      totalEarned: gameState.totalEarned,
      upgrades: gameState.upgrades,
      totalPlayTime: gameState.totalPlayTime,
    });
  }, [
    isLoaded,
    achievementsLoaded,
    gameState.totalClicks,
    gameState.totalEarned,
    gameState.upgrades,
    gameState.totalPlayTime,
    checkAchievements,
  ]);

  // Format money
  const formatMoney = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(0);
  };

  // Handle click on game area
  const handleGameAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameAreaRef.current) {
      const rect = gameAreaRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      handleClick(x, y);
    }
  };

  const filteredUpgrades =
    selectedCategory === 'all'
      ? UPGRADES
      : UPGRADES.filter((u) => u.category === selectedCategory);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-sky-400 to-sky-200">
        <div className="text-2xl text-white">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-b from-sky-400 to-sky-200">
      {/* Achievement Toast */}
      <AchievementToast
        achievementId={newlyUnlocked}
        onDismiss={dismissNotification}
      />

      {/* Achievements Popup */}
      <AchievementsPopup
        isOpen={achievementsOpen}
        onClose={() => setAchievementsOpen(false)}
        achievements={achievements}
        records={records}
        isUnlocked={isUnlocked}
        onReset={handleCompleteReset}
      />

      {/* Offline Earnings Modal */}
      {offlineEarnings !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-lg p-8 shadow-2xl max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-yellow-600">
              Willkommen zurück!
            </h2>
            <p className="text-lg mb-4 text-gray-700">
              Während du weg warst, hast du verdient:
            </p>
            <p className="text-4xl font-bold text-green-600 mb-6">
              ${formatMoney(offlineEarnings)}
            </p>
            <button
              onClick={dismissOfflineEarnings}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Super!
            </button>
          </div>
        </div>
      )}

      {/* Game Area */}
      <div className="flex-1 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Stats Header */}
          <div className="bg-white/90 rounded-lg shadow-lg p-4 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                <div>
                  <div className="text-sm text-gray-600">Geld</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    ${formatMoney(gameState.money)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Pro Klick</div>
                  <div className="text-xl font-bold text-green-600">
                    +${stats.clickValue}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Pro Sekunde</div>
                  <div className="text-xl font-bold text-blue-600">
                    +${stats.idleIncome.toFixed(1)}/s
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Multiplikator</div>
                  <div className="text-xl font-bold text-purple-600">
                    x{stats.multiplier.toFixed(2)}
                  </div>
                </div>
              </div>
              {/* Achievements Button */}
              <button
                onClick={() => setAchievementsOpen(true)}
                className="flex-shrink-0 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-white font-bold py-2 px-4 rounded-lg shadow transition flex items-center gap-2"
                title="Erfolge & Records"
              >
                <span className="text-xl">🏆</span>
                <span className="hidden sm:inline">{achievements.length}/5</span>
              </button>
            </div>
          </div>

          {/* Main Game Area */}
          <div
            ref={gameAreaRef}
            onClick={handleGameAreaClick}
            className="relative bg-gradient-to-b from-sky-300 to-green-300 rounded-lg shadow-lg overflow-hidden cursor-pointer select-none"
            style={{ height: '500px' }}
          >
            {/* Background - Sky */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: 'url(/games/lemonadestand/bg_sky.png)',
              }}
            />

            {/* Green mid layer (fills area behind flowers so they don't look like floating) */}
            <div
              className="absolute left-0 right-0"
              style={{
                bottom: '15px',
                height: '100px',
                background: 'linear-gradient(#36cd4f, #44a554f2)',
              }}
            />

            {/* Sun */}
            <img
              src="/games/lemonadestand/sun.png"
              alt="Sun"
              className="absolute top-4 right-4 w-32 h-32 animate-pulse drop-shadow-lg"
            />

            {/* Background - Grass */}
            <div
              className="absolute left-0 right-0 h-40 bg-repeat-x bg-bottom"
              style={{
                bottom: '-25px',
                backgroundImage: 'url(/games/lemonadestand/bg_grass1.png)',
                backgroundSize: 'auto 100%',
              }}
            />

            {/* Lemonade Stand - Changes based on upgrades */}
            {(() => {
              const standLevel = getUpgradeLevel('bigger-stand');

              // Alle Stände werden auf derselben Grundlinie positioniert (bottom: 24px vom Game-Bereich).
              // Die Höhe bestimmt, wie weit sie nach oben ragen.
              // Größere Stände = größere Höhen, aber gleiche Bodenposition.
              const commonStyle: React.CSSProperties = {
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: '24px',
                width: 'auto',
                objectFit: 'contain',
                imageRendering: 'auto',
                maxWidth: '95%',
              };

              if (standLevel >= 5) {
                return (
                  <img
                    src="/games/lemonadestand/stand_highrise.png"
                    alt="Highrise Stand"
                    className="drop-shadow-lg"
                    style={{
                      ...commonStyle,
                      height: '508px',
                    }}
                  />
                );
              } else if (standLevel >= 4) {
                return (
                  <img
                    src="/games/lemonadestand/stand_extraextralarge.png"
                    alt="Extra Extra Large Stand"
                    className="drop-shadow-lg"
                    style={{
                      ...commonStyle,
                      height: '360px',
                    }}
                  />
                );
              } else if (standLevel >= 3) {
                return (
                  <img
                    src="/games/lemonadestand/stand_extralarge.png"
                    alt="Extra Large Stand"
                    className="drop-shadow-lg"
                    style={{
                      ...commonStyle,
                      height: '340px',
                    }}
                  />
                );
              } else if (standLevel >= 2) {
                return (
                  <img
                    src="/games/lemonadestand/stand_large.png"
                    alt="Large Stand"
                    className="drop-shadow-lg"
                    style={{
                      ...commonStyle,
                      height: '320px',
                    }}
                  />
                );
              } else if (standLevel >= 1) {
                return (
                  <img
                    src="/games/lemonadestand/stand_medium.png"
                    alt="Medium Stand"
                    className="drop-shadow-lg"
                    style={{
                      ...commonStyle,
                      height: '300px',
                    }}
                  />
                );
              } else {
                return (
                  <img
                    src="/games/lemonadestand/stand_small.png"
                    alt="Small Stand"
                    className="drop-shadow-lg"
                    style={{
                      ...commonStyle,
                      height: '280px',
                    }}
                  />
                );
              }
            })()}

            {/* Sonnenschirm - Shows when upgraded, above the stand */}
            {getUpgradeLevel('sun-umbrella') > 0 && (
              <img
                src="/games/lemonadestand/umbrella.png"
                alt="Umbrella"
                className="absolute drop-shadow-lg"
                style={{
                  // Hinter der Sitzbank platzieren (Sitzbank steht rechts unten).
                  // Wichtig: zIndex < Bench, damit die Bank davor bleibt.
                  height: '220px',
                  width: 'auto',
                  bottom: '24px',
                  right: '-32px',
                  zIndex: 1,
                }}
              />
            )}

            {/* Werbeschild - Shows when upgraded, left side */}
            {getUpgradeLevel('sign') > 0 && (
              <img
                src="/games/lemonadestand/sign.png"
                alt="Sign"
                className="absolute drop-shadow-lg"
                style={{
                  height: '160px',
                  width: 'auto',
                  left: '1%',
                  bottom: '81px',
                }}
              />
            )}

            {/* Zapfanlage/Dispenser - Shows when upgraded, right side of stand */}
            {getUpgradeLevel('dispenser') > 0 && (
              <img
                src="/games/lemonadestand/dispenser.png"
                alt="Dispenser"
                className="absolute drop-shadow-lg"
                style={{
                  height: '120px',
                  width: 'auto',
                  bottom: '24px',
                  right: '31%',
                }}
              />
            )}

            {/* Bench - Shows when upgraded */}
            {getUpgradeLevel('bench') > 0 && (
              <img
                src="/games/lemonadestand/bench.png"
                alt="Bench"
                className="absolute bottom-6 right-4 drop-shadow-lg"
                style={{ height: '160px', width: 'auto', zIndex: 2 }}
              />
            )}

            {/* Plants - Shows when upgraded */}
            {getUpgradeLevel('plants') > 0 && (
              <img
                src="/games/lemonadestand/plants.png"
                alt="Plants"
                className="absolute bottom-6 left-4 drop-shadow-lg"
                style={{ height: '140px', width: 'auto', zIndex: 10 }}
              />
            )}

            {/* Music Box - Shows when upgraded, positioned on the bench */}
            {getUpgradeLevel('music-box') > 0 && (
              <img
                src="/games/lemonadestand/musicbox.png"
                alt="Music Box"
                className="absolute drop-shadow-lg"
                style={{
                  height: '125px',
                  width: 'auto',
                  top: '382px',
                  right: '108px',
                  zIndex: 3,
                }}
              />
            )}

            {/* Fairy Lights - Shows when upgraded */}
            {getUpgradeLevel('fairy-lights') > 0 && (
              <img
                src="/games/lemonadestand/fairylights.png"
                alt="Fairy Lights"
                className="absolute left-1/2 transform -translate-x-1/2 opacity-90"
                style={{
                  width: '217px',
                  height: 'auto',
                  top: (() => {
                    const standLevel = getUpgradeLevel('bigger-stand');
                    if (standLevel >= 5) return '50px';
                    if (standLevel >= 4) return '232px';
                    if (standLevel === 3) return '215px';
                    if (standLevel === 2) return '213px';
                    if (standLevel === 1) return '224px';
                    return '234px';
                  })(),
                }}
              />
            )}


            {/* Customers - Animated */}
            {customers.map((customer, index) => (
              <div
                key={customer.id}
                className="absolute bottom-8 transition-all duration-300"
                style={{
                  left: `${customer.x}px`,
                  opacity: customer.opacity,
                }}
              >
                <img
                  src={`/games/lemonadestand/customer_${(index % 6) + 1}.png`}
                  alt="Customer"
                  className="drop-shadow-lg"
                  style={{ height: '240px', width: 'auto' }}
                />
              </div>
            ))}

            {/* Floating Money */}
            {floatingMoney.map((money) => (
              <div
                key={money.id}
                className="absolute text-2xl font-bold text-green-600 pointer-events-none"
                style={{
                  left: `${money.x}%`,
                  top: `${money.y}%`,
                  opacity: money.opacity,
                  textShadow: '0 0 4px white',
                }}
              >
                +${money.amount}
              </div>
            ))}

            {/* Click Hint */}
            <div
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-lg"
              style={{ zIndex: 100 }}
            >
               🖱️ Klicke, um Limonade zu verkaufen!
             </div>
          </div>

          {/* Stats */}
          <div className="mt-4 bg-white/90 rounded-lg shadow-lg p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Gesamt verdient:</span>{' '}
                <span className="font-bold">${formatMoney(gameState.totalEarned)}</span>
              </div>
              <div>
                <span className="text-gray-600">Klicks:</span>{' '}
                <span className="font-bold">{gameState.totalClicks}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrades Panel */}
      <div className="w-full lg:w-96 bg-white shadow-lg overflow-y-auto">
        <div className="p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold mb-4 text-yellow-600">🏪 Upgrades</h2>

          {/* Category Filter */}
          <div className="flex gap-2 mb-4">
            {(
              [
                { id: 'all', label: 'Alle', emoji: '📦' },
                { id: 'product', label: 'Produkt', emoji: '🍋' },
                { id: 'stand', label: 'Stand', emoji: '🏪' },
                { id: 'ambiance', label: 'Ambiente', emoji: '✨' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  selectedCategory === cat.id
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-3">
          {filteredUpgrades.map((upgrade) => {
            const level = getUpgradeLevel(upgrade.id);
            const cost = getUpgradeCost(upgrade.id, level);
            const affordable = canAfford(upgrade.id);
            const maxed = level >= upgrade.maxLevel;

            return (
              <div
                key={upgrade.id}
                className={`p-4 rounded-lg border-2 transition ${
                  maxed
                    ? 'bg-gray-100 border-gray-300'
                    : affordable
                      ? 'bg-green-50 border-green-300 hover:bg-green-100'
                      : 'bg-white border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-4xl flex-shrink-0">
                    {upgrade.icon.startsWith('/') || upgrade.icon.startsWith('http') ? (
                      <img
                        src={upgrade.icon}
                        alt={upgrade.name}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <span>{upgrade.icon}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">{upgrade.name}</h3>
                      <div className="text-xs text-gray-500">
                        Level {level}/{upgrade.maxLevel}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{upgrade.description}</p>
                    <div className="text-sm text-blue-600 mb-2">
                      {upgrade.effect.type === 'clickValue' && (
                        <>+{upgrade.effect.value} pro Klick</>
                      )}
                      {upgrade.effect.type === 'idleIncome' && (
                        <>+{upgrade.effect.value}/s passiv</>
                      )}
                      {upgrade.effect.type === 'multiplier' && (
                        <>+{(upgrade.effect.value * 100).toFixed(0)}% Multiplikator</>
                      )}
                    </div>
                    {!maxed && (
                      <button
                        onClick={() => purchaseUpgrade(upgrade.id)}
                        disabled={!affordable}
                        className={`w-full py-2 px-4 rounded-lg font-bold transition ${
                          affordable
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Kaufen: ${formatMoney(cost)}
                      </button>
                    )}
                    {maxed && (
                      <div className="text-center py-2 text-green-600 font-bold">
                        ✓ Maximum erreicht
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reset Button */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={() => {
              if (confirm('Wirklich zurücksetzen? Alle Fortschritte gehen verloren!')) {
                resetGame();
              }
            }}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            🔄 Spiel zurücksetzen
          </button>
        </div>
      </div>
    </div>
  );
}
