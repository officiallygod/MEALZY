import type { Metadata, Viewport } from 'next';
import './globals.css';
import CookieConsent from '@/components/common/CookieConsent';

export const metadata: Metadata = {
  title: 'MEALZY • Aesthetic Meal Planner & Fridge Radar',
  description:
    'Plan what to make and when to eat. Never let food rot. Cook once, eat 3-4x. Aesthetic, responsive, smart, and 100% offline capable.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0B0E',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0A0B0E] text-white min-h-screen antialiased selection:bg-[#D4FF00] selection:text-black">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
