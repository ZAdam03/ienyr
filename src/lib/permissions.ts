// src/lib/permissions.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Entitás típusok definiálása
export type Entity = 
  | 'company' 
  | 'site' 
  | 'building' 
  | 'floor' 
  | 'room' 
  | 'department' 
  | 'item' 
  | 'item_department'
  | 'model' 
  | 'model_brands'
  | 'model_types'
  | 'user'
  | 'toolbook'
  | 'move'
  | 'move_approve'
  | 'move_reject'
  | 'structure-mapping'
  | 'scrappage'
  | 'scrappage_approve'
  | 'scrappage_reject'
  | 'role';

export type Action = 'view' | 'create' | 'edit' | 'delete';

// Permission típus generálása
type PermissionTemplate = `${Action}_${Entity}`;

// Alap permission nevek definiálása TÍPUSBIZTOSAN
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
  VIEW_SCRAPPAGE: 'view_scrappage',
  VIEW_MOVE: 'view_move',
  VIEW_STRUCTURE_MAPPING: 'view_structure-mapping',
  
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
  CREATE_MOVE: 'create_move',  // New permission
  CREATE_SCRAPPAGE: 'create_scrappage',  // New permission
  
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
  EDIT_MOVE: 'edit_move',  // New permission
  EDIT_SCRAPPAGE: 'edit_scrappage',  // New permission

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
  DELETE_MOVE: 'delete_move',  // New permission
  DELETE_SCRAPPAGE: 'delete_scrappage',  // New permission

  // Speciális műveletek
  MOVE_ITEM: 'move_item',
  SCRAP_ITEM: 'scrap_item',
  MANAGE_INVENTORY: 'manage_inventory',
  MANAGE_ROLES: 'manage_roles',
  CREATE_ROLE: 'create_role',
  EDIT_ROLE: 'edit_role',
  DELETE_ROLE: 'delete_role',
  APPROVE_MOVE: 'approve_move',  // New permission
  REJECT_MOVE: 'reject_move',  // New permission
  APPROVE_SCRAPPAGE: 'approve_scrappage',  // New permission
  REJECT_SCRAPPAGE: 'reject_scrappage',  // New permission
} as const;

// TÍPUSBIZTOS Permission típus
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Validáló típus - csak érvényes permission string-ek
type ValidPermission = Permission;

// Helper típusok az automatikus permission generáláshoz
type ViewPermission = `view_${Entity}`;
type CreatePermission = `create_${Entity}`;
type EditPermission = `edit_${Entity}`;
type DeletePermission = `delete_${Entity}`;

// Összes automatikusan generált permission
type GeneratedPermissions = 
  | ViewPermission 
  | CreatePermission 
  | EditPermission 
  | DeletePermission;

// Biztosítjuk, hogy minden generált permission benne van a PERMISSIONS-ben
type AssertGeneratedPermissions = {
  [K in GeneratedPermissions]: K extends keyof typeof PERMISSIONS 
    ? typeof PERMISSIONS[K] 
    : never;
};

// Minden permission egy tömbbe - TÍPUSBIZTOSAN
export const ALL_PERMISSIONS: readonly Permission[] = Object.values(PERMISSIONS);

// Permission ellenőrző függvények
export function isValidPermission(permission: string): permission is Permission {
  return ALL_PERMISSIONS.includes(permission as Permission);
}

export function assertPermission(permission: string): asserts permission is Permission {
  if (!isValidPermission(permission)) {
    throw new Error(`Invalid permission: ${permission}`);
  }
}

// Fő funkció: jogosultság ellenőrzése - TÍPUSBIZTOS
export async function checkPermission(
  appGroups: string[], 
  requiredPermission: Permission // CSAK érvényes permission-ök
): Promise<boolean> {
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

// Felhasználó összes jogainak lekérése - TÍPUSBIZTOS
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
      role.permissions.map(p => {
        // TÍPUSBIZTOS konverzió
        assertPermission(p.permissionName);
        return p.permissionName as Permission;
      })
    );

    // Duplikációk eltávolítása
    const uniquePermissions = [...new Set(permissions)] as Permission[];
    
    console.log('✅ FINAL USER PERMISSIONS:', uniquePermissions);
    return uniquePermissions;
  } catch (error) {
    console.error('❌ Get user permissions error:', error);
    return [];
  }
}