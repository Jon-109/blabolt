import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import Header from '@/app/(components)/shared/Header';
import Footer from '@/app/(components)/shared/Footer';
import AnalyticsWrapper from '@/app/(components)/AnalyticsWrapper';
import AnalyticsProvider from '@/app/(components)/AnalyticsProvider';
import GlobalLendingAssistant from '@/app/(components)/ai/GlobalLendingAssistant';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.businesslendingadvocate.com'),
  title: {
    default: 'Business Lending Advocate',
    template: '%s | Business Lending Advocate',
  },
  description:
    'Business loan guidance, free DSCR tools, cash flow analysis, loan packaging, and lender-readiness support for small-business owners.',
  applicationName: 'Business Lending Advocate',
  category: 'finance',
  authors: [{ name: 'Business Lending Advocate' }],
  creator: 'Business Lending Advocate',
  publisher: 'Business Lending Advocate',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/images/Logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Business Lending Advocate',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#020617',
};

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-18441521885';
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-NGD7MTC9';
const GTAG_PRIMARY_ID = GA_MEASUREMENT_ID || GOOGLE_ADS_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js): Google Ads + GA4 */}
        {GTAG_PRIMARY_ID && (
          <>
            <Script
              id="gtag-js"
              src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_PRIMARY_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="gtag-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  window.gtag = window.gtag || gtag;
                  gtag('js', new Date());
                  gtag('consent', 'default', {
                    'ad_storage': 'granted',
                    'analytics_storage': 'granted',
                    'ad_user_data': 'granted',
                    'ad_personalization': 'granted'
                  });
                  ${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}', { allow_enhanced_conversions: true });` : ''}
                  ${GA_MEASUREMENT_ID ? `gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });` : ''}
                `,
              }}
            />
          </>
        )}
        {/* End Google tag */}

        {/* Google Tag Manager */}
        {GTM_ID && (
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${GTM_ID}');
              `,
            }}
          />
        )}
        {/* End Google Tag Manager */}
      </head>
      <body className={inter.className}>
        {/* Google Tag Manager (noscript) */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
              title="gtm"
            />
          </noscript>
        )}
        {/* End Google Tag Manager (noscript) */}
        <Suspense fallback={null}>
          <AnalyticsProvider enableScrollTracking enableEngagementTracking>
            <Header />
            <main className="pt-16">
              {children}
            </main>
            <Footer />
            <GlobalLendingAssistant />
            <AnalyticsWrapper />
          </AnalyticsProvider>
        </Suspense>
      </body>
    </html>
  );
}
