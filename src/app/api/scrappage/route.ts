// FILE: /src/app/api/scrappage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { itemId, description, isFinished = false } = body; // Alapértelmezetten false!

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.appUserId;

    if (!userId) {
        return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });
    }

    try {
        // CSAK A SELEJTEZÉSI KÉRELEM LÉTREHOZÁSA - NEM változtatunk semmit!
        const scrappage = await prisma.scrappage.create({
            data: {
                itemId,
                description,
                isFinished: false, // Mindig false kezdetben
                createdById: userId
            }
        });

        // NEM frissítjük az item státuszát itt!
        // NEM deaktiváljuk az ItemPlace-et itt!
        // NEM deaktiváljuk a ToolbookItem-et itt!

        return NextResponse.json(scrappage, { status: 201 });
    } catch (error) {
        console.error('POST /api/scrappage error:', error);
        return NextResponse.json({ error: 'Selejtezési kérés hiba' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const isFinished = searchParams.get('isFinished');
        
        const where: any = {};
        
        if (isFinished !== null) {
            where.isFinished = isFinished === 'true';
        }
        
        const scrappages = await prisma.scrappage.findMany({
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
                createdAt: 'desc'
            }
        });
        return NextResponse.json(scrappages);
    } catch (error) {
        console.error('GET /api/scrappage error:', error);
        return NextResponse.json({ error: 'Lekérési hiba' }, { status: 500 });
    }
}