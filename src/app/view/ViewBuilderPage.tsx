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
    },
  });

  const transformed = items.map((item) => {
    const toolbookName = item.toolbookItem[0]?.toolbook?.user?.name ?? '';
    const roomOrCabinet = item.place[0]?.room?.description ?? item.place[0]?.cabinet?.description ?? '';

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
    };
  });

  return <ViewBuilderTable data={transformed} />;
}
