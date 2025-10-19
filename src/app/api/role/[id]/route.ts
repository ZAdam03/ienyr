// src/app/api/role/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const role = await prisma.role.findUnique({
            where: { id: params.id },
            include: {
                permissions: true
            }
        });

        if (!role) {
            return NextResponse.json({ error: 'Role nem található' }, { status: 404 });
        }

        return NextResponse.json(role);
    } catch (error) {
        console.error('GET /api/role/[id] error:', error);
        return NextResponse.json({ error: 'Lekérési hiba' }, { status: 500 });
    }
}