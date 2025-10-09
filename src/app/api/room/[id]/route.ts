// FILE: /src/app/api/room/[id]/route.ts (PATCH)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
    const body = await req.json();
    const { id: roomId, description, departmentId, number, isActive } = body;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.appUserId;

    if (!userId) return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });

    try {
        const updatedRoom = await prisma.room.update({
            where: { id: roomId },
            data: {
                description,
                departmentId,
                number,
                isActive,
                lastModifiedAt: new Date(),
                lastModifiedById: userId,
            },
        });

        return NextResponse.json(updatedRoom);
    } catch (error) {
        console.error(`PATCH /api/room/${roomId} error:`, error);
        return NextResponse.json({ error: 'Frissítési hiba' }, { status: 500 });
    }
}