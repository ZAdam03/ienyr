import { prisma } from '@/lib/prisma';
import AllItemsTable from './AllItemsTable'; // új kliens komponens

export default async function AllItemsPage() {
    const items = await prisma.item.findMany({
        select: {
            id: true,
            eid: true,
            description: true,
            serialNumber: true,
            status: true,
            model: {
                select: {
                    type: true,
                    brand: true,
                    model: true,
                },
            },
        },
    });

    const activeToolbooks = await prisma.item.findMany({
        where: {
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
            type: item.model?.type ?? '',
            brand: item.model?.brand ?? '',
            model: item.model?.model ?? '',
            toolbookName: toolbook ? toolbook.toolbookItem[0]?.toolbook.user.name ?? '' : '',
            roomOrCabinet:
                placeNotStored?.place[0]?.room?.description ??
                placeStored?.place[0]?.cabinet?.description ??
                '',
        };
    });

    return (
        <div>
            <h1>Összes eszköz</h1>
            <AllItemsTable items={mergedItems} />
        </div>
    );
}
