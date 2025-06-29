import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ItemDetail from './ItemDetail';

interface Props {
    params: { id: string };
}

export default async function ItemPage({ params }: Props) {
    const item = await prisma.item.findUnique({
        where: { id: params.id },
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

    return (
        <div>
            <h1>Eszköz részletei</h1>
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
    );
}
