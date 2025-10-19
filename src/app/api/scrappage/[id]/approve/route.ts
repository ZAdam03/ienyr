// FILE: /src/app/api/scrappage/[id]/approve/route.ts
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

        // Selejtezés lekérése
        const scrappage = await prisma.scrappage.findUnique({
            where: { id },
            include: {
                item: true
            }
        });

        if (!scrappage) {
            return NextResponse.json({ error: 'A selejtezés nem található' }, { status: 404 });
        }

        if (scrappage.isFinished) {
            return NextResponse.json({ error: 'A selejtezés már el lett fogadva' }, { status: 400 });
        }

        // Tranzakcióban végrehajtjuk a selejtezési műveleteket
        const result = await prisma.$transaction(async (tx) => {
            // 1. Item státusz frissítése selejtezett-re
            await tx.item.update({
                where: { id: scrappage.itemId },
                data: {
                    status: 'selejtezett'
                }
            });

            // 2. ItemPlace deaktiválása
            await tx.itemPlace.updateMany({
                where: { 
                    itemId: scrappage.itemId,
                    isActive: true
                },
                data: {
                    isActive: false,
                    deactivatedAt: new Date(),
                    deactivatedById: userId
                }
            });

            // 3. ToolbookItem deaktiválása
            await tx.toolbookItem.updateMany({
                where: { 
                    itemId: scrappage.itemId,
                    isActive: true
                },
                data: {
                    isActive: false,
                    deactivedAt: new Date(),
                    deactivedById: userId
                }
            });

            // 4. StructureMapping deaktiválása
            await tx.structureMapping.updateMany({
                where: {
                    OR: [
                        { parentItemId: scrappage.itemId },
                        { childItemId: scrappage.itemId }
                    ],
                    isActive: true
                },
                data: {
                    isActive: false,
                    deactivatedAt: new Date(),
                    deactivatedById: userId
                }
            });

            // 5. Selejtezés státusz frissítése
            const updatedScrappage = await tx.scrappage.update({
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
                    createdBy: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            return updatedScrappage;
        });

        return NextResponse.json({
            message: 'Selejtezés sikeresen jóváhagyva',
            scrappage: result
        });

    } catch (error) {
        console.error('POST /api/scrappage/[id]/approve error:', error);
        return NextResponse.json({ 
            error: 'Jóváhagyási hiba: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba')
        }, { status: 500 });
    }
}