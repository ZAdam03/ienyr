// src/app/scrappage/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

interface Scrappage {
    id: string;
    itemId: string;
    item: {
        id: string;
        description: string;
        eid: string | null;
        status: string;
        model: {
            brand: string;
            model: string;
        };
    };
    description: string | null;
    isFinished: boolean;
    createdAt: string;
    createdBy: {
        name: string;
    };
}

export default function ScrappagePage() {
    const [scrappages, setScrappages] = useState<Scrappage[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [filters, setFilters] = useState<{ global: { value: string | null; matchMode: FilterMatchMode } }>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadScrappages();
    }, []);

    const loadScrappages = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/scrappage?isFinished=false');
            if (!response.ok) throw new Error('Failed to load scrappages');
            const data = await response.json();
            setScrappages(data);
        } catch (error) {
            console.error('Error loading scrappages:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Hiba',
                detail: 'Nem sikerült betölteni a selejtezéseket',
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

    const handleApprove = (scrappageId: string) => {
        confirmDialog({
            message: 'Biztosan jóváhagyja ezt a selejtezést? Az eszköz véglegesen törlődik a rendszerből.',
            header: 'Selejtezés jóváhagyása',
            icon: 'pi pi-exclamation-triangle',
            accept: () => approveScrappage(scrappageId),
            acceptLabel: 'Igen, jóváhagyom',
            rejectLabel: 'Mégse',
            acceptClassName: 'p-button-danger'
        });
    };

    const handleReject = (scrappageId: string) => {
        confirmDialog({
            message: 'Biztosan elutasítja ezt a selejtezést? A kérés törlődik.',
            header: 'Selejtezés elutasítása',
            icon: 'pi pi-times-circle',
            accept: () => rejectScrappage(scrappageId),
            acceptLabel: 'Igen, elutasítom',
            rejectLabel: 'Mégse'
        });
    };

    const approveScrappage = async (scrappageId: string) => {
        setProcessing(scrappageId);
        try {
            const response = await fetch(`/api/scrappage/${scrappageId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Siker',
                    detail: 'Selejtezés sikeresen jóváhagyva',
                    life: 3000
                });
                await loadScrappages();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Jóváhagyás sikertelen');
            }
        } catch (error) {
            console.error('Error approving scrappage:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Hiba',
                detail: error instanceof Error ? error.message : 'Nem sikerült jóváhagyni a selejtezést',
                life: 3000
            });
        } finally {
            setProcessing(null);
        }
    };

    const rejectScrappage = async (scrappageId: string) => {
        setProcessing(scrappageId);
        try {
            const response = await fetch(`/api/scrappage/${scrappageId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Siker',
                    detail: 'Selejtezés sikeresen elutasítva',
                    life: 3000
                });
                await loadScrappages();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Elutasítás sikertelen');
            }
        } catch (error) {
            console.error('Error rejecting scrappage:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Hiba',
                detail: error instanceof Error ? error.message : 'Nem sikerült elutasítani a selejtezést',
                life: 3000
            });
        } finally {
            setProcessing(null);
        }
    };

    const itemBodyTemplate = (rowData: Scrappage) => (
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

    const actionBodyTemplate = (rowData: Scrappage) => (
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

    const dateBodyTemplate = (rowData: Scrappage) => {
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
                <Card title="Elvégzendő Selejtezések">
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
                            onClick={loadScrappages}
                            loading={loading}
                        />
                    </div>

                    <DataTable
                        value={scrappages}
                        paginator
                        rows={10}
                        loading={loading}
                        filters={filters}
                        globalFilterFields={[
                            'item.description', 
                            'item.eid', 
                            'item.model.brand', 
                            'item.model.model',
                            'description',
                            'createdBy.name'
                        ]}
                        emptyMessage="Nincsenek elvégzendő selejtezések"
                        className="p-datatable-sm"
                    >
                        <Column field="item.description" header="Eszköz" body={itemBodyTemplate} sortable />
                        <Column field="description" header="Selejtezés oka" sortable />
                        <Column field="createdBy.name" header="Kérte" sortable />
                        <Column field="createdAt" header="Kérés ideje" body={dateBodyTemplate} sortable />
                        <Column header="Műveletek" body={actionBodyTemplate} style={{ width: '120px' }} />
                    </DataTable>
                </Card>
            </div>
        </div>
    );
}