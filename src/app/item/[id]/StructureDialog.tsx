// src/app/item/[id]/StructureDialog.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { ProgressSpinner } from 'primereact/progressspinner';

interface StructureDialogProps {
    itemId: string;
}

interface Item {
    id: string;
    description: string;
    eid: string | null;
    serialNumber: string | null;
    status: string;
    model: {
        brand: string;
        model: string;
        type: string;
    };
    place: Array<{
        room: {
            description: string;
        } | null;
        cabinet: {
            description: string;
        } | null;
        isActive: boolean;
    }>;
}

export default function StructureDialog({ itemId }: StructureDialogProps) {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [items, setItems] = useState<Item[]>([]);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [relationType, setRelationType] = useState<'parent' | 'child'>('child');
    const [filters, setFilters] = useState<{ global: { value: string | null; matchMode: FilterMatchMode } }>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const toast = useRef<Toast>(null);

    useEffect(() => {
        if (visible) {
            loadItems();
        }
    }, [visible]);

    const loadItems = async () => {
        try {
            setItemsLoading(true);
            const response = await fetch('/api/item?limit=100');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Loaded items:', data); // Debug log
            
            // Szűrjük ki az aktuális itemet és formázzuk az adatokat
            const filteredItems = data
                .filter((item: Item) => item.id !== itemId)
                .map((item: Item) => ({
                    ...item,
                    // Biztosítjuk, hogy minden szükséges mező legyen
                    model: item.model || { brand: 'Ismeretlen', model: 'Ismeretlen', type: 'Ismeretlen' },
                    eid: item.eid || null,
                    serialNumber: item.serialNumber || null,
                    status: item.status || 'Ismeretlen'
                }));
            
            setItems(filteredItems);
        } catch (error) {
            console.error('Error loading items:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Hiba',
                detail: 'Nem sikerült betölteni az eszközöket',
                life: 3000
            });
        } finally {
            setItemsLoading(false);
        }
    };

    const openDialog = () => setVisible(true);
    const closeDialog = () => {
        setVisible(false);
        setSelectedItem(null);
        setRelationType('child');
        setItems([]);
    };

    const handleCreateRelation = async () => {
        if (!selectedItem) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Figyelmeztetés',
                detail: 'Válassz ki egy eszközt',
                life: 3000
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/structure-mapping', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    parentItemId: relationType === 'parent' ? selectedItem.id : itemId,
                    childItemId: relationType === 'child' ? selectedItem.id : itemId
                }),
            });

            if (response.ok) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Siker',
                    detail: 'Struktúra kapcsolat létrehozva',
                    life: 3000
                });
                closeDialog();
                // Oldal frissítése
                window.location.reload();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Relation creation failed');
            }
        } catch (error) {
            console.error('Error creating relation:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Hiba',
                detail: error instanceof Error ? error.message : 'Nem sikerült létrehozni a kapcsolatot',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const itemDescriptionTemplate = (rowData: Item) => {
        return (
            <div>
                <div className="font-bold">{rowData.description}</div>
                {rowData.eid && (
                    <small className="text-gray-500">EID: {rowData.eid}</small>
                )}
            </div>
        );
    };

    const modelTemplate = (rowData: Item) => {
        return (
            <div>
                <div>{rowData.model?.brand || 'Ismeretlen'} {rowData.model?.model || 'Ismeretlen'}</div>
                <small className="text-gray-500">{rowData.model?.type || 'Ismeretlen típus'}</small>
            </div>
        );
    };

    const locationTemplate = (rowData: Item) => {
        const activePlace = rowData.place?.find(p => p.isActive);
        if (!activePlace) return 'Nincs hely';
        
        return `${activePlace.room?.description || ''} ${activePlace.cabinet?.description || ''}`.trim() || 'Nincs hely';
    };

    const statusTemplate = (rowData: Item) => {
        const statusColors = {
            'új': 'bg-blue-100 text-blue-800',
            'aktív': 'bg-green-100 text-green-800',
            'selejtezett': 'bg-red-100 text-red-800'
        };
        
        const colorClass = statusColors[rowData.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
        
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
                {rowData.status}
            </span>
        );
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFilters(prev => ({ ...prev, global: { value, matchMode: FilterMatchMode.CONTAINS } }));
    };

    return (
        <>
            <Toast ref={toast} />
            <Button 
                label="Struktúra" 
                icon="pi pi-sitemap" 
                onClick={openDialog}
                severity="info"
            />
            
            <Dialog 
                header="Struktúra kapcsolat létrehozása" 
                visible={visible} 
                style={{ width: '80vw', maxWidth: '1200px' }} 
                onHide={closeDialog}
                footer={
                    <div>
                        <Button 
                            label="Mégse" 
                            icon="pi pi-times" 
                            onClick={closeDialog}
                            className="p-button-text"
                            disabled={loading}
                        />
                        <Button 
                            label="Kapcsolat létrehozása" 
                            icon="pi pi-link" 
                            onClick={handleCreateRelation}
                            loading={loading}
                            disabled={!selectedItem}
                        />
                    </div>
                }
            >
                <div className="grid p-fluid">
                    <div className="col-12 md:col-6">
                        <label className="font-bold block mb-2">
                            Kapcsolat típusa
                        </label>
                        <div className="flex flex-column gap-2">
                            <div className="field-radiobutton flex align-items-center">
                                <input 
                                    type="radio" 
                                    id="child" 
                                    value="child" 
                                    checked={relationType === 'child'} 
                                    onChange={(e) => setRelationType(e.target.value as 'parent' | 'child')} 
                                    className="mr-2"
                                />
                                <label htmlFor="child" className="mb-0">Gyermek eszköz hozzáadása</label>
                            </div>
                            <div className="field-radiobutton flex align-items-center">
                                <input 
                                    type="radio" 
                                    id="parent" 
                                    value="parent" 
                                    checked={relationType === 'parent'} 
                                    onChange={(e) => setRelationType(e.target.value as 'parent' | 'child')} 
                                    className="mr-2"
                                />
                                <label htmlFor="parent" className="mb-0">Szülő eszköz hozzáadása</label>
                            </div>
                        </div>
                    </div>

                    <div className="col-12">
                        <p className="text-sm text-gray-600 mb-3">
                            {relationType === 'child' 
                                ? 'Kiválasztott eszköz lesz ennek az eszköznek a gyermeke (része lesz a struktúrának)'
                                : 'Kiválasztott eszköz lesz ennek az eszköznek a szülője (ebbe a struktúrába kerül)'
                            }
                        </p>
                    </div>

                    <div className="col-12">
                        <label className="font-bold block mb-2">
                            Eszköz kiválasztása ({items.length} eszköz)
                        </label>
                        <InputText 
                            placeholder="Keresés leírás, EID, modell vagy sorozatszám szerint..." 
                            onChange={onGlobalFilterChange} 
                            className="w-full mb-3"
                        />
                        
                        {itemsLoading ? (
                            <div className="flex justify-content-center align-items-center" style={{ height: '200px' }}>
                                <ProgressSpinner />
                            </div>
                        ) : (
                            <DataTable
                                value={items}
                                selection={selectedItem}
                                onSelectionChange={(e) => setSelectedItem(e.value as Item)}
                                selectionMode="single"
                                dataKey="id"
                                filters={filters}
                                globalFilterFields={['description', 'eid', 'model.brand', 'model.model', 'serialNumber', 'status']}
                                emptyMessage="Nincs találat"
                                className="p-datatable-sm"
                                scrollHeight="400px"
                                size="small"
                                showGridlines
                            >
                                <Column selectionMode="single" headerStyle={{ width: '3rem' }} />
                                <Column 
                                    field="description" 
                                    header="Leírás" 
                                    sortable 
                                    body={itemDescriptionTemplate}
                                    style={{ minWidth: '200px' }}
                                />
                                <Column 
                                    header="Modell" 
                                    sortable 
                                    sortField="model.brand"
                                    body={modelTemplate}
                                    style={{ minWidth: '150px' }}
                                />
                                <Column 
                                    field="eid" 
                                    header="EID" 
                                    sortable 
                                    style={{ minWidth: '100px' }}
                                />
                                <Column 
                                    field="serialNumber" 
                                    header="Sorozatszám" 
                                    sortable 
                                    style={{ minWidth: '120px' }}
                                />
                                <Column 
                                    field="status" 
                                    header="Státusz" 
                                    sortable 
                                    body={statusTemplate}
                                    style={{ minWidth: '100px' }}
                                />
                                <Column 
                                    header="Hely" 
                                    body={locationTemplate}
                                    style={{ minWidth: '150px' }}
                                />
                            </DataTable>
                        )}
                    </div>

                    {selectedItem && (
                        <div className="col-12">
                            <div className="p-3 border-round bg-blue-50">
                                <h4 className="mt-0 mb-2">Kiválasztott eszköz:</h4>
                                <p><strong>Leírás:</strong> {selectedItem.description}</p>
                                <p><strong>Modell:</strong> {selectedItem.model?.brand} {selectedItem.model?.model}</p>
                                <p><strong>EID:</strong> {selectedItem.eid || 'Nincs'}</p>
                                <p><strong>Státusz:</strong> {selectedItem.status}</p>
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>
        </>
    );
}