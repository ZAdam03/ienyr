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
    type: string;
    brand: string;
    model: string;
    description: string;
    serialNumber: string;
    status: string;
    toolbookName?: string | null;
    roomOrCabinet?: string | null;
}

export default function AllItemsTable({ items }: { items: Item[] }) {
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        id: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        eid: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        type: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        brand: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        model: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        description: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        serialNumber: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        status: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        toolbookName: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        roomOrCabinet: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    });

    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
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

    const onRowDoubleClick = (event: import('primereact/datatable').DataTableRowClickEvent) => {
        const item = event.data as Item;
        if (!item?.id) return;
        router.push(`/item/model/${item.id}`);
    };

    return (
        <div className="card">
            <DataTable
                value={items}
                paginator
                rows={10}
                header={header}
                filters={filters}
                onFilter={(e) => setFilters(e.filters)}
                selection={selectedItem}
                onSelectionChange={(e) => setSelectedItem(e.value as Item)}
                selectionMode="single"
                dataKey="id"
                emptyMessage="Nincs találat."
                tableStyle={{ minWidth: '80rem' }}
                rowsPerPageOptions={[10, 25, 50]}
                onRowDoubleClick={onRowDoubleClick}
            >
                <Column field="id" header="Eszközszám" sortable filter />
                <Column field="eid" header="Berendezésszám" sortable filter />
                <Column field="type" header="Típus" sortable filter />
                <Column field="brand" header="Gyártó" sortable filter />
                <Column field="model" header="Modell" sortable filter />
                <Column field="description" header="SAP leírás" sortable filter />
                <Column field="serialNumber" header="Gyári szám" sortable filter />
                <Column field="status" header="Státusz" sortable filter />
                <Column field="toolbookName" header="Akinek a nevén van" sortable filter />
                <Column field="roomOrCabinet" header="Hely ahol van" sortable filter />
            </DataTable>
        </div>
    );
}
