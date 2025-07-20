'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { InputSwitch } from 'primereact/inputswitch';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { Site } from '@prisma/client';

export default function SiteTable() {
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

    const [sites, setSites] = useState<Site[]>([]);
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        description: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    });
    const [siteDialog, setSiteDialog] = useState<boolean>(false);
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);
    const [site, setSite] = useState<Site>(emptySite);
    const [submitted, setSubmitted] = useState<boolean>(false);
    const toast = useRef<Toast>(null);
    const dt = useRef<DataTable<Site[]>>(null);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/site')
            .then(res => res.json())
            .then(data => setSites(data.filter((s: Site) => s.companyId === companyId)))
            .catch(err => console.error('Hiba a telephelyek betöltésekor:', err));
    }, [companyId]);

    const refresh = () => {
        fetch('/api/site')
            .then(res => res.json())
            .then(data => setSites(data.filter((s: Site) => s.companyId === companyId)))
            .catch(err => console.error('Hiba a telephelyek frissítésekor:', err));
    };

    const openNew = () => {
        setSite({ ...emptySite });
        setSubmitted(false);
        setSiteDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setSiteDialog(false);
    };

    const saveSite = () => {
        setSubmitted(true);

        const method = site.id ? 'PATCH' : 'POST';
        const url = site.id ? `/api/site/${site.id}` : '/api/site';

        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(site),
        })
            .then(() => {
                toast.current?.show({ severity: 'success', summary: 'Mentve', detail: 'Telephely mentve', life: 3000 });
                refresh();
                setSiteDialog(false);
            });
    };

    const editSite = (site: Site) => {
        setSite({ ...site });
        setSiteDialog(true);
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>, name: string) => {
        const val = e.target.value;
        setSite(prev => ({ ...prev, [name]: val }));
    };

    const onActiveChange = (val: boolean) => {
        setSite(prev => ({ ...prev, isActive: val }));
    };

    const exportCSV = () => {
        dt.current?.exportCSV();
    };

    const [importDialog, setImportDialog] = useState<boolean>(false);
    const [jsonData, setJsonData] = useState<Site[]>([]);

    const leftToolbarTemplate = () => (
        <div className="flex gap-2">
            <Button label="Új" icon="pi pi-plus" severity="success" onClick={openNew} />
            <Button label="Új JSON-ból" icon="pi pi-download" severity="help" onClick={() => setImportDialog(true)} />
            {selectedSite && (
                <Button label="Módosítás" icon="pi pi-pencil" onClick={() => editSite(selectedSite)} />
            )}
        </div>
    );

    const rightToolbarTemplate = () => (
        <Button label="Export" icon="pi pi-upload" className="p-button-help" onClick={exportCSV} />
    );

    const siteDialogFooter = (
        <>
            <Button label="Mégse" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Mentés" icon="pi pi-check" onClick={saveSite} />
        </>
    );

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFilters((prev) => ({ ...prev, global: { ...prev.global, value } }));
    };

    const renderHeader = () => {
        {/* @ts-ignore */}
        const value = filters.global?.value || '';

        return (
            <IconField iconPosition="left">
                <InputIcon className="pi pi-search" />
                <InputText type="search" value={value} onChange={onGlobalFilterChange} placeholder="Keresés minden mezőben..." />
            </IconField>
        );
    };

    return (
        <div className="card">
            <Toast ref={toast} />
            <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>
            {/* @ts-ignore */}
            <DataTable<Site>
                ref={dt}
                value={sites}
                selection={selectedSite}
                onSelectionChange={(e) => setSelectedSite(e.value as Site)}
                selectionMode="single"
                dataKey="id"
                paginator rows={10} rowsPerPageOptions={[10, 25, 50]}
                filters={filters}
                onFilter={(e) => setFilters(e.filters)}
                header={renderHeader()}
                emptyMessage="Nincs találat."
                onRowDoubleClick={(e) => router.push(`/site/${e.data.id}`)}
            >
                <Column selectionMode="single" headerStyle={{ width: '3rem' }} />
                <Column field="id" header="Azonosító" sortable />
                <Column field="description" header="Leírás" sortable filter filterPlaceholder="Keresés leírás szerint" />
                <Column field="city" header="Város" sortable filter filterPlaceholder="Keresés város szerint" />
                <Column field="address" header="Cím" sortable />
                <Column field="address2" header="Cím 2" sortable />
                <Column field="isActive" header="Aktív" sortable />
                <Column field="latitude" header="Szélesség" sortable />
                <Column field="longitude" header="Hosszúság" sortable />
                <Column field="createdAt" header="Létrehozva" sortable />
                <Column field="lastModifiedAt" header="Módosítva" sortable />
                <Column field="lastModifiedBy.name" header="Módosította" sortable />
            </DataTable>

            <Dialog visible={siteDialog} style={{ width: '32rem' }} header="Telephely adatai" modal className="p-fluid" footer={siteDialogFooter} onHide={hideDialog}>
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
            </Dialog>

            <Dialog visible={importDialog} style={{ width: '50rem' }} header="Tömeges JSON import" modal className="p-fluid" onHide={() => setImportDialog(false)}>
            <div className="mb-3">
                <input
                    type="file"
                    accept="application/json"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                                try {
                                    const result = JSON.parse(evt.target?.result as string) as Site[];
                                    const withCompanyId = result.map((item) => ({
                                        ...item,
                                        companyId,
                                        id: '', // új rekordként kezeljük
                                        createdAt: new Date(),
                                        lastModifiedAt: null,
                                        lastModifiedById: null,
                                    }));
                                    setJsonData(withCompanyId);
                                } catch (err) {
                                    toast.current?.show({ severity: 'error', summary: 'Hibás JSON', detail: 'Nem sikerült beolvasni a fájlt', life: 3000 });
                                }
                            };
                            reader.readAsText(file);
                        }
                    }}
                />
            </div>

            {jsonData.length > 0 && (
                <>
                    <DataTable value={jsonData} scrollable scrollHeight="300px">
                        <Column field="description" header="Leírás" />
                        <Column field="zipCode" header="Irányítószám" />
                        <Column field="city" header="Város" />
                        <Column field="address" header="Cím" />
                        <Column field="address2" header="Cím 2" />
                        <Column field="latitude" header="Szélesség" />
                        <Column field="longitude" header="Hosszúság" />
                        <Column field="isActive" header="Aktív" />
                    </DataTable>

                    <div className="mt-4 flex justify-end gap-2">
                        <Button label="Mégse" icon="pi pi-times" outlined onClick={() => {
                            setImportDialog(false);
                            setJsonData([]);
                        }} />
                        <Button label="Mentés" icon="pi pi-check" onClick={async () => {
                            try {
                                await Promise.all(jsonData.map(site =>
                                    fetch('/api/site', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(site),
                                    })
                                ));
                                toast.current?.show({ severity: 'success', summary: 'Siker', detail: 'Telephelyek feltöltve', life: 3000 });
                                setImportDialog(false);
                                setJsonData([]);
                                refresh();
                            } catch (err) {
                                toast.current?.show({ severity: 'error', summary: 'Hiba', detail: 'Nem sikerült menteni', life: 3000 });
                            }
                        }} />
                    </div>
                </>
            )}
            </Dialog>

        </div>
    );
}
