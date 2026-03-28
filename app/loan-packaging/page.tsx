import { Merriweather, Public_Sans } from 'next/font/google';
import LoanPackagingDashboardClient from './LoanPackagingDashboardClient';
import { requirePageServiceAccess } from '@/lib/server/service-access';

const headingFont = Merriweather({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-bla-heading',
});

const bodyFont = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bla-body',
});

type LoanPackagingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoanPackagingPage({ searchParams }: LoanPackagingPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pendingCheckoutSessionId =
    typeof resolvedSearchParams?.session_id === 'string' ? resolvedSearchParams.session_id : null;

  if (!pendingCheckoutSessionId) {
    await requirePageServiceAccess('loan_packaging');
  }

  return (
    <LoanPackagingDashboardClient
      headingClassName={headingFont.className}
      bodyClassName={bodyFont.className}
      pendingCheckoutSessionId={pendingCheckoutSessionId}
    />
  );
}
