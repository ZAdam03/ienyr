// app/providers.tsx vagy app/layout.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { PrimeReactProvider } from 'primereact/api';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <PrimeReactProvider>
            <SessionProvider>
                {children}
            </SessionProvider>
        </PrimeReactProvider>
    );
}