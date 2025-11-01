// FILE: /src/app/api/site/[id]/route.ts (PATCH)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireEditPermission } from '@/lib/permission-middleware';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
    // EDIT jogosultság ellenőrzése
    const permissionError = await requireEditPermission('site', req);
    if (permissionError) return permissionError;
    
    const body = await req.json();
    const { id: siteId, description, zipCode, city, address, address2, latitude, longitude, isActive } = body;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.appUserId;

    if (!userId) return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });

    try {
        const updatedSite = await prisma.site.update({
            where: { id: siteId },
            data: {
                description,
                zipCode,
                city,
                address,
                address2,
                latitude,
                longitude,
                isActive,
                lastModifiedAt: new Date(),
                lastModifiedById: userId,
            },
        });

        return NextResponse.json(updatedSite);

    } catch (error) {
        console.error(`PATCH /api/site/${siteId} error:`, error);
        return NextResponse.json({ error: 'Frissítési hiba' }, { status: 500 });
    }
}
