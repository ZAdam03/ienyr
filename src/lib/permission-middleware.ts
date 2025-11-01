// src/lib/permission-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkPermission, PERMISSIONS } from './permissions';

export async function requirePermission(
  req: NextRequest,
  requiredPermission: string
) {
  try {
    const token = await getToken({ req });
    
    if (!token) {
      return NextResponse.json({ error: 'Nincs hitelesítés' }, { status: 401 });
    }

    const azureGroups = token.appGroups || [];
    
    const hasPermission = await checkPermission(azureGroups, requiredPermission as any);
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    return null; // Nincs hiba, folytathatjuk
  } catch (error) {
    console.error('Permission middleware error:', error);
    return NextResponse.json({ error: 'Szerver hiba' }, { status: 500 });
  }
}

// Gyakori permission-ök helper függvényekként
export async function requireAdmin(req: NextRequest) {
  return requirePermission(req, PERMISSIONS.ADMIN);
}

export async function requireViewPermission(entity: string, req: NextRequest) {
  const permission = `view_${entity.toLowerCase()}` as any;
  return requirePermission(req, permission);
}

export async function requireCreatePermission(entity: string, req: NextRequest) {
  const permission = `create_${entity.toLowerCase()}` as any;
  return requirePermission(req, permission);
}

export async function requireEditPermission(entity: string, req: NextRequest) {
  const permission = `edit_${entity.toLowerCase()}` as any;
  return requirePermission(req, permission);
}

export async function requireDeletePermission(entity: string, req: NextRequest) {
  const permission = `delete_${entity.toLowerCase()}` as any;
  return requirePermission(req, permission);
}