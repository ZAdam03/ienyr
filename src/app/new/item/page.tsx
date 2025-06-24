///src/app/new/item/page.tsx
'use client';
import React, { useState } from "react";
import { InputMask, InputMaskChangeEvent } from "primereact/inputmask";
import { FloatLabel } from "primereact/floatlabel";
import { InputText } from "primereact/inputtext";
import { AutoComplete, AutoCompleteChangeEvent, AutoCompleteCompleteEvent } from "primereact/autocomplete";


interface Type {
  label: string;
  value: string;
}

export default function NewItemPage() {
    const [asset, setAsset] = useState<string | undefined | null>();
    const [equipment, setEquipment] = useState<string | undefined | null>();
    const [description, setDescription] = useState<string>('');
    const [selectedType, setSelectedType] = useState<Type | null>(null);
    const [filteredTypes, setFilteredTypes] = useState<Type[]>([]);

    const searchTypes = async (event: AutoCompleteCompleteEvent) => {
        const res = await fetch("/api/items-type");
        const allTypes: Type[] = await res.json();

        const filtered = allTypes.filter((item) =>
        item.label.toLowerCase().startsWith(event.query.toLowerCase())
        );

        setFilteredTypes(filtered);
    };


    return (
        <div>Adjon hozzá!
        
            <div className="card flex justify-content-center">

                <div className="flex-auto">
                    <FloatLabel>
                        <InputMask id="asset" value={asset} onChange={(e: InputMaskChangeEvent) => setAsset(e.target.value)} mask="999 999 99" placeholder="99 999 999"/>
                        <label htmlFor="asset">Eszközszám</label>
                    </FloatLabel>
                </div>

                <div className="flex-auto">
                    <FloatLabel>
                        <InputMask id="equipment" value={equipment} onChange={(e: InputMaskChangeEvent) => setEquipment(e.target.value)} mask="999 999 99" placeholder="99 999 999"/>
                        <label htmlFor="equipment">Berendezésszám</label>
                    </FloatLabel>
                </div>

                <div className="flex-auto">
                    <FloatLabel>
                        {/* @ts-ignore */}
                        <InputText id="description" value={description} onChange={(e) => setDescription(e.target.value)}/>
                        <label htmlFor="description">SAP megnevezés</label>
                    </FloatLabel>
                </div>

                <div className="flex-auto">
                    <FloatLabel>
                        <InputText id="type" value={description} onChange={(e) => setDescription(e.target.value)}/>
                        <label htmlFor="type">SAP megnevezés</label>
                    </FloatLabel>
                </div>

                <div>
                    <FloatLabel>
                        <AutoComplete
                            value={selectedType}
                            suggestions={filteredTypes}
                            completeMethod={searchTypes}
                            virtualScrollerOptions={{ itemSize: 38 }}
                            field="label"
                            dropdown
                            onChange={(e: AutoCompleteChangeEvent) => setSelectedType(e.value)}
                        />
                        <label htmlFor="type">Típus</label>
                    </FloatLabel>
                </div>

            </div>
        
        </div>

        
    )
}