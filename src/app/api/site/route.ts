// FILE: /src/app/api/site/route.ts (GET, POST)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireCreatePermission, requireViewPermission } from '@/lib/permission-middleware';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    // VIEW jogosultság ellenőrzése
    const permissionError = await requireViewPermission('site', req);
    if (permissionError) return permissionError;

    try {
        const sites = await prisma.site.findMany({
            include: {
                company: true,
                lastModifiedBy: { select: { name: true } },
            },
        });
        return NextResponse.json(sites);
    } catch (error) {
        console.error('GET /api/site error:', error);
        return NextResponse.json({ error: 'Lekérési hiba' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    // CREATE jogosultság ellenőrzése
    const permissionError = await requireCreatePermission('site', req);
    if (permissionError) return permissionError;
    
    const body = await req.json();
    const {
        companyId,
        description,
        zipCode,
        city,
        address,
        address2,
        latitude,
        longitude,
        isActive = true,
    } = body;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.appUserId;

    if (!userId) return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });

    try {
        const newSite = await prisma.site.create({
            data: {
                companyId,
                description,
                zipCode,
                city,
                address,
                address2,
                latitude,
                longitude,
                isActive,
                lastModifiedById: userId,
            },
        });
        return NextResponse.json(newSite, { status: 201 });

    } catch (error) {
        console.error('POST /api/site error:', error);
        return NextResponse.json({ error: 'Létrehozási hiba' }, { status: 500 });
    }
}