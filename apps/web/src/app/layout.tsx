import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/logo.png', sizes: '128x128', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png', sizes: '128x128', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkReady =
    Boolean(clerkPublishableKey) &&
    !clerkPublishableKey?.includes('dummy') &&
    clerkPublishableKey?.startsWith('pk_');

  const content = (
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

  if (!isClerkReady) {
    return content;
  }

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      appearance={{
        variables: {
          colorPrimary: '#10b981',
          colorBackground: '#18181b',
          colorForeground: '#f4f4f5',
          colorMutedForeground: '#a1a1aa',
        },
        elements: {
          card: 'bg-zinc-900 border border-zinc-800 shadow-2xl text-zinc-100 rounded-2xl',
          formButtonPrimary: 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold transition-colors',
          headerTitle: 'text-zinc-100 font-bold',
          headerSubtitle: 'text-zinc-400',
          socialButtonsBlockButton: 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-750 transition-colors',
          formFieldLabel: 'text-zinc-300 font-medium',
          formFieldInput: 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-emerald-500',
          footerActionLink: 'text-emerald-400 hover:text-emerald-300 font-medium',
          identityPreviewText: 'text-zinc-200',
          identityPreviewEditButtonIcon: 'text-emerald-400',
        },
      }}
    >
      {content}
    </ClerkProvider>
  );
}


