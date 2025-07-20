// src/app/company/[id]/SiteTable.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Site } from '@prisma/client';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { GenericMaintenanceTable } from '@/components/GenericMaintenanceTable';
import { formatDate } from '@/lib/formateDate';

export default function SiteTable2() {
    const params = useParams();
    const companyId = params?.id as string;

    const emptySite: Site = {
        id: '',
        companyId,
        description: '',
        zipCode: '',
        city: '',
        address: '',
        address2: '',
        latitude: null,
        longitude: null,
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: null,
        lastModifiedById: null,
    };

    const columns = [
        { field: 'id', header: 'Azonosító', sortable: true },
        { field: 'description', header: 'Leírás', sortable: true, filter: true, filterPlaceholder: 'Keresés leírás szerint' },
        { field: 'city', header: 'Város', sortable: true, filter: true, filterPlaceholder: 'Keresés város szerint' },
        { field: 'address', header: 'Cím', sortable: true },
        { field: 'address2', header: 'Cím 2', sortable: true },
        { field: 'isActive', header: 'Aktív', sortable: true, body: (row: Site) => row.isActive ? 'Igen' : 'Nem' },
        { field: 'latitude', header: 'Szélesség', sortable: true },
        { field: 'longitude', header: 'Hosszúság', sortable: true },
        {
            field: 'createdAt',
            header: 'Létrehozva',
            sortable: true,
            body: (row: Site) => formatDate(row.createdAt),
        },
        {
            field: 'lastModifiedAt',
            header: 'Módosítva',
            sortable: true,
            body: (row: Site) => formatDate(row.lastModifiedAt),
        },
        {
            field: 'lastModifiedBy.name',
            header: 'Módosította',
            sortable: true,
            body: (row: any) => row.lastModifiedBy?.name ?? '',
        },
    ];


    const formFields = (site: Site, onInputChange: any, onActiveChange: any) => (
        <>
        <div className="field">
            <label htmlFor="description" className="font-bold">Leírás</label>
            <InputText id="description" value={site.description} onChange={(e) => onInputChange(e, 'description')} />
        </div>
        <div className="field">
            <label htmlFor="zipCode" className="font-bold">Irányítószám</label>
            <InputText id="zipCode" value={site.zipCode} onChange={(e) => onInputChange(e, 'zipCode')} />
        </div>
        <div className="field">
            <label htmlFor="city" className="font-bold">Város</label>
            <InputText id="city" value={site.city} onChange={(e) => onInputChange(e, 'city')} />
        </div>
        <div className="field">
            <label htmlFor="address" className="font-bold">Cím</label>
            <InputText id="address" value={site.address} onChange={(e) => onInputChange(e, 'address')} />
        </div>
        <div className="field">
            <label htmlFor="address2" className="font-bold">Cím 2</label>
            <InputText id="address2" value={site.address2 ?? ''} onChange={(e) => onInputChange(e, 'address2')} />
        </div>
        <div className="field">
            <label htmlFor="latitude" className="font-bold">Szélesség (Latitude)</label>
            <InputText id="latitude" value={site.latitude !== null && site.latitude !== undefined ? String(site.latitude) : ''} onChange={(e) => onInputChange(e, 'latitude')} />
        </div>
        <div className="field">
            <label htmlFor="longitude" className="font-bold">Hosszúság (Longitude)</label>
            <InputText id="longitude" value={site.longitude !== null && site.longitude !== undefined ? String(site.longitude) : ''} onChange={(e) => onInputChange(e, 'longitude')} />
        </div>
        <div className="field">
            <label htmlFor="isActive" className="font-bold">Aktív</label>
            <InputSwitch id="isActive" checked={site.isActive} onChange={(e) => onActiveChange(e.value)} />
        </div>
        </>
    );

    return (
        <GenericMaintenanceTable<Site>
        entityName="site"
        entityNamePlural="Telephelyek"
        emptyEntity={emptySite}
        columns={columns}
        apiPath="/api/site"
        parentId={companyId}
        formFields={formFields}
        />
    );
}