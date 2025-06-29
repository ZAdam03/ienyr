import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

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

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Modell részletei</h1>
            <ul className="space-y-2">
                <li><strong>Típus:</strong> {model.type}</li>
                <li><strong>Gyártó:</strong> {model.brand}</li>
                <li><strong>Modell:</strong> {model.model}</li>
                <li><strong>Súly:</strong> {model.weight ?? 'N/A'} kg</li>
                <li><strong>Kép:</strong> {model.picture ? <img src={model.picture} alt="Kép" className="mt-2 max-w-xs" /> : 'Nincs kép'}</li>
            </ul>
        </div>
    );
}
