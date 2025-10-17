// src/app/api/move/route.ts (JAVÍTOTT VERZIÓ)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isFinished = searchParams.get('isFinished');
    
    const where: any = {};
    
    if (isFinished !== null) {
      where.isFinished = isFinished === 'true';
    }
    
    const moves = await prisma.move.findMany({
      where,
      include: {
        item: {
          include: {
            model: true
          }
        },
        moveFromRoom: true,
        moveToRoom: true,
        moveFromToolbook: true,
        moveToToolbook: true,
        createdBy: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(moves);
  } catch (error) {
    console.error('GET /api/move error:', error);
    return NextResponse.json({ error: 'Lekérési hiba' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            itemId,
            moveFromRoomId,
            moveFromToolbookId,
            moveToRoomId,
            moveToToolbookId,
            description
        } = body;

        // Validáció
        if (!itemId) {
            return NextResponse.json({ error: 'Item ID kötelező' }, { status: 400 });
        }

        if (!moveToRoomId && !moveToToolbookId) {
            return NextResponse.json({ error: 'Legalább egy cél megadása kötelező' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.appUserId;

        if (!userId) {
            return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });
        }

        // Ellenőrizzük, hogy létezik-e az item
        const item = await prisma.item.findUnique({
            where: { id: itemId }
        });

        if (!item) {
            return NextResponse.json({ error: 'Az eszköz nem található' }, { status: 404 });
        }

        // CSAK A MOZGATÁSI KÉRELEM LÉTREHOZÁSA - NEM változtatunk semmit az ItemPlace-ben vagy ToolbookItem-ben!
        const move = await prisma.move.create({
            data: {
                itemId,
                moveFromRoomId,
                moveFromToolbookId,
                moveToRoomId,
                moveToToolbookId,
                description,
                createdById: userId,
                isFinished: false // Alapértelmezetten false!
            }
        });

        return NextResponse.json(move, { status: 201 });

    } catch (error) {
        console.error('POST /api/move error:', error);
        return NextResponse.json({ 
            error: 'Mozgatási hiba: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba')
        }, { status: 500 });
    }
}