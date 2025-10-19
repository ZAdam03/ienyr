// src/app/move/page.tsx
'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

interface Move {
    id: string;
    itemId: string;
    item: {
        status: ReactNode;
        id: string;
        description: string;
        eid: string | null;
        model: {
        brand: string;
        model: string;
        };
    };
    moveFromRoom: {
        id: string;
        description: string;
    } | null;
    moveToRoom: {
        id: string;
        description: string;
    } | null;
    moveFromToolbook: {
        id: string;
        description: string;
    } | null;
    moveToToolbook: {
        id: string;
        description: string;
    } | null;
    description: string | null;
    isFinished: boolean;
    createdAt: string;
    createdBy: {
        name: string;
    };
}

export default function MovesPage() {
    const [moves, setMoves] = useState<Move[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [filters, setFilters] = useState<{ global: { value: string | null; matchMode: FilterMatchMode } }>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadMoves();
    }, []);

    const loadMoves = async () => {
        try {
        setLoading(true);
        const response = await fetch('/api/move?isFinished=false');
        if (!response.ok) {
            throw new Error('Moves load failed');
        }
        const data = await response.json();
        setMoves(data);
        } catch (error) {
        console.error('Error loading moves:', error);
        toast.current?.show({
            severity: 'error',
            summary: 'Hiba',
            detail: 'Nem sikerült betölteni a mozgatásokat',
            life: 3000
        });
        } finally {
        setLoading(false);
        }
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFilters(prev => ({ ...prev, global: { value, matchMode: FilterMatchMode.CONTAINS } }));
    };

    const handleApprove = (moveId: string) => {
        confirmDialog({
        message: 'Biztosan jóváhagyja ezt a mozgatást? Az eszköz helye frissül.',
        header: 'Mozgatás jóváhagyása',
        icon: 'pi pi-check-circle',
        accept: () => approveMove(moveId),
        acceptLabel: 'Igen, jóváhagyom',
        rejectLabel: 'Mégse'
        });
    };

    const handleReject = (moveId: string) => {
        confirmDialog({
        message: 'Biztosan elutasítja ezt a mozgatást? A kérés törlődik.',
        header: 'Mozgatás elutasítása',
        icon: 'pi pi-times-circle',
        accept: () => rejectMove(moveId),
        acceptLabel: 'Igen, elutasítom',
        rejectLabel: 'Mégse',
        acceptClassName: 'p-button-danger'
        });
    };

    const approveMove = async (moveId: string) => {
        setProcessing(moveId);
        try {
        const response = await fetch(`/api/move/${moveId}/approve`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            toast.current?.show({
            severity: 'success',
            summary: 'Siker',
            detail: 'Mozgatás sikeresen jóváhagyva',
            life: 3000
            });
            await loadMoves(); // Lista frissítése
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Jóváhagyás sikertelen');
        }
        } catch (error) {
        console.error('Error approving move:', error);
        toast.current?.show({
            severity: 'error',
            summary: 'Hiba',
            detail: error instanceof Error ? error.message : 'Nem sikerült jóváhagyni a mozgatást',
            life: 3000
        });
        } finally {
        setProcessing(null);
        }
    };

    const rejectMove = async (moveId: string) => {
        setProcessing(moveId);
        try {
        const response = await fetch(`/api/move/${moveId}/reject`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            toast.current?.show({
            severity: 'success',
            summary: 'Siker',
            detail: 'Mozgatás sikeresen elutasítva',
            life: 3000
            });
            await loadMoves(); // Lista frissítése
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Elutasítás sikertelen');
        }
        } catch (error) {
        console.error('Error rejecting move:', error);
        toast.current?.show({
            severity: 'error',
            summary: 'Hiba',
            detail: error instanceof Error ? error.message : 'Nem sikerült elutasítani a mozgatást',
            life: 3000
        });
        } finally {
        setProcessing(null);
        }
    };

    const itemBodyTemplate = (rowData: Move) => (
        <div>
            <div className="font-bold">{rowData.item.description}</div>
            <small className="text-gray-500">
            {rowData.item.model.brand} {rowData.item.model.model} | 
            AID: {rowData.item.id || 'N/A'} | 
            EID: {rowData.item.eid || 'N/A'} | 
            Státusz: <span className={
                rowData.item.status === 'új' ? 'text-orange-500 font-semibold' : 
                rowData.item.status === 'aktív' ? 'text-green-500 font-semibold' : 
                'text-red-500 font-semibold'
            }>
                {rowData.item.status}
            </span>
            </small>
        </div>
    );

    const fromLocationBodyTemplate = (rowData: Move) => (
        <div>
        {rowData.moveFromRoom && (
            <div>Szoba: {rowData.moveFromRoom.description}</div>
        )}
        {rowData.moveFromToolbook && (
            <div>Toolbook: {rowData.moveFromToolbook.description}</div>
        )}
        {!rowData.moveFromRoom && !rowData.moveFromToolbook && (
            <div className="text-gray-500">Nincs forrás hely</div>
        )}
        </div>
    );

    const toLocationBodyTemplate = (rowData: Move) => (
        <div>
        {rowData.moveToRoom && (
            <div>Szoba: {rowData.moveToRoom.description}</div>
        )}
        {rowData.moveToToolbook && (
            <div>Toolbook: {rowData.moveToToolbook.description}</div>
        )}
        {!rowData.moveToRoom && !rowData.moveToToolbook && (
            <div className="text-gray-500">Nincs cél hely</div>
        )}
        </div>
    );

    const actionBodyTemplate = (rowData: Move) => (
        <div className="flex gap-2">
        <Button
            icon="pi pi-check"
            className="p-button-success p-button-rounded"
            tooltip="Jóváhagyás"
            tooltipOptions={{ position: 'top' }}
            onClick={() => handleApprove(rowData.id)}
            loading={processing === rowData.id}
            disabled={!!processing}
        />
        <Button
            icon="pi pi-times"
            className="p-button-danger p-button-rounded"
            tooltip="Elutasítás"
            tooltipOptions={{ position: 'top' }}
            onClick={() => handleReject(rowData.id)}
            loading={processing === rowData.id}
            disabled={!!processing}
        />
        </div>
    );

    const dateBodyTemplate = (rowData: Move) => {
        return new Date(rowData.createdAt).toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
        });
    };

    return (
        <div className="grid">
        <div className="col-12">
            <Card title="Elvégzendő Mozgatások">
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="flex justify-content-between mb-4">
                <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText 
                    placeholder="Keresés..." 
                    onChange={onGlobalFilterChange} 
                />
                </span>
                <Button 
                icon="pi pi-refresh" 
                label="Frissítés" 
                onClick={loadMoves}
                loading={loading}
                />
            </div>

            <DataTable
                value={moves}
                paginator
                rows={10}
                loading={loading}
                filters={filters}
                globalFilterFields={[
                'item.description', 
                'item.eid', 
                'item.model.brand', 
                'item.model.model',
                'moveFromRoom.description',
                'moveToRoom.description',
                'description',
                'createdBy.name'
                ]}
                emptyMessage="Nincsenek elvégzendő mozgatások"
                className="p-datatable-sm"
            >
                <Column field="item.description" header="Eszköz" body={itemBodyTemplate} sortable />
                <Column header="Honnan" body={fromLocationBodyTemplate} />
                <Column header="Hová" body={toLocationBodyTemplate} />
                <Column field="description" header="Megjegyzés" sortable />
                <Column field="createdBy.name" header="Kérte" sortable />
                <Column field="createdAt" header="Kérés ideje" body={dateBodyTemplate} sortable />
                <Column header="Műveletek" body={actionBodyTemplate} style={{ width: '120px' }} />
            </DataTable>
            </Card>
        </div>
        </div>
    );
}