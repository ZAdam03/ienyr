// src/app/api/move/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.appUserId;

    if (!userId) {
      return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });
    }

    // Mozgatás lekérése
    const move = await prisma.move.findUnique({
      where: { id }
    });

    if (!move) {
      return NextResponse.json({ error: 'A mozgatás nem található' }, { status: 404 });
    }

    if (move.isFinished) {
      return NextResponse.json({ error: 'A mozgatás már el lett fogadva' }, { status: 400 });
    }

    // Mozgatás státusz frissítése (soft delete)
    const updatedMove = await prisma.move.update({
      where: { id },
      data: {
        isFinished: true,
        closedAt: new Date(),
        closedById: userId
      }
    });

    return NextResponse.json({
      message: 'Mozgatás sikeresen elutasítva',
      move: updatedMove
    });

  } catch (error) {
    console.error('POST /api/move/[id]/reject error:', error);
    return NextResponse.json({ 
      error: 'Elutasítási hiba: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba')
    }, { status: 500 });
  }
}