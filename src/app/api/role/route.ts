// src/app/api/role/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const roles = await prisma.role.findMany({
            include: {
                permissions: true
            }
        });
        return NextResponse.json(roles);
    } catch (error) {
        console.error('GET /api/role error:', error);
        return NextResponse.json({ error: 'Lekérési hiba' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { name, description, azureGroupId } = body;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.appUserId;

    if (!userId) {
        return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });
    }

    try {
        const newRole = await prisma.role.create({
            data: {
                name,
                description,
                azureGroupId
            }
        });
        return NextResponse.json(newRole, { status: 201 });
    } catch (error) {
        console.error('POST /api/role error:', error);
        return NextResponse.json({ error: 'Létrehozási hiba' }, { status: 500 });
    }
}