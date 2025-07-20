import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ModelDetailTable from './ModelDetailTable'; // külön komponens, client oldali
import ItemTable from './ItemTable';

interface Props {
    params: { id: string };
}

export default async function ModelDetailPage({ params }: Props) {
    const model = await prisma.model.findUnique({
        where: { id: params.id },
    });

    if (!model) {
        return notFound();
    }

    const countItems = await prisma.item.count({
        where: { modelId: model.id },
    });

    const items = await prisma.item.findMany({
        where: { modelId: model.id },
        select: {
            id: true,
            eid: true,
            description: true,
            serialNumber: true,
            status: true,
        },
    });

    const activeToolbooks = await prisma.item.findMany({
        where: {
            modelId: model.id,
            toolbookItem: {
                some: {
                    isActive: true,
                },
            },
        },
        select: {
            id: true,
            toolbookItem: {
                select: {
                    toolbook: {
                        select: {
                            user: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    const placesNotStored = await prisma.item.findMany({
        where: {
            modelId: model.id,
            place: {
                some: {
                    isStored: false,
                    isActive: true,
                },
            },
        },
        select: {
            id: true,
            place: {
                select: {
                    room: {
                        select: {
                            description: true,
                        },
                    },
                },
            },
        },
    });

    const placesStored = await prisma.item.findMany({
        where: {
            modelId: model.id,
            place: {
                some: {
                    isStored: true,
                    isActive: true,
                },
            },
        },
        select: {
            id: true,
            place: {
                select: {
                    cabinet: {
                        select: {
                            description: true,
                        },
                    },
                },
            },
        },
    });

    const mergedItems = items.map(item => {
        const toolbook = activeToolbooks.find(tb => tb.id === item.id);
        const placeNotStored = placesNotStored.find(p => p.id === item.id);
        const placeStored = placesStored.find(p => p.id === item.id);

        return {
            ...item,
            eid: item.eid ?? '',
            description: item.description ?? '',
            serialNumber: item.serialNumber ?? '',
            toolbookName: toolbook ? toolbook.toolbookItem[0]?.toolbook.user.name ?? '' : '',
            roomOrCabinet:
                placeNotStored && placeNotStored.place.length > 0
                    ? placeNotStored.place[0]?.room?.description ?? ''
                    : (placeStored && placeStored.place.length > 0
                        ? placeStored.place[0]?.cabinet?.description ?? ''
                        : ''),
        };
    });

    return (
        <div>
            <h1>Modell részletei</h1>
            <div className="card flex flex-wrap p-fluid gap-5">
                <div className="flex-auto">
                    <h2>{model.brand} {model.model}</h2>
                    <h3>{model.type}</h3>
                    <p>{model.weight ?? 'N/A'} kg</p>
                    <h4>Példányok száma: {countItems}</h4>
                    <li><strong>Típus:</strong> {model.type}</li>
                    <li><strong>Gyártó:</strong> {model.brand}</li>
                    <li><strong>Modell:</strong> {model.model}</li>
                    <li><strong>Súly:</strong> {model.weight ?? 'N/A'} kg</li>
                </div>
                <div className="flex-auto">
                    {model.picture ? <img src={model.picture} alt="Kép" className="mt-2 max-w-xs" /> : 'Nincs kép'}
                </div>
            </div>

            {/* ⬇️ itt jön a client oldal */}
            <ModelDetailTable items={mergedItems} />
            <ItemTable/>
        </div>
    );
}
