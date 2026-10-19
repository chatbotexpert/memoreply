import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Memoreply Cloud Dashboard — Client Memory & Workspace Sync',
  description: 'Enterprise cloud dashboard for Memoreply client communications and persistent memory.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100`}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <TopNav />
          <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
