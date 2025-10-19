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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    console.log(`Fetching structure mappings for item: ${id}`);

    // Aktív struktúra kapcsolatok lekérése
    const structureMappings = await prisma.structureMapping.findMany({
      where: {
        isActive: true,
        OR: [
          { parentItemId: id },
          { childItemId: id }
        ]
      },
      include: {
        parentItem: {
          include: {
            model: true,
            place: {
              where: { isActive: true },
              include: {
                room: true,
                cabinet: true
              }
            },
            toolbookItem: {
              where: { isActive: true },
              include: {
                toolbook: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        },
        childItem: {
          include: {
            model: true,
            place: {
              where: { isActive: true },
              include: {
                room: true,
                cabinet: true
              }
            },
            toolbookItem: {
              where: { isActive: true },
              include: {
                toolbook: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`Found ${structureMappings.length} structure mappings`);

    // Struktúra elemek összegyűjtése
    const allItems = new Map();
    
    structureMappings.forEach(mapping => {
      // Szülő item hozzáadása (ha nem az aktuális item)
      if (mapping.parentItemId !== id && mapping.parentItem) {
        allItems.set(mapping.parentItemId, {
          ...mapping.parentItem,
          relationType: 'parent' as const,
          structureMappingId: mapping.id
        });
      }
      
      // Gyermek item hozzáadása (ha nem az aktuális item)
      if (mapping.childItemId !== id && mapping.childItem) {
        allItems.set(mapping.childItemId, {
          ...mapping.childItem,
          relationType: 'child' as const,
          structureMappingId: mapping.id
        });
      }
    });

    const structureItems = Array.from(allItems.values());

    return NextResponse.json({
      itemId: id,
      structureItems,
      totalCount: structureItems.length
    });

  } catch (error) {
    console.error('GET /api/structure-mapping/item/[id] error:', error);
    return NextResponse.json({ 
      error: 'Struktúra lekérési hiba: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba')
    }, { status: 500 });
  }
}