'use client';

import { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';

const ALL_COLUMNS = [
    { field: 'id', header: 'Eszközszám' },
    { field: 'eid', header: 'Berendezésszám' },
    { field: 'type', header: 'Típus' },
    { field: 'brand', header: 'Gyártó' },
    { field: 'model', header: 'Modell' },
    { field: 'description', header: 'Leírás' },
    { field: 'serialNumber', header: 'Gyári szám' },
    { field: 'status', header: 'Státusz' },
    { field: 'toolbookName', header: 'Akinek a nevén van' },
    { field: 'roomOrCabinet', header: 'Hely (szoba/szekrény)' },
    { field: 'licenceKeys', header: 'Licenc kulcsok' },
    { field: 'parentId', header: 'Szülő eszköz azonosító' },
    { field: 'parentDescription', header: 'Szülő eszköz leírás' },
    { field: 'scrappageDescription', header: 'Selejtezés leírás' },
    { field: 'scrappageClosedAt', header: 'Selejtezés dátuma' },
];

export default function ViewBuilderTable({ data }: { data: any[] }) {
    const [selectedColumns, setSelectedColumns] = useState(ALL_COLUMNS);

    const columnSelector = (
        <div className="flex align-items-center gap-3 mb-4">
        <MultiSelect
            value={selectedColumns}
            options={ALL_COLUMNS}
            optionLabel="header"
            onChange={(e) => setSelectedColumns(e.value)}
            placeholder="Oszlopok kiválasztása"
            display="chip"
            className="w-full md:w-20rem"
        />
        <Button
            icon="pi pi-refresh"
            label="Alaphelyzet"
            onClick={() => setSelectedColumns(ALL_COLUMNS)}
        />
        </div>
    );

    return (
        <div className="card">
        {columnSelector}
        <DataTable value={data} paginator rows={10} rowsPerPageOptions={[10, 25, 50]}>
            {selectedColumns.map(col => (
            <Column
                key={col.field}
                field={col.field}
                header={col.header}
                sortable
                filter
                filterPlaceholder={`${col.header} keresése`}
            />
            ))}
        </DataTable>
        </div>
    );
}
