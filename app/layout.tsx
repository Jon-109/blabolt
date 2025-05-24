import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/app/(components)/shared/Header';
import Footer from '@/app/(components)/shared/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Business Lending Advocate',
  description: 'Expert guidance for small business loans',
  icons: {
    icon: '/images/Logo.png'
  }
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
      </head>
      <body className={inter.className}>
        <Header />
        <main className="pt-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}