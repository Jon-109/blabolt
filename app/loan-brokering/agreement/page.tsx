import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Merriweather, Public_Sans } from 'next/font/google';
import LoanBrokeringAgreementClient from './LoanBrokeringAgreementClient';
import { createClient } from '@/supabase/helpers/server';

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

export default async function LoanBrokeringAgreementPage() {
  const supabase = createClient(cookies());
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/login?redirectTo=/loan-brokering/agreement');
  }

  return (
    <LoanBrokeringAgreementClient
      headingClassName={headingFont.className}
      bodyClassName={bodyFont.className}
    />
  );
}
