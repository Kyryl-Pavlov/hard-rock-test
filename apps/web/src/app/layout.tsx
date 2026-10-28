import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import { BackToTopButton } from '@/components/layout/back-to-top-button';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
  weight: ['600', '700'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetBrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: { default: 'Rick & Morty Explorer', template: '%s · Rick & Morty Explorer' },
  description: 'Browse characters, episodes and locations from the Rick & Morty universe.',
};

// GA is only loaded when a measurement ID is configured (see .env.example).
const gaId = process.env.NEXT_PUBLIC_GA_ID;

const fontVariables = `${plusJakartaSans.variable} ${inter.variable} ${jetBrainsMono.variable}`;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      {/* Browser extensions (e.g. Grammarly) add data-* attributes to <body> before hydration. */}
      <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
        {children}
        <BackToTopButton />
      </body>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </html>
  );
}
