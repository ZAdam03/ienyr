// FILE: /src/app/api/maintenance/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

interface Params {
    params: {
        id: string;
    };
}

export async function POST(request: NextRequest, { params }: Params) {
    try {
        const { id } = params; // Közvetlenül a params-ból

        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.appUserId;

        if (!userId) {
            return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });
        }

        // Karbantartás lekérése
        const maintenance = await prisma.maintenance.findUnique({
            where: { id }
        });

        if (!maintenance) {
            return NextResponse.json({ error: 'A karbantartás nem található' }, { status: 404 });
        }

        if (maintenance.isCompleted) {
            return NextResponse.json({ error: 'A karbantartás már el lett végezve' }, { status: 400 });
        }

        // Karbantartás státusz frissítése (soft delete)
        const updatedMaintenance = await prisma.maintenance.update({
            where: { id },
            data: {
                isCompleted: true,
                completedAt: new Date(),
                completedById: userId
            }
        });

        return NextResponse.json({
            message: 'Karbantartás sikeresen elvetve',
            maintenance: updatedMaintenance
        });

    } catch (error) {
        console.error('POST /api/maintenance/[id]/reject error:', error);
        return NextResponse.json({ 
            error: 'Elvetési hiba: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba')
        }, { status: 500 });
    }
}