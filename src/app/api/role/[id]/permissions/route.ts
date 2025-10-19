// src/app/api/role/[id]/permissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Permission } from '@/lib/permissions';

const prisma = new PrismaClient();

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const body = await request.json();
    const { permissions } = body;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.appUserId;

    if (!userId) {
        return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });
    }

    try {
        // Tranzakcióban frissítjük a permissions-öket
        const result = await prisma.$transaction(async (tx) => {
            // Régi permissions törlése
            await tx.rolePermission.deleteMany({
                where: { roleId: params.id }
            });

            // Új permissions létrehozása
            if (permissions.length > 0) {
                await tx.rolePermission.createMany({
                    data: permissions.map((permission: Permission) => ({
                        roleId: params.id,
                        permissionName: permission
                    }))
                });
            }

            // Frissített role visszaadása
            return await tx.role.findUnique({
                where: { id: params.id },
                include: {
                    permissions: true
                }
            });
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('PUT /api/role/[id]/permissions error:', error);
        return NextResponse.json({ error: 'Permission frissítési hiba' }, { status: 500 });
    }
}