import { prisma } from '@/lib/prisma';

export default async function ItemHistoryQuery(id: string) {
    const itemId = id;

    const [places, moves, toolbook, inventory, meta, structure, scrappage] = await Promise.all([
        prisma.itemPlace.findMany({
        where: { itemId },
        include: {
            createdBy: true,
            cabinet: true,
            room: { include: { floor: { include: { building: { include: { site: true } } } } } },
        },
        }),

        prisma.moveItem.findMany({
        where: { itemId },
        include: {
            move: true,
            moveToRoom: { include: { floor: { include: { building: { include: { site: true } } } } } },
            moveToCabinet: { include: { room: true } },
            finishedBy: true,
        },
        }),

        prisma.toolbookItem.findMany({
        where: { itemId },
        include: { createdBy: true, toolbook: true },
        }),

        prisma.inventoryItem.findMany({
        where: { itemId },
        include: {
            createdBy: true,
            inventory: true,
        },
        }),

        prisma.itemMetaData.findMany({
        where: { itemId },
        include: { modifiedBy: true },
        }),

        prisma.structureMapping.findMany({
        where: {
            OR: [{ parentItemId: itemId }, { childItemId: itemId }],
        },
        include: {
            createdBy: true,
            deactivatedBy: true,
            parentItem: true,
            childItem: true,
        },
        }),

        prisma.scrappageItem.findMany({
        where: { itemId },
        include: {
            scrappage: true,
            finishedBy: true,
        },
        }),
    ]);

    // 👇 Ezekből egységes, időrendezett eseménylista készítése
    const events: {
        status: string;
        date: string;
        details: string;
    }[] = [];

    // 1. Felvétel
    for (const place of places) {
        events.push({
        status: 'Felvétel a rendszerbe',
        date: place.createdAt.toISOString(),
        details: `Felvette: ${place.createdBy.name} – ${
            place.cabinet
            ? `Szekrény: ${place.cabinet.description}`
            : `Helyiség: ${place.room?.description ?? 'ismeretlen'}`
        }`,
        });
    }

    // 2. Mozgatások
    for (const move of moves) {
        const location = move.isStored
        ? `Szekrény: ${move.moveToCabinet?.description ?? '-'}`
        : `Helyiség: ${move.moveToRoom?.description ?? '-'}`;
        events.push({
        status: 'Mozgatás',
        date: move.finishedAt?.toISOString() ?? '',
        details: `Mozgató: ${move.finishedBy?.name ?? 'ismeretlen'}, ${location}`,
        });
    }

    // 3. Toolbook
    for (const tb of toolbook) {
        events.push({
        status: 'Toolbook esemény',
        date: tb.createdAt.toISOString(),
        details: `Felvette: ${tb.createdBy.name}`,
        });
    }

    // 4. Inventory
    for (const inv of inventory) {
        events.push({
        status: 'Leltár',
        date: inv.createdAt?.toISOString() ?? '',
        details: `Leltározó: ${inv.createdBy?.name ?? 'ismeretlen'} (${inv.inventory.description})`,
        });
    }

    // 5. Metaadatok
    for (const m of meta) {
        events.push({
        status: 'Metaadat módosítás',
        date: m.modifiedAt.toISOString(),
        details: `Módosító: ${m.modifiedBy.name}, Megjegyzés: ${m.notes}`,
        });
    }

    // 6. StructureMapping
    for (const s of structure) {
        events.push({
        status: s.deactivatedAt ? 'Kapcsolat bontva' : 'Kapcsolat létrehozva',
        date: (s.deactivatedAt ?? s.createdAt).toISOString(),
        details: `${s.parentItemId === itemId ? 'Szülőként' : 'Gyermekként'}: ${s.parentItemId === itemId ? s.childItem.description : s.parentItem.description}, Felvette: ${s.createdBy.name}`,
        });
    }

    // 7. Selejtezés
    for (const scr of scrappage) {
        events.push({
        status: 'Selejtezés',
        date: scr.finishedAt?.toISOString() ?? '',
        details: `Selejtező: ${scr.finishedBy?.name ?? 'ismeretlen'} – ${scr.scrappage.description}`,
        });
    }

    // Időrend szerint
        events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
        // You may want to return or render something here, for example:
        // return <Timeline value={events} />;
    return events;
};