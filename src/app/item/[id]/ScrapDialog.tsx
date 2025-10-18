// src/app/item/[id]/ScrapDialog.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Checkbox } from 'primereact/checkbox';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';

interface ScrapDialogProps {
    itemId: string;
    structureItems?: string[];
}

interface StructureItem {
    id: string;
    description: string;
    eid: string | null;
    model: {
        brand: string;
        model: string;
    };
    relationType: 'parent' | 'child';
    structureMappingId: string;
    place: Array<{
        room?: {
            id?: string;
            description: string;
        };
        cabinet?: {
            id?: string;
            description: string;
        };
    }>;
    toolbookItem: Array<{
        toolbook: {
            id?: string;
            user: {
                name: string;
            };
        };
    }>;
}

const SCRAP_REASONS = [
    { label: 'Javíthatatlan, elektronikai hulladék', value: 'javithatatlan_elektronikai_hulladek' },
    { label: 'Elavult, hulladékként elhelyezés', value: 'elavult_hulladkent_elhelyezes' },
    { label: 'Egyéb', value: 'egyeb' }
];

export default function ScrapDialog({ itemId, structureItems }: ScrapDialogProps) {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingStructure, setLoadingStructure] = useState(false);
    const [structureData, setStructureData] = useState<StructureItem[]>([]);
    const [includeStructure, setIncludeStructure] = useState(true);
    const [selectedStructureItems, setSelectedStructureItems] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        reason: '',
        customReason: ''
    });
    const toast = useRef<Toast>(null);

    const loadStructureData = async () => {
        if (!structureItems || structureItems.length === 0) return;
        
        setLoadingStructure(true);
        try {
            const response = await fetch(`/api/structure-mapping/${itemId}`);
            if (!response.ok) {
                throw new Error('Structure data load failed');
            }
            const data = await response.json();
            setStructureData(data.structureItems || []);
            
            // Alapértelmezetten kijelöljük az összes struktúra elemet
            setSelectedStructureItems(data.structureItems.map((item: StructureItem) => item.id));
        } catch (error) {
            console.error('Error loading structure data:', error);
            toast.current?.show({
                severity: 'warn',
                summary: 'Figyelmeztetés',
                detail: 'Nem sikerült betölteni a struktúra adatokat',
                life: 3000
            });
        } finally {
            setLoadingStructure(false);
        }
    };

    const openDialog = async () => {
        setVisible(true);
        await loadStructureData();
    };

    const closeDialog = () => {
        setVisible(false);
        setFormData({
            reason: '',
            customReason: ''
        });
        setSelectedStructureItems([]);
        setIncludeStructure(true);
    };

    const handleSubmit = async () => {
        if (!formData.reason) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Figyelmeztetés',
                detail: 'Kötelező megadni a selejtezés okát',
                life: 3000
            });
            return;
        }

        const description = formData.reason === 'egyeb' 
            ? formData.customReason 
            : SCRAP_REASONS.find(r => r.value === formData.reason)?.label;

        if (!description) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Figyelmeztetés',
                detail: 'Érvénytelen selejtezési ok',
                life: 3000
            });
            return;
        }

        setLoading(true);
        try {
            // Elsőként a fő eszköz selejtezése
            const mainScrapResponse = await fetch('/api/scrappage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    itemId,
                    description
                }),
            });

            if (!mainScrapResponse.ok) {
                const errorData = await mainScrapResponse.json();
                throw new Error(errorData.error || 'Fő eszköz selejtezése sikertelen');
            }

            // Struktúra elemek selejtezése, ha be van kapcsolva
            if (includeStructure && selectedStructureItems.length > 0) {
                await scrapStructureItems(description);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Siker',
                detail: `Selejtezési kérés sikeresen rögzítve${includeStructure && selectedStructureItems.length > 0 ? ` (${selectedStructureItems.length + 1} eszköz)` : ''}. A kérés jóváhagyásra vár.`,
                life: 5000
            });
            
            closeDialog();
            window.location.reload();

        } catch (error) {
            console.error('Error scrapping items:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Hiba',
                detail: error instanceof Error ? error.message : 'Nem sikerült rögzíteni a selejtezést',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const scrapStructureItems = async (description: string) => {
        const scrapPromises = selectedStructureItems.map(async (structureItemId) => {
            const structureItem = structureData.find(item => item.id === structureItemId);
            if (!structureItem) return;

            return fetch('/api/scrappage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    itemId: structureItemId,
                    description: `${description} [Struktúra: ${structureItem.relationType === 'child' ? 'gyermek' : 'szülő'}]`.trim()
                }),
            });
        });

        const results = await Promise.allSettled(scrapPromises);
        
        // Hibák ellenőrzése
        const errors = results.filter(result => result.status === 'rejected');
        if (errors.length > 0) {
            console.error('Some structure items failed to scrap:', errors);
            throw new Error(`${errors.length} struktúra elem selejtezése sikertelen`);
        }
    };

    const onStructureSelectionChange = (e: any) => {
        setSelectedStructureItems(e.value);
    };

    const structureSelectionHeader = (
        <div className="flex align-items-center">
            <Checkbox
                checked={selectedStructureItems.length === structureData.length}
                onChange={(e) => {
                    if (e.checked) {
                        setSelectedStructureItems(structureData.map(item => item.id));
                    } else {
                        setSelectedStructureItems([]);
                    }
                }}
            />
            <span className="ml-2">Összes kijelölése</span>
        </div>
    );

    const structureSelectionBody = (rowData: StructureItem) => (
        <Checkbox
            checked={selectedStructureItems.includes(rowData.id)}
            onChange={(e) => {
                let selected = [...selectedStructureItems];
                if (e.checked) {
                    selected.push(rowData.id);
                } else {
                    selected = selected.filter(id => id !== rowData.id);
                }
                setSelectedStructureItems(selected);
            }}
        />
    );

    const structureItemBody = (rowData: StructureItem) => (
        <div>
            <div className="font-bold">{rowData.description}</div>
            <small className="text-gray-500">
                {rowData.model.brand} {rowData.model.model} | 
                {rowData.relationType === 'child' ? ' Gyermek' : ' Szülő'} | 
                EID: {rowData.eid || 'N/A'}
            </small>
        </div>
    );

    const structureLocationBody = (rowData: StructureItem) => {
        const place = rowData.place[0];
        const toolbook = rowData.toolbookItem[0]?.toolbook.user.name;
        
        return (
            <div>
                <div>{place?.room?.description || place?.cabinet?.description || 'Nincs hely'}</div>
                {toolbook && <small className="text-gray-500">{toolbook}</small>}
            </div>
        );
    };

    return (
        <>
            <Toast ref={toast} />
            <Button 
                label="Selejtezés" 
                icon="pi pi-trash" 
                onClick={openDialog}
                severity="danger"
            />
            
            <Dialog 
                header="Eszköz selejtezése" 
                visible={visible} 
                style={{ width: '70vw' }} 
                onHide={closeDialog}
                footer={
                    <div>
                        <Button 
                            label="Mégse" 
                            icon="pi pi-times" 
                            onClick={closeDialog}
                            className="p-button-text"
                        />
                        <Button 
                            label={`Selejtezés (${includeStructure && selectedStructureItems.length > 0 ? selectedStructureItems.length + 1 : 1} eszköz)`}
                            icon="pi pi-check" 
                            onClick={handleSubmit}
                            loading={loading}
                            severity="danger"
                        />
                    </div>
                }
            >
                <div className="grid p-fluid">
                    <div className="col-12">
                        <h4>Selejtezés oka *</h4>
                        <Dropdown
                            value={formData.reason}
                            options={SCRAP_REASONS}
                            onChange={(e) => setFormData({...formData, reason: e.value, customReason: ''})}
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Válassz selejtezési okot"
                            className="w-full"
                        />
                    </div>

                    {formData.reason === 'egyeb' && (
                        <div className="col-12">
                            <label htmlFor="customReason" className="font-bold block mb-2">
                                Egyéb ok megadása *
                            </label>
                            <InputText
                                id="customReason"
                                value={formData.customReason}
                                onChange={(e) => setFormData({...formData, customReason: e.target.value})}
                                placeholder="Adja meg a selejtezés okát"
                                className="w-full"
                            />
                        </div>
                    )}

                    {structureData.length > 0 && (
                        <div className="col-12">
                            <Card>
                                <div className="flex align-items-center mb-3">
                                    <Checkbox
                                        inputId="includeStructure"
                                        checked={includeStructure}
                                        onChange={(e) => setIncludeStructure(!!e.checked)}
                                    />
                                    <label htmlFor="includeStructure" className="ml-2 font-bold">
                                        Struktúra elemek selejtezése ({structureData.length} eszköz)
                                    </label>
                                </div>

                                {includeStructure && (
                                    <DataTable
                                        value={structureData}
                                        //@ts-ignore
                                        selection={selectedStructureItems}
                                        onSelectionChange={onStructureSelectionChange}
                                        dataKey="id"
                                        selectionMode="multiple"
                                        className="p-datatable-sm"
                                        scrollHeight="200px"
                                        loading={loadingStructure}
                                    >
                                        <Column 
                                            selectionMode="multiple" 
                                            header={structureSelectionHeader}
                                            body={structureSelectionBody}
                                            style={{ width: '3rem' }}
                                        />
                                        <Column header="Eszköz" body={structureItemBody} />
                                        <Column header="Kapcsolat" field="relationType" 
                                            body={(rowData) => rowData.relationType === 'child' ? 'Gyermek' : 'Szülő'} 
                                            style={{ width: '100px' }}
                                        />
                                        <Column header="Jelenlegi hely" body={structureLocationBody} />
                                    </DataTable>
                                )}
                            </Card>
                        </div>
                    )}

                    <div className="col-12">
                        <small className="text-gray-500">* Kötelező mező</small>
                    </div>
                </div>
            </Dialog>
        </>
    );
}