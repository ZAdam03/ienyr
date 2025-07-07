// company/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { useRouter } from 'next/navigation';
import { InputSwitch } from 'primereact/inputswitch';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { Company } from '@prisma/client';

export default function CompanyTable() {
    const emptyCompany: Company = {
        id: '',
        description: '',
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: null,
        lastModifiedById: null
    };
    const [companies, setCompanies] = useState<Company[]>([]);
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        descripcion: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        isActive: { value: null, matchMode: FilterMatchMode.EQUALS },
        createdAt: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
    });
    const [companyDialog, setCompanyDialog] = useState<boolean>(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [company, setCompany] = useState<Company>(emptyCompany);
    const [submitted, setSubmitted] = useState<boolean>(false);
    const toast = useRef<Toast>(null);
    const dt = useRef<DataTable<Company[]>>(null);
    
    useEffect(() => {
        fetch('/api/company')
            .then(res => res.json())
            .then(data => setCompanies(data))
            .catch((err) => console.error('Hiba a cégek betöltésekor:', err));
    }, []);

    const openNew = () => {
        setCompany(emptyCompany);
        setSubmitted(false);
        setCompanyDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setCompanyDialog(false);
    };

    const saveCompany = () => {
        setSubmitted(true);

        if (company.id) {
            // PATCH
            fetch(`/api/company/${company.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(company),
            }).then(() => {
            toast.current?.show({ severity: 'success', summary: 'Updated', detail: 'Company updated', life: 3000 });
            refresh();
            });
        } else {
            // POST
            fetch('/api/company', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(company),
            }).then(() => {
            toast.current?.show({ severity: 'success', summary: 'Created', detail: 'Company created', life: 3000 });
            refresh();
            });
        }

        setCompanyDialog(false);

    };

    const refresh = () => {
        fetch('/api/company')
        .then(res => res.json())
        .then(data => setCompanies(data))
        .catch((err) => console.error('Hiba a cégek frissítésekor:', err));
    };

    const editCompany = (company: Company) => {
        setCompany({ ...company });
        setCompanyDialog(true);
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>, name: string) => {
        const val = e.target.value;
        setCompany(prev => ({ ...prev, [name]: val }));
    };

    const onActiveChange = (val: boolean) => {
        setCompany(prev => ({ ...prev, isActive: val }));
    };

    const router = useRouter();
    function handleRowDoubleClick(event: import('primereact/datatable').DataTableRowClickEvent) {
        const company = event.data as Company;
        if (!company?.id) return; // védelmi ellenőrzés
        router.push(`/company/${company.id}`);
    };

    const exportCSV = () => {
        dt.current?.exportCSV();
    };

    const leftToolbarTemplate = () => (
        <div className="flex gap-2">
            <Button label="Új" icon="pi pi-plus" severity="success" onClick={openNew} />
            {selectedCompany && (
                <Button label="Módosítás" icon="pi pi-pencil" onClick={() => editCompany(selectedCompany)} />
            )}
        </div>
    );

    const rightToolbarTemplate = () => {
        return <Button label="Export" icon="pi pi-upload" className="p-button-help" onClick={exportCSV} />;
    };

    const actionBodyTemplate = (rowData: Company) => (
        <Button icon="pi pi-pencil" rounded outlined onClick={() => editCompany(rowData)} />
    );

    const companyDialogFooter = (
        <>
        <Button label="Mégse" icon="pi pi-times" outlined onClick={hideDialog} />
        <Button label="Mentés" icon="pi pi-check" onClick={saveCompany} />
        </>
    );

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFilters((prev) => ({
            ...prev,
            global: { ...prev.global, value },
        }));
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

    const header = renderHeader();

    return (
        <div className="card">
            <Toast ref={toast} />
            <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>
            {/* @ts-ignore */}
            <DataTable<Company>
                ref={dt}
                value={companies}
                header={header}
                selection={selectedCompany}
                onSelectionChange={(e) => setSelectedCompany(e.value as Company)}
                selectionMode="single"
                dataKey="id"
                paginator
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                filters={filters}
                onFilter={(e) => setFilters(e.filters)}
                onRowDoubleClick={handleRowDoubleClick}
                emptyMessage="Nincs találat."
            >
                <Column selectionMode="single" headerStyle={{ width: '3rem' }} />
                <Column field="id" header="Azonosító" sortable />
                <Column field="description" header="Leírás" sortable filter filterPlaceholder="Leírás szűrése" />
                <Column field="isActive" header="Aktív" sortable filter filterPlaceholder="I/N" />
                <Column field="createdAt" header="Létrehozás dátuma" sortable/>
                <Column field="lastModifiedAt" header="Utolsó módosítás" sortable />
                <Column field="lastModifiedBy.name" header="Módosította" sortable />
            </DataTable>

            <Dialog visible={companyDialog} style={{ width: '32rem' }} header="Company Details" modal className="p-fluid" footer={companyDialogFooter} onHide={hideDialog}>
                <div className="field">
                    <label htmlFor="description" className="font-bold">
                        Leírás
                    </label>
                    <InputText id="description" value={company.description} onChange={(e) => onInputChange(e, 'description')} />
                </div>
                <div className="field">
                    <label htmlFor="isActive" className="font-bold">Aktív</label>
                    <InputSwitch id="isActive" checked={company.isActive} onChange={(e) => onActiveChange(e.value)} />
                </div>
            </Dialog>
        </div>
    );
}
