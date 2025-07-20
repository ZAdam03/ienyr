'use client';

import React, { useState } from 'react';
import { TabMenu } from 'primereact/tabmenu';
import { MenuItem } from 'primereact/menuitem';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import SiteTable from './SiteTable';
import DepartmentTable from './DepartmentTable';

// ⚠️ Térkép komponenst csak kliens oldalon töltjük be!
const SiteMap = dynamic(() => import('./SiteMap'), { ssr: false });

export default function Sites() {
    const [activeIndex, setActiveIndex] = useState(0);
    const items: MenuItem[] = [
        { label: 'Telephelyek', icon: 'pi pi-table' },
        { label: 'Telephely térkép', icon: 'pi pi-map' },
        { label: 'Részlegek', icon: 'pi pi-table' },
    ];

    const params = useParams();
    const companyId = params?.id as string;

    return (
        <div className="card">
            <TabMenu model={items} activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)} />
            <div className="mt-4">
                {/* @ts-ignore */}
                {activeIndex === 0 && <SiteTable companyId={companyId} />}
                {activeIndex === 1 && <SiteMap companyId={companyId} />}
                {activeIndex === 2 && <DepartmentTable companyId={companyId} />}
            </div>
        </div>
    );
}
