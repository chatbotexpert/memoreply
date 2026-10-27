import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppLayoutWrapper } from '@/components/AppLayoutWrapper';

// ── Memoreply Brand Typography ────────────────────────────────────
// Inter: primary UI sans-serif (body, headings, nav, buttons)
// JetBrains Mono: loaded via @font-face in globals.css (CDN at runtime)
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Memoreply — Replies that remember | Workspace Memory Ledger',
  description:
    'A deterministic context engine and communication ledger for client-facing professionals on Fiverr, Upwork, and LinkedIn by HashTurn.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`h-full antialiased dark ${inter.variable}`}
      style={{ colorScheme: 'dark' }}
    >
      {/* Brand bg: #09090b Jet Black — exact brand token */}
      <body
        className={`${inter.className} min-h-full bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-[#fafafa] antialiased transition-colors duration-200`}
      >
        <AppLayoutWrapper>{children}</AppLayoutWrapper>
      </body>
    </html>
  );
}


