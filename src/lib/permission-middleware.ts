// src/lib/permission-middleware.ts
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkPermission, PERMISSIONS, Permission, Entity, Action, isValidPermission } from './permissions';

// Error típus definiálása
export interface PermissionError {
  type: 'UNAUTHORIZED' | 'FORBIDDEN' | 'SERVER_ERROR';
  message: string;
  permission?: string;
}

// Alap permission ellenőrző - CSAK error objektumot vagy null-t ad vissza
export async function requirePermission(
  req: NextRequest,
  requiredPermission: Permission
): Promise<PermissionError | null> {
  try {
    const token = await getToken({ req });
    
    if (!token) {
      return {
        type: 'UNAUTHORIZED',
        message: 'Nincs hitelesítés'
      };
    }

    const appGroups = token.appGroups || [];
    
    const hasPermission = await checkPermission(appGroups, requiredPermission);
    
    if (!hasPermission) {
      return {
        type: 'FORBIDDEN',
        message: `Nincs jogosultság: ${requiredPermission}`,
        permission: requiredPermission
      };
    }

    return null; // Nincs hiba, folytathatjuk
  } catch (error) {
    console.error('Permission middleware error:', error);
    return {
      type: 'SERVER_ERROR',
      message: 'Szerver hiba a jogosultság ellenőrzése során'
    };
  }
}

// TÍPUSBIZTOS Helper függvények
export async function requireViewPermission(entity: Entity, req: NextRequest): Promise<PermissionError | null> {
  const permission = `view_${entity}` as const;
  
  if (isValidPermission(permission)) {
    return requirePermission(req, permission);
  }
  
  return {
    type: 'SERVER_ERROR',
    message: `Érvénytelen permission: ${permission}`
  };
}

export async function requireCreatePermission(entity: Entity, req: NextRequest): Promise<PermissionError | null> {
  const permission = `create_${entity}` as const;
  
  if (isValidPermission(permission)) {
    return requirePermission(req, permission);
  }
  
  return {
    type: 'SERVER_ERROR',
    message: `Érvénytelen permission: ${permission}`
  };
}

export async function requireEditPermission(entity: Entity, req: NextRequest): Promise<PermissionError | null> {
  const permission = `edit_${entity}` as const;
  
  if (isValidPermission(permission)) {
    return requirePermission(req, permission);
  }
  
  return {
    type: 'SERVER_ERROR',
    message: `Érvénytelen permission: ${permission}`
  };
}

export async function requireDeletePermission(entity: Entity, req: NextRequest): Promise<PermissionError | null> {
  const permission = `delete_${entity}` as const;
  
  if (isValidPermission(permission)) {
    return requirePermission(req, permission);
  }
  
  return {
    type: 'SERVER_ERROR',
    message: `Érvénytelen permission: ${permission}`
  };
}

// Speciális permission-ök - TÍPUSBIZTOSAN
export async function requireAdmin(req: NextRequest): Promise<PermissionError | null> {
  return requirePermission(req, PERMISSIONS.ADMIN);
}

export async function requireMoveItem(req: NextRequest): Promise<PermissionError | null> {
  return requirePermission(req, PERMISSIONS.MOVE_ITEM);
}

export async function requireScrapItem(req: NextRequest): Promise<PermissionError | null> {
  return requirePermission(req, PERMISSIONS.SCRAP_ITEM);
}

export async function requireManageRoles(req: NextRequest): Promise<PermissionError | null> {
  return requirePermission(req, PERMISSIONS.MANAGE_ROLES);
}

export async function requireManageInventory(req: NextRequest): Promise<PermissionError | null> {
  return requirePermission(req, PERMISSIONS.MANAGE_INVENTORY);
}

// Bulk permission ellenőrzés - TÍPUSBIZTOS
export async function requireAnyPermission(
  req: NextRequest,
  permissions: Permission[]
): Promise<PermissionError | null> {
  try {
    const token = await getToken({ req });
    
    if (!token) {
      return {
        type: 'UNAUTHORIZED',
        message: 'Nincs hitelesítés'
      };
    }

    const appGroups = token.appGroups || [];
    
    // Ellenőrizzük mindegyik permission-t
    for (const permission of permissions) {
      const hasPermission = await checkPermission(appGroups, permission);
      if (hasPermission) {
        return null; // Legalább egy jogosultság megvan
      }
    }
    
    return {
      type: 'FORBIDDEN',
      message: `Nincs egyetlen jogosultság sem: ${permissions.join(', ')}`,
      permission: permissions.join(', ')
    };
  } catch (error) {
    console.error('Bulk permission middleware error:', error);
    return {
      type: 'SERVER_ERROR',
      message: 'Szerver hiba a jogosultságok ellenőrzése során'
    };
  }
}

export async function requireAllPermissions(
  req: NextRequest,
  permissions: Permission[]
): Promise<PermissionError | null> {
  try {
    const token = await getToken({ req });
    
    if (!token) {
      return {
        type: 'UNAUTHORIZED',
        message: 'Nincs hitelesítés'
      };
    }

    const appGroups = token.appGroups || [];
    
    // Ellenőrizzük mindegyik permission-t
    for (const permission of permissions) {
      const hasPermission = await checkPermission(appGroups, permission);
      if (!hasPermission) {
        return {
          type: 'FORBIDDEN',
          message: `Hiányzó jogosultság: ${permission}`,
          permission: permission
        };
      }
    }
    
    return null; // Minden jogosultság megvan
  } catch (error) {
    console.error('Bulk permission middleware error:', error);
    return {
      type: 'SERVER_ERROR',
      message: 'Szerver hiba a jogosultságok ellenőrzése során'
    };
  }
}

// Helper: Error objektum konvertálása Toast üzenetté
export function permissionErrorToToast(error: PermissionError | null) {
  if (!error) return null;

  const { type, message } = error;
  
  switch (type) {
    case 'UNAUTHORIZED':
      return {
        severity: 'error' as const,
        summary: 'Hitelesítés szükséges',
        detail: message,
        life: 5000
      };
    case 'FORBIDDEN':
      return {
        severity: 'warn' as const,
        summary: 'Nincs jogosultság',
        detail: message,
        life: 5000
      };
    case 'SERVER_ERROR':
      return {
        severity: 'error' as const,
        summary: 'Szerver hiba',
        detail: message,
        life: 5000
      };
    default:
      return {
        severity: 'error' as const,
        summary: 'Hiba',
        detail: 'Ismeretlen hiba',
        life: 5000
      };
  }
}