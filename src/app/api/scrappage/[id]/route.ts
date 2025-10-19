// FILE: /src/app/api/scrappage/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const body = await request.json();
    const { isFinished } = body;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.appUserId;

    if (!userId) {
        return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });
    }

    try {
        // Selejtezés befejezése
        const scrappage = await prisma.scrappage.update({
            where: { id: params.id },
            data: {
                isFinished: true,
                closedAt: new Date(),
                closedById: userId
            },
            include: {
                item: true
            }
        });

        // ItemPlace deaktiválása
        await prisma.itemPlace.updateMany({
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

        // ToolbookItem deaktiválása
        await prisma.toolbookItem.updateMany({
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

        // StructureMapping deaktiválása
        await prisma.structureMapping.updateMany({
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

        return NextResponse.json(scrappage);
    } catch (error) {
        console.error(`PATCH /api/scrappage/${params.id} error:`, error);
        return NextResponse.json({ error: 'Selejtezés befejezési hiba' }, { status: 500 });
    }
}