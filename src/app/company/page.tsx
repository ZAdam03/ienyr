'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useRouter } from 'next/navigation';

interface Company {
  id: number | null;
  description: string;
}

export default function CompanyTable() {
    const emptyCompany: Company = { id: null, description: '' };

    const [companies, setCompanies] = useState<Company[]>([]);
    const [companyDialog, setCompanyDialog] = useState<boolean>(false);
    const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
    const [company, setCompany] = useState<Company>(emptyCompany);
    const [submitted, setSubmitted] = useState<boolean>(false);
    const toast = useRef<Toast>(null);
    const dt = useRef<DataTable<Company[]>>(null);

    useEffect(() => {
        fetch('/api/company')
        .then(res => res.json())
        .then(data => setCompanies(data));
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
        .then(data => setCompanies(data));
    };

    const editCompany = (company: Company) => {
        setCompany({ ...company });
        setCompanyDialog(true);
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>, name: string) => {
        const val = e.target.value;
        setCompany(prev => ({ ...prev, [name]: val }));
    };

    const router = useRouter();
    function handleRowDoubleClick(event: import('primereact/datatable').DataTableRowClickEvent) {
        const company = event.data as Company;
        if (!company?.id) return; // védelmi ellenőrzés
        router.push(`/company/${company.id}`);
    };

    const leftToolbarTemplate = () => (
        <div className="flex gap-2">
        <Button label="New" icon="pi pi-plus" severity="success" onClick={openNew} />
        </div>
    );

    const actionBodyTemplate = (rowData: Company) => (
        <Button icon="pi pi-pencil" rounded outlined onClick={() => editCompany(rowData)} />
    );

    const companyDialogFooter = (
        <>
        <Button label="Cancel" icon="pi pi-times" outlined onClick={hideDialog} />
        <Button label="Save" icon="pi pi-check" onClick={saveCompany} />
        </>
    );

    return (
        <div className="card">
            <Toast ref={toast} />
            <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

            <DataTable
                ref={dt}
                value={companies}
                selection={selectedCompanies}
                onSelectionChange={(e) => {
                    if (Array.isArray(e.value)) setSelectedCompanies(e.value);
                }}
                onRowDoubleClick={handleRowDoubleClick}
                dataKey="id"
                selectionMode="multiple"
                paginator rows={10}
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                <Column field="id" header="Azonosító" sortable />
                <Column field="description" header="Leírás" sortable/>
                <Column field="isActive" header="Aktív" sortable/>
                <Column field="createdAt" header="Létrehozás dátuma" sortable/>
                <Column body={actionBodyTemplate} exportable={false} />
            </DataTable>

            <Dialog visible={companyDialog} style={{ width: '32rem' }} header="Company Details" modal className="p-fluid" footer={companyDialogFooter} onHide={hideDialog}>
                <div className="field">
                <label htmlFor="description" className="font-bold">
                    Leírás
                </label>
                <InputText id="description" value={company.description} onChange={(e) => onInputChange(e, 'description')} />
                </div>
            </Dialog>
        </div>
    );
}
