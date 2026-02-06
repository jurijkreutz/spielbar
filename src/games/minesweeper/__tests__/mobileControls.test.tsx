import { render, screen, fireEvent } from '@testing-library/react';
import { Board } from '../components/Board';
import type { CellState } from '../types/minesweeper';

type Mode = 'reveal' | 'flag' | 'chord';

function buildBoard(): CellState[][] {
  return [[
    { isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0 },
    { isMine: false, isRevealed: true, isFlagged: false, adjacentMines: 1 },
  ]];
}

function TouchActionHarness({
  mode,
  onReveal,
  onFlag,
  onChord,
}: {
  mode: Mode;
  onReveal: jest.Mock;
  onFlag: jest.Mock;
  onChord: jest.Mock;
}) {
  const handlePrimary = (row: number, col: number) => {
    if (mode === 'flag') {
      onFlag(row, col);
      return;
    }
    if (mode === 'chord') {
      onChord(row, col);
      return;
    }
    onReveal(row, col);
  };

  return (
    <Board
      board={buildBoard()}
      gameState="playing"
      onCellClick={handlePrimary}
      onCellRightClick={onFlag}
      onChordClick={onChord}
    />
  );
}

describe('Minesweeper mobile controls', () => {
  it('uses flag action mode on tap without context menu', () => {
    const onReveal = jest.fn();
    const onFlag = jest.fn();
    const onChord = jest.fn();

    render(
      <TouchActionHarness
        mode="flag"
        onReveal={onReveal}
        onFlag={onFlag}
        onChord={onChord}
      />
    );

    fireEvent.click(screen.getByLabelText('Hidden cell'));

    expect(onFlag).toHaveBeenCalledWith(0, 0);
    expect(onReveal).not.toHaveBeenCalled();
    expect(onChord).not.toHaveBeenCalled();
  });

  it('uses reveal action mode on tap', () => {
    const onReveal = jest.fn();
    const onFlag = jest.fn();
    const onChord = jest.fn();

    render(
      <TouchActionHarness
        mode="reveal"
        onReveal={onReveal}
        onFlag={onFlag}
        onChord={onChord}
      />
    );

    fireEvent.click(screen.getByLabelText('Hidden cell'));

    expect(onReveal).toHaveBeenCalledWith(0, 0);
    expect(onFlag).not.toHaveBeenCalled();
    expect(onChord).not.toHaveBeenCalled();
  });

  it('uses chord action mode on tap for revealed number cells', () => {
    const onReveal = jest.fn();
    const onFlag = jest.fn();
    const onChord = jest.fn();

    render(
      <TouchActionHarness
        mode="chord"
        onReveal={onReveal}
        onFlag={onFlag}
        onChord={onChord}
      />
    );

    fireEvent.click(screen.getByLabelText('1 adjacent mines'));

    expect(onChord).toHaveBeenCalledWith(0, 1);
    expect(onReveal).not.toHaveBeenCalled();
  });
});
