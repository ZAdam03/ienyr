// FILE: /src/app/api/maintenance/[id]/complete/route.ts
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
            where: { id },
            include: {
                item: true
            }
        });

        if (!maintenance) {
            return NextResponse.json({ error: 'A karbantartás nem található' }, { status: 404 });
        }

        if (maintenance.isCompleted) {
            return NextResponse.json({ error: 'A karbantartás már el lett végezve' }, { status: 400 });
        }

        // Tranzakcióban végrehajtjuk a műveletekett
        const result = await prisma.$transaction(async (tx) => {
            // 1. Jelenlegi karbantartás befejezése
            const completedMaintenance = await tx.maintenance.update({
                where: { id },
                data: {
                    isCompleted: true,
                    completedAt: new Date(),
                    completedById: userId
                }
            });

            // 2. Új karbantartás létrehozása, ha van ismétlődés
            if (maintenance.frequencyDays) {
                const nextScheduledAt = new Date(maintenance.scheduledAt);
                nextScheduledAt.setDate(nextScheduledAt.getDate() + maintenance.frequencyDays);

                const nextMaintenance = await tx.maintenance.create({
                    data: {
                        itemId: maintenance.itemId,
                        description: maintenance.description,
                        scheduledAt: nextScheduledAt,
                        frequencyDays: maintenance.frequencyDays,
                        isCompleted: false,
                        createdById: userId
                    }
                });

                return {
                    completedMaintenance,
                    nextMaintenance
                };
            }

            return {
                completedMaintenance,
                nextMaintenance: null
            };
        });

        return NextResponse.json({
            message: maintenance.frequencyDays 
                ? 'Karbantartás sikeresen befejezve és újra ütemezve' 
                : 'Karbantartás sikeresen befejezve',
            data: result
        });

    } catch (error) {
        console.error('POST /api/maintenance/[id]/complete error:', error);
        return NextResponse.json({ 
            error: 'Befejezési hiba: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba')
        }, { status: 500 });
    }
}