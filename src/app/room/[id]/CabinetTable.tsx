// src/app/room/[id]/CabinetTable.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Cabinet } from '@prisma/client';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { GenericMaintenanceTable } from '@/components/GenericMaintenanceTable';
import { formatDate } from '@/lib/formateDate';

export default function CabinetTable() {
    const params = useParams();
    const roomId = params?.id as string;

    const emptyCabinet: Cabinet = {
        id: '',
        roomId,
        description: '',
        letter: '',
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: null,
        lastModifiedById: null,
    };

    const columns = [
        { field: 'id', header: 'Azonosító', sortable: true },
        { field: 'description', header: 'Leírás', sortable: true, filter: true },
        { field: 'letter', header: 'Betűjel', sortable: true },
        { field: 'isActive', header: 'Aktív', sortable: true, body: (row: Cabinet) => row.isActive ? 'Igen' : 'Nem' },
        {
            field: 'createdAt',
            header: 'Létrehozva',
            sortable: true,
            body: (row: Cabinet) => formatDate(row.createdAt),
        },
        {
            field: 'lastModifiedAt',
            header: 'Módosítva',
            sortable: true,
            body: (row: Cabinet) => formatDate(row.lastModifiedAt),
        },
        {
            field: 'lastModifiedBy.name',
            header: 'Módosította',
            sortable: true,
            body: (row: any) => row.lastModifiedBy?.name ?? '',
        },
    ];

    const formFields = (cabinet: Cabinet, onInputChange: any, onActiveChange: any) => (
        <>
            <div className="field">
                <label htmlFor="description" className="font-bold">Leírás</label>
                <InputText id="description" value={cabinet.description ?? ''} onChange={(e) => onInputChange(e, 'description')} />
            </div>
            <div className="field">
                <label htmlFor="letter" className="font-bold">Betűjel</label>
                <InputText id="letter" value={cabinet.letter ?? ''} onChange={(e) => onInputChange(e, 'letter')} />
            </div>
            <div className="field">
                <label htmlFor="isActive" className="font-bold">Aktív</label>
                <InputSwitch id="isActive" checked={cabinet.isActive} onChange={(e) => onActiveChange(e.value)} />
            </div>
        </>
    );

    return (
        <GenericMaintenanceTable<Cabinet>
            entityName="cabinet"
            entityNamePlural="Szekrények"
            emptyEntity={emptyCabinet}
            columns={columns}
            apiPath="/api/cabinet"
            parentId={roomId}
            formFields={formFields}
        />
    );
}