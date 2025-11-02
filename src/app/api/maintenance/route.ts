// FILE: /src/app/api/maintenance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireCreatePermission, requireViewPermission } from '@/lib/permission-middleware';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    // CREATE jogosultság ellenőrzése
    const permissionError = await requireViewPermission('maintenance', req);
    if (permissionError) return permissionError;
    try {
        const { searchParams } = new URL(req.url);
        const isCompleted = searchParams.get('isCompleted');
        
        const where: any = {};
        
        if (isCompleted !== null) {
            where.isCompleted = isCompleted === 'true';
        }
        
        const maintenance = await prisma.maintenance.findMany({
            where,
            include: {
                item: {
                    include: {
                        model: true
                    }
                },
                createdBy: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                scheduledAt: 'asc'
            }
        });
        
        return NextResponse.json(maintenance);
    } catch (error) {
        console.error('GET /api/maintenance error:', error);
        return NextResponse.json({ error: 'Lekérési hiba' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    // CREATE jogosultság ellenőrzése
    const permissionError = await requireCreatePermission('maintenance', req);
    if (permissionError) return permissionError;
    const body = await req.json();
    const {
        itemId,
        description,
        scheduledAt,
        frequencyDays
    } = body;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.appUserId;

    if (!userId) {
        return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });
    }

    try {
        const maintenance = await prisma.maintenance.create({
            data: {
                itemId,
                description,
                scheduledAt: new Date(scheduledAt),
                frequencyDays,
                isCompleted: false,
                createdById: userId
            }
        });

        return NextResponse.json(maintenance, { status: 201 });
    } catch (error) {
        console.error('POST /api/maintenance error:', error);
        return NextResponse.json({ error: 'Karbantartási hiba' }, { status: 500 });
    }
}