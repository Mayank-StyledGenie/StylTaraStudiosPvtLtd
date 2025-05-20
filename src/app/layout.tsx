

import type { Metadata } from 'next';
import { Playfair_Display, Poppins } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import '@/styles/globals.css';
import Providers  from '@/components/providers/SessionProviderWrapper';
import CookieConsent from '@/components/sections/CookiePopup';
import Script  from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google'


const playfair = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['700'], 
  variable: '--font-playfair',
});

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500'], 
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: {
    default: 'Styltara Studios',
    template: '%s | Styltara Studios'
  },
  description: 'At Styltara Studio, we believe fashion isn\'t just about what you wear-it\'s about how it makes you feel. We craft looks that reflect you, at your brightest.',
  icons: {
    icon: '/logo1.png',
    apple: '/logo1.png',
  },
};

export const viewport = {
  themeColor: '', 
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light-mode dark:dark-mode">
      <head>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </head>
      <body className={`${playfair.variable} ${poppins.variable} font-poppins`}>
        <div className="flex flex-col min-h-screen">
          <GoogleAnalytics gaId="G-0BJ2L5PHP2" />
          <Providers>
            
            <Header />
            <main className="flex-grow">{children}</main>
            <CookieConsent />
            <Footer />
          </Providers>
        </div>
      </body>
    </html>
  );
}
