// src/app/item/[id]/MoveDialog.tsx
'use client';

import React, { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';

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
    structureItems?: string[]; // Új prop
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

export default function MoveDialog({ itemId, currentRoom, currentToolbook }: MoveDialogProps) {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [toolbooks, setToolbooks] = useState<Toolbook[]>([]);
    const [formData, setFormData] = useState({
        moveToRoomId: '',
        moveToToolbookId: '',
        description: ''
    });
    const toast = useRef<Toast>(null);

    const loadData = async () => {
        try {
            // Szobák betöltése - most már a megfelelő include-okkal
            const roomsResponse = await fetch('/api/room?include=full');
            if (!roomsResponse.ok) {
                throw new Error(`Szobák betöltése sikertelen: ${roomsResponse.status}`);
            }
            const roomsData = await roomsResponse.json();
            setRooms(roomsData);

            // Toolbookok betöltése - most már a megfelelő API-val
            const toolbooksResponse = await fetch('/api/toolbook?active=true');
            if (!toolbooksResponse.ok) {
                // Ha nincs toolbook API, üres listát használunk
                console.warn('Toolbook API nem elérhető');
                setToolbooks([]);
            } else {
                const toolbooksData = await toolbooksResponse.json();
                setToolbooks(toolbooksData);
            }
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
            const response = await fetch('/api/move', {
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

            if (response.ok) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Siker',
                    detail: 'Mozgatás sikeresen rögzítve',
                    life: 3000
                });
                closeDialog();
                // Oldal frissítése
                window.location.reload();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Mozgatás sikertelen');
            }
        } catch (error) {
            console.error('Error moving item:', error);
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

    const roomOptionTemplate = (option: Room) => {
        // Biztonságos hozzáférés a nested objektumokhoz
        const siteDescription = option.floor?.building?.site?.description || 'Ismeretlen telephely';
        
        return (
            <div>
                <div>{option.description}</div>
                <small className="text-gray-500">
                    {siteDescription}
                </small>
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

    const selectedRoomTemplate = (option: Room) => {
        if (!option) return 'Válassz szobát';
        return option.description;
    };

    const selectedToolbookTemplate = (option: Toolbook) => {
        if (!option) return 'Válassz toolbookot';
        return `${option.user.name} toolbookja`;
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
                style={{ width: '50vw' }} 
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
                            label="Mozgatás" 
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
                            valueTemplate={selectedRoomTemplate}
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
                            valueTemplate={selectedToolbookTemplate}
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

                    <div className="col-12">
                        <small className="text-gray-500">* Legalább egy mezőt ki kell tölteni</small>
                    </div>
                </div>
            </Dialog>
        </>
    );
}