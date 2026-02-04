'use client';

type NumberPadProps = {
  onNumber: (num: number) => void;
  onClear: () => void;
  onToggleNotes: () => void;
  notesMode: boolean;
  disabled: boolean;
  numberCounts: Record<number, number>; // Wie oft jede Zahl bereits platziert ist
};

export function NumberPad({
  onNumber,
  onClear,
  onToggleNotes,
  notesMode,
  disabled,
  numberCounts,
}: NumberPadProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Zahlen 1-9 */}
      <div className="grid grid-cols-9 gap-1 sm:gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
          const count = numberCounts[num] || 0;
          const isComplete = count >= 9;

          return (
            <button
              key={num}
              className={`
                relative w-8 h-10 sm:w-10 sm:h-12
                flex items-center justify-center
                text-lg sm:text-xl font-semibold
                rounded-lg
                transition-all duration-100
                ${isComplete
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-default'
                  : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-blue-50 dark:hover:bg-zinc-700 active:scale-95'
                }
                border border-zinc-200 dark:border-zinc-600
                shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-400
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => !isComplete && onNumber(num)}
              disabled={disabled || isComplete}
              aria-label={`Zahl ${num}${isComplete ? ' (vollständig)' : ''}`}
            >
              {num}
              {/* Zähler */}
              {count > 0 && count < 9 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] bg-zinc-200 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-300 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Aktionen */}
      <div className="flex gap-2 justify-center">
        <button
          className={`
            px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-100
            ${notesMode
              ? 'bg-blue-500 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }
            border border-zinc-200 dark:border-zinc-600
            focus:outline-none focus:ring-2 focus:ring-blue-400
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={onToggleNotes}
          disabled={disabled}
          aria-pressed={notesMode}
        >
          ✏️ Notizen {notesMode ? 'An' : 'Aus'}
        </button>

        <button
          className={`
            px-4 py-2 rounded-lg text-sm font-medium
            bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300
            hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400
            border border-zinc-200 dark:border-zinc-600
            transition-all duration-100
            focus:outline-none focus:ring-2 focus:ring-blue-400
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={onClear}
          disabled={disabled}
        >
          ⌫ Löschen
        </button>
      </div>
    </div>
  );
}

