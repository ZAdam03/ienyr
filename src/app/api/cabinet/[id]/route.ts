// FILE: /src/app/api/cabinet/[id]/route.ts (PATCH)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
    const body = await req.json();
    const { id: cabinetId, description, letter, isActive } = body;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.appUserId;

    if (!userId) return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });

    try {
        const updatedCabinet = await prisma.cabinet.update({
            where: { id: cabinetId },
            data: {
                description,
                letter,
                isActive,
                lastModifiedAt: new Date(),
                lastModifiedById: userId,
            },
        });

        return NextResponse.json(updatedCabinet);
    } catch (error) {
        console.error(`PATCH /api/cabinet/${cabinetId} error:`, error);
        return NextResponse.json({ error: 'Frissítési hiba' }, { status: 500 });
    }
}