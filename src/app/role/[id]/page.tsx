// src/app/role/[id]/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { PickList } from 'primereact/picklist';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ALL_PERMISSIONS, PERMISSIONS, Permission } from '@/lib/permissions';

interface RoleDetail {
    id: string;
    name: string;
    description: string | null;
    azureGroupId: string;
    permissions: {
        id: string;
        permissionName: Permission;
    }[];
}

export default function RoleDetailPage() {
    const params = useParams();
    const roleId = params.id as string;
    
    const [role, setRole] = useState<RoleDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sourcePermissions, setSourcePermissions] = useState<Permission[]>([]);
    const [targetPermissions, setTargetPermissions] = useState<Permission[]>([]);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadRoleData();
    }, [roleId]);

    const loadRoleData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/role/${roleId}`);
            if (!response.ok) throw new Error('Failed to load role');
            
            const roleData: RoleDetail = await response.json();
            setRole(roleData);
            
            // Permissions beállítása a PickList-hez
            const currentPermissions = roleData.permissions.map(p => p.permissionName);
            setTargetPermissions(currentPermissions);
            
            // Forrás: minden permission, ami nincs a jelenlegi listában
            const availablePermissions = ALL_PERMISSIONS.filter(
                p => !currentPermissions.includes(p)
            );
            setSourcePermissions(availablePermissions);
            
        } catch (error) {
            console.error('Error loading role:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Hiba',
                detail: 'Nem sikerült betölteni a role adatait',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePermissionChange = (event: any) => {
        setSourcePermissions(event.source);
        setTargetPermissions(event.target);
    };

    const savePermissions = async () => {
        try {
            setSaving(true);
            const response = await fetch(`/api/role/${roleId}/permissions`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    permissions: targetPermissions
                }),
            });

            if (!response.ok) throw new Error('Failed to save permissions');

            toast.current?.show({
                severity: 'success',
                summary: 'Siker',
                detail: 'Jogosultságok sikeresen mentve',
                life: 3000
            });
        } catch (error) {
            console.error('Error saving permissions:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Hiba',
                detail: 'Nem sikerült menteni a jogosultságokat',
                life: 3000
            });
        } finally {
            setSaving(false);
        }
    };

    const permissionTemplate = (permission: Permission) => {
        // Permission csoport meghatározása
        const group = Object.entries(PERMISSIONS).find(([_, perms]) => 
            perms.includes(permission)
        )?.[0] || 'Egyéb';

        return (
            <div className="flex flex-wrap p-2 align-items-center gap-3">
                <div className="flex-1 flex flex-column gap-1">
                    <span className="font-bold text-sm">{permission}</span>
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-tag text-xs"></i>
                        <span className="text-xs text-gray-500">{group}</span>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-content-center align-items-center" style={{ height: '200px' }}>
                <ProgressSpinner />
            </div>
        );
    }

    if (!role) {
        return (
            <div className="p-4">
                <Card>
                    <p>Role nem található</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="grid p-4">
            <div className="col-12">
                <Toast ref={toast} />
                <Card title={`Role: ${role.name}`}>
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <div className="field">
                                <label className="font-bold">Leírás:</label>
                                <p>{role.description || 'Nincs leírás'}</p>
                            </div>
                        </div>
                        <div className="col-12 md:col-6">
                            <div className="field">
                                <label className="font-bold">Azure Group ID:</label>
                                <p>{role.azureGroupId}</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="col-12">
                <Card 
                    title="Jogosultságok kezelése" 
                    footer={
                        <div className="flex justify-content-end">
                            <Button 
                                label="Jogosultságok mentése" 
                                icon="pi pi-save" 
                                onClick={savePermissions}
                                loading={saving}
                            />
                        </div>
                    }
                >
                    <PickList 
                        dataKey="id"
                        source={sourcePermissions} 
                        target={targetPermissions} 
                        onChange={handlePermissionChange} 
                        itemTemplate={permissionTemplate}
                        filter 
                        filterBy="id"
                        breakpoint="1280px"
                        sourceHeader="Elérhető jogosultságok" 
                        targetHeader="Kijelölt jogosultságok" 
                        sourceStyle={{ height: '24rem' }} 
                        targetStyle={{ height: '24rem' }}
                        sourceFilterPlaceholder="Keresés..." 
                        targetFilterPlaceholder="Keresés..."
                    />
                </Card>
            </div>
        </div>
    );
}