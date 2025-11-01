// src/app/api/model/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireCreatePermission, requireViewPermission } from '@/lib/permission-middleware';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // CREATE jogosultság ellenőrzése
  const permissionError = await requireCreatePermission('model', req);
  if (permissionError) return permissionError;

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
export async function GET(req: NextRequest) {
  // VIEW jogosultság ellenőrzése
  const permissionError = await requireViewPermission('model', req);
  if (permissionError) return permissionError;

  try {
    const models = await prisma.model.findMany();
    return NextResponse.json(models);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Hiba a modellek lekérése során' }, { status: 500 });
  }
}