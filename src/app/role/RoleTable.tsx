// src/app/role/RoleTable.tsx
'use client';

import React from 'react';
import { Role } from '@prisma/client';
import { InputText } from 'primereact/inputtext';
import { GenericMaintenanceTable } from '@/components/GenericMaintenanceTable';
import { formatDate } from '@/lib/formateDate';

export default function RoleTable() {
    const emptyRole: Role = {
        id: '',
        name: '',
        description: '',
        azureGroupId: '',
    };

    const columns = [
        { field: 'id', header: 'Azonosító', sortable: true },
        { field: 'name', header: 'Név', sortable: true, filter: true },
        { field: 'description', header: 'Leírás', sortable: true, filter: true },
        { field: 'azureGroupId', header: 'Azure Group ID', sortable: true },
    ];

    const formFields = (role: Role, onInputChange: any) => (
        <>
            <div className="field">
                <label htmlFor="name" className="font-bold">Név *</label>
                <InputText 
                    id="name" 
                    value={role.name} 
                    onChange={(e) => onInputChange(e, 'name')} 
                    required
                />
            </div>
            <div className="field">
                <label htmlFor="description" className="font-bold">Leírás</label>
                <InputText 
                    id="description" 
                    value={role.description || ''} 
                    onChange={(e) => onInputChange(e, 'description')} 
                />
            </div>
            <div className="field">
                <label htmlFor="azureGroupId" className="font-bold">Azure Group ID *</label>
                <InputText 
                    id="azureGroupId" 
                    value={role.azureGroupId} 
                    onChange={(e) => onInputChange(e, 'azureGroupId')} 
                    required
                    placeholder="Azure AD Group Object ID"
                />
            </div>
        </>
    );

    return (
        <GenericMaintenanceTable<Role>
            entityName="Role"
            entityNamePlural="Role-ok"
            emptyEntity={emptyRole}
            columns={columns}
            apiPath="/api/role"
            formFields={formFields}
            onRowDoubleClick={(role) => window.location.href = `/role/${role.id}`}
        />
    );
}