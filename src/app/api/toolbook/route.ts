// src/app/api/toolbook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireViewPermission } from '@/lib/permission-middleware';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    // VIEW jogosultság ellenőrzése
    const permissionError = await requireViewPermission('toolbook', req);
    if (permissionError) return permissionError;
    
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