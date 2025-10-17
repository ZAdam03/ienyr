// src/app/api/scrappage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { itemId, description } = body;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.appUserId;

    if (!userId) {
        return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });
    }

    try {
        // Selejtezés létrehozása
        const scrappage = await prisma.scrappage.create({
            data: {
                itemId,
                description,
                createdById: userId
            }
        });

        // Item státuszának frissítése
        await prisma.item.update({
            where: { id: itemId },
            data: {
                status: 'selejtezett'
            }
        });

        return NextResponse.json(scrappage, { status: 201 });
    } catch (error) {
        console.error('POST /api/scrappage error:', error);
        return NextResponse.json({ error: 'Selejtezési hiba' }, { status: 500 });
    }
}