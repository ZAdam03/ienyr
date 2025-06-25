///src/app/new/model/page.tsx
'use client';
import React, { useState } from "react";
import { InputMask, InputMaskChangeEvent } from "primereact/inputmask";
import { FloatLabel } from "primereact/floatlabel";
import { InputText } from "primereact/inputtext";
import { AutoComplete, AutoCompleteChangeEvent, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { InputNumber, InputNumberValueChangeEvent } from "primereact/inputnumber";
import { Button } from "primereact/button";


interface I {
  label: string;
  value: string;
}

export default function NewModelPage() {

    const [selectedType, setSelectedType] = useState<I | null>(null);
    const [filteredTypes, setFilteredTypes] = useState<I[]>([]);

    const searchTypes = async (event: AutoCompleteCompleteEvent) => {
        const res = await fetch("/api/model/types");
        const allTypes: I[] = await res.json();

        const filtered = allTypes.filter((item) =>
        item.label.toLowerCase().startsWith(event.query.toLowerCase())
        );

        setFilteredTypes(filtered);
    };


    const [selectedBrand, setSelectedBrand] = useState<I | null>(null);
    const [filteredBrands, setFilteredBrands] = useState<I[]>([]);

    const searchBrands = async (event: AutoCompleteCompleteEvent) => {
        const res = await fetch("/api/model/brands");
        const allTypes: I[] = await res.json();

        const filtered = allTypes.filter((item) =>
        item.label.toLowerCase().startsWith(event.query.toLowerCase())
        );

        setFilteredBrands(filtered);
    };

    const [field1, setfield1] = useState<string>('');
    const [picture, setPicture] = useState<string>('');
    const [value1, setValue1] = useState<number>();

    // A mentés kezelése
    const handleSubmit = async () => {
        // Normalizálás: ha objektum, akkor .value, ha string, akkor simán megy
        const typeValue =
            typeof selectedType === 'object' && selectedType !== null
                ? selectedType.value
                : selectedType;

        const brandValue =
            typeof selectedBrand === 'object' && selectedBrand !== null
                ? selectedBrand.value
                : selectedBrand;
        if (!selectedType || !selectedBrand || !field1) {
            alert("Töltsd ki az összes kötelező mezőt!");
            return;
        }
        console.log("sgfrgsrgsreg:: ", selectedType, selectedBrand, field1, picture, value1);
        try {
            const res = await fetch('/api/model', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: typeValue,
                    brand: brandValue,
                    model: field1,
                    picture: picture,
                    weight: value1,
                }),
            });
            console.log('POST body:', res);


            if (!res.ok) throw new Error('Hiba a mentés során.');

            const data = await res.json();
            alert('Sikeresen mentve!');
            console.log(data);

            // Opcionálisan: form reset
            setSelectedType(null);
            setSelectedBrand(null);
            setfield1('');
            setPicture('');
            setValue1(undefined);
        } catch (error) {
            console.error(error);
            alert('Hiba történt a mentés közben.');
        }
    };


    return (
        <div>
            <h1>Egy modell létrehozása</h1>
            <p>Az eszközök egy modellből vannak származtatva, ezért az eszközök felvitele előtt elengedhetetlen, a kijelöni egy modellt.</p>
        <br />
            <div className="card flex flex-wrap p-fluid gap-5">

                <div className="flex-auto">
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

                <div className="flex-auto">
                    <FloatLabel>
                        <AutoComplete
                            value={selectedBrand}
                            suggestions={filteredBrands}
                            completeMethod={searchBrands}
                            virtualScrollerOptions={{ itemSize: 38 }}
                            field="label"
                            dropdown
                            onChange={(e: AutoCompleteChangeEvent) => setSelectedBrand(e.value)}
                        />
                        <label htmlFor="type">Márka</label>
                    </FloatLabel>
                </div>
            
                <div className="flex-auto">
                    <FloatLabel>
                        <InputText id="field1" value={field1} onChange={(e) => setfield1(e.target.value)}/>
                        <label htmlFor="field1">Modell</label>
                    </FloatLabel>
                </div>

                <div className="flex-auto">
                    <FloatLabel>
                        <InputText id="picture" value={picture} onChange={(e) => setPicture(e.target.value)}/>
                        <label htmlFor="picture">Kép URL</label>
                    </FloatLabel>
                </div>

                <div className="flex-auto">
                    <FloatLabel>
                        {/* @ts-ignore */}
                        <InputNumber inputId="kg" value={value1} onValueChange={(e: InputNumberValueChangeEvent) => setValue1(e.value)} suffix=" kg" />
                        <label htmlFor="kg">Súly (kg)</label>
                    </FloatLabel>
                </div>

                <div className="flex-auto">
                    <Button label="Mentés" onClick={handleSubmit}/>
                </div>
                
            </div>
        
        </div>
        
    )
}