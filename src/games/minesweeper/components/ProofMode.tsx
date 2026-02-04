'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { CellState } from '../types/minesweeper';
import { analyzeMistake, type ProofResult } from '../lib/proofSolver';

type PostGameAnalysisProps = {
  board: CellState[][];
  gameState: 'won' | 'lost';
  explodedCell?: [number, number];
  time: number;
  usedProofHint: boolean;
  onClose: () => void;
  onNewGame: () => void;
  isDaily?: boolean;
};

export function PostGameAnalysis({
  board,
  gameState,
  explodedCell,
  time,
  usedProofHint,
  onClose,
  onNewGame,
  isDaily = false,
}: PostGameAnalysisProps) {
  const analysis = useMemo(() => {
    if (gameState === 'lost' && explodedCell) {
      return analyzeMistake(board, explodedCell[0], explodedCell[1]);
    }
    return null;
  }, [board, gameState, explodedCell]);


  const isSkillVerified = gameState === 'won' && !usedProofHint;

  // Ticket 4.1 - Konsistente Endstate Messages
  const endMessage = gameState === 'won'
    ? 'Nice. Runde geschafft.'
    : 'Runde vorbei.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-zinc-200">
        {/* Header */}
        <div className="text-center mb-4">
          {gameState === 'won' ? (
            <>
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-xl font-bold text-zinc-800">{endMessage}</h2>
              <p className="text-zinc-500 text-sm mt-1">
                Zeit: <span className="font-mono font-bold">{time}s</span>
              </p>
              {isSkillVerified && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <span>✓</span>
                  <span>Skill-Verified Run</span>
                </div>
              )}
              {usedProofHint && (
                <p className="mt-2 text-xs text-zinc-400">
                  Proof-Hilfe wurde genutzt – kein Skill-Verified Run
                </p>
              )}
            </>
          ) : (
            <>
              <div className="text-4xl mb-2">💥</div>
              <h2 className="text-xl font-bold text-zinc-800">{endMessage}</h2>
              <p className="text-zinc-500 text-sm mt-1">
                Zeit: <span className="font-mono font-bold">{time}s</span>
              </p>
            </>
          )}
        </div>

        {/* Analysis for lost games */}
        {gameState === 'lost' && analysis && (
          <div className="mb-6 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-2">
              <span>🔍</span>
              <span>Analyse</span>
            </h3>

            {/* Was it a guess situation? */}
            <div className={`p-3 rounded-lg mb-3 ${
              analysis.wasGuessRequired 
                ? 'bg-amber-50 border border-amber-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {analysis.wasGuessRequired ? (
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    🎲 Guess-Situation
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    An diesem Punkt war ein Raten notwendig. Pech gehabt!
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-red-800">
                    ❌ Logischer Fehler
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Es gab einen sicheren Zug, der übersehen wurde.
                  </p>
                </div>
              )}
            </div>

            {/* Explanation */}
            <p className="text-sm text-zinc-600 leading-relaxed">
              {analysis.explanation}
            </p>

            {/* Show the safe move if there was one */}
            {analysis.lastSafeMove && !analysis.wasGuessRequired && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs font-medium text-green-800">
                  💡 Verpasster Zug:
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {analysis.lastSafeMove.type === 'safe'
                    ? `Feld (${analysis.lastSafeMove.row + 1}, ${analysis.lastSafeMove.col + 1}) war sicher.`
                    : `Feld (${analysis.lastSafeMove.row + 1}, ${analysis.lastSafeMove.col + 1}) war eine Mine.`
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions (Ticket 4.1 - Konsistente Buttons) */}
        <div className="flex flex-col gap-3">
          {/* Nochmal (Primary) */}
          {!isDaily && (
            <button
              onClick={onNewGame}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Nochmal
            </button>
          )}

          {/* Nächstes Spiel */}
          <Link
            href="/"
            className="w-full px-4 py-3 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors text-center"
          >
            Alle Spiele
          </Link>

          {/* Daily spielen (nur wenn nicht im Daily) */}
          {!isDaily && (
            <Link
              href="/games/minesweeper/daily"
              className="w-full px-4 py-2.5 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors text-center"
            >
              Heute: Daily spielen
            </Link>
          )}
        </div>

        {/* Keyboard hint */}
        {!isDaily && (
          <p className="mt-4 text-xs text-zinc-400 text-center">
            Drücke <kbd className="px-1.5 py-0.5 bg-zinc-100 rounded text-xs">R</kbd> für Neustart
          </p>
        )}
      </div>
    </div>
  );
}

type ProofHintProps = {
  proof: ProofResult;
  onClose: () => void;
};

export function ProofHint({ proof, onClose }: ProofHintProps) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72">
      <div className="bg-zinc-800 text-white rounded-lg shadow-xl p-4 relative">
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-800" />

        {/* Content */}
        <div className="flex items-start gap-3">
          <div className="text-xl">
            {proof.type === 'safe' ? '✅' : '🚩'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-300 mb-1">
              {proof.type === 'safe' ? 'Sicheres Feld' : 'Mine gefunden'}
            </p>
            <p className="text-sm leading-relaxed">
              {proof.reason}
            </p>
            <p className="text-xs text-zinc-400 mt-2">
              Position: ({proof.row + 1}, {proof.col + 1})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

