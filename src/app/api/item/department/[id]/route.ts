// src/app/api/item/department/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const departmentId = params.id;

    // Ellenőrizzük, hogy érvényes UUID-e a paraméter
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(departmentId)) {
      return NextResponse.json(
        { error: 'Érvénytelen department azonosító' },
        { status: 400 }
      );
    }

    const items = await prisma.item.findMany({
      where: {
        place: {
          some: {
            room: {
              departmentId: departmentId
            },
            isActive: true
          }
        }
      },
      include: {
        model: {
          select: {
            brand: true,
            model: true
          }
        },
        place: {
          where: {
            isActive: true
          },
          include: {
            room: {
              select: {
                description: true
              }
            },
            cabinet: {
              select: {
                description: true
              }
            }
          }
        }
      },
      orderBy: {
        description: 'asc'
      }
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error in GET /api/item/department/[id]:', error);
    return NextResponse.json(
      { error: 'Belső szerverhiba' },
      { status: 500 }
    );
  }
}