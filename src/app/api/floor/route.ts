// FILE: /src/app/api/floor/route.ts (GET, POST)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const buildingId = searchParams.get('buildingId');
        
        const where = buildingId ? { buildingId } : {};
        
        const floors = await prisma.floor.findMany({
            where,
            include: {
                building: true,
                lastModifiedBy: { select: { name: true } },
            },
        });
        return NextResponse.json(floors);
    } catch (error) {
        console.error('GET /api/floor error:', error);
        return NextResponse.json({ error: 'Lekérési hiba' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const {
        buildingId,
        description = 'földszint',
        number = 0,
        isActive = true,
    } = body;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.appUserId;

    if (!userId) return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });

    try {
        const newFloor = await prisma.floor.create({
            data: {
                buildingId,
                description,
                number,
                isActive,
                lastModifiedById: userId,
            },
        });
        return NextResponse.json(newFloor, { status: 201 });
    } catch (error) {
        console.error('POST /api/floor error:', error);
        return NextResponse.json({ error: 'Létrehozási hiba' }, { status: 500 });
    }
}