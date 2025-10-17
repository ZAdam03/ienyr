// src/app/api/move/[id]/approve/route.ts
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
      where: { id },
      include: {
        item: true
      }
    });

    if (!move) {
      return NextResponse.json({ error: 'A mozgatás nem található' }, { status: 404 });
    }

    if (move.isFinished) {
      return NextResponse.json({ error: 'A mozgatás már el lett fogadva' }, { status: 400 });
    }

    // Tranzakcióban végrehajtjuk a műveleteket
    const result = await prisma.$transaction(async (tx) => {
        // 1. ESZKÖZ STÁTUSZ FRISSÍTÉSE - csak ha "új" státuszú
        if (move.item.status === 'új') {
            await tx.item.update({
                where: { id: move.itemId },
                data: {
                    status: 'aktív'
                }
            });
        }

        // 1. Régi helyek inaktiválása
        if (move.moveFromRoomId) {
            await tx.itemPlace.updateMany({
                where: {
                    itemId: move.itemId,
                    isActive: true,
                    roomId: move.moveFromRoomId
                },
                data: {
                    isActive: false,
                    deactivatedAt: new Date(),
                    deactivatedById: userId
                }
            });
        }

        // 2. Régi toolbook inaktiválása
        if (move.moveFromToolbookId) {
            await tx.toolbookItem.updateMany({
                where: {
                    itemId: move.itemId,
                    isActive: true,
                    toolbookId: move.moveFromToolbookId
                },
                data: {
                    isActive: false,
                    deactivedAt: new Date(),
                    deactivedById: userId
                }
            });
        }

        // 3. Új hely létrehozása (ha van megadva)
        if (move.moveToRoomId) {
            await tx.itemPlace.create({
                data: {
                    itemId: move.itemId,
                    roomId: move.moveToRoomId,
                    isStored: true,
                    isActive: true,
                    createdById: userId
                }
            });
        }

        // 4. Új toolbook létrehozása (ha van megadva)
        if (move.moveToToolbookId) {
            await tx.toolbookItem.create({
                data: {
                    itemId: move.itemId,
                    toolbookId: move.moveToToolbookId,
                    isActive: true,
                    createdById: userId
                }
            });
        }

        // 5. Mozgatás státusz frissítése
        const updatedMove = await tx.move.update({
            where: { id },
            data: {
                isFinished: true,
                closedAt: new Date(),
                closedById: userId
            },
            include: {
                item: {
                    include: {
                    model: true
                    }
                },
                moveFromRoom: true,
                moveToRoom: true,
                moveFromToolbook: true,
                moveToToolbook: true
            }
        });

        return updatedMove;
    });

    return NextResponse.json({
        message: 'Mozgatás sikeresen jóváhagyva',
        move: result
    });

  } catch (error) {
        console.error('POST /api/move/[id]/approve error:', error);
        return NextResponse.json({ 
            error: 'Jóváhagyási hiba: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba')
        }, { status: 500 });
    }
}