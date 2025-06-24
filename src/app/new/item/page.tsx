"use client";
import React, { use, useState } from "react";
import { InputMask, InputMaskChangeEvent } from "primereact/inputmask";
import { FloatLabel } from "primereact/floatlabel";
import { InputText } from "primereact/inputtext";
import { AutoComplete, AutoCompleteChangeEvent, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { PrismaClient } from "@prisma/client";

interface Type {
    label: string;
    value: number;
}

const prisma = new PrismaClient();

export default function NewItemPage() {
    const [asset, setAsset] = useState<string | undefined | null>();
    const [equipment, setEquipment] = useState<string | undefined | null>();
    const [description, setDescription] = useState<string>('');
    //type
    // const [selectedType, setSelectedType] = useState<Type>(null);
    // const [filteredTypes, setFilteredTypes] = useState<Type[]>(null);
    // const items = Array.from({ length: 100000 }).map((_, i) => ({ label: `Item #${i}`, value: i }));

    // const searchTypes = async (event: AutoCompleteCompleteEvent) => {
    //     const query = await prisma.item.findMany({
    //         distinct: ['type'], // A 'brand' mező alapján kérdezzük le az egyedi értékeket
    //         select: {
    //             brand: true, // Csak a brand mezőt kérjük le
    //         },
    //     });
    //     let _filteredTypes = [];

    //     for(let i = 0; i < items.length; i++) {
    //         let item = items[i];
    //         if (item.label.toLowerCase().indexOf(query.toLowerCase()) === 0) {
    //             _filteredTypes.push(item);
    //         }
    //     }

    //     setFilteredTypes(_filteredTypes);
    // }

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

                {/* <div>
                    <AutoComplete value={selectedType} suggestions={filteredTypes} completeMethod={searchTypes}
                    virtualScrollerOptions={{ itemSize: 38 }} field="label" dropdown onChange={(e: AutoCompleteChangeEvent) => setSelectedType(e.value)} />
                </div> */}

            </div>
        
        </div>

        
    )
}