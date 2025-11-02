// src/app/maintenance/page.tsx
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
import { Dialog } from 'primereact/dialog';
import { Calendar } from 'primereact/calendar';

interface Maintenance {
    id: string;
    itemId: string;
    item: {
        id: string;
        description: string;
        eid: string | null;
        model: {
            brand: string;
            model: string;
        };
    };
    description: string | null;
    frequencyDays: number | null;
    scheduledAt: string;
    isCompleted: boolean;
    completedAt: string | null;
    createdAt: string;
    createdBy: {
        name: string;
    };
    completedBy: {
        name: string;
    } | null;
}

export default function MaintenancePage() {
    const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [completeDialog, setCompleteDialog] = useState<{ visible: boolean; maintenance: Maintenance | null }>({
        visible: false,
        maintenance: null
    });
    const [filters, setFilters] = useState<{ global: { value: string | null; matchMode: FilterMatchMode } }>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadMaintenance();
    }, []);

    const loadMaintenance = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/maintenance?isCompleted=false');
            if (!response.ok) throw new Error('Failed to load maintenance');
            const data = await response.json();
            setMaintenance(data);
        } catch (error) {
            console.error('Error loading maintenance:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Hiba',
                detail: 'Nem sikerült betölteni a karbantartásokat',
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

    const handleComplete = (maintenanceItem: Maintenance) => {
        if (maintenanceItem.frequencyDays) {
            // Ha van ismétlődés, mutassuk meg a dialogot
            setCompleteDialog({
                visible: true,
                maintenance: maintenanceItem
            });
        } else {
            // Ha nincs ismétlődés, azonnal befejezzük
            confirmComplete(maintenanceItem.id, false);
        }
    };

    const handleReject = (maintenanceId: string) => {
        confirmDialog({
            message: 'Biztosan elveti ezt a karbantartást?',
            header: 'Karbantartás elvetése',
            icon: 'pi pi-times-circle',
            accept: () => rejectMaintenance(maintenanceId),
            acceptLabel: 'Igen, elvetem',
            rejectLabel: 'Mégse',
            acceptClassName: 'p-button-danger'
        });
    };

    const confirmComplete = (maintenanceId: string, withReschedule: boolean) => {
        const message = withReschedule 
            ? 'Biztosan befejezi ezt a karbantartást? A rendszer automatikusan ütemez egy újat.'
            : 'Biztosan befejezi ezt a karbantartást?';

        confirmDialog({
            message: message,
            header: 'Karbantartás befejezése',
            icon: 'pi pi-check-circle',
            accept: () => completeMaintenance(maintenanceId),
            acceptLabel: 'Igen, befejezem',
            rejectLabel: 'Mégse'
        });
    };

    const completeMaintenance = async (maintenanceId: string) => {
        setProcessing(maintenanceId);
        try {
            const response = await fetch(`/api/maintenance/${maintenanceId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const result = await response.json(); // MINDIG parse-oljuk a választ
                toast.current?.show({
                    severity: 'success',
                    summary: 'Siker',
                    detail: result.message || 'Karbantartás sikeresen befejezve',
                    life: 3000
                });
                setCompleteDialog({ visible: false, maintenance: null });
                await loadMaintenance();
            } else {
                // Ha nem OK a válasz, próbáljuk meg parse-olni a hibaüzenetet
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Befejezés sikertelen');
                } catch (parseError) {
                    // Ha a JSON parse is sikertelen, használjuk a status text-et
                    throw new Error(response.statusText || 'Befejezés sikertelen');
                }
            }
        } catch (error) {
            console.error('Error completing maintenance:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Hiba',
                detail: error instanceof Error ? error.message : 'Nem sikerült befejezni a karbantartást',
                life: 3000
            });
        } finally {
            setProcessing(null);
        }
    };

    const rejectMaintenance = async (maintenanceId: string) => {
        setProcessing(maintenanceId);
        try {
            const response = await fetch(`/api/maintenance/${maintenanceId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const result = await response.json(); // MINDIG parse-oljuk a választ
                toast.current?.show({
                    severity: 'success',
                    summary: 'Siker',
                    detail: result.message || 'Karbantartás sikeresen elvetve',
                    life: 3000
                });
                await loadMaintenance();
            } else {
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Elvetés sikertelen');
                } catch (parseError) {
                    throw new Error(response.statusText || 'Elvetés sikertelen');
                }
            }
        } catch (error) {
            console.error('Error rejecting maintenance:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Hiba',
                detail: error instanceof Error ? error.message : 'Nem sikerült elvetni a karbantartást',
                life: 3000
            });
        } finally {
            setProcessing(null);
        }
    };

    const itemBodyTemplate = (rowData: Maintenance) => (
        <div>
            <div className="font-bold">{rowData.item.description}</div>
            <small className="text-gray-500">
                {rowData.item.model.brand} {rowData.item.model.model} | 
                AID: {rowData.item.id || 'N/A'} | 
                EID: {rowData.item.eid || 'N/A'}
            </small>
        </div>
    );

    const frequencyBodyTemplate = (rowData: Maintenance) => {
        if (!rowData.frequencyDays) return 'Egyszeri';
        
        const frequencies: { [key: number]: string } = {
            7: 'Hetente',
            14: 'Kéthetente',
            30: 'Havonta',
            60: 'Kéthavonta',
            90: 'Negyedévente',
            180: 'Félévente',
            365: 'Évente',
            730: 'Kétévente'
        };
        
        return frequencies[rowData.frequencyDays] || `${rowData.frequencyDays} naponta`;
    };

    const dateBodyTemplate = (rowData: Maintenance, field: 'scheduledAt' | 'createdAt') => {
        return new Date(rowData[field]).toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const actionBodyTemplate = (rowData: Maintenance) => (
        <div className="flex gap-2">
            <Button
                icon="pi pi-check"
                className="p-button-success p-button-rounded"
                tooltip="Befejezés"
                tooltipOptions={{ position: 'top' }}
                onClick={() => handleComplete(rowData)}
                loading={processing === rowData.id}
                disabled={!!processing}
            />
            <Button
                icon="pi pi-times"
                className="p-button-danger p-button-rounded"
                tooltip="Elvetés"
                tooltipOptions={{ position: 'top' }}
                onClick={() => handleReject(rowData.id)}
                loading={processing === rowData.id}
                disabled={!!processing}
            />
        </div>
    );

    const completeDialogFooter = (
        <div>
            <Button 
                label="Mégse" 
                icon="pi pi-times" 
                onClick={() => setCompleteDialog({ visible: false, maintenance: null })}
                className="p-button-text"
            />
            <Button 
                label="Befejezés és új ütemezés" 
                icon="pi pi-check" 
                onClick={() => completeDialog.maintenance && confirmComplete(completeDialog.maintenance.id, true)}
            />
        </div>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <Card title="Ütemezett Karbantartások">
                    <Toast ref={toast} />
                    <ConfirmDialog />

                    <Dialog 
                        header="Karbantartás befejezése" 
                        visible={completeDialog.visible} 
                        style={{ width: '40vw' }} 
                        footer={completeDialogFooter}
                        onHide={() => setCompleteDialog({ visible: false, maintenance: null })}
                    >
                        {completeDialog.maintenance && (
                            <div className="p-fluid">
                                <p>Ez a karbantartás ismétlődő ({frequencyBodyTemplate(completeDialog.maintenance)}).</p>
                                <p><strong>Következő ütemezés:</strong> {new Date(completeDialog.maintenance.scheduledAt).toLocaleDateString('hu-HU')}</p>
                                <p className="mt-3">A karbantartás befejezése után a rendszer automatikusan ütemez egy újat.</p>
                            </div>
                        )}
                    </Dialog>

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
                            onClick={loadMaintenance}
                            loading={loading}
                        />
                    </div>

                    <DataTable
                        value={maintenance}
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
                        emptyMessage="Nincsenek ütemezett karbantartások"
                        className="p-datatable-sm"
                    >
                        <Column field="item.description" header="Eszköz" body={itemBodyTemplate} sortable />
                        <Column field="description" header="Leírás" sortable />
                        <Column field="frequencyDays" header="Ismétlődés" body={frequencyBodyTemplate} sortable />
                        <Column 
                            field="scheduledAt" 
                            header="Ütemezve" 
                            body={(rowData) => dateBodyTemplate(rowData, 'scheduledAt')} 
                            sortable 
                        />
                        <Column field="createdBy.name" header="Ütemezte" sortable />
                        <Column 
                            field="createdAt" 
                            header="Létrehozva" 
                            body={(rowData) => dateBodyTemplate(rowData, 'createdAt')} 
                            sortable 
                        />
                        <Column header="Műveletek" body={actionBodyTemplate} style={{ width: '120px' }} />
                    </DataTable>
                </Card>
            </div>
        </div>
    );
}