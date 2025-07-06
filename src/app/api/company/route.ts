import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// POST: Új company létrehozása
export async function POST(req: NextRequest) {
    const body = await req.json();
    const { id, description, isActive } = body;

    const session = await getServerSession(authOptions);
    const appUserId = (session?.user as any)?.appUserId;

    if (!appUserId) {
    return NextResponse.json({ error: 'Hiányzik a felhasználói azonosító' }, { status: 401 });
    }

    console.log("my userID: ", appUserId);

    try {
        const newCompany = await prisma.company.create({
            data: {
                description,
                isActive: isActive ?? true,
                lastModifiedById: appUserId,
            },
        });

        return NextResponse.json(newCompany, { status: 201 });
    } catch (error) {
        console.error('POST /api/company error:', error);
        return NextResponse.json({ error: 'Hiba a létrehozás során' }, { status: 500 });
    }
}

// GET: Összes company lekérése
export async function GET() {
    try {
        const companies = await prisma.company.findMany({
            include: {
                lastModifiedBy: {
                    select: {
                        name: true,
                        id: true,
                    },
                },
            },
        });

        return NextResponse.json(companies);
    } catch (error) {
        console.error('GET /api/company error:', error);
        return NextResponse.json({ error: 'Hiba a lekérdezés során' }, { status: 500 });
    }
}