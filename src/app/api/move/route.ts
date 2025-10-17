// src/app/api/move/route.ts (javított verzió)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

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

        // Tranzakcióban végrehajtjuk a műveleteket
        const result = await prisma.$transaction(async (tx) => {
            // 1. Mozgatás létrehozása
            const move = await tx.move.create({
                data: {
                    itemId,
                    moveFromRoomId,
                    moveFromToolbookId,
                    moveToRoomId,
                    moveToToolbookId,
                    description,
                    createdById: userId
                }
            });

            // 2. Ha szobába mozgatunk, kezeljük az ItemPlace-t
            if (moveToRoomId) {
                // Régi aktív helyek inaktiválása
                await tx.itemPlace.updateMany({
                    where: {
                        itemId,
                        isActive: true
                    },
                    data: {
                        isActive: false,
                        deactivatedAt: new Date(),
                        deactivatedById: userId
                    }
                });

                // Új hely létrehozása
                await tx.itemPlace.create({
                    data: {
                        itemId,
                        roomId: moveToRoomId,
                        isStored: true,
                        isActive: true,
                        createdById: userId
                    }
                });
            }

            // 3. Ha toolbookba mozgatunk, kezeljük a ToolbookItem-et
            if (moveToToolbookId) {
                // Régi aktív toolbook item inaktiválása
                await tx.toolbookItem.updateMany({
                    where: {
                        itemId,
                        isActive: true
                    },
                    data: {
                        isActive: false,
                        deactivedAt: new Date(),
                        deactivedById: userId
                    }
                });

                // Új toolbook item létrehozása
                await tx.toolbookItem.create({
                    data: {
                        toolbookId: moveToToolbookId,
                        itemId,
                        isActive: true,
                        createdById: userId
                    }
                });
            }

            return move;
        });

        return NextResponse.json(result, { status: 201 });

    } catch (error) {
        console.error('POST /api/move error:', error);
        return NextResponse.json({ 
            error: 'Mozgatási hiba: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba')
        }, { status: 500 });
    }
}