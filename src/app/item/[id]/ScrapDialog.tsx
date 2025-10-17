// src/app/item/[id]/ScrapDialog.tsx
'use client';

import React, { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';

interface ScrapDialogProps {
    itemId: string;
    structureItems?: string[]; // Új prop
}

export default function ScrapDialog({ itemId }: ScrapDialogProps) {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [description, setDescription] = useState('');
    const toast = useRef<Toast>(null);

    const openDialog = () => setVisible(true);
    const closeDialog = () => {
        setVisible(false);
        setDescription('');
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/scrappage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    itemId,
                    description: description || null
                }),
            });

            if (response.ok) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Siker',
                    detail: 'Selejtezés sikeresen rögzítve',
                    life: 3000
                });
                closeDialog();
                // Oldal frissítése
                window.location.reload();
            } else {
                throw new Error('Selejtezés sikertelen');
            }
        } catch (error) {
            console.error('Error scrapping item:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Hiba',
                detail: 'Nem sikerült rögzíteni a selejtezést',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
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
                style={{ width: '40vw' }} 
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
                            label="Selejtezés" 
                            icon="pi pi-check" 
                            onClick={handleSubmit}
                            loading={loading}
                            severity="danger"
                        />
                    </div>
                }
            >
                <div className="p-fluid">
                    <p>Biztosan szeretné selejtezni ezt az eszközt?</p>
                    
                    <div className="field">
                        <label htmlFor="description" className="font-bold block mb-2">
                            Megjegyzés (opcionális)
                        </label>
                        <InputText
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Selejtezés oka"
                        />
                    </div>
                </div>
            </Dialog>
        </>
    );
}