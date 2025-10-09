// src/app/floor/[id]/RoomTable.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Room } from '@prisma/client';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { formatDate } from '@/lib/formateDate';
import { GenericMaintenanceTable } from '@/components/GenericMaintenanceTable';
import Link from 'next/link';
import router from 'next/router';

export default function RoomTable() {
    const params = useParams();
    const floorId = params?.id as string;
    const [departments, setDepartments] = useState<any[]>([]);

    useEffect(() => {
        // Betöltjük az osztályokat a dropdownhoz
        fetch('/api/department')
            .then(res => res.json())
            .then(data => {
                // Formázzuk a megjelenítendő értékeket
                const formatted = data.map((dept: any) => ({
                    ...dept,
                    label: `${dept.description}${dept.costCenter ? ` (${dept.costCenter})` : ''}`
                }));
                setDepartments(formatted);
            });
    }, []);

    const emptyRoom: Room = {
        id: '',
        floorId,
        departmentId: null,
        description: '',
        number: 0,
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: null,
        lastModifiedById: null,
    };

    const columns = [
        { field: 'id', header: 'Azonosító', sortable: true },
        { field: 'description', header: 'Leírás', sortable: true, filter: true },
        { field: 'number', header: 'Szoba szám', sortable: true },
        // Módosított oszlop definíció a RoomTable-ban
        // Módosított oszlop definíció a RoomTable-ban
        {
            field: 'department.label', 
            header: 'Osztály', 
            sortable: true,
            body: (row: any) => row.department ? (
                <Link 
                href={`/department/${row.department.id}`} 
                className="text-primary hover:underline cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/department/${row.department.id}`);
                }}
                >
                {`${row.department.description}${row.department.costCenter ? ` (${row.department.costCenter})` : ''}`}
                </Link>
            ) : '-'
        },
        { field: 'isActive', header: 'Aktív', sortable: true, body: (row: Room) => row.isActive ? 'Igen' : 'Nem' },
        {
            field: 'createdAt',
            header: 'Létrehozva',
            sortable: true,
            body: (row: Room) => formatDate(row.createdAt),
        },
        {
            field: 'lastModifiedAt',
            header: 'Módosítva',
            sortable: true,
            body: (row: Room) => formatDate(row.lastModifiedAt),
        },
        {
            field: 'lastModifiedBy.name',
            header: 'Módosította',
            sortable: true,
            body: (row: any) => row.lastModifiedBy?.name ?? '',
        },
    ];

    const formFields = (room: Room, onInputChange: any, onActiveChange: any) => (
        <>
            <div className="field">
                <label htmlFor="description" className="font-bold">Leírás</label>
                <InputText id="description" value={room.description} onChange={(e) => onInputChange(e, 'description')} />
            </div>
            <div className="field">
                <label htmlFor="number" className="font-bold">Szoba száma</label>
                <InputNumber 
                    id="number" 
                    value={room.number ?? undefined} 
                    onValueChange={(e) => onInputChange({ target: { value: e.value } }, 'number')} 
                />
            </div>
            <div className="field">
                <label htmlFor="departmentId" className="font-bold">Osztály</label>
                <Dropdown
                    id="departmentId"
                    options={[
                        { label: 'Nincs osztály kiválasztva', value: null },
                        ...departments
                    ]}
                    optionLabel="label"
                    optionValue="id"
                    value={room.departmentId}
                    onChange={(e) => onInputChange({ target: { value: e.value } }, 'departmentId')}
                    placeholder="Válassz osztályt"
                    filter
                    filterBy="label"
                    showClear
                />
            </div>
            <div className="field">
                <label htmlFor="isActive" className="font-bold">Aktív</label>
                <InputSwitch id="isActive" checked={room.isActive} onChange={(e) => onActiveChange(e.value)} />
            </div>
        </>
    );

    return (
        <GenericMaintenanceTable<Room>
            entityName="room"
            entityNamePlural="Szobák"
            emptyEntity={emptyRoom}
            columns={columns}
            apiPath="/api/room"
            parentId={floorId}
            formFields={formFields}
        />
    );
}