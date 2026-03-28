import { Merriweather, Public_Sans } from 'next/font/google';
import LenderPortalClient from './LenderPortalClient';

const headingFont = Merriweather({
  subsets: ['latin'],
  weight: ['700', '900'],
});

const bodyFont = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

interface LenderPortalPageProps {
  params: Promise<{ token: string }>;
}

export default async function LenderPortalPage({ params }: LenderPortalPageProps) {
  const { token } = await params;

  return (
    <LenderPortalClient
      token={token}
      headingClassName={headingFont.className}
      bodyClassName={bodyFont.className}
    />
  );
}
