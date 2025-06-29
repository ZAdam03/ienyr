'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';

interface Item {
    id: string;
    eid: string;
    description: string;
    serialNumber: string;
    status: string;
    toolbookName?: string | null;
    roomOrCabinet?: string | null;
}

export default function ModelDetailTable({ items }: { items: Item[] }) {
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        description: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        serialNumber: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        status: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        eid: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        id: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        toolbookName: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        roomOrCabinet: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    });

    const [selectedModel, setSelectedModel] = useState<Item | null>(null);
    const router = useRouter();

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFilters(prev => ({
            ...prev,
            global: { ...prev.global, value },
        }));
    };

    const header = (
        <IconField iconPosition="left">
            <InputIcon className="pi pi-search" />
            <InputText
                type="search"
                onChange={onGlobalFilterChange}
                placeholder="Keresés minden mezőben..."
            />
        </IconField>
    );

    function handleRowDoubleClick(event: import('primereact/datatable').DataTableRowClickEvent) {
        const item = event.data as Item;
        if (!item?.id) return; // védelmi ellenőrzés
        router.push(`/item/model/${item.id}`);
    };

    return (
        <div className="card">
            <DataTable
                value={items}
                paginator
                rows={5}
                header={header}
                filters={filters}
                onFilter={(e) => setFilters(e.filters)}
                selection={selectedModel}
                onSelectionChange={(e) => setSelectedModel(e.value as Item)}
                selectionMode="single"
                dataKey="id"
                emptyMessage="Nincs találat."
                tableStyle={{ minWidth: '60rem' }}
                rowsPerPageOptions={[10, 25, 50]}
                onRowDoubleClick={handleRowDoubleClick}
            >
                <Column field="id" header="Eszközszám" sortable filter filterPlaceholder="Eszközszám keresése" style={{ width: '10%' }} />
                <Column field="eid" header="Berendezésszám" sortable filter filterPlaceholder="Berendezésszám keresése" style={{ width: '10%' }} />
                <Column field="description" header="SAP leírás" sortable filter filterPlaceholder="Leírásban keresés" style={{ width: '20%' }} />
                <Column field="serialNumber" header="Gyári szám" sortable filter filterPlaceholder="Gyári szám keresése" style={{ width: '10%' }} />
                <Column field="status" header="Státusz" sortable filter filterPlaceholder="Státusz keresése" style={{ width: '10%' }} />
                <Column field="toolbookName" header="Akinek a nevén van" sortable filter filterPlaceholder="Nevek keresése" style={{ width: '20%' }} />
                <Column field="roomOrCabinet" header="Hely ahol van" sortable filter filterPlaceholder="Hely keresése" style={{ width: '20%' }} />
            </DataTable>
        </div>
    );
}
