// src/app/api/item/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getToken } from 'next-auth/jwt';

const prisma = new PrismaClient();
const secret = process.env.AUTH_SECRET!;

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const { id, eid, description, modelId, serialNumber } = body;

  try {
    const newItem = await prisma.item.create({
      data: {
        id, 
        eid, 
        description, 
        modelId, 
        serialNumber
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Hiba a mentés során' }, { status: 500 });
  }
}
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
        const { searchParams } = new URL(req.url);
        const limit = searchParams.get('limit');
        const exclude = searchParams.get('exclude');
        
        const items = await prisma.item.findMany({
            where: exclude ? { id: { not: exclude } } : {},
            take: limit ? parseInt(limit) : undefined,
            include: {
                model: {
                    select: {
                        brand: true,
                        model: true,
                        type: true
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
    console.error('API error:', error);
    return NextResponse.json({ error: 'Hiba az eszközök lekérése során' }, { status: 500 });
  }
}