import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
    const body = await req.json();
    const { id: companyId, description, isActive } = body;

    const session = await getServerSession(authOptions);
    const appUserId = (session?.user as any)?.appUserId;

    if (!appUserId) {
        return NextResponse.json({ error: 'Hiányzik a felhasználói azonosító' }, { status: 401 });
    }

    try {
        const updatedCompany = await prisma.company.update({
            where: { id: companyId },
            data: {
                description,
                isActive,
                lastModifiedAt: new Date(),
                lastModifiedById: appUserId,
            },
        });

        return NextResponse.json(updatedCompany);
    } catch (error) {
        console.error(`PATCH /api/company/${companyId} error:`, error);
        return NextResponse.json({ error: 'Nem sikerült módosítani a céget' }, { status: 500 });
    }
}