"use client";
import React from 'react';
import { Menubar } from 'primereact/menubar';
import { InputText } from 'primereact/inputtext';
import { MenuItem } from 'primereact/menuitem';
import { Badge } from 'primereact/badge';
import { Avatar } from 'primereact/avatar';
import { useRouter } from 'next/navigation';

export default function MyMenubar() {
    // @ts-ignore
    const itemRenderer = (item) => (
        <a className="flex align-items-center p-menuitem-link">
            <span className={item.icon} />
            <span className="mx-2">{item.label}</span>
            {item.badge && <Badge className="ml-auto" value={item.badge} />}
            {item.shortcut && <span className="ml-auto border-1 surface-border border-round surface-100 text-xs p-1">{item.shortcut}</span>}
        </a>
    );
    const items: MenuItem[] = [
        {
            label: 'Eszközök',
            icon: 'pi pi-desktop',
            items: [
                {
                    label: 'Összes eszköz',
                    icon: 'pi pi-star',
                    url: '/item/every',
                },
                {
                    label: 'Lekérdezés szerkesztő',
                    icon: 'pi pi-hammer',
                    url: '/querybuilder',
                },
                {
                    label: 'Modelek',
                    icon: 'pi pi-fw pi-barcode',
                    url: '/item/model',
                },
                {
                    label: 'Számítógépek',
                    icon: 'pi pi-desktop',
                    url: '/item/list',
                },
                {
                    label: 'Mobiltelefonok',
                    icon: 'pi pi-mobile',
                    url: '/item/list'
                },
                {
                    label: 'Nyomtatók',
                    icon: 'pi pi-print',
                    url: '/item/list'
                },
                {
                    label: 'Szerverek',
                    icon: 'pi pi-server',
                    url: '/item/list'
                }
            ]
        },
        {
            label: 'Funkciók',
            icon: 'pi pi-star',
            items: [
                {
                    label: 'Új',
                    icon: 'pi pi-fw pi-plus',
                    items: [
                        {
                            label: 'Model',
                            icon: 'pi pi-fw pi-barcode',
                            url: '/new/model',
                        },
                        {
                            label: 'Eszköz',
                            icon: 'pi pi-fw pi-desktop',
                            url: '/new/item',
                        },
                        {
                            label: 'Épület',
                            icon: 'pi pi-fw pi-building'
                        }
                    ]
                },
                {
                    label: 'Mozgatás',
                    icon: 'pi pi-fw pi-arrow-right-arrow-left',
                    url: '/eszkoz/mozgatas'
                },
                {
                    label: 'Selejtezés',
                    icon: 'pi pi-fw pi-trash',
                    url: '/eszkoz/seleztes'
                },
                {
                    label: 'Leltározás',
                    icon: 'pi pi-fw pi-search',
                    url: '/eszkoz/leltar'
                },
                
                {
                    label: 'Jelentések',
                    icon: 'pi pi-fw pi-chart-bar',
                    url: '/eszkoz/reports'
                },
            ]
        },
        {
            label: 'Lokációk',
            icon: 'pi pi-map-marker',
            url: '/company'
        },
        {
            label: 'Projects',
            icon: 'pi pi-search',
            items: [
                {
                    // @ts-ignore
                    label: 'Core',
                    icon: 'pi pi-bolt',
                    shortcut: '⌘+S',
                    template: itemRenderer
                },
                {
                    // @ts-ignore
                    label: 'Blocks',
                    icon: 'pi pi-server',
                    shortcut: '⌘+B',
                    template: itemRenderer
                },
                {
                    // @ts-ignore
                    label: 'UI Kit',
                    icon: 'pi pi-pencil',
                    shortcut: '⌘+U',
                    template: itemRenderer
                },
                {
                    // @ts-ignore
                    separator: true
                },
                {
                    // @ts-ignore
                    label: 'Templates',
                    icon: 'pi pi-palette',
                    items: [
                        {
                            label: 'Apollo',
                            icon: 'pi pi-palette',
                            badge: 2,
                            template: itemRenderer
                        },
                        {
                            label: 'Ultima',
                            icon: 'pi pi-palette',
                            badge: 3,
                            template: itemRenderer
                        }
                    ]
                }
            ]
        },
        {
            label: 'Üzenetek',
            icon: 'pi pi-envelope',
            // @ts-ignore
            badge: 3,
            template: itemRenderer
        }
    ];
    
    const router = useRouter();
    const start = <img alt="logo" 
                        src="/ienyr_logo_e_c.svg" 
                        height="40" 
                        className="mr-2"
                        onClick={() => router.push('/')}
                        style={{ cursor: 'pointer' }}></img>;
    const end = (
        <div className="flex align-items-center gap-2">
            {/* <ThemeSwitcher/> */}
            <InputText placeholder="Search" type="text" className="w-8rem sm:w-auto" />
            <Avatar image="https://primefaces.org/cdn/primereact/images/avatar/amyelsner.png" shape="circle" />
        </div>
    );

    return (
        <div className="card">
            <Menubar model={items} start={start} end={end} />
        </div>
    )
}