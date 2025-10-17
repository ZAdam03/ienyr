// src\app\item\[id]\timelineQuery.ts
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

        prisma.move.findMany({ // JAVÍTVA: moveItem -> move
            where: { itemId },
            include: {
                createdBy: true,
                closedBy: true,
                moveToRoom: { include: { floor: { include: { building: { include: { site: true } } } } } },
                moveFromRoom: { include: { floor: { include: { building: { include: { site: true } } } } } },
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

        prisma.scrappage.findMany({ // JAVÍTVA: scrappageItem -> scrappage
            where: { itemId },
            include: {
                createdBy: true,
                closedBy: true,
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

    // 2. Mozgatások - JAVÍTVA
    for (const move of moves) {
        const fromLocation = move.moveFromRoom?.description ?? 'Toolbook';
        const toLocation = move.moveToRoom?.description ?? 'Toolbook';
        
        events.push({
            status: move.isFinished ? 'Mozgatás befejezve' : 'Mozgatás elkezdve',
            date: move.createdAt.toISOString(),
            details: `Mozgató: ${move.createdBy?.name ?? 'ismeretlen'}, ${fromLocation} → ${toLocation}`,
        });

        if (move.closedAt && move.closedBy) {
            events.push({
                status: 'Mozgatás lezárva',
                date: move.closedAt.toISOString(),
                details: `Lezárta: ${move.closedBy.name}`,
            });
        }
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

    // 7. Selejtezés - JAVÍTVA
    for (const scrap of scrappage) {
        events.push({
            status: scrap.isFinished ? 'Selejtezés befejezve' : 'Selejtezés elkezdve',
            date: scrap.createdAt.toISOString(),
            details: `Kezdte: ${scrap.createdBy.name} – ${scrap.description ?? 'Selejtezés'}`,
        });

        if (scrap.closedAt && scrap.closedBy) {
            events.push({
                status: 'Selejtezés lezárva',
                date: scrap.closedAt.toISOString(),
                details: `Lezárta: ${scrap.closedBy.name}`,
            });
        }
    }
    // Időrend szerint
        events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
        // You may want to return or render something here, for example:
        // return <Timeline value={events} />;
    return events;
};