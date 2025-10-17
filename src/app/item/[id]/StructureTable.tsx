// src/app/item/[id]/StructureTable.tsx
'use client';

import React, { useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { useRouter } from 'next/navigation';

interface StructureMapping {
    id: string;
    parentItem?: {
        id: string;
        description: string;
        eid: string | null;
        model: {
            brand: string;
            model: string;
        };
    };
    childItem?: {
        id: string;
        description: string;
        eid: string | null;
        model: {
            brand: string;
            model: string;
        };
    };
    createdAt: Date;
    createdBy?: {
        name: string;
    };
}

interface StructureTableProps {
    parentItems: StructureMapping[];
    childItems: StructureMapping[];
    currentItemId: string;
}

export default function StructureTable({ parentItems, childItems, currentItemId }: StructureTableProps) {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState<string | null>(null);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const itemBodyTemplate = (rowData: StructureMapping, isParent: boolean) => {
        const item = isParent ? rowData.parentItem : rowData.childItem;
        if (!item) return null;

        return (
            <div 
                className="cursor-pointer text-primary hover:underline"
                onClick={() => router.push(`/item/${item.id}`)}
            >
                <div className="font-bold">{item.description}</div>
                <small className="text-gray-500">
                    {item.model.brand} {item.model.model} | EID: {item.eid || 'N/A'}
                </small>
            </div>
        );
    };

    const relationBodyTemplate = (rowData: StructureMapping, isParent: boolean) => {
        return isParent ? 'Szülő eszköz' : 'Gyermek eszköz';
    };

    const handleDeleteMapping = async (mappingId: string) => {
        setLoading(mappingId);
        try {
            const response = await fetch(`/api/structure-mapping/${mappingId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Siker',
                    detail: 'Kapcsolat sikeresen törölve',
                    life: 3000
                });
                // Oldal frissítése
                setTimeout(() => {
                    router.refresh();
                }, 500);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Törlés sikertelen');
            }
        } catch (error) {
            console.error('Error deleting mapping:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Hiba',
                detail: error instanceof Error ? error.message : 'Nem sikerült törölni a kapcsolatot',
                life: 3000
            });
        } finally {
            setLoading(null);
        }
    };

    const confirmDelete = (mapping: StructureMapping) => {
        const relatedItem = mapping.parentItem?.id === currentItemId ? mapping.childItem : mapping.parentItem;
        
        confirmDialog({
            message: `Biztosan törölni szeretné a kapcsolatot a(z) "${relatedItem?.description}" eszközzel?`,
            header: 'Kapcsolat törlése',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => handleDeleteMapping(mapping.id),
            rejectClassName: 'p-button-secondary'
        });
    };

    const actionBodyTemplate = (rowData: StructureMapping) => {
        return (
            <Button 
                icon="pi pi-trash" 
                className="p-button-rounded p-button-danger p-button-text"
                tooltip="Kapcsolat törlése"
                tooltipOptions={{ position: 'top' }}
                onClick={() => confirmDelete(rowData)}
                loading={loading === rowData.id}
                disabled={loading !== null}
            />
        );
    };

    // Összevonjuk a szülő és gyermek kapcsolatokat
    const allMappings = [
        ...parentItems.map(mapping => ({ ...mapping, isParent: true })),
        ...childItems.map(mapping => ({ ...mapping, isParent: false }))
    ];

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <Card title="Struktúra kapcsolatok">
                {allMappings.length === 0 ? (
                    <div className="text-center p-4 text-gray-500">
                        Nincsenek struktúra kapcsolatok
                    </div>
                ) : (
                    <DataTable
                        value={allMappings}
                        paginator
                        rows={5}
                        rowsPerPageOptions={[5, 10, 20]}
                        emptyMessage="Nincsenek kapcsolatok"
                        className="p-datatable-sm"
                        loading={loading !== null}
                    >
                        <Column 
                            header="Kapcsolat típusa" 
                            body={(rowData: any) => relationBodyTemplate(rowData, rowData.isParent)}
                            style={{ width: '150px' }}
                        />
                        <Column 
                            header="Eszköz" 
                            body={(rowData: any) => itemBodyTemplate(rowData, rowData.isParent)}
                        />
                        <Column 
                            header="Létrehozva" 
                            body={(rowData) => formatDate(rowData.createdAt)}
                            style={{ width: '180px' }}
                        />
                        <Column 
                            header="Létrehozta" 
                            body={(rowData) => rowData.createdBy?.name || 'Ismeretlen'}
                            style={{ width: '150px' }}
                        />
                        <Column 
                            header="Műveletek"
                            body={actionBodyTemplate}
                            style={{ width: '100px' }}
                        />
                    </DataTable>
                )}
            </Card>
        </>
    );
}