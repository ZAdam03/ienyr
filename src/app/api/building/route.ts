// FILE: /src/app/api/building/route.ts (GET, POST)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireCreatePermission, requireViewPermission } from '@/lib/permission-middleware';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {

    // VIEW jogosultság ellenőrzése
    const permissionError = await requireViewPermission('building', req);
    if (permissionError) return permissionError;
    
    try {
        const { searchParams } = new URL(req.url);
        const siteId = searchParams.get('siteId');
        
        const where = siteId ? { siteId } : {};
        
        const buildings = await prisma.building.findMany({
            where,
            include: {
                site: true,
                lastModifiedBy: { select: { name: true } },
            },
        });
        return NextResponse.json(buildings);
    } catch (error) {
        console.error('GET /api/building error:', error);
        return NextResponse.json({ error: 'Lekérési hiba' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {

    // CREATE jogosultság ellenőrzése
    const permissionError = await requireCreatePermission('building', req);
    if (permissionError) return permissionError;

    const body = await req.json();
    const {
        siteId,
        description,
        isActive = true,
    } = body;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.appUserId;

    if (!userId) return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });

    try {
        const newBuilding = await prisma.building.create({
            data: {
                siteId,
                description,
                isActive,
                lastModifiedById: userId,
            },
        });
        return NextResponse.json(newBuilding, { status: 201 });
    } catch (error) {
        console.error('POST /api/building error:', error);
        return NextResponse.json({ error: 'Létrehozási hiba' }, { status: 500 });
    }
}