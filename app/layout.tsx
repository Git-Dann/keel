import type { Metadata, Viewport } from 'next';
import { Gruppo, Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { themeScript } from '@/lib/theme';
import { Providers } from '@/components/shell/Providers';
import { AppShell } from '@/components/shell/AppShell';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
});

const gruppo = Gruppo({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-gruppo',
  fallback: ['Century Gothic', 'Avenir Next', 'ui-sans-serif', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'Keel',
  description: 'Keel brings contracts, AI compliance, tribunal risk, account research and board packs into one calm platform. Demo with fictional data.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${gruppo.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Suspense>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
