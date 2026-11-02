import type { Metadata, Viewport } from 'next';
import './globals.css';
import UnifiedHeader from '@/components/UnifiedHeader';

export const metadata: Metadata = {
  title: 'Arcade Pulse — Viral Mini-Games Platform',
  description: 'High-octane, instant browser mini-games. No signups, instant play, 10-60 second rounds, global leaderboards & friend challenges.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#07090E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#07090E] text-white flex flex-col antialiased selection:bg-cyan-500 selection:text-black">
        <UnifiedHeader />
        <main className="flex-1 w-full pb-20 md:pb-10">{children}</main>
        <footer className="border-t border-white/10 py-6 px-4 text-center text-xs text-gray-500">
          <p className="font-semibold text-gray-400">
            ⚡ Arcade Pulse — Built for instant mobile fun.
          </p>
          <p className="mt-1">
            Zero installs • Zero signups • Challenge your friends anytime.
          </p>
        </footer>
      </body>
    </html>
  );
}
