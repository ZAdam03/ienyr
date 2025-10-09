// src/app/company/CompanyTable.tsx
'use client';

import React from 'react';
import { Company } from '@prisma/client';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { GenericMaintenanceTable } from '@/components/GenericMaintenanceTable';
import { formatDate } from '@/lib/formateDate';

export default function CompanyTable() {
    const emptyCompany: Company = {
        id: '',
        description: '',
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: null,
        lastModifiedById: null,
    };

    const columns = [
        { field: 'id', header: 'Azonosító', sortable: true },
        { field: 'description', header: 'Leírás', sortable: true, filter: true, filterPlaceholder: 'Keresés leírás szerint' },
        { field: 'isActive', header: 'Aktív', sortable: true, body: (row: Company) => row.isActive ? 'Igen' : 'Nem' },
        {
            field: 'createdAt',
            header: 'Létrehozva',
            sortable: true,
            body: (row: Company) => formatDate(row.createdAt),
        },
        {
            field: 'lastModifiedAt',
            header: 'Módosítva',
            sortable: true,
            body: (row: Company) => formatDate(row.lastModifiedAt),
        },
        {
            field: 'lastModifiedBy.name',
            header: 'Módosította',
            sortable: true,
            body: (row: any) => row.lastModifiedBy?.name ?? '',
        },
    ];

    const formFields = (company: Company, onInputChange: any, onActiveChange: any) => (
        <>
            <div className="field">
                <label htmlFor="description" className="font-bold">Leírás</label>
                <InputText id="description" value={company.description} onChange={(e) => onInputChange(e, 'description')} />
            </div>
            <div className="field">
                <label htmlFor="isActive" className="font-bold">Aktív</label>
                <InputSwitch id="isActive" checked={company.isActive} onChange={(e) => onActiveChange(e.value)} />
            </div>
        </>
    );

    return (
        <GenericMaintenanceTable<Company>
            entityName="company"
            entityNamePlural="Cégek"
            emptyEntity={emptyCompany}
            columns={columns}
            apiPath="/api/company"
            formFields={formFields}
        />
    );
}