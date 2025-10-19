import { prisma } from '@/lib/prisma';
import ViewBuilderTable from './ViewBuilderTable';

export default async function ViewBuilderPage() {
  const items = await prisma.item.findMany({
    include: {
      model: true,
      toolbookItem: {
        where: { isActive: true },
        include: {
          toolbook: {
            
            include: {
              user: true,
            },
          },
        },
      },
      place: {
        where: { isActive: true },
        include: {
          room: true,
          cabinet: true,
        },
      },
      licenceKeys: true,
      ParentItem: {
        include: {
          parentItem: true,
        },
      },
      scrappages: {
        where: {
          isFinished: false
        },
        include: {
          createdBy: {
            select: {
              name: true
            }
          }
        }
      }
    },
  });

  const transformed = items.map((item) => {
    const toolbookName = item.toolbookItem[0]?.toolbook?.user?.name ?? '';
    const roomOrCabinet = item.place[0]?.room?.description ?? item.place[0]?.cabinet?.description ?? '';

    const toolbookItem = item.toolbookItem.find(tbi => tbi.isActive);
    const toolbookCreatedAt = toolbookItem?.createdAt?.toISOString() ?? '';

    const licenceKeys = item.licenceKeys.map(lk => `${lk.key} (${lk.description ?? ''})`).join(', ');

    const parentMapping = item.ParentItem[0];
    const parentId = parentMapping?.parentItemId ?? '';
    const parentDescription = parentMapping?.parentItem?.description ?? '';

    const scrappageItem = item.scrappages[0]; 
    const scrappageDescription = scrappageItem?.description ?? ''; 
    const scrappageClosedAt = scrappageItem?.closedAt?.toISOString() ?? '';


    return {
      id: item.id,
      eid: item.eid ?? '',
      type: item.model?.type ?? '',
      brand: item.model?.brand ?? '',
      model: item.model?.model ?? '',
      description: item.description ?? '',
      serialNumber: item.serialNumber ?? '',
      status: item.status,
      toolbookName,
      roomOrCabinet,
      licenceKeys,
      parentId,
      parentDescription,
      scrappageDescription,
      scrappageClosedAt,
    };
  });

  return <ViewBuilderTable data={transformed} />;
}
