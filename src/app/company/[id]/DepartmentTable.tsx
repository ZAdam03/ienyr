// src/app/company/[id]/DepartmentTable.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Department } from '@prisma/client';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { GenericMaintenanceTable } from '@/components/GenericMaintenanceTable';
import { formatDate } from '@/lib/formateDate';

interface DepartmentTableProps {
    companyId: string;
}

export default function DepartmentTable({ companyId }: DepartmentTableProps) {
    const params = useParams();
    companyId = params?.id as string;

    const emptyDepartment: Department = {
        id: '',
        companyId,
        description: '',
        costCenter: '',
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: null,
        lastModifiedById: null,
    };

    const columns = [
        { field: 'id', header: 'Azonosító', sortable: true },
        { field: 'description', header: 'Leírás', sortable: true, filter: true },
        { field: 'costCenter', header: 'Költséghely', sortable: true },
        { field: 'isActive', header: 'Aktív', sortable: true, body: (row: Department) => row.isActive ? 'Igen' : 'Nem' },
        {
            field: 'createdAt',
            header: 'Létrehozva',
            sortable: true,
            body: (row: Department) => formatDate(row.createdAt),
        },
        {
            field: 'lastModifiedAt',
            header: 'Módosítva',
            sortable: true,
            body: (row: Department) => formatDate(row.lastModifiedAt),
        },
        {
            field: 'lastModifiedBy.name',
            header: 'Módosította',
            sortable: true,
            body: (row: any) => row.lastModifiedBy?.name ?? '',
        },
    ];

    const formFields = (department: Department, onInputChange: any, onActiveChange: any) => (
        <>
            <div className="field">
                <label htmlFor="description" className="font-bold">Leírás</label>
                <InputText id="description" value={department.description} onChange={(e) => onInputChange(e, 'description')} />
            </div>
            <div className="field">
                <label htmlFor="costCenter" className="font-bold">Költséghely</label>
                <InputText id="costCenter" value={department.costCenter ?? ''} onChange={(e) => onInputChange(e, 'costCenter')} />
            </div>
            <div className="field">
                <label htmlFor="isActive" className="font-bold">Aktív</label>
                <InputSwitch id="isActive" checked={department.isActive} onChange={(e) => onActiveChange(e.value)} />
            </div>
        </>
    );

    return (
        <GenericMaintenanceTable<Department>
        entityName="Osztály"
        entityNamePlural="Osztályok"
        emptyEntity={emptyDepartment}
        columns={columns}
        apiPath="/api/department"
        parentId={companyId}
        formFields={formFields}
        />
    );
}