// src/app/api/item/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
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
export async function GET() {
  try {
    const items = await prisma.model.findMany();
    return NextResponse.json(items);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Hiba az eszközök lekérése során' }, { status: 500 });
  }
}