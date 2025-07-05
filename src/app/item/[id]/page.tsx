import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ItemDetail from './ItemDetail';
import { Button } from 'primereact/button';
import React, { use } from 'react'; 
import { Timeline } from 'primereact/timeline';
import ItemHistoryTimeline from './timeline';
import timelineQuery from './timelineQuery';

interface Props {
    params: { id: string };
}

export default async function ItemPage({ params }: Props) {
    const { id } = await params;
    const item = await prisma.item.findUnique({
        where: { id },
        select: {
            id: true,
            eid: true,
            description: true,
            serialNumber: true,
            status: true,
            model: {
                select: {
                    brand: true,
                    model: true,
                    type: true,
                    weight: true,
                    picture: true,
                },
            },
            toolbookItem: {
                where: { isActive: true },
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
            place: {
                where: { isActive: true },
                select: {
                    isStored: true,
                    room: { select: { description: true } },
                    cabinet: { select: { description: true } },
                },
            },
        },
    });

    if (!item) {
        return notFound();
    }

    const toolbookName = item.toolbookItem[0]?.toolbook.user.name ?? '';
    const place = item.place.find(p => p.isStored) || item.place[0];
    const roomOrCabinet =
        place?.room?.description ?? place?.cabinet?.description ?? '';

    const events = await timelineQuery(id);

    return (
        <div>
            <h1>Eszköz részletei</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-auto gap-4">
                <div className="aspect-[1/1] md:col-span-1 shadow rounded p-4">
                    <ItemDetail
                    item={{
                        id: item.id,
                        eid: item.eid ?? '',
                        description: item.description ?? '',
                        serialNumber: item.serialNumber ?? '',
                        status: item.status,
                        type: item.model?.type ?? '',
                        brand: item.model?.brand ?? '',
                        model: item.model?.model ?? '',
                        weight: item.model?.weight ?? null,
                        picture: item.model?.picture ?? '',
                        toolbookName,
                        roomOrCabinet,
                    }}
                    />
                </div>
                <div className="flex-auto aspect-[1/1] md:col-span-1 shadow rounded p-4">
                    {item.model?.picture ? (
                        <img
                            src={item.model?.picture ?? ''}
                            alt="Kép"
                            className="mt-2 max-w-xs rounded shadow"
                        />
                    ) : (
                        'Nincs kép'
                    )}
                </div>

                <div className="aspect-[2/1] md:col-span-2 bg-white shadow rounded p-4">
                    <h2>Térkép</h2>
                    {/* térkép komponens */}
                </div>
                <h2>Előzmények</h2>
                <div className="card">
                    <ItemHistoryTimeline events={events} />
                </div>
            </div>
        </div>
    );
}
