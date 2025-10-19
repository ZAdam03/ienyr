// FILE: /src/app/api/room/route.ts (GET, POST)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const floorId = searchParams.get('floorId');
        const include = searchParams.get('include');
        
        const where = floorId ? { floorId } : {};
        
        const rooms = await prisma.room.findMany({
            where,
            include: {
                floor: include === 'full' ? {
                    include: {
                        building: {
                            include: {
                                site: true
                            }
                        }
                    }
                } : true,
                department: true,
                lastModifiedBy: { select: { name: true } },
            },
        });
        
        return NextResponse.json(rooms);
    } catch (error) {
        console.error('GET /api/room error:', error);
        return NextResponse.json({ error: 'Lekérési hiba' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const {
        floorId,
        departmentId,
        description,
        number,
        isActive = true,
    } = body;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.appUserId;

    if (!userId) return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });

    try {
        const newRoom = await prisma.room.create({
            data: {
                floorId,
                departmentId,
                description,
                number,
                isActive,
                lastModifiedById: userId,
            },
        });
        return NextResponse.json(newRoom, { status: 201 });
    } catch (error) {
        console.error('POST /api/room error:', error);
        return NextResponse.json({ error: 'Létrehozási hiba' }, { status: 500 });
    }
}