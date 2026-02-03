import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDailyBoard, getTodayDateString } from '@/games/minesweeper/lib/dailyBoard';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date') || getTodayDateString();
  const playerId = searchParams.get('playerId');

  try {
    // Check if board exists for this date
    let dailyBoard = await prisma.dailyBoard.findUnique({
      where: { date },
    });

    // If not, generate it
    if (!dailyBoard) {
      const generated = generateDailyBoard(date);

      dailyBoard = await prisma.dailyBoard.create({
        data: {
          date,
          seed: generated.seed,
          rows: generated.rows,
          cols: generated.cols,
          mines: generated.mines,
          minePositions: JSON.stringify(generated.minePositions),
          difficulty: generated.difficulty,
          verified: true,
        },
      });
    }

    // Check if player has an attempt
    let attempt = null;
    if (playerId) {
      attempt = await prisma.dailyAttempt.findUnique({
        where: {
          date_playerId: {
            date,
            playerId,
          },
        },
      });
    }

    // Parse mine positions
    const minePositions = JSON.parse(dailyBoard.minePositions) as [number, number][];

    return NextResponse.json({
      date: dailyBoard.date,
      rows: dailyBoard.rows,
      cols: dailyBoard.cols,
      mines: dailyBoard.mines,
      minePositions,
      difficulty: dailyBoard.difficulty,
      verified: dailyBoard.verified,
      attempt: attempt ? {
        completed: attempt.completed,
        won: attempt.won,
        time: attempt.time,
        moves: attempt.moves,
        usedHints: attempt.usedHints,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching daily board:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden des Daily Boards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { date, playerId, completed, won, time, moves, usedHints } = data;

    if (!date || !playerId) {
      return NextResponse.json(
        { error: 'date und playerId sind erforderlich' },
        { status: 400 }
      );
    }

    // Check if board exists
    const dailyBoard = await prisma.dailyBoard.findUnique({
      where: { date },
    });

    if (!dailyBoard) {
      return NextResponse.json(
        { error: 'Daily Board nicht gefunden' },
        { status: 404 }
      );
    }

    // Upsert attempt
    const attempt = await prisma.dailyAttempt.upsert({
      where: {
        date_playerId: {
          date,
          playerId,
        },
      },
      create: {
        date,
        playerId,
        completed: completed || false,
        won: won || false,
        time: time || null,
        moves: moves || null,
        usedHints: usedHints || false,
        completedAt: completed ? new Date() : null,
      },
      update: {
        completed: completed || false,
        won: won || false,
        time: time || null,
        moves: moves || null,
        usedHints: usedHints || false,
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
        usedHints: attempt.usedHints,
      },
    });
  } catch (error) {
    console.error('Error saving daily attempt:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern des Versuchs' },
      { status: 500 }
    );
  }
}

