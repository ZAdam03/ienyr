// src/lib/permissions.ts (JAVÍTOTT)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Alap permission nevek definiálása
export const PERMISSIONS = {
  // Admin jogok
  ADMIN: 'admin',
  
  // Olvasási jogok
  VIEW_COMPANY: 'view_company',
  VIEW_SITE: 'view_site',
  VIEW_BUILDING: 'view_building',
  VIEW_FLOOR: 'view_floor',
  VIEW_ROOM: 'view_room',
  VIEW_CABINET: 'view_cabinet',
  VIEW_DEPARTMENT: 'view_department',
  VIEW_ITEM: 'view_item',
  VIEW_MODEL: 'view_model',
  VIEW_TOOLBOOK: 'view_toolbook',
  
  // Írási jogok
  CREATE_COMPANY: 'create_company',
  CREATE_SITE: 'create_site',
  CREATE_BUILDING: 'create_building',
  CREATE_FLOOR: 'create_floor',
  CREATE_ROOM: 'create_room',
  CREATE_CABINET: 'create_cabinet',
  CREATE_DEPARTMENT: 'create_department',
  CREATE_ITEM: 'create_item',
  CREATE_MODEL: 'create_model',
  CREATE_TOOLBOOK: 'create_toolbook',
  
  // Módosítási jogok
  EDIT_COMPANY: 'edit_company',
  EDIT_SITE: 'edit_site',
  EDIT_BUILDING: 'edit_building',
  EDIT_FLOOR: 'edit_floor',
  EDIT_ROOM: 'edit_room',
  EDIT_CABINET: 'edit_cabinet',
  EDIT_DEPARTMENT: 'edit_department',
  EDIT_ITEM: 'edit_item',
  EDIT_MODEL: 'edit_model',
  EDIT_TOOLBOOK: 'edit_toolbook',
  
  // Törlési jogok
  DELETE_COMPANY: 'delete_company',
  DELETE_SITE: 'delete_site',
  DELETE_BUILDING: 'delete_building',
  DELETE_FLOOR: 'delete_floor',
  DELETE_ROOM: 'delete_room',
  DELETE_CABINET: 'delete_cabinet',
  DELETE_DEPARTMENT: 'delete_department',
  DELETE_ITEM: 'delete_item',
  DELETE_MODEL: 'delete_model',
  DELETE_TOOLBOOK: 'delete_toolbook',
  
  // Speciális műveletek
  MOVE_ITEM: 'move_item',
  SCRAP_ITEM: 'scrap_item',
  MANAGE_INVENTORY: 'manage_inventory',
  MANAGE_ROLES: 'manage_roles',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Minden permission egy tömbbe
export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

// Fő funkció: jogosultság ellenőrzése
export async function checkPermission(appGroups: string[], requiredPermission: Permission): Promise<boolean> {
  try {
    console.log('🔐 CHECKING PERMISSION:', {
      appGroups,
      requiredPermission
    });

    // ADMIN mindent tud
    if (await hasAdminPermission(appGroups)) {
      console.log('✅ ADMIN ACCESS GRANTED');
      return true;
    }

    // Keresés a role-ok között
    const rolesWithPermission = await prisma.role.findMany({
      where: {
        azureGroupId: { in: appGroups },
        permissions: {
          some: {
            permissionName: requiredPermission
          }
        }
      }
    });

    const hasPermission = rolesWithPermission.length > 0;
    console.log('📋 PERMISSION CHECK RESULT:', {
      hasPermission,
      rolesFound: rolesWithPermission.length
    });

    return hasPermission;
  } catch (error) {
    console.error('❌ Permission check error:', error);
    return false;
  }
}

// Admin jog ellenőrzése
export async function hasAdminPermission(appGroups: string[]): Promise<boolean> {
  try {
    const adminRole = await prisma.role.findFirst({
      where: {
        azureGroupId: { in: appGroups },
        permissions: {
          some: {
            permissionName: PERMISSIONS.ADMIN
          }
        }
      }
    });

    const isAdmin = !!adminRole;
    console.log('👑 ADMIN CHECK:', { isAdmin, appGroups });
    
    return isAdmin;
  } catch (error) {
    console.error('❌ Admin permission check error:', error);
    return false;
  }
}

// Felhasználó összes jogainak lekérése
export async function getUserPermissions(appGroups: string[]): Promise<Permission[]> {
  try {
    console.log('📋 GETTING USER PERMISSIONS FOR APP GROUPS:', appGroups);

    const rolesWithPermissions = await prisma.role.findMany({
      where: {
        azureGroupId: { in: appGroups }
      },
      include: {
        permissions: true
      }
    });

    console.log('🏷️ ROLES FOUND:', rolesWithPermissions.length);

    const permissions = rolesWithPermissions.flatMap(role => 
      role.permissions.map(p => p.permissionName as Permission)
    );

    // Duplikációk eltávolítása
    const uniquePermissions = [...new Set(permissions)];
    
    console.log('✅ FINAL USER PERMISSIONS:', uniquePermissions);
    return uniquePermissions;
  } catch (error) {
    console.error('❌ Get user permissions error:', error);
    return [];
  }
}