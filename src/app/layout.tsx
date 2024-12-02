import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Business Lending Advocate',
  description: 'Expert guidance for securing small business loans with simplified processes and proven results.',
  keywords: 'business loans, loan packaging, loan brokering, cash flow analysis, SBA loans',
  openGraph: {
    title: 'Business Lending Advocate',
    description: 'Expert guidance for securing small business loans',
    url: 'https://businesslendingadvocate.com',
    siteName: 'Business Lending Advocate',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf',
        width: 1200,
        height: 630,
        alt: 'Business Lending Advocate',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}