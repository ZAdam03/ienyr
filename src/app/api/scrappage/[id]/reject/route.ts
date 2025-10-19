// FILE: /src/app/api/scrappage/[id]/reject/route.ts
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
            where: { id }
        });

        if (!scrappage) {
            return NextResponse.json({ error: 'A selejtezés nem található' }, { status: 404 });
        }

        if (scrappage.isFinished) {
            return NextResponse.json({ error: 'A selejtezés már el lett fogadva' }, { status: 400 });
        }

        // Selejtezés státusz frissítése (soft delete)
        const updatedScrappage = await prisma.scrappage.update({
            where: { id },
            data: {
                isFinished: true,
                closedAt: new Date(),
                closedById: userId
            }
        });

        return NextResponse.json({
            message: 'Selejtezés sikeresen elutasítva',
            scrappage: updatedScrappage
        });

    } catch (error) {
        console.error('POST /api/scrappage/[id]/reject error:', error);
        return NextResponse.json({ 
            error: 'Elutasítási hiba: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba')
        }, { status: 500 });
    }
}