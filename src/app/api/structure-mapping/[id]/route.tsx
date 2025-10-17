// /src/app/api/structure-mapping/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.appUserId;

    if (!userId) {
      return NextResponse.json({ error: 'Nincs felhasználói azonosító' }, { status: 401 });
    }

    // Ellenőrizzük, hogy létezik-e a kapcsolat
    const existingMapping = await prisma.structureMapping.findUnique({
      where: { id },
      include: {
        parentItem: true,
        childItem: true
      }
    });

    if (!existingMapping) {
      return NextResponse.json({ error: 'A kapcsolat nem található' }, { status: 404 });
    }

    if (!existingMapping.isActive) {
      return NextResponse.json({ error: 'A kapcsolat már inaktív' }, { status: 400 });
    }

    // Kapcsolat inaktiválása (soft delete)
    const updatedMapping = await prisma.structureMapping.update({
      where: { id },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedById: userId
      },
      include: {
        parentItem: {
          include: {
            model: true
          }
        },
        childItem: {
          include: {
            model: true
          }
        }
      }
    });

    console.log(`Structure mapping ${id} deactivated by user ${userId}`);

    return NextResponse.json({ 
      message: 'Kapcsolat sikeresen törölve',
      mapping: updatedMapping
    });

  } catch (error) {
    console.error('DELETE /api/structure-mapping/[id] error:', error);
    return NextResponse.json({ 
      error: 'Törlési hiba: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba')
    }, { status: 500 });
  }
}