import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppLayoutWrapper } from '@/components/AppLayoutWrapper';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Contexly — AI replies that remember | Workspace Memory Ledger',
  description:
    'A deterministic context engine and communication ledger for client-facing professionals on Fiverr, Upwork, and LinkedIn by HashTurn.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark" style={{ colorScheme: 'dark' }}>
      <body className={`${inter.className} min-h-full bg-zinc-950 text-zinc-100`}>
        <AppLayoutWrapper>{children}</AppLayoutWrapper>
      </body>
    </html>
  );
}

