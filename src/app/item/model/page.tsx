'use client';

import React, { useEffect, useState } from 'react';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Model } from '@prisma/client';

export default function ViewModels() {
    const [models, setModels] = useState<Model[]>([]);
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        model: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        brand: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        type: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    });
    const [selectedModel, setSelectedModel] = useState<Model | null>(null);

    useEffect(() => {
        fetch('/api/model')
            .then((res) => res.json())
            .then((data: Model[]) => setModels(data))
            .catch((err) => console.error('Hiba a modellek betöltésekor:', err));
    }, []);

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
            <DataTable
                value={models}
                paginator
                rows={5}
                header={header}
                filters={filters}
                onFilter={(e) => setFilters(e.filters)}
                selection={selectedModel}
                onSelectionChange={(e) => setSelectedModel(e.value as Model)}
                selectionMode="single"
                dataKey="id"
                emptyMessage="Nincs találat."
                tableStyle={{ minWidth: '60rem' }}
                rowsPerPageOptions={[10, 25, 50]}
            >
                <Column field="id" header="Azonosító" sortable filter filterPlaceholder="Azonosító keresése" style={{ width: '20%' }} />
                <Column field="type" header="Típus" sortable filter filterPlaceholder="Típus keresése" style={{ width: '20%' }} />
                <Column field="brand" header="Gyártó" sortable filter filterPlaceholder="Gyártó keresése" style={{ width: '20%' }} />
                <Column field="model" header="Modell" sortable filter filterPlaceholder="Modell keresése" style={{ width: '20%' }} />
                <Column field="weight" header="Súly (kg)" sortable style={{ width: '10%' }} />
                {/* <Column
                    field="picture"
                    header="Kép"
                    body={(rowData) =>
                        rowData.picture ? (
                            <img src={rowData.picture} alt="model pic" style={{ maxWidth: '40px', maxHeight: '40px' }} />
                        ) : (
                            <span>Nincs kép</span>
                        )
                    }
                    style={{ width: '20%' }}
                /> */}
            </DataTable>
        </div>
    );
}

<link rel="stylesheet" href="" />