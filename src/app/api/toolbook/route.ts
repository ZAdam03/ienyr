// src/app/api/toolbook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const active = searchParams.get('active');
        
        const where = active === 'true' ? { isActive: true } : {};
        
        const toolbooks = await prisma.toolbook.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        return NextResponse.json(toolbooks);
    } catch (error) {
        console.error('GET /api/toolbook error:', error);
        return NextResponse.json({ error: 'Lekérési hiba' }, { status: 500 });
    }
}