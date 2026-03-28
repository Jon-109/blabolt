import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import TemplatesBundleServiceClient from './TemplatesBundleServiceClient';

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Templates Bundle Service | All 5 Lender-Ready Templates',
  description:
    'Unlock all 5 lender-ready templates in one bundle. Build business and personal financial documents faster with guided workflows and clear output structure.',
  alternates: {
    canonical: '/services/templates-bundle',
  },
};

export default function TemplatesBundleServicePage() {
  return (
    <div className={sora.className}>
      <TemplatesBundleServiceClient />
    </div>
  );
}
