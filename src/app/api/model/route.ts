// src/app/api/new/model/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { type, brand, model, picture, weight } = body;

  try {
    const newModel = await prisma.model.create({
      data: {
        type,
        brand,
        model,
        picture,
        weight,
      },
    });

    return NextResponse.json(newModel, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Hiba a mentés során' }, { status: 500 });
  }
}
export async function GET() {
  try {
    const models = await prisma.model.findMany();
    return NextResponse.json(models);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Hiba a modellek lekérése során' }, { status: 500 });
  }
}