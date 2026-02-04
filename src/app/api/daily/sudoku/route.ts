import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDailySudoku, getTodayDateString } from '@/games/sudoku/lib/sudokuGenerator';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date') || getTodayDateString();
  const playerId = searchParams.get('playerId');

  try {
    // Check if board exists for this date
    let dailyBoard = await prisma.dailySudokuBoard.findUnique({
      where: { date },
    });

    // If not, generate it
    if (!dailyBoard) {
      const generated = generateDailySudoku(date);

      dailyBoard = await prisma.dailySudokuBoard.create({
        data: {
          date,
          seed: generated.seed,
          puzzle: JSON.stringify(generated.puzzle),
          solution: JSON.stringify(generated.solution),
          difficulty: generated.difficulty,
        },
      });
    }

    // Check if player has an attempt
    let attempt = null;
    if (playerId) {
      attempt = await prisma.dailySudokuAttempt.findUnique({
        where: {
          date_playerId: {
            date,
            playerId,
          },
        },
      });
    }

    // Parse puzzle
    const puzzle = JSON.parse(dailyBoard.puzzle) as number[][];

    return NextResponse.json({
      date: dailyBoard.date,
      puzzle,
      difficulty: dailyBoard.difficulty,
      attempt: attempt ? {
        completed: attempt.completed,
        won: attempt.won,
        time: attempt.time,
        moves: attempt.moves,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching daily sudoku:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden des Daily Sudoku' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { date, playerId, completed, won, time, moves } = data;

    if (!date || !playerId) {
      return NextResponse.json(
        { error: 'date und playerId sind erforderlich' },
        { status: 400 }
      );
    }

    // Check if board exists
    const dailyBoard = await prisma.dailySudokuBoard.findUnique({
      where: { date },
    });

    if (!dailyBoard) {
      return NextResponse.json(
        { error: 'Daily Sudoku nicht gefunden' },
        { status: 404 }
      );
    }

    // Upsert attempt
    const attempt = await prisma.dailySudokuAttempt.upsert({
      where: {
        date_playerId: {
          date,
          playerId,
        },
      },
      update: {
        completed,
        won,
        time,
        moves,
        completedAt: completed ? new Date() : null,
      },
      create: {
        date,
        playerId,
        completed,
        won,
        time,
        moves,
        completedAt: completed ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      attempt: {
        completed: attempt.completed,
        won: attempt.won,
        time: attempt.time,
        moves: attempt.moves,
      },
    });
  } catch (error) {
    console.error('Error saving daily sudoku attempt:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern des Versuchs' },
      { status: 500 }
    );
  }
}

