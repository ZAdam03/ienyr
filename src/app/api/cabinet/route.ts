// FILE: /src/app/api/cabinet/route.ts (GET, POST)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const roomId = searchParams.get('roomId');
        
        const where = roomId ? { roomId } : {};
        
        const cabinets = await prisma.cabinet.findMany({
            where,
            include: {
                room: true,
                lastModifiedBy: { select: { name: true } },
            },
        });
        return NextResponse.json(cabinets);
    } catch (error) {
        console.error('GET /api/cabinet error:', error);
        return NextResponse.json({ error: 'Lekérési hiba' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const {
        roomId,
        description,
        letter,
        isActive = true,
    } = body;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.appUserId;

    if (!userId) return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });

    try {
        const newCabinet = await prisma.cabinet.create({
            data: {
                roomId,
                description,
                letter,
                isActive,
                lastModifiedById: userId,
            },
        });
        return NextResponse.json(newCabinet, { status: 201 });
    } catch (error) {
        console.error('POST /api/cabinet error:', error);
        return NextResponse.json({ error: 'Létrehozási hiba' }, { status: 500 });
    }
}