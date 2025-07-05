import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const companyId = params.id;
    const body = await req.json();
    const { description, isActive } = body;

    try {
        const updatedCompany = await prisma.company.update({
        where: { id: companyId },
        data: {
            description,
            isActive,
        },
        });

        return NextResponse.json(updatedCompany);
    } catch (error) {
        console.error(`PATCH /api/company/${companyId} error:`, error);
        return NextResponse.json({ error: 'Nem sikerült módosítani a céget' }, { status: 500 });
    }
}
