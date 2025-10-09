// src/app/department/[id]/DepartmentItemsTable.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';

interface Item {
  id: string;
  eid: string | null;
  description: string;
  model: {
    brand: string;
    model: string;
  };
  serialNumber: string | null;
  status: string;
  place: {
    room: {
      description: string;
    } | null;
    cabinet: {
      description: string;
    } | null;
    isActive: boolean;
  }[];
}

export default function DepartmentItemsTable({ 
  departmentId 
}: { 
  departmentId: string 
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    global: { value: string | null; matchMode: FilterMatchMode }
  }>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });
  const router = useRouter();
  const toast = useRef<Toast>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`/api/item/department/${departmentId}`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error('Failed to fetch items:', err);
        setError('Nem sikerült betölteni az eszközöket');
        toast.current?.show({
          severity: 'error',
          summary: 'Hiba',
          detail: 'Nem sikerült betölteni az eszközöket',
          life: 3000
        });
      } finally {
        setLoading(false);
      }
    };

    if (departmentId) {
      fetchItems();
    }
  }, [departmentId]);

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, global: { value, matchMode: FilterMatchMode.CONTAINS } }));
  };

  function exportCSV() {
        const dt = document.querySelector('.p-datatable') as any;
        dt?.exportCSV();
    }

  const locationBodyTemplate = (rowData: Item) => {
    const activePlace = rowData.place.find(p => p.isActive);
    if (!activePlace) return 'Nincs hely';
    
    return `${activePlace.room?.description || ''} ${activePlace.cabinet?.description || ''}`;
  };

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '200px' }}>
        <ProgressSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-100 border-red-300">
        <div className="text-red-700">{error}</div>
      </Card>
    );
  }

  return (
    <div className="card">
      <Toast ref={toast} />
      <Card title="Osztályhoz tartozó eszközök">
        <div className="flex justify-content-between mb-4">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText 
              placeholder="Keresés minden mezőben..." 
              onChange={onGlobalFilterChange} 
            />
          </span>
          <Button 
            label="Export CSV" 
            icon="pi pi-download" 
            className="p-button-help"
            onClick={exportCSV} 
          />
        </div>

        <DataTable
          value={items}
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          globalFilterFields={['id', 'eid', 'description', 'model.brand', 'model.model', 'serialNumber', 'status']}
          emptyMessage="Nincs találat"
          onRowClick={(e) => router.push(`/item/${e.data.id}`)}
          selectionMode="single"
          stripedRows
          showGridlines
          size="small"
        >
          <Column field="id" header="Azonosító" sortable style={{ width: '15%' }} />
          <Column field="eid" header="EID" sortable style={{ width: '10%' }} />
          <Column field="description" header="Leírás" sortable style={{ width: '20%' }} />
          <Column 
            header="Modell" 
            body={(data) => `${data.model.brand} ${data.model.model}`} 
            sortable 
            sortField="model.brand"
            style={{ width: '15%' }}
          />
          <Column field="serialNumber" header="Sorozatszám" sortable style={{ width: '15%' }} />
          <Column field="status" header="Státusz" sortable style={{ width: '10%' }} />
          <Column 
            header="Hely" 
            body={locationBodyTemplate} 
            style={{ width: '15%' }}
          />
        </DataTable>
      </Card>
    </div>
  );
}