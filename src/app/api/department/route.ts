// FILE: /src/app/api/department/route.ts (GET, POST)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('companyId');
        
        const where = companyId ? { companyId } : {};
        
        const departments = await prisma.department.findMany({
            where,
            include: {
                company: true,
                lastModifiedBy: { select: { name: true } },
            },
        });
        return NextResponse.json(departments);
    } catch (error) {
        console.error('GET /api/department error:', error);
        return NextResponse.json({ error: 'Lekérési hiba' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const {
        companyId,
        description,
        costCenter,
        isActive = true,
    } = body;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.appUserId;

    if (!userId) return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });

    try {
        const newDepartment = await prisma.department.create({
            data: {
                companyId,
                description,
                costCenter,
                isActive,
                lastModifiedById: userId,
            },
        });
        return NextResponse.json(newDepartment, { status: 201 });
    } catch (error) {
        console.error('POST /api/department error:', error);
        return NextResponse.json({ error: 'Létrehozási hiba' }, { status: 500 });
    }
}