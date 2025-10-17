// src/app/item/[id]/MoveDialog.tsx
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

interface MoveDialogProps {
    itemId: string;
    currentRoom?: {
        id: string;
        description: string;
    } | null;
    currentToolbook?: {
        id: string;
        user: {
            name: string;
        };
    } | null;
    structureItems?: string[];
}

interface Room {
    id: string;
    description: string;
    floor?: {
        building?: {
            site?: {
                description: string;
            };
        };
    };
}

interface Toolbook {
    id: string;
    user: {
        name: string;
    };
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

export default function MoveDialog({ itemId, currentRoom, currentToolbook, structureItems }: MoveDialogProps) {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingStructure, setLoadingStructure] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [toolbooks, setToolbooks] = useState<Toolbook[]>([]);
    const [structureData, setStructureData] = useState<StructureItem[]>([]);
    const [includeStructure, setIncludeStructure] = useState(true);
    const [selectedStructureItems, setSelectedStructureItems] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        moveToRoomId: '',
        moveToToolbookId: '',
        description: ''
    });
    const toast = useRef<Toast>(null);

    const loadData = async () => {
        try {
            // Szobák betöltése
            const roomsResponse = await fetch('/api/room?include=full');
            if (!roomsResponse.ok) {
                throw new Error(`Szobák betöltése sikertelen: ${roomsResponse.status}`);
            }
            const roomsData = await roomsResponse.json();
            setRooms(roomsData);

            // Toolbookok betöltése
            const toolbooksResponse = await fetch('/api/toolbook?active=true');
            if (!toolbooksResponse.ok) {
                console.warn('Toolbook API nem elérhető');
                setToolbooks([]);
            } else {
                const toolbooksData = await toolbooksResponse.json();
                setToolbooks(toolbooksData);
            }

            // Struktúra adatok betöltése
            await loadStructureData();

        } catch (error) {
            console.error('Error loading data:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Hiba',
                detail: 'Nem sikerült betölteni az adatokat',
                life: 3000
            });
        }
    };

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
        await loadData();
    };

    const closeDialog = () => {
        setVisible(false);
        setFormData({
            moveToRoomId: '',
            moveToToolbookId: '',
            description: ''
        });
        setSelectedStructureItems([]);
        setIncludeStructure(true);
    };

    const handleSubmit = async () => {
        if (!formData.moveToRoomId && !formData.moveToToolbookId) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Figyelmeztetés',
                detail: 'Legalább egy célt (szoba vagy toolbook) meg kell adni',
                life: 3000
            });
            return;
        }

        setLoading(true);
        try {
            // Elsőként a fő eszköz mozgatása
            const mainMoveResponse = await fetch('/api/move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    itemId,
                    moveFromRoomId: currentRoom?.id || null,
                    moveFromToolbookId: currentToolbook?.id || null,
                    moveToRoomId: formData.moveToRoomId || null,
                    moveToToolbookId: formData.moveToToolbookId || null,
                    description: formData.description
                }),
            });

            if (!mainMoveResponse.ok) {
                const errorData = await mainMoveResponse.json();
                throw new Error(errorData.error || 'Fő eszköz mozgatása sikertelen');
            }

            // Struktúra elemek mozgatása, ha be van kapcsolva
            if (includeStructure && selectedStructureItems.length > 0) {
                await moveStructureItems();
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Siker',
                detail: `Mozgatás sikeresen rögzítve${includeStructure && selectedStructureItems.length > 0 ? ` (${selectedStructureItems.length + 1} eszköz)` : ''}`,
                life: 3000
            });
            
            closeDialog();
            window.location.reload();

        } catch (error) {
            console.error('Error moving items:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Hiba',
                detail: error instanceof Error ? error.message : 'Nem sikerült rögzíteni a mozgatást',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const moveStructureItems = async () => {
        const movePromises = selectedStructureItems.map(async (structureItemId) => {
            const structureItem = structureData.find(item => item.id === structureItemId);
            if (!structureItem) return;

            // Aktuális hely és toolbook lekérése a struktúra elemhez
            const currentPlace = structureItem.place[0];
            const currentToolbook = structureItem.toolbookItem[0]?.toolbook;

            return fetch('/api/move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    itemId: structureItemId,
                    moveFromRoomId: currentPlace?.room?.id || null,
                    moveFromToolbookId: currentToolbook?.id || null,
                    moveToRoomId: formData.moveToRoomId || null,
                    moveToToolbookId: formData.moveToToolbookId || null,
                    description: `${formData.description || ''} [Struktúra: ${structureItem.relationType === 'child' ? 'gyermek' : 'szülő'}]`.trim()
                }),
            });
        });

        const results = await Promise.allSettled(movePromises);
        
        // Hibák ellenőrzése
        const errors = results.filter(result => result.status === 'rejected');
        if (errors.length > 0) {
            console.error('Some structure items failed to move:', errors);
            throw new Error(`${errors.length} struktúra elem mozgatása sikertelen`);
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

    const roomOptionTemplate = (option: Room) => {
        const siteDescription = option.floor?.building?.site?.description || 'Ismeretlen telephely';
        return (
            <div>
                <div>{option.description}</div>
                <small className="text-gray-500">{siteDescription}</small>
            </div>
        );
    };

    const toolbookOptionTemplate = (option: Toolbook) => {
        return (
            <div>
                <div>{option.user.name} toolbookja</div>
                <small className="text-gray-500">Toolbook ID: {option.id}</small>
            </div>
        );
    };

    return (
        <>
            <Toast ref={toast} />
            <Button 
                label="Mozgatás" 
                icon="pi pi-arrows-h" 
                onClick={openDialog}
                severity="help"
            />
            
            <Dialog 
                header="Eszköz mozgatása" 
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
                            label={`Mozgatás (${includeStructure && selectedStructureItems.length > 0 ? selectedStructureItems.length + 1 : 1} eszköz)`}
                            icon="pi pi-check" 
                            onClick={handleSubmit}
                            loading={loading}
                        />
                    </div>
                }
            >
                <div className="grid p-fluid">
                    <div className="col-12">
                        <h4>Jelenlegi hely</h4>
                        <div className="p-2 border-round bg-gray-100">
                            <p><strong>Szoba:</strong> {currentRoom?.description || 'Nincs'}</p>
                            <p><strong>Toolbook:</strong> {currentToolbook?.user.name || 'Nincs'}</p>
                        </div>
                    </div>

                    <div className="col-12 md:col-6">
                        <label htmlFor="moveToRoomId" className="font-bold block mb-2">
                            Új szoba *
                        </label>
                        <Dropdown
                            id="moveToRoomId"
                            value={formData.moveToRoomId}
                            options={rooms}
                            onChange={(e) => setFormData({...formData, moveToRoomId: e.value})}
                            optionLabel="description"
                            optionValue="id"
                            placeholder="Válassz szobát"
                            itemTemplate={roomOptionTemplate}
                            filter
                            showClear
                            className="w-full"
                        />
                    </div>

                    <div className="col-12 md:col-6">
                        <label htmlFor="moveToToolbookId" className="font-bold block mb-2">
                            Új toolbook
                        </label>
                        <Dropdown
                            id="moveToToolbookId"
                            value={formData.moveToToolbookId}
                            options={toolbooks}
                            onChange={(e) => setFormData({...formData, moveToToolbookId: e.value})}
                            optionLabel="user.name"
                            optionValue="id"
                            placeholder="Válassz toolbookot"
                            itemTemplate={toolbookOptionTemplate}
                            filter
                            showClear
                            className="w-full"
                            disabled={toolbooks.length === 0}
                        />
                        {toolbooks.length === 0 && (
                            <small className="text-gray-500">Nincsenek elérhető toolbookok</small>
                        )}
                    </div>

                    <div className="col-12">
                        <label htmlFor="description" className="font-bold block mb-2">
                            Megjegyzés (opcionális)
                        </label>
                        <InputText
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Mozgatás oka vagy egyéb megjegyzés"
                            className="w-full"
                        />
                    </div>

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
                                        Struktúra elemek mozgatása ({structureData.length} eszköz)
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
                        <small className="text-gray-500">* Legalább egy mezőt ki kell tölteni</small>
                    </div>
                </div>
            </Dialog>
        </>
    );
}