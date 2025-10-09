// src/app/site/[id]/BuildingTable.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Building } from '@prisma/client';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { GenericMaintenanceTable } from '@/components/GenericMaintenanceTable';
import { formatDate } from '@/lib/formateDate';

export default function BuildingTable() {
    const params = useParams();
    const siteId = params?.id as string;

    const emptyBuilding: Building = {
        id: '',
        siteId,
        description: '',
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: null,
        lastModifiedById: null,
    };

    const columns = [
        { field: 'id', header: 'Azonosító', sortable: true },
        { field: 'description', header: 'Leírás', sortable: true, filter: true },
        { field: 'isActive', header: 'Aktív', sortable: true, body: (row: Building) => row.isActive ? 'Igen' : 'Nem' },
        {
            field: 'createdAt',
            header: 'Létrehozva',
            sortable: true,
            body: (row: Building) => formatDate(row.createdAt),
        },
        {
            field: 'lastModifiedAt',
            header: 'Módosítva',
            sortable: true,
            body: (row: Building) => formatDate(row.lastModifiedAt),
        },
        {
            field: 'lastModifiedBy.name',
            header: 'Módosította',
            sortable: true,
            body: (row: any) => row.lastModifiedBy?.name ?? '',
        },
    ];

    const formFields = (building: Building, onInputChange: any, onActiveChange: any) => (
        <>
            <div className="field">
                <label htmlFor="description" className="font-bold">Leírás</label>
                <InputText id="description" value={building.description} onChange={(e) => onInputChange(e, 'description')} />
            </div>
            <div className="field">
                <label htmlFor="isActive" className="font-bold">Aktív</label>
                <InputSwitch id="isActive" checked={building.isActive} onChange={(e) => onActiveChange(e.value)} />
            </div>
        </>
    );

    return (
        <GenericMaintenanceTable<Building>
            entityName="building"
            entityNamePlural="Épületek"
            emptyEntity={emptyBuilding}
            columns={columns}
            apiPath="/api/building"
            parentId={siteId}
            formFields={formFields}
        />
    );
}