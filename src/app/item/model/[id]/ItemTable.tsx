// src/app/item/model/[id]/ItemTable.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Item, ItemStatus } from '@prisma/client';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { GenericMaintenanceTable } from '@/components/GenericMaintenanceTable';
import { formatDate } from '@/lib/formateDate';

export default function ItemTable() {
    const [models, setModels] = useState<any[]>([]);
    
    useEffect(() => {
        fetch('/api/model')
            .then(res => res.json())
            .then(data => setModels(data));
    }, []);

    const emptyItem: Item = {
        id: '',
        eid: '',
        description: '',
        modelId: '',
        serialNumber: '',
        status: 'új',
    };

    const statusOptions = [
        { label: 'Új', value: 'új' },
        { label: 'Aktív', value: 'aktív' },
        { label: 'Selejtezett', value: 'selejtezett' }
    ];

    const columns = [
        { field: 'id', header: 'Azonosító', sortable: true },
        { field: 'eid', header: 'EID', sortable: true },
        { field: 'description', header: 'Leírás', sortable: true, filter: true },
        { field: 'model.brand', header: 'Márka', sortable: true },
        { field: 'model.model', header: 'Modell', sortable: true },
        { field: 'serialNumber', header: 'Sorozatszám', sortable: true },
        { field: 'status', header: 'Státusz', sortable: true },
        {
            field: 'createdAt',
            header: 'Létrehozva',
            sortable: true,
            // body: (row: Item) => formatDate(row.createdAt),
        },
    ];

    const formFields = (item: Item, onInputChange: any) => (
        <>
            <div className="field">
                <label htmlFor="id" className="font-bold">Azonosító</label>
                <InputText id="id" value={item.id} onChange={(e) => onInputChange(e, 'id')} />
            </div>
            <div className="field">
                <label htmlFor="eid" className="font-bold">EID</label>
                <InputText id="eid" value={item.eid ?? ''} onChange={(e) => onInputChange(e, 'eid')} />
            </div>
            <div className="field">
                <label htmlFor="description" className="font-bold">Leírás</label>
                <InputText id="description" value={item.description} onChange={(e) => onInputChange(e, 'description')} />
            </div>
            <div className="field">
                <label htmlFor="modelId" className="font-bold">Modell</label>
                <Dropdown
                    id="modelId"
                    options={models}
                    optionLabel="brand"
                    optionValue="id"
                    value={item.modelId}
                    onChange={(e) => onInputChange({ target: { value: e.value } }, 'modelId')}
                    placeholder="Válassz modellt"
                />
            </div>
            <div className="field">
                <label htmlFor="serialNumber" className="font-bold">Sorozatszám</label>
                <InputText id="serialNumber" value={item.serialNumber ?? ''} onChange={(e) => onInputChange(e, 'serialNumber')} />
            </div>
            <div className="field">
                <label htmlFor="status" className="font-bold">Státusz</label>
                <Dropdown
                    id="status"
                    options={statusOptions}
                    value={item.status}
                    onChange={(e) => onInputChange({ target: { value: e.value } }, 'status')}
                />
            </div>
        </>
    );

    return (
        <GenericMaintenanceTable<Item>
            entityName="item"
            entityNamePlural="Eszközök"
            emptyEntity={emptyItem}
            columns={columns}
            apiPath="/api/item"
            formFields={formFields}
        />
    );
}