'use client';

interface ItemDetailProps {
    item: {
        id: string;
        eid: string;
        description: string;
        serialNumber: string;
        status: string;
        type: string;
        brand: string;
        model: string;
        weight: number | null;
        picture: string;
        toolbookName?: string;
        roomOrCabinet?: string;
    };
}

export default function ItemDetail({ item }: ItemDetailProps) {
    return (
        <div className="card flex flex-wrap p-fluid gap-5">
            <div className="flex-auto">
                <h2>{item.brand} {item.model}</h2>
                <h3>{item.type}</h3>
                <p><strong>Eszközszám:</strong> {item.id}</p>
                <p><strong>Berendezésszám:</strong> {item.eid}</p>
                <p><strong>Leírás:</strong> {item.description}</p>
                <p><strong>Gyári szám:</strong> {item.serialNumber}</p>
                <p><strong>Státusz:</strong> {item.status}</p>
                <p><strong>Súly:</strong> {item.weight ?? 'N/A'} kg</p>
                <p><strong>Akinek a nevén van:</strong> {item.toolbookName ?? 'Nincs adat'}</p>
                <p><strong>Hely:</strong> {item.roomOrCabinet ?? 'Nincs adat'}</p>
            </div>
        </div>
    );
}
