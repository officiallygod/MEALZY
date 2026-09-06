import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';
import CookieConsent from '@/components/common/CookieConsent';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-funky',
  display: 'swap',
});

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
    <html lang="en" className={`dark ${plusJakartaSans.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mealzy_theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}else{document.documentElement.classList.remove('light');document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        <script id="google-gsi-client" src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className={`font-sans bg-[#FAF8F5] dark:bg-[#0A0B0E] text-gray-900 dark:text-white min-h-screen antialiased selection:bg-[#D4FF00] selection:text-black transition-colors ${plusJakartaSans.className}`}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
