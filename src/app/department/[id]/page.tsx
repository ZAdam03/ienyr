// src/app/department/[id]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { Card } from 'primereact/card';
import Link from 'next/link';
import DepartmentItemsTable from './DepartmentItemsTable';

const prisma = new PrismaClient();

export default async function DepartmentPage({ params }: { params: { id: string } }) {
    let department = null;
    try {
        department = await prisma.department.findUnique({
            where: { id: params.id },
            include: {
            company: {
                include: {
                sites: true,
            }},
            rooms: {
                include: {
                floor: {
                    include: {
                        building: true
                    }
                }
            }}
            }
        });

    if (!department) {
      notFound();
    }

  return (
    <div className="grid">
      <div className="col-12">
        <Card title={`Osztály részletei: ${department.description}`}>
          <div className="grid">
            <div className="col-6">
              <div className="field">
                <label className="font-bold">Cég:</label>
                <p>
                  <Link href={`/company/${department.companyId}`}>
                    {department.company.description}
                  </Link>
                </p>
              </div>
              <div className="field">
                <label className="font-bold">Telephely:</label>
                <p>
                  <Link href={`/site/${department.company.sites[0]?.id}`}>
                    {department.company.sites[0]?.description}
                  </Link>
                </p>
              </div>
            </div>
            <div className="col-6">
              <div className="field">
                <label className="font-bold">Költséghely:</label>
                <p>{department.costCenter || 'Nincs megadva'}</p>
              </div>
              <div className="field">
                <label className="font-bold">Státusz:</label>
                <p>{department.isActive ? 'Aktív' : 'Inaktív'}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="col-12">
        <Card title="Szobák ehhez az osztályhoz">
          <div className="grid">
            {department.rooms.map(room => (
              <div key={room.id} className="col-12 md:col-6 lg:col-4">
                <Link href={`/room/${room.id}`}>
                  <Card className="cursor-pointer hover:shadow-2 transition-all">
                    <p className="font-bold">{room.description}</p>
                    <p>Szint: {room.floor.description}</p>
                    <p>Épület: {room.floor.building.description}</p>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="col-12">
        <DepartmentItemsTable departmentId={params.id} />
      </div>
    </div>
  );
  } catch (error) {
        console.error('Error fetching department:', error);
        notFound();
    }
}