// src/lib/init-admin.ts (JAVÍTOTT)
import { PrismaClient } from '@prisma/client';
import { ALL_PERMISSIONS, PERMISSIONS } from './permissions';

const prisma = new PrismaClient();

export async function initializeAdminRole() {
  try {
    const adminGroupId = process.env.ADMIN_AZURE_GROUP_ID;
    
    if (!adminGroupId) {
      console.warn('⚠️ ADMIN_AZURE_GROUP_ID nincs beállítva a .env fájlban');
      return;
    }

    console.log('🔧 INITIALIZING ADMIN ROLE FOR GROUP:', adminGroupId);

    // Ellenőrizzük, hogy létezik-e már az admin role
    const existingAdminRole = await prisma.role.findUnique({
      where: { azureGroupId: adminGroupId },
      include: { permissions: true }
    });

    if (existingAdminRole) {
      console.log('✅ Admin role már létezik:', existingAdminRole.name);
      
      // Ellenőrizzük, hogy minden permission hozzá van-e rendelve
      const existingPermissions = existingAdminRole.permissions.map(p => p.permissionName);
      const missingPermissions = ALL_PERMISSIONS.filter(p => !existingPermissions.includes(p));
      
      if (missingPermissions.length > 0) {
        console.log('🔧 Adding missing permissions to admin role:', missingPermissions);
        
        await prisma.rolePermission.createMany({
          data: missingPermissions.map(permissionName => ({
            roleId: existingAdminRole.id,
            permissionName
          }))
        });
        
        console.log('✅ Missing permissions added to admin role');
      }
      
      return;
    }

    // Admin role létrehozása
    const adminRole = await prisma.role.create({
      data: {
        name: 'Administrator',
        description: 'Rendszer adminisztrátor - teljes hozzáférés',
        azureGroupId: adminGroupId,
        permissions: {
          create: ALL_PERMISSIONS.map(permissionName => ({
            permissionName
          }))
        }
      },
      include: {
        permissions: true
      }
    });

    console.log('✅ Admin role sikeresen létrehozva:', {
      id: adminRole.id,
      name: adminRole.name,
      azureGroupId: adminRole.azureGroupId,
      permissions: adminRole.permissions.length
    });
    
  } catch (error) {
    console.error('❌ Admin role inicializálási hiba:', error);
  }
}

// Alkalmazás indításakor futtatjuk
initializeAdminRole().catch(console.error);