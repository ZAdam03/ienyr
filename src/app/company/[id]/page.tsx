'use client';

import React, { useState } from 'react';
import { TabMenu } from 'primereact/tabmenu';
import { MenuItem } from 'primereact/menuitem';
import { useParams } from 'next/navigation';
import SiteTable from './SiteTable';
import SiteMap from './SiteMap';

export default function Sites() {
    const [activeIndex, setActiveIndex] = useState(0);
    const items: MenuItem[] = [
        { label: 'Táblázat', icon: 'pi pi-table' },
        { label: 'Térkép', icon: 'pi pi-map' },
    ];

    const params = useParams();
    const companyId = params?.id as string; // pl.: /company/[id]/sites

    return (
        <div className="card">
            <TabMenu model={items} activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)} />
            <div className="mt-4">
                {activeIndex === 0 && <SiteTable companyId={companyId} />}
                {activeIndex === 1 && <SiteMap companyId={companyId} />}
            </div>
        </div>
    );
}