// src/app/api/structure-mapping/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { parentItemId, childItemId } = body;

        if (!parentItemId || !childItemId) {
            return NextResponse.json({ error: 'Parent és child item ID kötelező' }, { status: 400 });
        }

        if (parentItemId === childItemId) {
            return NextResponse.json({ error: 'Egy eszköz nem lehet saját magának a szülője' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.appUserId;

        if (!userId) {
            return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });
        }

        // Ellenőrizzük, hogy léteznek-e az itemek
        const [parentItem, childItem] = await Promise.all([
            prisma.item.findUnique({ where: { id: parentItemId } }),
            prisma.item.findUnique({ where: { id: childItemId } })
        ]);

        if (!parentItem || !childItem) {
            return NextResponse.json({ error: 'Egy vagy mindkét eszköz nem található' }, { status: 404 });
        }

        // Ellenőrizzük, hogy nem létezik-e már a kapcsolat
        const existingMapping = await prisma.structureMapping.findFirst({
            where: {
                OR: [
                    { parentItemId, childItemId },
                    { parentItemId: childItemId, childItemId: parentItemId } // fordított kapcsolat sem lehet
                ],
                isActive: true
            }
        });

        if (existingMapping) {
            return NextResponse.json({ error: 'A kapcsolat már létezik' }, { status: 400 });
        }

        // Kapcsolat létrehozása
        const structureMapping = await prisma.structureMapping.create({
            data: {
                parentItemId,
                childItemId,
                createdById: userId
            },
            include: {
                parentItem: {
                    include: {
                        model: true
                    }
                },
                childItem: {
                    include: {
                        model: true
                    }
                }
            }
        });

        return NextResponse.json(structureMapping, { status: 201 });

    } catch (error) {
        console.error('POST /api/structure-mapping error:', error);
        return NextResponse.json({ 
            error: 'Kapcsolat létrehozási hiba: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba')
        }, { status: 500 });
    }
}