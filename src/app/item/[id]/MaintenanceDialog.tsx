// src/app/item/[id]/MaintenanceDialog.tsx
'use client';

import React, { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';

interface MaintenanceDialogProps {
    itemId: string;
}

// Előre definiált karbantartási gyakoriságok
const FREQUENCY_OPTIONS = [
    { label: 'Hetente', value: 7 },
    { label: 'Kéthetente', value: 14 },
    { label: 'Havonta', value: 30 },
    { label: 'Kéthavonta', value: 60 },
    { label: 'Negyedévente', value: 90 },
    { label: 'Félévente', value: 180 },
    { label: 'Évente', value: 365 },
    { label: 'Kétévente', value: 730 },
    { label: 'Egyedi', value: null }
];

export default function MaintenanceDialog({ itemId }: MaintenanceDialogProps) {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        scheduledAt: new Date(),
        frequencyDays: 30, // Alapértelmezett: havonta
        customFrequency: null as number | null
    });
    const toast = useRef<Toast>(null);

    const openDialog = () => {
        setVisible(true);
        // Alapértelmezett értékek beállítása
        setFormData({
            description: '',
            scheduledAt: new Date(),
            frequencyDays: 30,
            customFrequency: null
        });
    };

    const closeDialog = () => {
        setVisible(false);
    };

    const handleSubmit = async () => {
        if (!formData.description.trim()) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Figyelmeztetés',
                detail: 'Kötelező megadni a karbantartás leírását',
                life: 3000
            });
            return;
        }

        if (!formData.scheduledAt) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Figyelmeztetés',
                detail: 'Kötelező megadni a tervezett dátumot',
                life: 3000
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/maintenance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    itemId,
                    description: formData.description,
                    scheduledAt: formData.scheduledAt,
                    frequencyDays: formData.frequencyDays === null ? formData.customFrequency : formData.frequencyDays
                }),
            });

            if (response.ok) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Siker',
                    detail: 'Karbantartási kérés sikeresen létrehozva',
                    life: 3000
                });
                closeDialog();
                // Oldal frissítése
                window.location.reload();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Karbantartási kérés sikertelen');
            }
        } catch (error) {
            console.error('Error creating maintenance:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Hiba',
                detail: error instanceof Error ? error.message : 'Nem sikerült létrehozni a karbantartási kérést',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const isCustomFrequency = formData.frequencyDays === null;

    return (
        <>
            <Toast ref={toast} />
            <Button 
                label="Karbantartás" 
                icon="pi pi-wrench" 
                onClick={openDialog}
                severity="info"
            />
            
            <Dialog 
                header="Karbantartás ütemezése" 
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
                            label="Ütemezés" 
                            icon="pi pi-check" 
                            onClick={handleSubmit}
                            loading={loading}
                        />
                    </div>
                }
            >
                <div className="grid p-fluid">
                    <div className="col-12">
                        <label htmlFor="description" className="font-bold block mb-2">
                            Karbantartás leírása *
                        </label>
                        <InputText
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Pl.: Tisztítás, portalanítás, pasztázás..."
                            className="w-full"
                        />
                    </div>

                    <div className="col-12">
                        <label htmlFor="scheduledAt" className="font-bold block mb-2">
                            Tervezett dátum *
                        </label>
                        <Calendar
                            id="scheduledAt"
                            value={formData.scheduledAt}
                            onChange={(e) => setFormData({...formData, scheduledAt: e.value as Date})}
                            dateFormat="yy.mm.dd"
                            showIcon
                            className="w-full"
                            minDate={new Date()}
                        />
                    </div>

                    <div className="col-12">
                        <label htmlFor="frequencyDays" className="font-bold block mb-2">
                            Ismétlődés
                        </label>
                        <Dropdown
                            id="frequencyDays"
                            value={formData.frequencyDays}
                            options={FREQUENCY_OPTIONS}
                            onChange={(e) => setFormData({...formData, frequencyDays: e.value})}
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Válassz gyakoriságot"
                            className="w-full"
                        />
                    </div>

                    {isCustomFrequency && (
                        <div className="col-12">
                            <label htmlFor="customFrequency" className="font-bold block mb-2">
                                Egyedi gyakoriság (napokban) *
                            </label>
                            <InputNumber
                                id="customFrequency"
                                value={formData.customFrequency}
                                onValueChange={(e) => setFormData({...formData, customFrequency: e.value ?? null})}
                                placeholder="Napok száma"
                                min={1}
                                max={3650} // 10 év
                                className="w-full"
                            />
                        </div>
                    )}

                    <div className="col-12">
                        <small className="text-gray-500">* Kötelező mező</small>
                        <br />
                        <small className="text-blue-500">
                            Megjegyzés: Az ismétlődés beállítása esetén a karbantartás automatikusan újra ütemeződik befejezéskor.
                        </small>
                    </div>
                </div>
            </Dialog>
        </>
    );
}