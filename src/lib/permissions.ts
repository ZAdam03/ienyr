// src/lib/permissions.ts
export const PERMISSIONS = {
  // Admin jogosultságok
  ADMIN: 'admin',
  
  // Role kezelés
  ROLE_VIEW: 'role.view',
  ROLE_CREATE: 'role.create', 
  ROLE_EDIT: 'role.edit',
  ROLE_DELETE: 'role.delete',
  
  // User kezelés
  USER_VIEW: 'user.view',
  USER_CREATE: 'user.create',
  USER_EDIT: 'user.edit',
  USER_DELETE: 'user.delete',
  
  // Company kezelés
  COMPANY_VIEW: 'company.view',
  COMPANY_CREATE: 'company.create',
  COMPANY_EDIT: 'company.edit',
  COMPANY_DELETE: 'company.delete',
  
  // Site kezelés
  SITE_VIEW: 'site.view',
  SITE_CREATE: 'site.create',
  SITE_EDIT: 'site.edit',
  SITE_DELETE: 'site.delete',
  
  // Building kezelés
  BUILDING_VIEW: 'building.view',
  BUILDING_CREATE: 'building.create',
  BUILDING_EDIT: 'building.edit',
  BUILDING_DELETE: 'building.delete',
  
  // Floor kezelés
  FLOOR_VIEW: 'floor.view',
  FLOOR_CREATE: 'floor.create',
  FLOOR_EDIT: 'floor.edit',
  FLOOR_DELETE: 'floor.delete',
  
  // Room kezelés
  ROOM_VIEW: 'room.view',
  ROOM_CREATE: 'room.create',
  ROOM_EDIT: 'room.edit',
  ROOM_DELETE: 'room.delete',
  
  // Department kezelés
  DEPARTMENT_VIEW: 'department.view',
  DEPARTMENT_CREATE: 'department.create',
  DEPARTMENT_EDIT: 'department.edit',
  DEPARTMENT_DELETE: 'department.delete',
  
  // Cabinet kezelés
  CABINET_VIEW: 'cabinet.view',
  CABINET_CREATE: 'cabinet.create',
  CABINET_EDIT: 'cabinet.edit',
  CABINET_DELETE: 'cabinet.delete',
  
  // Model kezelés
  MODEL_VIEW: 'model.view',
  MODEL_CREATE: 'model.create',
  MODEL_EDIT: 'model.edit',
  MODEL_DELETE: 'model.delete',
  
  // Item kezelés
  ITEM_VIEW: 'item.view',
  ITEM_CREATE: 'item.create',
  ITEM_EDIT: 'item.edit',
  ITEM_DELETE: 'item.delete',
  
  // Move kezelés
  MOVE_VIEW: 'move.view',
  MOVE_CREATE: 'move.create',
  MOVE_APPROVE: 'move.approve',
  
  // Scrappage kezelés
  SCRAPPAGE_VIEW: 'scrappage.view',
  SCRAPPAGE_CREATE: 'scrappage.create',
  SCRAPPAGE_APPROVE: 'scrappage.approve',
  
  // Toolbook kezelés
  TOOLBOOK_VIEW: 'toolbook.view',
  TOOLBOOK_CREATE: 'toolbook.create',
  TOOLBOOK_EDIT: 'toolbook.edit',
  
  // Inventory kezelés
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_EDIT: 'inventory.edit',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const PERMISSION_GROUPS = {
  ADMIN: [PERMISSIONS.ADMIN],
  ROLE_MANAGEMENT: [
    PERMISSIONS.ROLE_VIEW,
    PERMISSIONS.ROLE_CREATE,
    PERMISSIONS.ROLE_EDIT,
    PERMISSIONS.ROLE_DELETE
  ],
  USER_MANAGEMENT: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_DELETE
  ],
  LOCATION_MANAGEMENT: [
    PERMISSIONS.COMPANY_VIEW, PERMISSIONS.COMPANY_CREATE, PERMISSIONS.COMPANY_EDIT, PERMISSIONS.COMPANY_DELETE,
    PERMISSIONS.SITE_VIEW, PERMISSIONS.SITE_CREATE, PERMISSIONS.SITE_EDIT, PERMISSIONS.SITE_DELETE,
    PERMISSIONS.BUILDING_VIEW, PERMISSIONS.BUILDING_CREATE, PERMISSIONS.BUILDING_EDIT, PERMISSIONS.BUILDING_DELETE,
    PERMISSIONS.FLOOR_VIEW, PERMISSIONS.FLOOR_CREATE, PERMISSIONS.FLOOR_EDIT, PERMISSIONS.FLOOR_DELETE,
    PERMISSIONS.ROOM_VIEW, PERMISSIONS.ROOM_CREATE, PERMISSIONS.ROOM_EDIT, PERMISSIONS.ROOM_DELETE,
    PERMISSIONS.DEPARTMENT_VIEW, PERMISSIONS.DEPARTMENT_CREATE, PERMISSIONS.DEPARTMENT_EDIT, PERMISSIONS.DEPARTMENT_DELETE,
    PERMISSIONS.CABINET_VIEW, PERMISSIONS.CABINET_CREATE, PERMISSIONS.CABINET_EDIT, PERMISSIONS.CABINET_DELETE
  ],
  ASSET_MANAGEMENT: [
    PERMISSIONS.MODEL_VIEW, PERMISSIONS.MODEL_CREATE, PERMISSIONS.MODEL_EDIT, PERMISSIONS.MODEL_DELETE,
    PERMISSIONS.ITEM_VIEW, PERMISSIONS.ITEM_CREATE, PERMISSIONS.ITEM_EDIT, PERMISSIONS.ITEM_DELETE,
    PERMISSIONS.TOOLBOOK_VIEW, PERMISSIONS.TOOLBOOK_CREATE, PERMISSIONS.TOOLBOOK_EDIT
  ],
  OPERATIONS: [
    PERMISSIONS.MOVE_VIEW, PERMISSIONS.MOVE_CREATE, PERMISSIONS.MOVE_APPROVE,
    PERMISSIONS.SCRAPPAGE_VIEW, PERMISSIONS.SCRAPPAGE_CREATE, PERMISSIONS.SCRAPPAGE_APPROVE,
    PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.INVENTORY_CREATE, PERMISSIONS.INVENTORY_EDIT
  ]
};

// Összes permission egy tömbben
export const ALL_PERMISSIONS = Object.values(PERMISSIONS);