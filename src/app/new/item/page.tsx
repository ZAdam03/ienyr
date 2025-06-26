///src/app/new/item/page.tsx
'use client';
import React, { useState } from "react";
import { InputMask, InputMaskChangeEvent } from "primereact/inputmask";
import { FloatLabel } from "primereact/floatlabel";
import { InputText } from "primereact/inputtext";
import { AutoComplete, AutoCompleteChangeEvent, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { Button } from "primereact/button";


interface I {
  label: string;
  value: string;
}

export default function NewItemPage() {
    const [asset1, setAsset1] = useState<string | undefined | null>();
    const [equipment1, setEquipment1] = useState<string | undefined | null>();
    const [description, setDescription] = useState<string>('');
    const [modelId, setModelId] = useState<string>('');
    const [sN, setSN] = useState<string>('');

    // A mentés kezelése
    const handleSubmit = async () => {
        const data = {
            id: asset1,
            eid: equipment1,
            description: description,
            modelId: modelId,
            serialNumber: sN
        };
        if (!asset1 || !description || !modelId) {
            alert("Töltsd ki az összes kötelező mezőt!");
            return;
        }
        try {
            const res = await fetch("/api/item", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Hiba a mentés során.');
            alert('Sikeresen mentve!');

            //form reset
            setAsset1('');
            setEquipment1('');
            setDescription('');
            setModelId('');
            setSN('');

        } catch (error) {
            console.error(error);
            alert('Hiba történt a mentés közben.');
        }
    };

    return (
        <div>
            <h1>Eszköz létrehozása</h1>
            <p></p>
        <br />
            <div className="card flex flex-wrap p-fluid gap-5">

                <div className="flex-auto">
                    <FloatLabel>
                        <InputMask id="asset1" value={asset1} onChange={(e: InputMaskChangeEvent) => setAsset1(e.target.value)} mask="999 999 99" placeholder="99 999 999"/>
                        <label htmlFor="asset1">Eszközszám*</label>
                    </FloatLabel>
                </div>

                <div className="flex-auto">
                    <FloatLabel>
                        <InputMask id="equipment1" value={equipment1} onChange={(e: InputMaskChangeEvent) => setEquipment1(e.target.value)} mask="999 999 99" placeholder="99 999 999"/>
                        <label htmlFor="equipment1">Berendezésszám</label>
                    </FloatLabel>
                </div>

                <div className="flex-auto">
                    <FloatLabel>
                        <InputText id="description" value={description} onChange={(e) => setDescription(e.target.value)}/>
                        <label htmlFor="description">SAP megnevezés*</label>
                    </FloatLabel>
                </div>

                <div className="flex-auto">
                    <FloatLabel>
                        <InputText id="modelId" value={modelId} onChange={(e) => setModelId(e.target.value)}/>
                        <label htmlFor="modelId">Model ID*</label>
                    </FloatLabel>
                </div>

                <div className="flex-auto">
                    <FloatLabel>
                        <InputText id="sN" value={sN} onChange={(e) => setSN(e.target.value)}/>
                        <label htmlFor="sN">Sorozatszám (S/N)</label>
                    </FloatLabel>
                </div>

                <div className="flex-auto">
                    <Button label="Mentés" onClick={handleSubmit}/>
                </div>

            </div>
        
        </div>

    )
}