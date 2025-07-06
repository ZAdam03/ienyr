import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Új company létrehozása
export async function POST(req: NextRequest) {
    const body = await req.json();
    const { id, description, isActive } = body;

    try {
        const newCompany = await prisma.company.create({
        data: {
            description,
            isActive: isActive ?? true,
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