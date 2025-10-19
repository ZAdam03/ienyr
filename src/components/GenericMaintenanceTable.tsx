// src/components/GenericMaintenanceTable.tsx
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
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { FilterMatchMode, FilterOperator } from 'primereact/api';

interface GenericTableProps<T> {
    entityName: string;
    entityNamePlural: string;
    emptyEntity: T;
    columns: {
        field: string;
        header: string;
        sortable?: boolean;
        filter?: boolean;
        filterPlaceholder?: string;
        body?: (rowData: T) => React.ReactNode;
    }[];
    apiPath: string;
    parentId?: string;
    formFields: (entity: T, onInputChange: (e: React.ChangeEvent<HTMLInputElement>, name: string) => void, onActiveChange?: (val: boolean) => void) => React.ReactNode;
    additionalToolbarButtons?: (leftToolbarTemplate: () => React.ReactNode, selectedEntity: T | null) => React.ReactNode;
    onRowDoubleClick?: (entity: T) => void;
    importFields?: string[]; // Fields to show in import preview
}

export function GenericMaintenanceTable<T extends { id: string; isActive?: boolean; createdAt?: Date; lastModifiedAt?: Date | null }>({
    entityName,
    entityNamePlural,
    emptyEntity,
    columns,
    apiPath,
    parentId,
    formFields,
    additionalToolbarButtons,
    onRowDoubleClick,
    importFields,
    }: GenericTableProps<T>) {
    const params = useParams();
    const router = useRouter();

    const [entities, setEntities] = useState<T[]>([]);
    const [filters, setFilters] = useState<DataTableFilterMeta>(() => {
        // Alap szűrőkonfiguráció létrehozása dinamikusan a oszlopok alapján
        const initialFilters: DataTableFilterMeta = {
            global: { value: null, matchMode: FilterMatchMode.CONTAINS }
        };

        // Minden szűrhető oszlophoz hozzáadjuk a szűrőkonfigurációt
        columns.forEach(column => {
            if (column.filter) {
            initialFilters[column.field] = { 
                operator: FilterOperator.AND, 
                constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] 
            };
            }
        });
        return initialFilters;
    });

    const [entityDialog, setEntityDialog] = useState<boolean>(false);
    const [selectedEntity, setSelectedEntity] = useState<T | null>(null);
    const [entity, setEntity] = useState<T>(emptyEntity);
    const [submitted, setSubmitted] = useState<boolean>(false);
    const toast = useRef<Toast>(null);
    const dt = useRef<DataTable<T[]>>(null);
    const [importDialog, setImportDialog] = useState<boolean>(false);
    const [jsonData, setJsonData] = useState<T[]>([]);

    useEffect(() => {
        refresh();
    }, [parentId]);

    const refresh = () => {
        fetch(apiPath)
        .then(res => res.json())
        .then(data => {
            if (parentId) {
            // Filter by parentId if it exists in the entity
            const filtered = data.filter((e: any) => 
                e.companyId === parentId || 
                e.siteId === parentId || 
                e.buildingId === parentId || 
                e.floorId === parentId || 
                e.roomId === parentId || 
                e.cabinetId === parentId || 
                e.departmentId === parentId);
            setEntities(filtered);
            } else {
            setEntities(data);
            }
        })
        .catch(err => console.error(`Hiba a ${entityNamePlural} betöltésekor:`, err));
    };

    const openNew = () => {
        const newEntity = { ...emptyEntity };
        if (parentId) {
        // Set parentId if it exists in the entity
        if ('companyId' in newEntity) (newEntity as any).companyId = parentId;
        if ('siteId' in newEntity) (newEntity as any).siteId = parentId;
        if ('buildingId' in newEntity) (newEntity as any).buildingId = parentId;
        if ('floorId' in newEntity) (newEntity as any).floorId = parentId;
        if ('roomId' in newEntity) (newEntity as any).roomId = parentId;
        if ('cabinetId' in newEntity) (newEntity as any).cabinetId = parentId;
        if ('departmentId' in newEntity) (newEntity as any).departmentId = parentId;
        }
        setEntity(newEntity);
        setSubmitted(false);
        setEntityDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setEntityDialog(false);
    };

    const saveEntity = () => {
        setSubmitted(true);

        const method = entity.id ? 'PATCH' : 'POST';
        const url = entity.id ? `${apiPath}/${entity.id}` : apiPath;

        fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entity),
        })
        .then(() => {
            toast.current?.show({ 
            severity: 'success', 
            summary: 'Mentve', 
            detail: `${entityName} mentve`, 
            life: 3000 
            });
            refresh();
            setEntityDialog(false);
        })
        .catch(err => {
            toast.current?.show({ 
            severity: 'error', 
            summary: 'Hiba', 
            detail: `Nem sikerült menteni a ${entityName.toLowerCase()}t`, 
            life: 3000 
            });
            console.error(err);
        });
    };

    const editEntity = (entity: T) => {
        setEntity({ ...entity });
        setEntityDialog(true);
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>, name: string) => {
        const val = e.target.value;
        setEntity(prev => ({ ...prev, [name]: val }));
    };

    const onActiveChange = (val: boolean) => {
        setEntity(prev => ({ ...prev, isActive: val }));
    };

    const exportCSV = () => {
        dt.current?.exportCSV();
    };

    const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
            const result = JSON.parse(evt.target?.result as string) as T[];
            const withParentId = result.map((item) => ({
                ...item,
                ...(parentId && { 
                companyId: parentId,
                siteId: parentId,
                buildingId: parentId,
                floorId: parentId,
                roomId: parentId,
                cabinetId: parentId,
                departmentId: parentId
                }),
                id: '', // új rekordként kezeljük
                createdAt: new Date(),
                lastModifiedAt: null,
                lastModifiedById: null,
            }));
            setJsonData(withParentId);
            } catch (err) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Hibás JSON', 
                detail: 'Nem sikerült beolvasni a fájlt', 
                life: 3000 
            });
            }
        };
        reader.readAsText(file);
        }
    };

    const saveImportedData = async () => {
        try {
        await Promise.all(jsonData.map(entity =>
            fetch(apiPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entity),
            })
        ));
        toast.current?.show({ 
            severity: 'success', 
            summary: 'Siker', 
            detail: `${entityNamePlural} feltöltve`, 
            life: 3000 
        });
        setImportDialog(false);
        setJsonData([]);
        refresh();
        } catch (err) {
        toast.current?.show({ 
            severity: 'error', 
            summary: 'Hiba', 
            detail: 'Nem sikerült menteni', 
            life: 3000 
        });
        }
    };

    const leftToolbarTemplate = () => (
        <div className="flex gap-2">
        <Button label="Új" icon="pi pi-plus" severity="success" onClick={openNew} />
        <Button 
            label="JSON import" 
            icon="pi pi-upload" 
            severity="help" 
            onClick={() => setImportDialog(true)} 
        />
        {selectedEntity && (
            <Button label="Módosítás" icon="pi pi-pencil" onClick={() => editEntity(selectedEntity)} />
        )}
        {additionalToolbarButtons && additionalToolbarButtons(leftToolbarTemplate, selectedEntity)}
        </div>
    );

    const rightToolbarTemplate = () => (
        <Button label="Export" icon="pi pi-download" className="p-button-help" onClick={exportCSV} />
    );

    const entityDialogFooter = (
        <>
        <Button label="Mégse" icon="pi pi-times" outlined onClick={hideDialog} />
        <Button label="Mentés" icon="pi pi-check" onClick={saveEntity} />
        </>
    );

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFilters((prev) => ({ ...prev, global: { ...prev.global, value } }));
    };

    const renderHeader = () => {

        const value = (filters.global && 'value' in filters.global ? filters.global.value : '') || '';

        return (
        <IconField iconPosition="left">
            <InputIcon className="pi pi-search" />
            <InputText 
            type="search" 
            value={value} 
            onChange={onGlobalFilterChange} 
            placeholder={`Keresés ${entityNamePlural.toLowerCase()} között...`} 
            />
        </IconField>
        );
    };

    const handleRowDoubleClick = (e: any) => {
        if (onRowDoubleClick) {
        onRowDoubleClick(e.data);
        } else {
        // Default behavior: navigate to entity detail page
        router.push(`/${entityName.toLowerCase()}/${e.data.id}`);
        }
    };

    // Determine which fields to show in import preview
    const previewFields = importFields || 
        columns
        .filter(col => !['id', 'createdAt', 'lastModifiedAt', 'lastModifiedBy'].includes(col.field))
        .map(col => col.field);

    return (
        <div className="card">
        <Toast ref={toast} />
        <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>
        
        {/* @ts-ignore */}
        <DataTable<T>
            ref={dt}
            value={entities}
            selection={selectedEntity}
            onSelectionChange={(e) => setSelectedEntity(e.value as T)}
            selectionMode="single"
            dataKey="id"
            paginator 
            rows={10} 
            rowsPerPageOptions={[10, 25, 50]}
            filters={filters}
            onFilter={(e) => setFilters(e.filters)}
            header={renderHeader()}
            emptyMessage={`Nincs ${entityName.toLowerCase()} találat.`}
            onRowDoubleClick={handleRowDoubleClick}
        >
            <Column selectionMode="single" headerStyle={{ width: '3rem' }} />
            {columns.map((col) => (
            <Column
                key={col.field}
                field={col.field}
                header={col.header}
                sortable={col.sortable}
                filter={col.filter}
                filterPlaceholder={col.filterPlaceholder}
                body={col.body}
            />
            ))}
        </DataTable>

        <Dialog 
            visible={entityDialog} 
            style={{ width: '32rem' }} 
            header={`${entityName} adatai`} 
            modal 
            className="p-fluid" 
            footer={entityDialogFooter} 
            onHide={hideDialog}
        >
            {formFields(entity, onInputChange, onActiveChange)}
        </Dialog>

        <Dialog 
            visible={importDialog} 
            style={{ width: '50rem' }} 
            header={`Tömeges ${entityName} import`} 
            modal 
            className="p-fluid" 
            onHide={() => setImportDialog(false)}
        >
            <div className="mb-3">
            <input
                type="file"
                accept="application/json"
                onChange={handleJsonImport}
            />
            </div>

            {jsonData.length > 0 && (
            <>
                <DataTable value={jsonData} scrollable scrollHeight="300px">
                {previewFields.map(field => (
                    <Column 
                    key={field} 
                    field={field} 
                    header={columns.find(c => c.field === field)?.header || field} 
                    />
                ))}
                </DataTable>

                <div className="mt-4 flex justify-end gap-2">
                <Button 
                    label="Mégse" 
                    icon="pi pi-times" 
                    outlined 
                    onClick={() => {
                    setImportDialog(false);
                    setJsonData([]);
                    }} 
                />
                <Button 
                    label="Mentés" 
                    icon="pi pi-check" 
                    onClick={saveImportedData}
                />
                </div>
            </>
            )}
        </Dialog>
        </div>
    );
}