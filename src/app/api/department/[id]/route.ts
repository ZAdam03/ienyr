// FILE: /src/app/api/department/[id]/route.ts (PATCH)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireEditPermission } from '@/lib/permission-middleware';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
    // EDIT jogosultság ellenőrzése
    const permissionError = await requireEditPermission('department', req);
    if (permissionError) return permissionError;
    
    const body = await req.json();
    const { id: departmentId, description, costCenter, isActive } = body;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.appUserId;

    if (!userId) return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });

    try {
        const updatedDepartment = await prisma.department.update({
            where: { id: departmentId },
            data: {
                description,
                costCenter,
                isActive,
                lastModifiedAt: new Date(),
                lastModifiedById: userId,
            },
        });

        return NextResponse.json(updatedDepartment);
    } catch (error) {
        console.error(`PATCH /api/department/${departmentId} error:`, error);
        return NextResponse.json({ error: 'Frissítési hiba' }, { status: 500 });
    }
}