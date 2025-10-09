// src/app/building/[id]/FloorTable.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Floor } from '@prisma/client';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { GenericMaintenanceTable } from '@/components/GenericMaintenanceTable';
import { formatDate } from '@/lib/formateDate';

export default function FloorTable() {
    const params = useParams();
    const buildingId = params?.id as string;

    const emptyFloor: Floor = {
        id: '',
        buildingId,
        description: 'földszint',
        number: 0,
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: null,
        lastModifiedById: null,
    };

    const columns = [
        { field: 'id', header: 'Azonosító', sortable: true },
        { field: 'description', header: 'Leírás', sortable: true, filter: true },
        { field: 'number', header: 'Szint', sortable: true },
        { field: 'isActive', header: 'Aktív', sortable: true, body: (row: Floor) => row.isActive ? 'Igen' : 'Nem' },
        {
            field: 'createdAt',
            header: 'Létrehozva',
            sortable: true,
            body: (row: Floor) => formatDate(row.createdAt),
        },
        {
            field: 'lastModifiedAt',
            header: 'Módosítva',
            sortable: true,
            body: (row: Floor) => formatDate(row.lastModifiedAt),
        },
        {
            field: 'lastModifiedBy.name',
            header: 'Módosította',
            sortable: true,
            body: (row: any) => row.lastModifiedBy?.name ?? '',
        },
    ];

    const formFields = (floor: Floor, onInputChange: any, onActiveChange: any) => (
        <>
            <div className="field">
                <label htmlFor="description" className="font-bold">Leírás</label>
                <InputText id="description" value={floor.description ?? ''} onChange={(e) => onInputChange(e, 'description')} />
            </div>
            <div className="field">
                <label htmlFor="number" className="font-bold">Szint száma</label>
                <InputNumber 
                    id="number" 
                    value={floor.number ?? 0} 
                    onValueChange={(e) => onInputChange({ target: { value: e.value } }, 'number')} 
                />
            </div>
            <div className="field">
                <label htmlFor="isActive" className="font-bold">Aktív</label>
                <InputSwitch id="isActive" checked={floor.isActive} onChange={(e) => onActiveChange(e.value)} />
            </div>
        </>
    );

    return (
        <GenericMaintenanceTable<Floor>
            entityName="floor"
            entityNamePlural="Szintek"
            emptyEntity={emptyFloor}
            columns={columns}
            apiPath="/api/floor"
            parentId={buildingId}
            formFields={formFields}
        />
    );
}