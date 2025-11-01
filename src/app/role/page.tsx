// src/app/role/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GenericMaintenanceTable } from '@/components/GenericMaintenanceTable';
import { Role } from '@prisma/client';
import { InputText } from 'primereact/inputtext';
import { PickList } from 'primereact/picklist';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ALL_PERMISSIONS, Permission, PERMISSIONS } from '@/lib/permissions';

interface RoleWithPermissions extends Role {
  permissions: { permissionName: string }[];
}

export default function RolePage() {
  const [permissionDialog, setPermissionDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useRef<Toast>(null);

  const emptyRole: RoleWithPermissions = {
    id: '',
    name: '',
    description: '',
    azureGroupId: '',
    permissions: [],
  };

  const columns = [
    { field: 'id', header: 'Azonosító', sortable: true },
    { field: 'name', header: 'Név', sortable: true, filter: true },
    { field: 'description', header: 'Leírás', sortable: true, filter: true },
    { field: 'azureGroupId', header: 'Azure Group ID', sortable: true, filter: true },
    { 
      field: 'permissions', 
      header: 'Jogosultságok', 
      body: (row: RoleWithPermissions) => `${row.permissions?.length || 0} db`,
      sortable: true 
    },
  ];
  const formFields = (role: RoleWithPermissions, onInputChange: any) => (
    <>
      <div className="field">
        <label htmlFor="name" className="font-bold">Név *</label>
        <InputText id="name" value={role.name} onChange={(e) => onInputChange(e, 'name')} />
      </div>
      <div className="field">
        <label htmlFor="description" className="font-bold">Leírás</label>
        <InputText id="description" value={role.description || ''} onChange={(e) => onInputChange(e, 'description')} />
      </div>
      <div className="field">
        <label htmlFor="azureGroupId" className="font-bold">Azure Group ID *</label>
        <InputText 
          id="azureGroupId" 
          value={role.azureGroupId} 
          onChange={(e) => onInputChange(e, 'azureGroupId')} 
          placeholder="Azure AD Group Object ID"
        />
      </div>
    </>
  );

  const handleRowDoubleClick = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    loadRolePermissions(role.id);
    setPermissionDialog(true);
  };

  const loadRolePermissions = async (roleId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/role/${roleId}/permissions`);
      if (!response.ok) throw new Error('Failed to load permissions');
      
      const data = await response.json();
      setSelectedPermissions(data.permissions || []);
      
      // Available permissions are all permissions minus selected ones
      const available = ALL_PERMISSIONS.filter(p => !data.permissions.includes(p));
      setAvailablePermissions(available);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Hiba',
        detail: 'Nem sikerült betölteni a jogosultságokat',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (event: any) => {
    setAvailablePermissions(event.source);
    setSelectedPermissions(event.target);
  };

  const savePermissions = async () => {
    if (!selectedRole) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/role/${selectedRole.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: selectedPermissions
        }),
      });

      if (!response.ok) throw new Error('Failed to save permissions');

      toast.current?.show({
        severity: 'success',
        summary: 'Siker',
        detail: 'Jogosultságok sikeresen mentve',
        life: 3000
      });

      setPermissionDialog(false);
      // Refresh the table to show updated permission count
      window.location.reload();
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Hiba',
        detail: 'Nem sikerült menteni a jogosultságokat',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const permissionTemplate = (permission: Permission) => {
    // Find which group this permission belongs to
    const group = Object.entries(PERMISSIONS).find(([_, perms]) => 
      perms.includes(permission)
    )?.[0];

    return (
      <div className="flex flex-wrap p-2 align-items-center gap-3">
        <div className="flex-1 flex flex-column gap-1">
          <span className="font-bold">{permission}</span>
          <small className="text-gray-500">{group} csoport</small>
        </div>
      </div>
    );
  };

  const permissionDialogFooter = (
    <div>
      <Button 
        label="Mégse" 
        icon="pi pi-times" 
        onClick={() => setPermissionDialog(false)}
        className="p-button-text"
      />
      <Button 
        label="Mentés" 
        icon="pi pi-check" 
        onClick={savePermissions}
        loading={loading}
      />
    </div>
  );

  return (
    <div>
      <Toast ref={toast} />
      <GenericMaintenanceTable<RoleWithPermissions>
        entityName="Role"
        entityNamePlural="Role-ok"
        emptyEntity={emptyRole}
        columns={columns}
        apiPath="/api/role"
        formFields={formFields}
        onRowDoubleClick={handleRowDoubleClick}
      />

      <Dialog 
        header={`Jogosultságok kezelése - ${selectedRole?.name}`}
        visible={permissionDialog}
        style={{ width: '70vw' }}
        onHide={() => setPermissionDialog(false)}
        footer={permissionDialogFooter}
      >
        <Card>
          <PickList
            dataKey="id"
            source={availablePermissions}
            target={selectedPermissions}
            onChange={handlePermissionChange}
            itemTemplate={permissionTemplate}
            filter
            filterBy="id"
            breakpoint="1280px"
            sourceHeader="Elérhető jogosultságok"
            targetHeader="Kiválasztott jogosultságok"
            sourceStyle={{ height: '400px' }}
            targetStyle={{ height: '400px' }}
            sourceFilterPlaceholder="Keresés..."
            targetFilterPlaceholder="Keresés..."
            // loading={loading}
          />
        </Card>
      </Dialog>
    </div>
  );
}