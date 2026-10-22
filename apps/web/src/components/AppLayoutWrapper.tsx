'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/pricing';

  return (
    <AuthProvider>
      {isPublicPage ? (
        <div className="w-full min-h-screen bg-zinc-950 text-zinc-100">{children}</div>
      ) : (
        <WorkspaceProvider>
          <div className="flex min-h-screen w-full bg-zinc-950 text-zinc-100">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
              <TopNav />
              <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
        </WorkspaceProvider>
      )}
    </AuthProvider>
  );
}
