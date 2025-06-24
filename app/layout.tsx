import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/app/(components)/shared/Header';
import Footer from '@/app/(components)/shared/Footer';
import AnalyticsWrapper from '@/app/(components)/AnalyticsWrapper';
import { Analytics } from "@vercel/analytics/next";
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Business Lending Advocate',
  description: 'Expert guidance for small business loans',
  icons: {
    icon: '/images/Logo.png'
  },
  metadataBase: new URL('https://www.businesslendingadvocate.com'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.supabase.com" />
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-NGD7MTC9');
            `,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body className={inter.className}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NGD7MTC9"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            title="gtm"
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Header />
        <main className="pt-16">
          {children}
        </main>
        <Footer />
        <AnalyticsWrapper />
      </body>
    </html>
  );
}