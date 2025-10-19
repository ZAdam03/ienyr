// src/app/api/role/[id]/permissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Permission } from '@/lib/permissions';
import { requirePermission } from '@/lib/permission-middleware';

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
        // Permission check - csak admin vagy role management joggal
        const permissionError = await requirePermission(request, 'manage_roles');
        if (permissionError) return permissionError;
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

export async function GET(
        request: NextRequest,
        { params }: { params: { id: string } }
    ) {
    try {
        // Permission check - csak admin vagy role management joggal
        const permissionError = await requirePermission(request, 'manage_roles');
        if (permissionError) return permissionError;

        const { id } = await params;

        // Role és permissions lekérése
        const role = await prisma.role.findUnique({
        where: { id },
        include: {
            permissions: {
            select: {
                permissionName: true
            }
            }
        }
        });

        if (!role) {
        return NextResponse.json({ error: 'Role nem található' }, { status: 404 });
        }

        // Csak a permission neveket adjuk vissza
        const permissions = role.permissions.map(p => p.permissionName);

        return NextResponse.json({
        roleId: role.id,
        roleName: role.name,
        permissions
        });

    } catch (error) {
        console.error('GET /api/role/[id]/permissions error:', error);
        return NextResponse.json({ error: 'Lekérési hiba' }, { status: 500 });
    }
}